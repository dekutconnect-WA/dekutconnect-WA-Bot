try {
    require('fs-extra');
    require('sharp');
} catch (e) {
    console.log('⚡ [Self-Installer] Missing dependencies! Starting fast bootstrap...');
    const fs = require('fs');
    const path = require('path');
    const cp = require('child_process');

    try {
        console.log('🗑️ [Self-Installer] Clearing .npm, .cache, and node_modules to free up disk space...');
        fs.rmSync(path.join(process.cwd(), '.npm'), { recursive: true, force: true });
        fs.rmSync(path.join(process.cwd(), '.cache'), { recursive: true, force: true });
        fs.rmSync(path.join(process.cwd(), 'node_modules'), { recursive: true, force: true });
        console.log('✅ [Self-Installer] Space cleared successfully.');
    } catch (err) {
        console.warn('⚠️ [Self-Installer] Cache cleanup warning:', err.message);
    }

    try {
        console.log('📦 [Self-Installer] Running npm install --omit=dev --no-audit --no-fund --prefer-offline...');
        cp.execSync('npm install --omit=dev --no-audit --no-fund --prefer-offline', { stdio: 'inherit' });
        
        // Auto-recreate the hash file to prevent subsequent panel installs
        const crypto = require('crypto');
        const pkgJson = fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8');
        const md5 = crypto.createHash('md5').update(pkgJson).digest('hex');
        fs.mkdirSync(path.join(process.cwd(), 'node_modules'), { recursive: true });
        fs.writeFileSync(path.join(process.cwd(), 'node_modules/.pkg_hash'), md5);
        
        console.log('🎉 [Self-Installer] Dependencies installed successfully! Booting bot...');
    } catch (err) {
        console.error('❌ [Self-Installer] Installation failed:', err.message);
        process.exit(1);
    }
}

require("events").EventEmitter.defaultMaxListeners = 0; // Unlimited — required for high-concurrency bot

// 🔒 Network-level block: prevent any library from fetching external newsletter JIDs.
// The obfuscated gifted-btns package makes HTTP(S) requests to files.gifted.co.ke
// to inject foreign newsletter JIDs. We intercept at the Node.js http/https layer so
// no module — regardless of obfuscation — can reach that endpoint.
(function installNetworkGuard() {
    const _https = require('https');
    const _http  = require('http');

    // Only block the specific file-hosting subdomain used for newsletter injection.
    // Other gifted.co.ke subdomains (e.g. yts.gifted.co.ke) are intentionally allowed.
    const BLOCKED_HOSTS = ['files.gifted.co.ke'];

    function isBlocked(options) {
        const host = (typeof options === 'string' || options instanceof URL)
            ? (typeof options === 'string' ? new URL(options).hostname : options.hostname)
            : (options.hostname || options.host || '');
        return BLOCKED_HOSTS.some(b => String(host) === b || String(host).endsWith('.' + b));
    }

    function patchRequest(mod) {
        const original = mod.request.bind(mod);
        mod.request = function(options, cb) {
            if (isBlocked(options)) {
                const target = typeof options === 'string' ? options : (options.hostname || options.host || '?');
                console.warn(`[NetworkGuard] Blocked outgoing request to restricted host: ${target}`);
                // Return a no-op fake request that won't crash the caller
                const { PassThrough } = require('stream');
                const fake = new PassThrough();
                fake.end = () => {};
                fake.write = () => {};
                fake.abort = () => {};
                fake.destroy = () => {};
                fake.on = () => fake;
                fake.once = () => fake;
                fake.setTimeout = () => fake;
                setImmediate(() => {
                    if (typeof cb === 'function') {
                        try { cb({ statusCode: 403, headers: {}, on: () => {}, pipe: () => {}, resume: () => {} }); } catch (_) {}
                    }
                });
                return fake;
            }
            return original(options, cb);
        };
    }

    patchRequest(_https);
    patchRequest(_http);
})();

require("./gift/gmdHelpers");

const {
    default: giftedConnect,
    isJidGroup,
    jidNormalizedUser,
    isJidBroadcast,
    downloadMediaMessage,
    downloadContentFromMessage,
    getContentType,
    fetchLatestWaWebVersion,
} = require("gifted-baileys");

const {
    evt,
    logger,
    emojis,
    commands,
    setSudo,
    delSudo,
    GiftedTechApi,
    GiftedApiKey,
    GiftedAutoReact,
    GiftedAntiLink,
    GiftedAntibad,
    GiftedAntiGroupMention,
    GiftedAutoBio,
    handleGameMessage,
    GiftedChatBot,
    loadSession,
    useSQLiteAuthState,
    getMediaBuffer,
    getSudoNumbers,
    getFileContentType,
    bufferToStream,
    uploadToPixhost,
    uploadToImgBB,
    setCommitHash,
    getCommitHash,
    getSyncDate,
    gmdBuffer,
    gmdJson,
    formatAudio,
    formatVideo,
    toAudio,
    uploadToGithubCdn,
    uploadToGiftedCdn,
    uploadToCatbox,
    GiftedAnticall,
    createContext,
    createContext2,
    verifyJidState,
    GiftedPresence,
    GiftedAntiDelete,
    GiftedAntiEdit,
    syncDatabase,
    initializeSettings,
    initializeGroupSettings,
    getAllSettings,
    DEFAULT_SETTINGS,
    standardizeJid,
    serializeMessage,
    loadPlugins,
    findCommand,
    findBodyCommand,
    createHelpers,
    getGroupInfo,
    buildSuperUsers,
    getGroupMetadata,
    createSocketConfig,
    safeNewsletterFollow,
    safeGroupAcceptInvite,
    setupConnectionHandler,
    setupGroupEventsListeners,
    initializeLidStore,
} = require("./gift");

const {
    saveAntiDelete,
    findAntiDelete,
    removeAntiDelete,
    startCleanup,
    SQLiteStore,
} = require('./gift/database/messageStore');

