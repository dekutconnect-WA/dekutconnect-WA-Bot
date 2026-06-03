/**
 * userStore.js — Dual-mode user-bot database store for DEKUTCONNECT
 * Supports: Firebase Admin (Firestore) + PostgreSQL + JSON file fallback
 */
'use strict';

const fs = require('fs');
const path = require('path');

const FALLBACK_FILE = path.join(__dirname, '..', 'user_bots.json');

let driver = 'json'; // 'firestore' | 'postgresql' | 'json'
let firestoreDb = null;
let pgPool = null;

/**
 * Initialize the user store. Called after sessionStore.init().
 * @param {object} config  — from gifted-session-main/config.js
 */
async function initUserStore(config) {
    // Try Firestore via Firebase Admin first
    if (config.FIREBASE_ADMIN_CREDENTIAL) {
        try {
            const admin = require('firebase-admin');
            if (!admin.apps.length) {
                const serviceAccount = JSON.parse(
                    Buffer.from(config.FIREBASE_ADMIN_CREDENTIAL, 'base64').toString('utf8')
                );
                const credential = admin.credential.cert(serviceAccount);
                admin.initializeApp({
                    credential,
                    projectId: config.FIREBASE_PROJECT_ID || 'dekut-app-main',
                    databaseURL: `https://${config.FIREBASE_PROJECT_ID || 'dekut-app-main'}-default-rtdb.firebaseio.com`
                });
            }
            firestoreDb = admin.firestore();
            driver = 'firestore';
            console.log('✅ UserStore: Firestore connected');
            await _ensurePostgresTable(config); // also try pg in parallel
            return;
        } catch (e) {
            console.warn('⚠️  UserStore: Firestore init failed:', e.message);
        }
    }

    // Try PostgreSQL
    if (await _ensurePostgresTable(config)) {
        driver = 'postgresql';
        return;
    }

    // Fallback: JSON file
    _ensureJsonFile();
    driver = 'json';
    console.log('ℹ️  UserStore: Using JSON file fallback');
}

