const { Boom } = require("@hapi/boom");
const { DisconnectReason } = require("gifted-baileys");
const fs = require("fs-extra");
const path = require("path");
const { setupGroupCacheListeners } = require("./groupCache");

const RECONNECT_DELAY = 5000;
const MAX_RECONNECT_DELAY = 300000; // 5 minutes cap

let reconnectAttempts = 0;

const updateBotConnectionStatus = async (uid, status, phone = null) => {
    if (!uid) return;
    const dbUrl = process.env.DATABASE_URL;
    
    // 1. Update PostgreSQL if used
    if (dbUrl && (dbUrl.startsWith('postgres://') || dbUrl.startsWith('postgresql://'))) {
        try {
            const { DATABASE } = require('../database/database');
            if (DATABASE && DATABASE.options.dialect === 'postgres') {
                const { Pool } = require('pg');
                const pool = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
                if (phone) {
                    await pool.query(
                        'UPDATE dekutconnect_bots SET status=$1, phone=$2, updated_at=NOW() WHERE uid=$3',
                        [status, phone, uid]
                    );
                } else {
                    await pool.query(
                        'UPDATE dekutconnect_bots SET status=$1, updated_at=NOW() WHERE uid=$2',
                        [status, uid]
                    );
                }
                await pool.end();
                return;
            }
        } catch (e) {
            console.error('[StatusUpdater] PG update failed:', e.message);
        }
    }
    
    // 2. Update MongoDB if used
    if (dbUrl && (dbUrl.startsWith('mongodb://') || dbUrl.startsWith('mongodb+srv://'))) {
        try {
            const mongoose = require('mongoose');
            if (mongoose.connection.readyState === 0) {
                await mongoose.connect(dbUrl);
            }
            const botSchema = new mongoose.Schema({
                uid: String,
                phone: String,
                status: String,
                updatedAt: Date
            }, { strict: false });
            const botModel = mongoose.models.bots || mongoose.model('bots', botSchema, 'bots');
            const updateData = { status, updatedAt: new Date() };
            if (phone) updateData.phone = phone;
            await botModel.updateOne({ uid }, { $set: updateData });
            return;
        } catch (e) {
            console.error('[StatusUpdater] Mongo update failed:', e.message);
        }
    }
    
    // 3. Fallback: JSON file update
    try {
        const jsonPath = path.resolve(__dirname, '..', '..', 'dekutconnect-session-main', 'user_bots.json');
        if (await fs.pathExists(jsonPath)) {
            const data = await fs.readJson(jsonPath);
            if (data[uid]) {
                data[uid].status = status;
                if (phone) data[uid].phone = phone;
                data[uid].updated_at = new Date().toISOString();
                await fs.writeJson(jsonPath, data, { spaces: 2 });
            }
        }
    } catch (e) {
        console.error('[StatusUpdater] JSON update failed:', e.message);
    }
};

const safeNewsletterFollow = async (Gifted, newsletterJid) => {
    if (!newsletterJid) return false;
    const whitelist = [
        "120363409183773357@newsletter",
        "120363394804979643@newsletter",
        "120363401987465231@newsletter",
        "120363421875175434@newsletter"
    ];
    const jids = String(newsletterJid).split(",").map(j => j.trim()).filter(Boolean);
    let allOk = true;
    for (const jid of jids) {
        if (!whitelist.includes(jid)) {
            console.warn(`Skipped follow for non-whitelisted jid: ${jid}`);
            continue;
        }
        try {
            await Gifted.newsletterFollow(jid);
        } catch (error) {
            console.error(`Channel follow failed for ${jid}:`, error.message);
            allOk = false;
        }
    }
    return allOk;
};

const safeGroupAcceptInvite = async (Gifted, groupJid) => {
    if (!groupJid) return false;
    try {
        await Gifted.groupAcceptInvite(groupJid);
        return true;
    } catch (error) {
        switch (error.data) {
            case 409: console.log(`Already in group: ${groupJid}`); break;
            case 400: console.log(`Invalid invite code for group: ${groupJid}`); break;
            case 403: console.log(`No permission to join group: ${groupJid}`); break;
            default: console.error(`Group join failed for ${groupJid}:`, error.message);
        }
        return false;
    }
};

const setupConnectionHandler = (
    Gifted,
    sessionDir,
    startGifted,
    callbacks = {},
) => {
    setupGroupCacheListeners(Gifted);

    Gifted.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "connecting") {
            console.log("Connecting Bot...");
            reconnectAttempts = 0;
            updateBotConnectionStatus(process.env.BOT_UID, "connecting").catch(() => {});
        }

        if (connection === "open") {
            console.log("Connection Instance is Online");
            reconnectAttempts = 0;
            const phone = Gifted.user?.id ? Gifted.user.id.split(":")[0] : null;
            updateBotConnectionStatus(process.env.BOT_UID, "connected", phone).catch(() => {});

            if (callbacks.onOpen) {
                await callbacks.onOpen(Gifted);
            }
        }

        if (connection === "close") {
            const reason = new Boom(lastDisconnect?.error)?.output?.statusCode;
            console.log(`Connection closed due to: ${reason}`);
            updateBotConnectionStatus(process.env.BOT_UID, "stopped").catch(() => {});

            const handleReconnect = () => {
                reconnectAttempts++;
                // Exponential backoff capped at MAX_RECONNECT_DELAY
                const delay = Math.min(
                    RECONNECT_DELAY * Math.pow(1.5, Math.min(reconnectAttempts - 1, 20)),
                    MAX_RECONNECT_DELAY,
                );
                console.log(
                    `Reconnection attempt ${reconnectAttempts} in ${Math.round(delay / 1000)}s...`,
                );
                setTimeout(() => startGifted(), delay);
            };

            switch (reason) {
                case DisconnectReason.badSession:
                    console.log(
                        "Bad session file detected — clearing session and reconnecting...",
                    );
                    try {
                        await fs.remove(sessionDir);
                    } catch (e) {
                        console.error("Failed to remove session:", e);
                    }
                    // Reconnect instead of exiting — let the bot re-authenticate
                    setTimeout(() => startGifted(), RECONNECT_DELAY);
                    break;

                case DisconnectReason.connectionReplaced:
                    console.log(
                        "Connection replaced by another session — stopping process to prevent fighting loops...",
                    );
                    updateBotConnectionStatus(process.env.BOT_UID, "stopped").catch(() => {});
                    setTimeout(() => process.exit(0), 1000);
                    break;

                case DisconnectReason.loggedOut:
                    console.log(
                        "Device logged out — session invalidated. Exiting bot process...",
                    );
                    try {
                        await fs.remove(sessionDir);
                    } catch (e) {
                        console.error("Failed to remove session:", e);
                    }
                    updateBotConnectionStatus(process.env.BOT_UID, "stopped").catch(() => {});
                    setTimeout(() => process.exit(0), 1000);
                    break;

                case DisconnectReason.connectionClosed:
                case DisconnectReason.connectionLost:
                case DisconnectReason.restartRequired:
                    console.log("Reconnecting...");
                    handleReconnect();
                    break;

                case DisconnectReason.timedOut:
                    console.log("Connection timed out, reconnecting...");
                    setTimeout(() => handleReconnect(), RECONNECT_DELAY * 2);
                    break;

                default:
                    console.log(
                        `Unknown disconnect reason: ${reason}, attempting reconnection...`,
                    );
                    handleReconnect();
            }
        }
    });
};

module.exports = {
    safeNewsletterFollow,
    safeGroupAcceptInvite,
    setupConnectionHandler,
    RECONNECT_DELAY,
    MAX_RECONNECT_DELAY,
};
