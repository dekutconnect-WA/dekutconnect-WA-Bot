const config = require("../../config");
const Sequelize = require("sequelize");
const fs = require("fs");
const path = require("path");

function checkPostgresReachable(dbUrl) {
    if (!dbUrl) return false;
    let host = "";
    let port = 5432;
    try {
        const parsed = new URL(dbUrl);
        host = parsed.hostname;
        if (parsed.port) port = parseInt(parsed.port, 10);
    } catch (e) {
        const match = dbUrl.match(/@([^/:]+)(?::(\d+))?/);
        if (match) {
            host = match[1];
            if (match[2]) port = parseInt(match[2], 10);
        }
    }

    if (!host) return false;

    try {
        const checkCmd = `"${process.execPath}" -e "const net = require('net'); const client = net.connect({ host: '${host}', port: ${port}, timeout: 3500 }, () => { client.end(); process.exit(0); }); client.on('error', () => process.exit(1)); client.on('timeout', () => process.exit(1));"`;
        const { execSync } = require('child_process');
        execSync(checkCmd, { timeout: 4500 });
        return true;
    } catch (err) {
        return false;
    }
}

class DatabaseManager {
    static instance = null;

    static getInstance() {
        if (!DatabaseManager.instance) {
            const DATABASE_URL = config.DATABASE_URL?.trim();
            const DEFAULT_SQLITE_PATH = path.join(__dirname, "database.db");

            let usePostgres = false;
            if (DATABASE_URL) {
                console.log("🐘 Testing PostgreSQL database connectivity...");
                if (checkPostgresReachable(DATABASE_URL)) {
                    usePostgres = true;
                } else {
                    console.warn("⚠️  PostgreSQL database is unreachable. Falling back to local SQLite database!");
                }
            }

            if (!usePostgres) {
                console.log("ℹ️  Using SQLite at:", DEFAULT_SQLITE_PATH);
                const dbDir = path.dirname(DEFAULT_SQLITE_PATH);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                }

                DatabaseManager.instance = new Sequelize({
                    dialect: "sqlite",
                    storage: DEFAULT_SQLITE_PATH,
                    logging: false,
                    pool: {
                        max: 1,
                        min: 0,
                        acquire: 30000,
                        idle: 10000,
                    },
                    retry: { max: 5 },
                    dialectOptions: { busyTimeout: 30000 },
                });
            } else {
                console.log("🐘 Connecting to PostgreSQL database...");
                
                const poolMax = parseInt(process.env.DB_POOL_MAX, 10) || 25;
                const poolMin = parseInt(process.env.DB_POOL_MIN, 10) || 3;
                
                DatabaseManager.instance = new Sequelize(DATABASE_URL, {
                    dialect: "postgres",
                    logging: false,
                    // Connection pool — sized dynamically for high-throughput / multi-tenant clustering
                    pool: {
                        max: poolMax,      // max concurrent connections to PG
                        min: poolMin,       // keep warm connections
                        acquire: 30000,
                        idle: 60000,        // release idle connections after 60s
                    },
                    dialectOptions: {
                        ssl: { require: true, rejectUnauthorized: false },
                        connectTimeout: 15000,
                    },
                    retry: { max: 5 },
                });
            }
        }
        return DatabaseManager.instance;
    }
}

const DATABASE = DatabaseManager.getInstance();

async function syncDatabase() {
    try {
        // Verify connectivity before syncing (gives a clear error on bad credentials)
        await DATABASE.authenticate();
        console.log("✅ Database connection established.");
        await DATABASE.sync();
        console.log("✅ Database Synchronized.");
    } catch (error) {
        console.error("❌ Database connection/sync failed:", error.message);
        throw error;
    }
}

module.exports = { DATABASE, syncDatabase };