async function _ensurePostgresTable(config) {
    try {
        const dbUrl = config.DATABASE_URL || process.env.DATABASE_URL;
        if (!dbUrl || !dbUrl.startsWith('postgres')) return false;
        const { Pool } = require('pg');
        pgPool = new Pool({
            connectionString: dbUrl,
            ssl: { rejectUnauthorized: false }
        });
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS dekutconnect_bots (
                uid         VARCHAR(128) PRIMARY KEY,
                phone       VARCHAR(30),
                session_id  TEXT,
                status      VARCHAR(20) DEFAULT 'stopped',
                autolike    BOOLEAN     DEFAULT FALSE,
                autoview    BOOLEAN     DEFAULT FALSE,
                created_at  TIMESTAMP   DEFAULT NOW(),
                updated_at  TIMESTAMP   DEFAULT NOW()
            )
        `);
        await pgPool.query(`
            ALTER TABLE dekutconnect_bots ADD COLUMN IF NOT EXISTS autolike BOOLEAN DEFAULT FALSE;
            ALTER TABLE dekutconnect_bots ADD COLUMN IF NOT EXISTS autoview BOOLEAN DEFAULT FALSE;
        `).catch(() => {});
        try {
            const legacyCheck = await pgPool.query("SELECT to_regclass('gifted_bots')");
            if (legacyCheck.rows[0]?.to_regclass) {
                await pgPool.query(`
                    INSERT INTO dekutconnect_bots (uid, phone, session_id, status, created_at, updated_at)
                    SELECT uid, phone, session_id, status, created_at, updated_at FROM gifted_bots
                    ON CONFLICT (uid) DO NOTHING
                `);
                console.log('PostgreSQL migration: Copied bots from gifted_bots to dekutconnect_bots');
            }
        } catch (migErr) {
            console.log('PostgreSQL migration check skipped for bots table:', migErr.message);
        }
        if (driver === 'json') {
            driver = 'postgresql';
            console.log('✅ UserStore: PostgreSQL connected');
        } else {
            console.log('✅ UserStore: PostgreSQL mirror also connected');
        }
        return true;
    } catch (e) {
        console.warn('⚠️  UserStore: PostgreSQL init failed:', e.message);
        pgPool = null;
        return false;
    }
}

function _ensureJsonFile() {
    if (!fs.existsSync(FALLBACK_FILE)) {
        fs.writeFileSync(FALLBACK_FILE, '{}', 'utf8');
    }
}

function _readJson() {
    try { return JSON.parse(fs.readFileSync(FALLBACK_FILE, 'utf8')); }
    catch { return {}; }
}

function _writeJson(data) {
    fs.writeFileSync(FALLBACK_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ─────────────────────────────────── CRUD ───────────────────────────────────

async function saveUserBot(uid, phone, sessionId, status = 'running') {
    const data = { uid, phone, session_id: sessionId, status, updated_at: new Date().toISOString() };

    // Always try pg mirror if available
    if (pgPool) {
        try {
            await pgPool.query(`
                INSERT INTO dekutconnect_bots (uid, phone, session_id, status, updated_at)
                VALUES ($1,$2,$3,$4,NOW())
                ON CONFLICT (uid) DO UPDATE
                SET phone=$2, session_id=$3, status=$4, updated_at=NOW()
            `, [uid, phone, sessionId, status]);
        } catch (e) { console.error('PG saveUserBot error:', e.message); }
    }

    if (firestoreDb) {
        try {
            await firestoreDb.collection('bots').doc(uid).set(data, { merge: true });
        } catch (e) { console.error('Firestore saveUserBot error:', e.message); }
    } else {
        const store = _readJson();
        // Preserve existing settings on JSON save
        const existing = store[uid] || {};
        store[uid] = { autolike: false, autoview: false, ...existing, ...data };
        _writeJson(store);
    }
}

async function getUserBot(uid) {
    if (firestoreDb) {
        try {
            const doc = await firestoreDb.collection('bots').doc(uid).get();
            return doc.exists ? doc.data() : null;
        } catch (e) { console.error('Firestore getUserBot error:', e.message); }
    }

    if (pgPool) {
        try {
            const r = await pgPool.query('SELECT * FROM dekutconnect_bots WHERE uid=$1', [uid]);
            return r.rows[0] || null;
        } catch (e) { console.error('PG getUserBot error:', e.message); }
    }

    const store = _readJson();
    return store[uid] || null;
}

async function updateUserBotStatus(uid, status) {
    if (pgPool) {
        try {
            await pgPool.query(
                'UPDATE dekutconnect_bots SET status=$1, updated_at=NOW() WHERE uid=$2',
                [status, uid]
            );
        } catch (e) { console.error('PG updateStatus error:', e.message); }
    }
    if (firestoreDb) {
        try {
            await firestoreDb.collection('bots').doc(uid).update({ status, updated_at: new Date().toISOString() });
        } catch (e) { console.error('Firestore updateStatus error:', e.message); }
    } else {
        const store = _readJson();
        if (store[uid]) { store[uid].status = status; store[uid].updated_at = new Date().toISOString(); }
        _writeJson(store);
    }
}

async function deleteUserBot(uid) {
    if (pgPool) {
        try { await pgPool.query('DELETE FROM dekutconnect_bots WHERE uid=$1', [uid]); }
        catch (e) { console.error('PG deleteUserBot error:', e.message); }
    }
    if (firestoreDb) {
        try { await firestoreDb.collection('bots').doc(uid).delete(); }
        catch (e) { console.error('Firestore deleteUserBot error:', e.message); }
    } else {
        const store = _readJson();
        delete store[uid];
        _writeJson(store);
    }
}

async function getAllActiveUserBots() {
    if (pgPool) {
        try {
            const r = await pgPool.query("SELECT * FROM dekutconnect_bots WHERE status != 'stopped'");
            return r.rows;
        } catch (e) { console.error('PG getAllActive error:', e.message); }
    }
    if (firestoreDb) {
        try {
            const snap = await firestoreDb.collection('bots').where('status', '!=', 'stopped').get();
            return snap.docs.map(d => d.data());
        } catch (e) { console.error('Firestore getAllActive error:', e.message); }
    }
    const store = _readJson();
    return Object.values(store).filter(b => b.status !== 'stopped');
}

async function updateUserBotSettings(uid, settings) {
    const { autolike, autoview } = settings;
    const patch = {};
    if (autolike !== undefined) patch.autolike = autolike;
    if (autoview !== undefined) patch.autoview = autoview;

    if (pgPool) {
        try {
            const keys = Object.keys(patch);
            if (keys.length > 0) {
                const sets = keys.map((k, i) => `${k}=$${i+1}`).join(', ');
                const vals = keys.map(k => patch[k]);
                await pgPool.query(
                    `UPDATE dekutconnect_bots SET ${sets}, updated_at=NOW() WHERE uid=$${keys.length + 1}`,
                    [...vals, uid]
                );
            }
        } catch (e) { console.error('PG updateSettings error:', e.message); }
    }
    if (firestoreDb) {
        try {
            await firestoreDb.collection('bots').doc(uid).update({ ...patch, updated_at: new Date().toISOString() });
        } catch (e) { console.error('Firestore updateSettings error:', e.message); }
    } else {
        const store = _readJson();
        if (store[uid]) {
            if (autolike !== undefined) store[uid].autolike = autolike;
            if (autoview !== undefined) store[uid].autoview = autoview;
            store[uid].updated_at = new Date().toISOString();
        }
        _writeJson(store);
    }
}

module.exports = {
    initUserStore,
    saveUserBot,
    getUserBot,
    updateUserBotStatus,
    deleteUserBot,
    getAllActiveUserBots,
    updateUserBotSettings
};