const config = require("./config");
const googleTTS = require("google-tts-api");
const fs = require("fs-extra");
const path = require("path");
const axios = require('axios');
const express = require("express");
const firebaseBridge = require("./gift/bridge/firebaseBridge");

/**
 * Resolves any JID to a real phone JID (@s.whatsapp.net).
 * Returns the original jid unchanged if it is already a real JID.
 * Returns null only when jid itself is null/undefined.
 * When a LID cannot be resolved it returns the original LID as a best-effort
 * fallback so the operation still fires rather than being silently skipped.
 */
async function resolveRealJid(Gifted, jid) {
    if (!jid) return null;
    if (!jid.endsWith('@lid')) return jid;   // already real
    try {
        const { getLidMapping } = require('./gift/connection/groupCache');
        const cached = getLidMapping(jid);
        if (cached) return cached;
    } catch (_) {}
    try {
        const resolved = await Gifted.getJidFromLid(jid);
        if (resolved && !resolved.endsWith('@lid')) return resolved;
    } catch (_) {}
    try {
        const { getLidMappingFromDb } = require('./gift/database/lidMapping');
        const fromDb = await getLidMappingFromDb(jid);
        if (fromDb) return fromDb;
    } catch (_) {}
    return jid;   // best effort — return original LID so the operation still fires
}

const { SESSION_ID: sessionId } = config;
const PORT = process.env.PORT || process.env.SERVER_PORT || 5000;
const app = express();
let Gifted;
let store;

logger.level = "silent";
if (config.SESSION_ID) {
    app.use(express.static("gift"));
    app.get("/", (req, res) => res.sendFile(__dirname + "/gift/gifted.html"));
} else {
    console.log("ℹ️ Registering Session Server middleware...");
    const sessionApp = require('./gifted-session-main/index.js');
    app.use('/', sessionApp);
}
app.get("/health", async (req, res) => {
    const health = {
        status: "UP",
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        checks: {
            database: "UNKNOWN",
            redis: "UNKNOWN",
            storage: "UNKNOWN",
            memory: "OK"
        }
    };

    let httpStatus = 200;

    // 1. Verify Sequelize Database connection
    try {
        const { DATABASE } = require("./gift/database/database");
        await DATABASE.authenticate();
        health.checks.database = "CONNECTED";
    } catch (e) {
        health.checks.database = "DISCONNECTED";
        health.status = "DOWN";
        httpStatus = 503;
    }

    // 2. Verify Redis client status
    try {
        const { getRedisClient } = require("./gift/database/redis");
        const client = await getRedisClient();
        health.checks.redis = client ? "CONNECTED" : "FALLBACK_MEM";
    } catch (_) {
        health.checks.redis = "FAILED";
    }

    // 3. Verify S3 client status
    try {
        const s3Store = require("./gift/s3Store");
        health.checks.storage = s3Store.getS3Client() ? "S3_ACTIVE" : "LOCAL_DISK";
    } catch (_) {
        health.checks.storage = "FAILED";
    }

    // 4. Verify memory pressure
    const memory = process.memoryUsage();
    health.memory = {
        heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024),
        heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024),
        rssMb: Math.round(memory.rss / 1024 / 1024)
    };
    if (health.memory.rssMb > 450) {
        health.checks.memory = "PRESSURE_WARNING";
    }

    res.status(httpStatus).json(health);
});

