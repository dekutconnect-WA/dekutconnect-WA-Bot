const express = require("express");
const cors = require("cors");
const path = require("path");
const bodyParser = require("body-parser");
const config = require("./config");
const { PORT } = config;
const { qrRoute, pairRoute } = require("./routes");
const { init, isConfigured, getSession } = require("./gift/sessionStore");

// ── Firebase Admin ──
const admin = require("firebase-admin");
if (!admin.apps.length) {
    try {
        // Prefer a service-account key file if provided, otherwise use default credentials
        const serviceAccount = config.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(config.FIREBASE_SERVICE_ACCOUNT)
            : undefined;
        admin.initializeApp({
            credential: serviceAccount
                ? admin.credential.cert(serviceAccount)
                : admin.credential.applicationDefault(),
            projectId: config.FIREBASE_PROJECT_ID,
        });
    } catch (e) {
        console.warn('[Admin] Firebase Admin init failed — bot routes unprotected:', e.message);
    }
}

/**
 * Middleware: verify Firebase ID token from Authorization: Bearer <token>.
 * Populates req.uid and req.emailVerified on success.
 * Also accepts ?uid= for GET /api/bot/status (read-only, lower risk).
 */
async function verifyToken(req, res, next) {
    const header = req.headers['authorization'] || '';
    let token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token && req.query.token) {
        token = req.query.token;
    }
    if (!token) return res.status(401).json({ error: 'Missing auth token' });
    try {
        const decoded = await admin.auth().verifyIdToken(token);
        if (!decoded.email_verified) {
            return res.status(403).json({ error: 'Email not verified' });
        }
        req.uid = decoded.uid;
        next();
    } catch {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}
const app = express();
app.set("json spaces", 2);
let bootPromise = null;

require("events").EventEmitter.defaultMaxListeners = 0; // Unlimited listeners for high-concurrency

// Custom lightweight in-memory rate-limiter to handle 1M concurrent users without dependency bloat
const ipRequests = new Map();
const rateLimiter = (limit = 100, windowMs = 60000) => (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (!ipRequests.has(ip)) {
        ipRequests.set(ip, []);
    }
    const timestamps = ipRequests.get(ip);
    const recent = timestamps.filter(t => (now - t) < windowMs);
    recent.push(now);
    ipRequests.set(ip, recent);
    if (recent.length > limit) {
        return res.status(429).json({ error: "Too many requests from this IP. Please slow down." });
    }
    next();
};

// Periodic memory cleanup for rate limiter map
setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipRequests.entries()) {
        const recent = timestamps.filter(t => (now - t) < 60000);
        if (recent.length === 0) ipRequests.delete(ip);
        else ipRequests.set(ip, recent);
    }
}, 300000);

// CORS — allow all origins (lock down in production)
// app.use(cors()) handles OPTIONS preflight automatically — no wildcard route needed
app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    preflightContinue: false,
    optionsSuccessStatus: 204
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

async function bootstrap() {
    if (!bootPromise) {
        bootPromise = Promise.all([
            init(config),
            initUserStore(config),
        ]).then(async () => {
            if (!remoteBridge.isEnabled()) {
                await botManager.initAllActiveBots();
            }
        });
    }
    return bootPromise;
}

app.use(['/api', '/qr', '/code', '/session'], async (_req, res, next) => {
    try {
        await bootstrap();
        next();
    } catch (error) {
        res.status(503).json({ error: 'Service initialization failed', detail: error.message });
    }
});

// Apply rate limiter to API endpoints
app.use('/api/', rateLimiter(150, 60000));

app.get("/pair", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "pair.html"), { dotfiles: "allow" }, (err) => {
        if (err) res.status(500).send("Error serving page: " + err.message);
    });
});

app.get("/reset", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "reset.html"), { dotfiles: "allow" }, (err) => {
        if (err) res.status(500).send("Error serving page: " + err.message);
    });
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"), { dotfiles: "allow" }, (err) => {
        if (err) res.status(500).send("Error serving page: " + err.message);
    });
});

app.get("/qr", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "qr.html"), { dotfiles: "allow" }, (err) => {
        if (err) res.status(500).send("Error serving page: " + err.message);
    });
});

// Setup Swagger API docs route
const { swaggerUi, swaggerSpec } = require("./routes/swagger");
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/qr", verifyToken, qrRoute);
app.use("/code", verifyToken, pairRoute);

app.get("/session/:id", async (req, res) => {
    if (!isConfigured()) {
        return res.status(503).send("No database configured on this server.");
    }
    try {
        const session = await getSession(req.params.id);
        if (!session) {
            return res.status(404).send("Session not found.");
        }
        res.setHeader("Content-Type", "text/plain; charset=utf-8");
        res.send(session);
    } catch (e) {
        res.status(500).send("Error retrieving session.");
    }
});

