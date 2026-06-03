const path = require('path');

require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true,
  override: true,
});

module.exports = {
    PORT: process.env.PORT || 50900,
    SESSION_PREFIX: process.env.SESSION_PREFIX || "DEKUTCONNECT~",
    GC_JID: process.env.GC_JID || "GuS93JhyfyE56LOV3ZJTFZ",

    // Database — Supabase PostgreSQL connection string
    DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "",

    // Bot control mode: 'local' = spawn child processes, 'firebase' = remote VPS via Firebase RTDB
    BOT_CONTROL_MODE: process.env.BOT_CONTROL_MODE || "firebase",

    // Firebase Realtime Database URL (used for VPS command bridge)
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || `https://${process.env.FIREBASE_PROJECT_ID || 'dekut-app-main'}-default-rtdb.firebaseio.com`,

    // Session server URL — the VPS bot uses this to fetch session credentials
    SESSION_SERVER_URL: process.env.SESSION_SERVER_URL || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "https://session.bot.connect.dekut.org",

    BOT_REPO: process.env.BOT_REPO || "https://github.com/dekutconnect/wa-bot",
    WA_CHANNEL: process.env.WA_CHANNEL || "https://whatsapp.com/channel/0029VbCpYtZLtOj5LDuj7Q1p",
    MSG_FOOTER: process.env.MSG_FOOTER || "> *ᴘᴏᴡᴇʀᴇᴅ ʙʏ ᴅᴇᴋᴜᴛᴄᴏɴɴᴇᴄᴛ*",

    // Firebase Client Configuration (Defaults provided by user)
    FIREBASE_API_KEY: process.env.FIREBASE_API_KEY || "AIzaSyDBpcfygHw2pCBrVtMp6dGeIRw2sCAC6TI",
    FIREBASE_AUTH_DOMAIN: process.env.FIREBASE_AUTH_DOMAIN || "dekut-app-main.firebaseapp.com",
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "dekut-app-main",
    FIREBASE_STORAGE_BUCKET: process.env.FIREBASE_STORAGE_BUCKET || "dekut-app-main.firebasestorage.app",
    FIREBASE_MESSAGING_SENDER_ID: process.env.FIREBASE_MESSAGING_SENDER_ID || "227712751066",
    FIREBASE_APP_ID: process.env.FIREBASE_APP_ID || "1:227712751066:web:1179019f15578e1de71ce3",
    FIREBASE_MEASUREMENT_ID: process.env.FIREBASE_MEASUREMENT_ID || "G-1K8D7E0YZZ",

    // Firebase Admin base64 service account JSON (optional)
    FIREBASE_ADMIN_CREDENTIAL: process.env.FIREBASE_ADMIN_CREDENTIAL || "",
    FIREBASE_SERVICE_ACCOUNT: process.env.FIREBASE_SERVICE_ACCOUNT || "",
};