app.get("/api/check-wa", async (req, res) => {
    const number = (req.query.number || "").replace(/[^0-9]/g, "");
    if (!number) return res.status(400).json({ error: "Missing number parameter" });
    if (!Gifted || !Gifted.user) {
        return res.status(503).json({ error: "System bot not online yet." });
    }
    try {
        const [result] = await Gifted.onWhatsApp(number);
        if (result && result.exists) {
            return res.json({ exists: true, jid: result.jid });
        } else {
            return res.json({ exists: false });
        }
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

if (process.env.NO_SERVER !== "true") {
    app.listen(PORT, () => console.log(`Server Running on Port: ${PORT}`));
} else {
    console.log(`[Bot] Running in NO_SERVER mode, bypassing HTTP server listen.`);
}

setInterval(() => {
    const used = process.memoryUsage();
    if (used.heapUsed > 400 * 1024 * 1024) {
        if (global.gc) global.gc();
    }
}, 60000);

if (process.env.NO_SERVER !== "true") {
    setInterval(async () => {
        try {
            const http = require("http");
            http.get(`http://localhost:${PORT}/health`, () => {});
        } catch (e) {}
    }, 240000);
}

const sessionDir = process.env.BOT_UID
    ? path.join(__dirname, "gift", `session_${process.env.BOT_UID}`)
    : path.join(__dirname, "gift", "session");
const pluginsPath = path.join(__dirname, "dekutconnect");

let botSettings = {};
async function loadBotSettings() {
    await syncDatabase();
    await initializeSettings();
    await initializeGroupSettings();
    botSettings = await getAllSettings();
    return botSettings;
}

startCleanup();

// ─── In your MAIN FILE (startGifted) ───────────────────────────────────────

// Define extractButtonId HERE (or import it from a shared utils file)
function extractButtonId(msg) {
    if (!msg) return null;
    if (msg.templateButtonReplyMessage?.selectedId)
        return msg.templateButtonReplyMessage.selectedId;
    if (msg.buttonsResponseMessage?.selectedButtonId)
        return msg.buttonsResponseMessage.selectedButtonId;
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
        return msg.listResponseMessage.singleSelectReply.selectedRowId;
    if (msg.interactiveResponseMessage) {
        const nf = msg.interactiveResponseMessage.nativeFlowResponseMessage;
        if (nf?.paramsJson) {
            try { const p = JSON.parse(nf.paramsJson); if (p.id) return p.id; } catch {}
        }
        return msg.interactiveResponseMessage.buttonId || null;
    }
    return null;
}
// ── Track processed message IDs to prevent double-firing ──
const processedMsgIds = new Set();

async function startGifted() {
    try {
        const { version } = await fetchLatestWaWebVersion();
        const sessionDbPath = path.join(sessionDir, "session.db");
        const { state, saveCreds } = await useSQLiteAuthState(sessionDbPath);

        if (store) store.destroy();
        store = new SQLiteStore();

        const socketConfig = createSocketConfig(version, state, logger);
        socketConfig.getMessage = async (key) => {
            if (store) {
                const msg = await store.loadMessage(key.remoteJid, key.id);
                return msg?.message || undefined;
            }
            return { conversation: "Error occurred" };
        };

        Gifted = giftedConnect(socketConfig);

        // 🛡️ Security Shield: Intercept and validate all newsletter follow requests
        if (Gifted && typeof Gifted.newsletterFollow === 'function') {
            const originalFollow = Gifted.newsletterFollow;
            Gifted.newsletterFollow = async (jid, ...args) => {
                const allowedJids = [
                    "120363409183773357@newsletter",
                    "120363394804979643@newsletter",
                    "120363401987465231@newsletter",
                    "120363421875175434@newsletter"
                ];
                if (allowedJids.includes(jid)) {
                    console.log(`[Security Shield] Allowed newsletter follow: ${jid}`);
                    return originalFollow.call(Gifted, jid, ...args);
                } else {
                    console.warn(`[Security Shield] BLOCKED unauthorized newsletter follow attempt to: ${jid}`);
                    return { status: 200, message: "Blocked by security policy" };
                }
            };
        }

        store.bind(Gifted.ev);

        // ── GLOBAL BUTTON HANDLER ──────────────────────────────────────────
        Gifted.ev.on("messages.upsert", async ({ messages }) => {
            try {
                const msg = messages[0];
                if (!msg?.message) return;

                // Deduplicate: skip if we already handled this message ID
                const msgId = msg.key.id;
                if (processedMsgIds.has(msgId)) return;
                processedMsgIds.add(msgId);
                // Clean up after 10 seconds to avoid memory leak
                setTimeout(() => processedMsgIds.delete(msgId), 10000);

                const buttonId = extractButtonId(msg.message);
                if (!buttonId) return;

                if (buttonId === "follow_btn") {
                    await Gifted.sendMessage(
                        msg.key.remoteJid,
                        {
                            text: "‎˙✧˖°🎓 ༘⋆｡D͎eK͎U͎T͎ C͎O͎N͎N͎E͎C͎T͎𓂃𓂃𓂃✍️︎\n‎「ᵛᵉʳᶦᶠᶦᵉᵈ」Dedan Kimathi University of Technology number one source of entertainment.\n‎ \n‎We provide❯❯❯❯❯ ╰┈➤\n➤ ① Entertainment and juicy gist\n➤ ②  Hot campus Trends & Gossips\n➤ ③  Real talk from DeKUT fam\n➤ ④ Snapshots of campus culture\n➤ ⑤ HELB § KUCCPS updates\n➤ ⑥  Bursary updates\n‎⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘⫘\n‎\n‎✆𝒂𝒅𝒎𝒊𝒏/𝒂𝒅𝒗𝒆𝒓𝒕𝒊𝒔𝒆𝒎𝒆𝒏𝒕/ 𝒂𝒏𝒅 𝒑𝒓𝒐𝒎𝒐𝒔♛\n‎https://tinyurl.com/dekutconnect-admin\n𝑨𝒏𝒐𝒏𝒚𝒎𝒐𝒖𝒔 enquiries👇\nhttps://twet.link/dekutconnect\n‎┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n‎✆ ᵂʰᵃᵗˢᵃᵖᵖ group ᶜᵒᵐᵐᵘⁿⁱᵗʸ ꨄ︎\nhttps://chat.whatsapp.com/KqVMAYzgQSXAKF4kNuKfWR?mode=hqrt3\nAll groups👇\n‎https://tinyurl.com/dekutconnect-groups\n‎\n‎┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\nᵂʰᵃᵗˢᵃᵖᵖ channel\nhttps://whatsapp.com/channel/0029VbAb8L46WaKx34k8vU0S\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n𝕏: https://x.com/dekutconnect\n┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n‎ ❤️‍🔥⃟.  𝙏𝙚𝙡𝙚𝙜𝙧𝙖𝙢 𝘾𝙝𝙖𝙣𝙣𝙚𝙡 𝟙𝟠₊\n‎𖤍 https://t.me/addlist/B7N3JNdzaOo1ZDc8\n‎┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n‎🅾️𝐈𝐧𝐬𝐭𝐚𝐠𝐫𝐚𝐦ᯓᡣ\n‎🌟 instagram.com/dekutconnect\n‎┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈┈\n‎‎⌯⌲𝑫𝒆𝑲𝑼𝑻CONNECT all resources\n‎https://bit.ly/dekutconnect",
                        },
                        { quoted: msg },
                    );
                }
            } catch (err) {
                console.error("Global button handler error:", err);
            }
        });

        Gifted.ev.process(async (events) => {
            if (events["creds.update"]) await saveCreds();
        });

        setupAutoReact(Gifted);
        setupAntiDelete(Gifted);
        setupAutoBio(Gifted);
        setupAntiCall(Gifted);
        setupNewsletterReact(Gifted);
        setupPresence(Gifted);
        setupChatBotAndAntiLink(Gifted);
        setupAntiEdit(Gifted);
        setupStatusHandlers(Gifted);
        setupGroupEventsListeners(Gifted);

        loadPlugins(pluginsPath);
        setupCommandHandler(Gifted);

        setupConnectionHandler(Gifted, sessionDir, startGifted, {
            onOpen: async (Gifted) => {
                firebaseBridge.startCommandBridge(Gifted, process.env.BOT_UID || Gifted.user?.id || "");
                firebaseBridge.updateStatus(process.env.BOT_UID || Gifted.user?.id || "", {
                    state: "online",
                    phone: Gifted.user?.id || null,
                }).catch(() => {});
                const allJids = PERMANENT_NEWSLETTER_JIDS.join(",");
                await safeNewsletterFollow(Gifted, allJids);
                const s = await getAllSettings();
                await safeGroupAcceptInvite(Gifted, s.GC_JID);
                await initializeLidStore(Gifted);

                setTimeout(async () => {
                    try {
                        const { sendButtons } = require("gifted-btns");

                        const totalCommands = commands.filter(
                            (c) => c.pattern && !c.dontAddCommandList,
                        ).length;

                        // Fetch last sync date from DB
                        let lastSyncDate = 'Never synced';
                        try { lastSyncDate = await getSyncDate(); } catch (_) {}

                        console.log(`💜 Connected to Whatsapp, Active! | Last Sync: ${lastSyncDate}`);

                        if (s.STARTING_MESSAGE === "true") {
                            const d = DEFAULT_SETTINGS;
                            const md = s.MODE === "public" ? "public" : "private";

                            const connectionMsg = `
*${s.BOT_NAME || d.BOT_NAME} 𝐂𝐎𝐍𝐍𝐄𝐂𝐓𝐄𝐃*

𝐍𝐨𝐭𝐞: Bot may take some few seconds/minutes to sync before being ready.

𝐏𝐫𝐞𝐟𝐢𝐱      : *[ ${s.PREFIX || d.PREFIX} ]*
𝐏𝐥𝐮𝐠𝐢𝐧𝐬    : *${totalCommands}*
𝐌𝐨𝐝𝐞        : *${md}*
𝐎𝐰𝐧𝐞𝐫      : *${s.OWNER_NUMBER || d.OWNER_NUMBER}*
𝐋𝐚𝐬𝐭 𝐒𝐲𝐧𝐜 : *${lastSyncDate}*
𝐔𝐩𝐝𝐚𝐭𝐞𝐬   : *${s.NEWSLETTER_URL || d.NEWSLETTER_URL}*

Connect to RizzRok App and enjoy Premium WhatsApp Features 🚀
𝟏. 𝐒𝐚𝐯𝐞 𝐬𝐭𝐚𝐭𝐮𝐬 𝐰𝐢𝐭𝐡 𝐨𝐧𝐞 𝐜𝐥𝐢𝐜𝐤
𝟐. 𝐒𝐚𝐯𝐞 𝐕𝐢𝐞𝐰 𝐎𝐧𝐜𝐞 𝐖𝐢𝐭𝐡 𝐨𝐧𝐞 𝐜𝐥𝐢𝐜𝐤
𝟑. 𝐒𝐞𝐞 𝐯𝐢𝐞𝐰 𝐎𝐧𝐜𝐞 𝐰𝐢𝐭𝐡𝐨𝐮𝐭 𝐢𝐧𝐟𝐨𝐫𝐦𝐢𝐧𝐠 𝐭𝐡𝐞 𝐬𝐞𝐧𝐝𝐞𝐫
𝟒. 𝐀𝐧𝐭𝐢𝐃𝐞𝐥𝐞𝐭𝐞
𝟓. 𝐏𝐨𝐬𝐭 𝐆𝐫𝐨𝐮𝐩 𝐒𝐭𝐚𝐭𝐮𝐬 𝐰𝐢𝐭𝐡𝐨𝐮𝐭 𝐌𝐞𝐧𝐭𝐢𝐨𝐧𝐢𝐧𝐠 𝐠𝐫𝐨𝐮𝐩
𝟔. 𝐄𝐃𝐈𝐓 𝐦𝐞𝐬𝐬𝐚𝐠𝐞 𝐦𝐚𝐧𝐲 𝐭𝐢𝐦𝐞𝐬 𝐲𝐨𝐮 𝐰𝐢𝐬𝐡.
...ᵃⁿᵈ ᵐᵒʳᵉ ᵖʳᵉᵐⁱᵘᵐ ᵂʰᵃᵗˢᴬᵖᵖ ᶠᵉᵃᵗᵘʳᵉˢ

> *${s.CAPTION || d.CAPTION}*`;

                            const ctx = await createContext(
                                s.BOT_NAME || d.BOT_NAME,
                                {
                                    title: "BOT INTEGRATED",
                                    body: "Status: Ready for Use",
                                },
                            );

                            await sendButtons(
                                Gifted,
                                Gifted.user.id,
                                {
                                    title: `${s.BOT_NAME || d.BOT_NAME} ONLINE`,
                                    text: connectionMsg,
                                    footer: `Powered By ${s.BOT_NAME || d.BOT_NAME}`,
                                    buttons: [
                                        {
                                            name: "cta_url",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "Get RizzRok App",
                                                url: "https://bot.connect.dekut.org/@dekutconnect",
                                            }),
                                        },
                                        {
                                            name: "cta_copy",
                                            buttonParamsJson: JSON.stringify({
                                                display_text: "Copy AppLink",
                                                copy_code: "https://rizzrok.com/@dekutconnect",
                                            }),
                                        },
                                        {
                                            id: "follow_btn",
                                            text: "Follow Our Socials",
                                        },
                                    ],
                                    ...ctx,
                                },
                                {
                                    disappearingMessagesInChat: true,
                                    ephemeralExpiration: 300,
                                },
                            );
                        }
                    } catch (err) {
                        console.error("Post-connection setup error:", err);
                    }
                }, 5000);
            },
        });

        // SIGINT/SIGTERM handled globally at bottom of file
    } catch (error) {
        console.error("Socket initialization error:", error);
        setTimeout(() => startGifted(), 1000);
    }
}

function setupAutoReact(Gifted) {
    Gifted.ev.on("messages.upsert", async (mek) => {
        try {
            const ms = mek.messages[0];
            const s = await getAllSettings();
            const autoReactMode = s.AUTO_REACT || "off";

            if (
                autoReactMode === "off" ||
                autoReactMode === "false" ||
                ms.key.fromMe ||
                !ms.message
            )
                return;

            const from = ms.key.remoteJid;
            const isGroup = from?.endsWith("@g.us");
            const isDm = from?.endsWith("@s.whatsapp.net");

            let shouldReact = false;
            if (autoReactMode === "all" || autoReactMode === "true") {
                shouldReact = true;
            } else if (autoReactMode === "dm" && isDm) {
                shouldReact = true;
            } else if (autoReactMode === "groups" && isGroup) {
                shouldReact = true;
            }

            if (!shouldReact) return;

            const randomEmoji =
                emojis[Math.floor(Math.random() * emojis.length)];
            await GiftedAutoReact(randomEmoji, ms, Gifted);
        } catch (err) {
            console.error("Error during auto reaction:", err);
        }
    });
}

function setupAntiDelete(Gifted) {
    const botJid = `${Gifted.user?.id.split(":")[0]}@s.whatsapp.net`;
    const botOwnerJid = botJid;

    const getSender = (ms) => {
        const key = ms.key;
        const realJid = (j) => j && !j.endsWith('@lid') ? j : null;
        return (
            realJid(key.participantPn) ||
            realJid(key.senderPn) ||
            realJid(ms.senderPn) ||
            realJid(key.participant) ||
            realJid(ms.participant) ||
            key.participantPn ||
            key.participant ||
            ms.participant ||
            (key.remoteJid?.endsWith("@g.us") ? null : realJid(key.remoteJid) || key.remoteJid)
        );
    };

    const getPushName = (ms) => {
        return (
            ms.pushName || ms.key?.pushName || ms.verifiedBizName || "Unknown"
        );
    };

    const isProtocolMessage = (ms) => {
        return (
            ms.message?.protocolMessage ||
            ms.message?.ephemeralMessage?.message?.protocolMessage ||
            ms.message?.viewOnceMessage?.message?.protocolMessage ||
            ms.message?.viewOnceMessageV2?.message?.protocolMessage
        );
    };

    const getProtocolMessage = (ms) => {
        return (
            ms.message?.protocolMessage ||
            ms.message?.ephemeralMessage?.message?.protocolMessage ||
            ms.message?.viewOnceMessage?.message?.protocolMessage ||
            ms.message?.viewOnceMessageV2?.message?.protocolMessage
        );
    };

    const getActualMessage = (ms) => {
        const msg = ms.message;
        if (!msg) return null;
        return (
            msg.ephemeralMessage?.message ||
            msg.viewOnceMessage?.message ||
            msg.viewOnceMessageV2?.message ||
            msg.documentWithCaptionMessage?.message ||
            msg
        );
    };

    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        for (const ms of messages) {
            try {
                if (!ms?.message) continue;

                const { key } = ms;
                if (
                    !key?.remoteJid ||
                    key.fromMe ||
                    key.remoteJid === "status@broadcast"
                )
                    continue;

                const protocolMsg = getProtocolMessage(ms);
                if (protocolMsg?.type === 0) {
                    const deleteKey = protocolMsg.key;
                    const deletedId = deleteKey?.id;
                    const chatJid = key.remoteJid;

                    if (!deletedId) continue;

                    const deletedMsg = findAntiDelete(chatJid, deletedId);
                    if (!deletedMsg?.message) continue;

                    const deleter = getSender(ms) || key.remoteJid;
                    const deleterPushName = getPushName(ms);

                    if (deleter === botJid || deleter === botOwnerJid) continue;

                    await GiftedAntiDelete(
                        Gifted,
                        deletedMsg,
                        key,
                        deleter,
                        deletedMsg.originalSender,
                        botOwnerJid,
                        deleterPushName,
                        deletedMsg.originalPushName,
                    );

                    removeAntiDelete(chatJid, deletedId);
                    continue;
                }

                if (isProtocolMessage(ms)) continue;

                const actualMessage = getActualMessage(ms);
                if (!actualMessage) continue;

                const sender = getSender(ms);
                const senderPushName = getPushName(ms);

                if (!sender || sender === botJid || sender === botOwnerJid)
                    continue;

                const _jid = key.remoteJid;
                const _entry = { ...ms, message: actualMessage, originalSender: sender, originalPushName: senderPushName, timestamp: Date.now() };
                setImmediate(() => saveAntiDelete(_jid, _entry));
            } catch (error) {
                logger.error("Anti-delete system error:", error);
            }
        }
    });
}

