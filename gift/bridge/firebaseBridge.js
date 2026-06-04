'use strict';

const config = require('../../config');

let admin = null;
let database = null;
let unsubscribe = null;

function parseCredential(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (_) {
        return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
}

function initAdmin() {
    if (!config.BOT_BRIDGE_ENABLED || !config.FIREBASE_ADMIN_CREDENTIAL) return false;
    if (database) return true;

    admin = require('firebase-admin');
    if (!admin.apps.length) {
        const serviceAccount = parseCredential(config.FIREBASE_ADMIN_CREDENTIAL);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.FIREBASE_PROJECT_ID,
            databaseURL: config.FIREBASE_DATABASE_URL,
        });
    }
    database = admin.database();
    return true;
}

async function updateStatus(uid, patch) {
    if (!initAdmin() || !uid) return;
    await database.ref(`botStatus/${uid}`).update({
        ...patch,
        updatedAt: admin.database.ServerValue.TIMESTAMP,
    });
}

function startCommandBridge(Gifted, uid = config.BOT_UID) {
    if (!initAdmin() || !uid || unsubscribe) return;

    const ref = database.ref(`botCommands/${uid}`);
    unsubscribe = ref.on('child_added', async (snapshot) => {
        const command = snapshot.val() || {};
        const commandRef = snapshot.ref;

        if (command.status && command.status !== 'queued') return;

        try {
            await commandRef.update({
                status: 'processing',
                pickedAt: admin.database.ServerValue.TIMESTAMP,
            });

            if (command.type === 'ping') {
                await updateStatus(uid, { state: 'online', phone: Gifted?.user?.id || null });
            } else if (command.type === 'sendMessage' && command.to && command.text) {
                await Gifted.sendMessage(command.to, { text: command.text });
            } else {
                throw new Error(`Unsupported command: ${command.type || 'missing'}`);
            }

            await commandRef.update({
                status: 'done',
                doneAt: admin.database.ServerValue.TIMESTAMP,
            });
        } catch (error) {
            await commandRef.update({
                status: 'failed',
                error: error.message,
                failedAt: admin.database.ServerValue.TIMESTAMP,
            });
        }
    });

    setInterval(() => {
        updateStatus(uid, {
            state: 'online',
            phone: Gifted?.user?.id || null,
            pid: process.pid,
            uptime: Math.round(process.uptime()),
        }).catch(() => {});
    }, 30000).unref();
}

function stopCommandBridge() {
    if (unsubscribe && database && config.BOT_UID) {
        database.ref(`botCommands/${config.BOT_UID}`).off('child_added', unsubscribe);
    }
    unsubscribe = null;
}

module.exports = {
    startCommandBridge,
    stopCommandBridge,
    updateStatus,
};
