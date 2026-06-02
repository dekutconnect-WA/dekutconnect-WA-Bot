/**
 * botManager.js — Spawns and manages WhatsApp bot child processes per user
 * DEKUTCONNECT Multi-User Bot Manager
 */
'use strict';

const { spawn } = require('child_process');
const path = require('path');
const { updateUserBotStatus, getAllActiveUserBots } = require('./userStore');

const BOT_ROOT = path.resolve(__dirname, '..', '..'); // dekutconnect-bot root
const activeProcesses = new Map(); // uid -> ChildProcess
const restartHistory = new Map();  // uid -> [timestamps]

const MAX_RESTARTS_PER_WINDOW = 10;     // Max restarts in the time window
const RESTART_WINDOW_MS = 5 * 60 * 1000; // 5 minute window
const RESTART_DELAY_MS = 5000;            // Delay before auto-restart
const MAX_BOT_MEMORY_MB = 512;            // Memory limit per bot (MB)

function _canRestart(uid) {
    const now = Date.now();
    const history = restartHistory.get(uid) || [];
    // Prune old entries outside the window
    const recent = history.filter(t => (now - t) < RESTART_WINDOW_MS);
    restartHistory.set(uid, recent);
    return recent.length < MAX_RESTARTS_PER_WINDOW;
}

function _recordRestart(uid) {
    const history = restartHistory.get(uid) || [];
    history.push(Date.now());
    restartHistory.set(uid, history);
}

function startBot(uid, sessionId) {
    if (activeProcesses.has(uid)) {
        const existing = activeProcesses.get(uid);
        if (existing && !existing.killed) {
            console.log(`[BotManager] Bot already running for uid=${uid}`);
            return;
        }
    }

    console.log(`[BotManager] Starting bot for uid=${uid}`);

    const env = {
        ...process.env,
        SESSION_ID: sessionId,
        NO_SERVER: 'true',
        BOT_UID: uid,
        NODE_OPTIONS: `--max-old-space-size=${MAX_BOT_MEMORY_MB}`,
    };

    const child = spawn('node', ['index.js'], {
        cwd: BOT_ROOT,
        env,
        detached: false,
        stdio: ['ignore', 'pipe', 'pipe'],
    });

    // Store session ID alongside the process for auto-restart
    child._sessionId = sessionId;
    activeProcesses.set(uid, child);

    child.stdout.on('data', (d) => {
        process.stdout.write(`[BOT:${uid.slice(0,6)}] ${d}`);
    });
    child.stderr.on('data', (d) => {
        process.stderr.write(`[BOT:${uid.slice(0,6)}] ERR: ${d}`);
    });

    child.on('exit', async (code, signal) => {
        console.log(`[BotManager] Bot uid=${uid} exited with code ${code} signal ${signal}`);
        activeProcesses.delete(uid);

        // Auto-restart on unexpected exit (code !== 0 and not manually stopped)
        if (code !== 0 && code !== null && signal !== 'SIGTERM') {
            if (_canRestart(uid)) {
                _recordRestart(uid);
                console.log(`[BotManager] Auto-restarting bot uid=${uid} in ${RESTART_DELAY_MS}ms...`);
                setTimeout(() => {
                    startBot(uid, sessionId);
                    updateUserBotStatus(uid, 'running').catch(() => {});
                }, RESTART_DELAY_MS);
                return; // Don't mark as stopped since we're restarting
            } else {
                console.error(`[BotManager] Bot uid=${uid} exceeded max restarts (${MAX_RESTARTS_PER_WINDOW} in ${RESTART_WINDOW_MS/1000}s). Stopping.`);
            }
        }

        try { await updateUserBotStatus(uid, 'stopped'); } catch (_) {}
    });

    child.on('error', (err) => {
        console.error(`[BotManager] Bot uid=${uid} process error:`, err.message);
        activeProcesses.delete(uid);
    });
}

async function stopBot(uid) {
    const child = activeProcesses.get(uid);
    if (!child || child.killed) {
        activeProcesses.delete(uid);
        await updateUserBotStatus(uid, 'stopped').catch(() => {});
        return;
    }
    // Clear restart history so auto-restart doesn't fire
    restartHistory.delete(uid);
    child.kill('SIGTERM');
    activeProcesses.delete(uid);
    await updateUserBotStatus(uid, 'stopped').catch(() => {});
    console.log(`[BotManager] Stopped bot for uid=${uid}`);
}

async function restartBot(uid, sessionId) {
    await stopBot(uid);
    await new Promise(r => setTimeout(r, 1500));
    startBot(uid, sessionId);
    await updateUserBotStatus(uid, 'running').catch(() => {});
}

function isBotRunning(uid) {
    const child = activeProcesses.get(uid);
    return !!(child && !child.killed);
}

async function initAllActiveBots() {
    try {
        const bots = await getAllActiveUserBots();
        console.log(`[BotManager] Restoring ${bots.length} active bots (staggered)...`);
        // Staggered startup: 3 second delay between each bot to prevent thundering herd
        for (let i = 0; i < bots.length; i++) {
            const bot = bots[i];
            const uid = bot.uid;
            const sessionId = bot.session_id;
            if (uid && sessionId) {
                const delay = 2000 + (i * 3000); // Stagger by 3 seconds per bot
                setTimeout(() => startBot(uid, sessionId), delay);
            }
        }
    } catch (e) {
        console.error('[BotManager] initAllActiveBots error:', e.message);
    }
}

function getConnectedBotsCount() {
    let count = 0;
    for (const child of activeProcesses.values()) {
        if (child && !child.killed) {
            count++;
        }
    }
    return count;
}

module.exports = { startBot, stopBot, restartBot, isBotRunning, initAllActiveBots, getConnectedBotsCount };