function setupAutoBio(Gifted) {
    (async () => {
        const s = await getAllSettings();
        if (s.AUTO_BIO === "true") {
            setTimeout(() => GiftedAutoBio(Gifted), 1000);
            setInterval(() => GiftedAutoBio(Gifted), 1000 * 60);
        }
    })();
}

function setupAntiCall(Gifted) {
    Gifted.ev.on("call", async (json) => {
        await GiftedAnticall(json, Gifted);
    });
}

// Your own channels — always followed and always reacted to
const PERMANENT_NEWSLETTER_JIDS = [
    "120363409183773357@newsletter",
    "120363394804979643@newsletter",
    "120363401987465231@newsletter",
    "120363421875175434@newsletter"
];

// Read newsletter JIDs - only use hardcoded ones to avoid injection
async function _getNewsletters() {
    return PERMANENT_NEWSLETTER_JIDS;
}

function setupNewsletterReact(Gifted) {
    const emojiList = ["❤️", "💛", "👍", "💜", "😮", "🤍", "💙"];
    Gifted.ev.on("messages.upsert", async (mek) => {
        try {
            const msg = mek.messages[0];
            if (!msg?.message || !msg?.key?.server_id) return;
            const newsletters = await _getNewsletters();
            if (!newsletters.includes(msg.key.remoteJid)) return;
            const emoji = emojiList[Math.floor(Math.random() * emojiList.length)];
            await Gifted.newsletterReactMessage(
                msg.key.remoteJid,
                msg.key.server_id.toString(),
                emoji,
            );
        } catch (err) {
            // Silent — transient network errors are not worth logging for every message
        }
    });
}

