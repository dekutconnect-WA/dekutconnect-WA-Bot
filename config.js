const fs = require("fs-extra");
const path = require('path');

const presetSessionId = process.env.SESSION_ID;
require('dotenv').config({
  path: path.join(__dirname, '.env'),
  quiet: true,
  override: true,
});
if (presetSessionId) {
  process.env.SESSION_ID = presetSessionId;
}

module.exports = {
    MODE: process.env.MODE,
    SESSION_ID: process.env.SESSION_ID,
    TIME_ZONE: process.env.TIME_ZONE,
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS,
    AUTO_LIKE_STATUS: process.env.AUTO_LIKE_STATUS,

    // Database — Supabase PostgreSQL (or any Postgres/SQLite)
    DATABASE_URL: process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || "",

    // Session server URL — where to fetch session credentials from
    SESSION_SERVER_URL: process.env.SESSION_SERVER_URL || "https://dekutconnect-wa-bot.vercel.app",

    // Na-api dashboard URL
    NA_API_URL: process.env.NA_API_URL || "https://dekutconnectdownloaders.vercel.app",

    // Firebase configuration for command bridge
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || "dekut-app-main",
    FIREBASE_DATABASE_URL: process.env.FIREBASE_DATABASE_URL || "https://dekut-app-main-default-rtdb.firebaseio.com",
    FIREBASE_ADMIN_CREDENTIAL: process.env.FIREBASE_ADMIN_CREDENTIAL || "",

    // Bot bridge — enables Firebase Realtime Database command listener
    BOT_BRIDGE_ENABLED: process.env.BOT_BRIDGE_ENABLED === "true",
    BOT_UID: process.env.BOT_UID || "",
};

// Hot-reloading removed to prevent crash loop during VPS deployment file transfer