// Firebase configuration endpoint
app.get("/api/firebase-config", (req, res) => {
    res.json({
        apiKey: config.FIREBASE_API_KEY,
        authDomain: config.FIREBASE_AUTH_DOMAIN,
        projectId: config.FIREBASE_PROJECT_ID,
        storageBucket: config.FIREBASE_STORAGE_BUCKET,
        messagingSenderId: config.FIREBASE_MESSAGING_SENDER_ID,
        appId: config.FIREBASE_APP_ID,
        measurementId: config.FIREBASE_MEASUREMENT_ID
    });
});

// Public check WhatsApp status endpoint
app.get("/api/public/check-wa", async (req, res) => {
    const number = (req.query.number || "").replace(/[^0-9]/g, "");
    if (!number) return res.status(400).json({ error: "Missing number parameter" });
    try {
        const axios = require('axios');
        const mainBotPort = process.env.SERVER_PORT || process.env.PORT || 5000;
        const response = await axios.get(`http://localhost:${mainBotPort}/api/check-wa?number=${number}`, { timeout: 5000 });
        return res.json(response.data);
    } catch (err) {
        return res.status(503).json({ error: "Check service temporarily unavailable" });
    }
});

// Bot Management APIs
const { initUserStore, getUserBot, updateUserBotStatus, deleteUserBot } = require('./gift/userStore');
const botManager = require('./gift/botManager');
const remoteBridge = require('./gift/remoteBridge');

app.get("/api/bot/status", async (req, res) => {
    const { uid } = req.query;
    if (!uid) return res.status(400).json({ error: "Missing uid parameter" });
    try {
        const bot = await getUserBot(uid);
        const remoteStatus = remoteBridge.isEnabled() ? await remoteBridge.getStatus(uid).catch(() => null) : null;
        const totalConnectedBots = botManager.getConnectedBotsCount();
        if (!bot) {
            return res.json({
                status: remoteStatus?.state || "stopped",
                phone: remoteStatus?.phone || null,
                connected: remoteStatus?.state === 'online',
                totalConnectedBots
            });
        }
        // Verify if the Node child process is active
        const processRunning = remoteBridge.isEnabled()
            ? remoteStatus?.state === 'online'
            : botManager.isBotRunning(uid);
        // Status is resolved from the database if process is running, defaulting to 'connecting'
        const liveStatus = processRunning ? (bot.status && bot.status !== 'stopped' ? bot.status : 'connecting') : 'stopped';
        
        if (bot.status !== liveStatus) {
            await updateUserBotStatus(uid, liveStatus).catch(() => {});
        }
        res.json({
            status: liveStatus,
            phone: bot.phone,
            connected: processRunning && (liveStatus === 'connected' || liveStatus === 'running'),
            uid: bot.uid,
            totalConnectedBots
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/bot/start", verifyToken, async (req, res) => {
    const uid = req.uid;  // from verified token, not body
    try {
        const bot = await getUserBot(uid);
        if (!bot || !bot.session_id) {
            return res.status(404).json({ error: "Bot session not found. Please pair first." });
        }
        await updateUserBotStatus(uid, 'running');
        if (remoteBridge.isEnabled()) {
            await remoteBridge.queueCommand(uid, { type: 'ping' });
        } else {
            botManager.startBot(uid, bot.session_id);
        }
        res.json({ success: true, status: 'running' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/bot/stop", verifyToken, async (req, res) => {
    const uid = req.uid;
    try {
        if (remoteBridge.isEnabled()) {
            await updateUserBotStatus(uid, 'stopped');
            return res.json({ success: true, status: 'stopped', note: 'Remote VPS bots are not killed without VPS consent.' });
        }
        await botManager.stopBot(uid);
        res.json({ success: true, status: 'stopped' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post("/api/bot/delete", verifyToken, async (req, res) => {
    const uid = req.uid;
    try {
        if (!remoteBridge.isEnabled()) {
            await botManager.stopBot(uid);
        }
        await deleteUserBot(uid);
        res.json({ success: true });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get("/health", (req, res) => {
    res.json({
        status: 200,
        success: true,
        service: "DEKUTCONNECT Session",
        storage: isConfigured() ? "database" : "inline-zlib",
        connected_bots: botManager.getConnectedBotsCount(),
        timestamp: new Date().toISOString(),
    });
});

if (require.main === module) {
    app.listen(PORT, async () => {
        console.log(
            `\nDeployment Successful!\n\n DEKUTCONNECT Session-Server Running on http://localhost:${PORT}`,
        );
        await bootstrap();
    });
}

module.exports = app;