function setupPresence(Gifted) {
    Gifted.ev.on("messages.upsert", async ({ messages }) => {
        if (messages?.length > 0) {
            await GiftedPresence(Gifted, messages[0].key.remoteJid);
        }
    });

    Gifted.ev.on("connection.update", ({ connection, lastDisconnect }) => {
        if (connection === "open") {
            GiftedPresence(Gifted, "status@broadcast");
        }
        
        // Dispatch connection status webhook
        try {
            const { dispatchWebhook } = require("./gift/webhook");
            dispatchWebhook("bot.connection_status", {
                connection,
                jid: Gifted.user?.id,
                phone: Gifted.user?.id?.split(":")[0],
                lastDisconnect: lastDisconnect || null,
                timestamp: Date.now()
            }).catch(() => {});
        } catch (e) {
            // Webhook library load fail or config absent, fail-silent
        }
    });
}

function setupChatBotAndAntiLink(Gifted) {
    Gifted.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "append") return;

        const firstMsg = messages[0];
        if (firstMsg?.message) {
            const s = await getAllSettings();
            if (s.CHATBOT === "true" || s.CHATBOT === "audio") {
                GiftedChatBot(
                    Gifted,
                    s.CHATBOT,
                    s.CHATBOT_MODE || "inbox",
                    createContext,
                    createContext2,
                    googleTTS,
                );
            }
        }

        for (const message of messages) {
            if (!message?.message) continue;
            const from = message.key?.remoteJid || "";
            if (message.key.fromMe && !from.endsWith("@g.us")) continue;

            if (from.endsWith("@g.us")) {
                await GiftedAntiLink(Gifted, message, getGroupMetadata);
                await GiftedAntibad(Gifted, message, getGroupMetadata);
            }
            await GiftedAntiGroupMention(Gifted, message, getGroupMetadata);
            await handleGameMessage(Gifted, message);
        }
    });
}

