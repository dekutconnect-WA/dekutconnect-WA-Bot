/**
 * redis.js — Redis integration and distributed locking for DEKUTCONNECT
 * Provides: performance caching, distributed locks (Redlock-like) for session isolation
 */
'use strict';

const { createClient } = require('redis');

let redisClient = null;
let isConnected = false;

async function getRedisClient() {
    if (!redisClient) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redisClient = createClient({ url: redisUrl });
        
        redisClient.on('error', (err) => {
            // Log only once to avoid spamming
            if (isConnected) {
                console.error('🔴 Redis Connection Error:', err.message);
            }
            isConnected = false;
        });

        redisClient.on('connect', () => {
            console.log('🟢 Redis Client Connecting...');
        });

        redisClient.on('ready', () => {
            console.log('✅ Redis Client Ready');
            isConnected = true;
        });

        try {
            await redisClient.connect();
        } catch (err) {
            console.warn('⚠️  Redis connection failed. Scaling features (locks & cache) will use local memory fallbacks.', err.message);
            redisClient = null;
            isConnected = false;
        }
    }
    return isConnected ? redisClient : null;
}

/**
 * Get cached item
 */
async function get(key) {
    try {
        const client = await getRedisClient();
        if (!client) return null;
        return await client.get(key);
    } catch (e) {
        console.warn(`[Redis] Get failed for key=${key}:`, e.message);
        return null;
    }
}

/**
 * Set cached item
 */
async function set(key, value, expirySec = null) {
    try {
        const client = await getRedisClient();
        if (!client) return false;
        const options = expirySec ? { EX: expirySec } : undefined;
        await client.set(key, value, options);
        return true;
    } catch (e) {
        console.warn(`[Redis] Set failed for key=${key}:`, e.message);
        return false;
    }
}

/**
 * Delete cached item
 */
async function del(key) {
    try {
        const client = await getRedisClient();
        if (!client) return false;
        await client.del(key);
        return true;
    } catch (e) {
        console.warn(`[Redis] Delete failed for key=${key}:`, e.message);
        return false;
    }
}

/**
 * Acquire distributed lock using NX (Not Exists) + PX (Expiry Time in MS)
 * Prevents multiple active WhatsApp connections for the same Session ID.
 * @param {string} key     — unique session key identifier
 * @param {number} ttlMs   — Lock lifetime in milliseconds
 * @returns {Promise<string|null>} Lock token value on success, null on failure
 */
async function acquireLock(key, ttlMs = 15000) {
    try {
        const client = await getRedisClient();
        if (!client) {
            // Local memory fallback if Redis is down (acts as standard lock)
            return 'fallback-lock-' + Date.now();
        }
        const lockKey = `lock:${key}`;
        const token = Math.random().toString(36).slice(2) + Date.now();
        
        // NX: set if not exists, PX: expiry time in ms
        const result = await client.set(lockKey, token, { PX: ttlMs, NX: true });
        if (result === 'OK') {
            return token;
        }
        return null;
    } catch (e) {
        console.error(`[RedisLock] AcquireLock error for key=${key}:`, e.message);
        return 'fallback-lock-' + Date.now();
    }
}

/**
 * Release distributed lock securely using Lua script to verify token ownership
 * @param {string} key     — unique session key identifier
 * @param {string} token   — lock token obtained from acquireLock
 * @returns {Promise<boolean>} True if lock released, false otherwise
 */
async function releaseLock(key, token) {
    if (!token || token.startsWith('fallback-lock')) return true;
    try {
        const client = await getRedisClient();
        if (!client) return true;
        
        const lockKey = `lock:${key}`;
        // Lua script ensures atomic check-and-delete
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;
        const res = await client.eval(script, {
            keys: [lockKey],
            arguments: [token]
        });
        return res === 1;
    } catch (e) {
        console.error(`[RedisLock] ReleaseLock error for key=${key}:`, e.message);
        return false;
    }
}

module.exports = {
    getRedisClient,
    get,
    set,
    del,
    acquireLock,
    releaseLock
};
