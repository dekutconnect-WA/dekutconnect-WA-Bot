'use strict';

const config = require('../config');

let admin = null;
let database = null;

function parseCredential(raw) {
    if (!raw) return null;
    try {
        return JSON.parse(raw);
    } catch (_) {
        return JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    }
}

function init() {
    if (database) return true;
    const raw = config.FIREBASE_SERVICE_ACCOUNT || config.FIREBASE_ADMIN_CREDENTIAL;
    if (!raw) return false;

    admin = require('firebase-admin');
    if (!admin.apps.length) {
        const serviceAccount = parseCredential(raw);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: config.FIREBASE_PROJECT_ID,
            databaseURL: config.FIREBASE_DATABASE_URL,
        });
    }
    database = admin.database();
    return true;
}

async function queueCommand(uid, command) {
    if (!init()) throw new Error('Firebase remote bridge is not configured.');
    const ref = database.ref(`botCommands/${uid}`).push();
    await ref.set({
        ...command,
        id: ref.key,
        status: 'queued',
        createdAt: admin.database.ServerValue.TIMESTAMP,
    });
    return ref.key;
}

async function getStatus(uid) {
    if (!init()) return null;
    const snapshot = await database.ref(`botStatus/${uid}`).get();
    return snapshot.exists() ? snapshot.val() : null;
}

module.exports = {
    queueCommand,
    getStatus,
    isEnabled: () => config.BOT_CONTROL_MODE === 'firebase',
};