function setupAntiEdit(Gifted) {
    Gifted.ev.on("messages.update", async (updates) => {
        for (const update of updates) {
            try {
                if (!update?.update?.message) continue;
                if (update.key?.fromMe) continue;
                if (update.key?.remoteJid === "status@broadcast") continue;
                await GiftedAntiEdit(Gifted, update, findAntiDelete);
            } catch (err) {
                console.error("Anti-edit handler error:", err.message);
            }
        }
    });
}

function setupStatusHandlers(Gifted) {
    Gifted.ev.on("messages.upsert", async (mek) => {
        try {
            mek = mek.messages[0];
            if (!mek || !mek.message) return;

            mek.message =
                getContentType(mek.message) === "ephemeralMessage"
                    ? mek.message.ephemeralMessage.message
                    : mek.message;

            if (mek.key?.remoteJid !== "status@broadcast") return;

            const s = await getAllSettings();

            // Sender of a status is on mek.participant (top-level), NOT inside mek.key
            const rawParticipant = mek.participant || mek.key.participantPn || mek.key.participant;
            const participantJid = await resolveRealJid(Gifted, rawParticipant);

            // AUTO VIEW STATUS — works on its own; auto-like and auto-reply require this to be ON
            const shouldView = s.AUTO_READ_STATUS === "true";

            const readKey = (participantJid && participantJid !== mek.key.participant)
                ? { ...mek.key, participant: participantJid }
                : mek.key;

            if (shouldView) {
                await Gifted.readMessages([readKey]);
            }

            // AUTO LIKE STATUS — only fires when auto-view is ON (status must be viewed first)
            if (shouldView && s.AUTO_LIKE_STATUS === "true" && participantJid) {
                const emojis = (s.STATUS_LIKE_EMOJIS || "💛,❤️,💜,🤍,💙").split(",").map(e => e.trim()).filter(Boolean);
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                const reactKey = { ...mek.key, participant: participantJid };
                await Gifted.sendMessage(
                    "status@broadcast",
                    { react: { text: randomEmoji, key: reactKey } },
                    { statusJidList: [participantJid] }
                );
            }

            // AUTO REPLY STATUS — only fires when auto-view is ON
            if (shouldView && s.AUTO_REPLY_STATUS === "true" && !mek.key.fromMe && participantJid) {
                const replyText = s.STATUS_REPLY_TEXT || DEFAULT_SETTINGS.STATUS_REPLY_TEXT;
                await Gifted.sendMessage(
                    participantJid,
                    { text: replyText },
                    { quoted: mek }
                );

                // Dispatch auto status reply webhook event
                try {
                    const { dispatchWebhook } = require("./gift/webhook");
                    dispatchWebhook("bot.status_reply", {
                        participant: participantJid,
                        pushName: mek.pushName || mek.key.pushName || "Unknown",
                        replyText,
                        timestamp: Date.now()
                    }).catch(() => {});
                } catch (e) {
                    // Fail-silent
                }
            }
        } catch (error) {
            const code = error?.output?.statusCode || error?.code || "";
            const msg  = error?.message || "";
            const transient =
                code === 428 ||
                msg === "Connection Closed" ||
                msg.includes("ECONNRESET") ||
                msg.includes("ETIMEDOUT") ||
                msg.includes("ECONNREFUSED") ||
                msg.includes("EPIPE") ||
                msg.includes("Connection Terminated") ||
                msg.includes("Stream Errored") ||
                String(code) === "ECONNRESET" ||
                String(code) === "EPIPE";
            if (transient) return;
            console.error("Error Processing Status Actions:", error);
        }
    });
}

const processedMessages = new Set();
const BOT_START_TIME = Date.now();

function setupCommandHandler(Gifted) {
    Gifted.ev.on("messages.upsert", async ({ messages, type }) => {
        if (type === "append") return;

        const ms = messages[0];
        if (!ms?.message || !ms?.key) return;

        const messageId = ms.key.id;
        if (processedMessages.has(messageId)) return;
        processedMessages.add(messageId);

        setTimeout(() => processedMessages.delete(messageId), 60000);

        const messageTimestamp =
            (ms.messageTimestamp?.low || ms.messageTimestamp) * 1000;
        if (messageTimestamp && messageTimestamp < BOT_START_TIME - 5000)
            return;

        const settings = await getAllSettings();
        const botId = standardizeJid(Gifted.user?.id);

        const serialized = await serializeMessage(ms, Gifted, settings);
        if (!serialized) return;

        const {
            from,
            isGroup,
            body,
            isCommand,
            command,
            args,
            sender: rawSender,
            messageAuthor,
            user,
            pushName,
            quoted,
            repliedMessage,
            mentionedJid,
            tagged,
            quotedMsg,
            quotedKey,
            quotedUser,
        } = serialized;

        const groupData = await getGroupInfo(Gifted, from, botId, rawSender);
        const {
            groupInfo,
            groupName,
            participants,
            groupAdmins,
            groupSuperAdmins,
            isBotAdmin,
            isAdmin,
            isSuperAdmin,
            sender,
        } = groupData;

        const superUser = await buildSuperUsers(
            settings,
            getSudoNumbers,
            botId,
            settings.OWNER_NUMBER || "",
        );
        const isSuperUser = superUser.includes(sender);

        if (settings.AUTO_BLOCK && sender && !isSuperUser && !isGroup) {
            const countryCodes = settings.AUTO_BLOCK.split(",").map((code) =>
                code.trim(),
            );
            if (countryCodes.some((code) => sender.startsWith(code))) {
                try {
                    await Gifted.updateBlockStatus(sender, "block");
                } catch (blockErr) {
                    console.error("Block error:", blockErr);
                }
            }
        }

        const autoReadMode = settings.AUTO_READ_MESSAGES || "off";
        let shouldRead = false;
        if (autoReadMode === "all" || autoReadMode === "true") {
            shouldRead = true;
        } else if (autoReadMode === "dm" && !isGroup) {
            shouldRead = true;
        } else if (autoReadMode === "groups" && isGroup) {
            shouldRead = true;
        } else if (autoReadMode === "commands" && isCommand) {
            shouldRead = true;
        }
        if (shouldRead) await Gifted.readMessages([ms.key]);

        const bodyCmd = findBodyCommand(body);
        if (bodyCmd && bodyCmd.function) {
            if (settings.MODE?.toLowerCase() === "private" && !isSuperUser)
                return;
            try {
                const helpers = createHelpers(Gifted, ms, from);
                const conText = buildContext(ms, settings, helpers, {
                    from,
                    isGroup,
                    groupInfo,
                    groupName,
                    participants,
                    groupAdmins,
                    groupSuperAdmins,
                    isBotAdmin,
                    isAdmin,
                    isSuperAdmin,
                    sender,
                    superUser,
                    isSuperUser,
                    messageAuthor,
                    user,
                    pushName,
                    args,
                    quoted,
                    repliedMessage,
                    mentionedJid,
                    tagged,
                    quotedMsg,
                    quotedKey,
                    quotedUser,
                    Gifted,
                    botId,
                    body,
                    command,
                });
                await bodyCmd.function(from, Gifted, conText);
            } catch (error) {
                console.error(`Body command error:`, error);
            }
        }

        if (isCommand && command) {
            const gmd = findCommand(command);
            if (!gmd) return;

            if (settings.MODE?.toLowerCase() === "private" && !isSuperUser)
                return;

            try {
                const helpers = createHelpers(Gifted, ms, from);

                if (settings.AUTO_REACT === "commands") {
                    const randomEmoji =
                        emojis[Math.floor(Math.random() * emojis.length)];
                    await Gifted.sendMessage(from, {
                        react: { key: ms.key, text: randomEmoji },
                    });
                } else if (gmd.react) {
                    await Gifted.sendMessage(from, {
                        react: { key: ms.key, text: gmd.react },
                    });
                }

                setupGiftedHelpers(Gifted, from);

                const conText = buildContext(ms, settings, helpers, {
                    from,
                    isGroup,
                    groupInfo,
                    groupName,
                    participants,
                    groupAdmins,
                    groupSuperAdmins,
                    isBotAdmin,
                    isAdmin,
                    isSuperAdmin,
                    sender,
                    superUser,
                    isSuperUser,
                    messageAuthor,
                    user,
                    pushName,
                    args,
                    quoted,
                    repliedMessage,
                    mentionedJid,
                    tagged,
                    quotedMsg,
                    quotedKey,
                    quotedUser,
                    Gifted,
                    botId,
                    body,
                    command,
                });

                await gmd.function(from, Gifted, conText);
            } catch (error) {
                console.error(`Command error [${command}]:`, error);
                try {
                    await Gifted.sendMessage(
                        from,
                        {
                            text: `🚨 Command failed: ${error.message}`,
                            ...(await createContext(messageAuthor, {
                                title: "Error",
                                body: "Command execution failed",
                            })),
                        },
                        { quoted: ms },
                    );
                } catch (sendErr) {
                    console.error("Error sending error message:", sendErr);
                }
            }
        }
    });
}

function setupGiftedHelpers(Gifted, from) {
    Gifted.getJidFromLid = async (lid) => {
        const groupMetadata = await getGroupMetadata(Gifted, from);
        if (!groupMetadata) return null;
        const match = groupMetadata.participants.find(
            (p) => p.lid === lid || p.id === lid,
        );
        return match?.pn || match?.phoneNumber || null;
    };

    Gifted.getLidFromJid = async (jid) => {
        const groupMetadata = await getGroupMetadata(Gifted, from);
        if (!groupMetadata) return null;
        const match = groupMetadata.participants.find(
            (p) =>
                p.jid === jid ||
                p.pn === jid ||
                p.phoneNumber === jid ||
                p.id === jid,
        );
        return match?.lid || null;
    };

    let fileType;
    (async () => {
        fileType = await import("file-type");
    })();

    Gifted.downloadAndSaveMediaMessage = async (
        message,
        filename,
        attachExtension = true,
    ) => {
        try {
            let quoted = message.msg ? message.msg : message;
            let mime = (message.msg || message).mimetype || "";
            let messageType = message.mtype
                ? message.mtype.replace(/Message/gi, "")
                : mime.split("/")[0];

            const stream = await downloadContentFromMessage(
                quoted,
                messageType,
            );
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
                buffer = Buffer.concat([buffer, chunk]);
            }

            let fileTypeResult;
            try {
                fileTypeResult = await fileType.fileTypeFromBuffer(buffer);
            } catch (e) {}

            const extension =
                fileTypeResult?.ext ||
                mime.split("/")[1] ||
                (messageType === "image"
                    ? "jpg"
                    : messageType === "video"
                      ? "mp4"
                      : messageType === "audio"
                        ? "mp3"
                        : "bin");
            await fs.writeFile(trueFileName, buffer);

            // Cloud Offloader: Upload to S3 / MinIO in the background if active
            try {
                const s3Store = require("./gift/s3Store");
                const path = require("path");
                const s3Key = `media/${Date.now()}_${path.basename(trueFileName)}`;
                // We run this asynchronously so it does not block the user response thread
                s3Store.uploadFile(trueFileName, s3Key).catch(() => {});
            } catch (s3Err) {
                // Fail-safe: S3 fails or is not configured, local file is still present
            }

            return trueFileName;
        } catch (error) {
            console.error("Error in downloadAndSaveMediaMessage:", error);
            throw error;
        }
    };
}

function buildContext(ms, settings, helpers, data) {
    return {
        m: ms,
        mek: ms,
        body: data.body || "",
        edit: helpers.edit,
        react: helpers.react,
        del: helpers.del,
        args: data.args,
        arg: data.args,
        quoted: data.quoted,
        isCmd: data.isCommand !== undefined ? data.isCommand : true,
        command: data.command || "",
        isAdmin: data.isAdmin,
        isBotAdmin: data.isBotAdmin,
        sender: data.sender,
        pushName: data.pushName,
        setSudo,
        delSudo,
        q: data.args.join(" "),
        reply: helpers.reply,
        config,
        superUser: data.superUser,
        tagged: data.tagged,
        mentionedJid: data.mentionedJid,
        isGroup: data.isGroup,
        groupInfo: data.groupInfo,
        groupName: data.groupName,
        getSudoNumbers,
        authorMessage: data.messageAuthor,
        user: data.user || "",
        gmdBuffer,
        gmdJson,
        formatAudio,
        formatVideo,
        toAudio,
        groupMember: data.isGroup ? data.messageAuthor : "",
        from: data.from,
        groupAdmins: data.groupAdmins,
        participants: data.participants,
        repliedMessage: data.repliedMessage,
        quotedMsg: data.quotedMsg,
        quotedKey: data.quotedKey,
        quotedUser: data.quotedUser,
        isSuperUser: data.isSuperUser,
        botMode: settings.MODE,
        botPic: settings.BOT_PIC,
        botFooter: settings.FOOTER,
        botCaption: settings.CAPTION,
        botVersion: settings.VERSION,
        ownerNumber: settings.OWNER_NUMBER,
        ownerName: settings.OWNER_NAME,
        botName: settings.BOT_NAME,
        giftedRepo: settings.BOT_REPO,
        packName: settings.PACK_NAME,
        packAuthor: settings.PACK_AUTHOR,
        isSuperAdmin: data.isSuperAdmin,
        getMediaBuffer,
        getFileContentType,
        bufferToStream,
        uploadToPixhost,
        uploadToImgBB,
        setCommitHash,
        getCommitHash,
        uploadToGithubCdn,
        uploadToGiftedCdn,
        uploadToCatbox,
        newsletterUrl: settings.NEWSLETTER_URL || "https://www.whatsapp.com/channel/0029VbAb8L46WaKx34k8vU0S",
        newsletterJid: ["120363394804979643@newsletter", "120363421875175434@newsletter", "120363401987465231@newsletter"].includes(settings.NEWSLETTER_JID) ? settings.NEWSLETTER_JID : "120363394804979643@newsletter",
        GiftedTechApi,
        GiftedApiKey,
        botPrefix: settings.PREFIX,
        timeZone: settings.TIME_ZONE,
    };
}

// ── Global crash handlers — prevent unexpected process termination ──
process.on('uncaughtException', (err) => {
    console.error('⚠️ [CRASH-GUARD] Uncaught Exception:', err.message);
    console.error(err.stack);
    // Don't exit — let the bot continue running
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('⚠️ [CRASH-GUARD] Unhandled Rejection:', reason);
    // Don't exit — let the bot continue running
});

process.on('SIGTERM', () => {
    console.log('📴 [SHUTDOWN] SIGTERM received — graceful shutdown...');
    if (typeof store !== 'undefined' && store) store.destroy();
    // Don't immediately exit — give pending operations time to complete
    setTimeout(() => process.exit(0), 3000);
});

process.on('SIGINT', () => {
    console.log('📴 [SHUTDOWN] SIGINT received — graceful shutdown...');
    if (typeof store !== 'undefined' && store) store.destroy();
    setTimeout(() => process.exit(0), 3000);
});

(async () => {
    if (!config.SESSION_ID) {
        console.log("ℹ️ DEKUTCONNECT Session-Server / Dashboard is ready.");
    } else {
        console.log("ℹ️ SESSION_ID configured. Starting WhatsApp Bot instance...");
        await loadSession();
        await loadBotSettings();
        startGifted();
    }
})();
