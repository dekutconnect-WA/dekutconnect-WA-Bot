#!/usr/bin/env node
/**
 * migrate-db.js — Production Data Migration CLI for DEKUTCONNECT
 * Usage: node bin/migrate-db.js --from=sqlite --to=postgres
 */
'use strict';

const fs = require('fs-extra');
const path = require('path');
const { Sequelize } = require('sequelize');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const args = process.argv.slice(2);
const fromArg = args.find(a => a.startsWith('--from='))?.split('=')[1] || 'sqlite';
const toArg = args.find(a => a.startsWith('--to='))?.split('=')[1] || 'postgres';

async function runMigration() {
    console.log(`\n🚀 [Migration] Initializing data migration: ${fromArg.toUpperCase()} ➡️  ${toArg.toUpperCase()}`);

    let sourceSequelize = null;
    let targetSequelize = null;

    try {
        // --- 1. Establish Connections ---
        if (fromArg === 'sqlite') {
            const sqlitePath = path.join(__dirname, '..', 'gift', 'database', 'database.db');
            console.log(`📖 Loading SQLite database from: ${sqlitePath}`);
            if (!await fs.exists(sqlitePath)) {
                throw new Error(`SQLite database file not found at ${sqlitePath}`);
            }
            sourceSequelize = new Sequelize({
                dialect: 'sqlite',
                storage: sqlitePath,
                logging: false
            });
        } else if (fromArg === 'postgres') {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) throw new Error('Source postgres selected but DATABASE_URL is not set.');
            sourceSequelize = new Sequelize(dbUrl, {
                dialect: 'postgres',
                logging: false,
                dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
            });
        } else {
            throw new Error(`Unsupported source dialect: ${fromArg}`);
        }

        if (toArg === 'postgres') {
            const dbUrl = process.env.DATABASE_URL;
            if (!dbUrl) throw new Error('Target postgres selected but DATABASE_URL is not set.');
            targetSequelize = new Sequelize(dbUrl, {
                dialect: 'postgres',
                logging: false,
                dialectOptions: { ssl: { require: true, rejectUnauthorized: false } }
            });
        } else if (toArg === 'sqlite') {
            const sqlitePath = path.join(__dirname, '..', 'gift', 'database', 'database.db');
            console.log(`Writing to SQLite database at: ${sqlitePath}`);
            targetSequelize = new Sequelize({
                dialect: 'sqlite',
                storage: sqlitePath,
                logging: false
            });
        } else {
            throw new Error(`Unsupported target dialect: ${toArg}`);
        }

        await sourceSequelize.authenticate();
        console.log('✅ Connected to source database');
        await targetSequelize.authenticate();
        console.log('✅ Connected to target database');

        // --- 2. Define Schemas ---
        const sourceQueryInterface = sourceSequelize.getQueryInterface();
        const targetQueryInterface = targetSequelize.getQueryInterface();

        // Check if bot_settings table exists in source
        const tables = await sourceQueryInterface.showAllTables();
        const settingsTable = tables.find(t => t.toLowerCase() === 'bot_settings');
        
        if (!settingsTable) {
            console.log('ℹ️  No "bot_settings" table found in source database. Skipping settings migration.');
        } else {
            console.log('📦 Migrating "bot_settings" records...');
            
            // Read source settings
            const [records] = await sourceSequelize.query('SELECT * FROM bot_settings');
            console.log(`📊 Found ${records.length} records in source settings`);

            if (records.length > 0) {
                // Ensure target table exists
                await targetSequelize.query(`
                    CREATE TABLE IF NOT EXISTS bot_settings (
                        id INTEGER PRIMARY KEY ${toArg === 'sqlite' ? 'AUTOINCREMENT' : ''},
                        key VARCHAR(255) NOT NULL UNIQUE,
                        value TEXT,
                        createdAt TIMESTAMP,
                        updatedAt TIMESTAMP
                    )
                `);

                // Insert records into target
                let migratedCount = 0;
                for (const row of records) {
                    try {
                        if (toArg === 'postgres') {
                            await targetSequelize.query(`
                                INSERT INTO bot_settings (key, value, "createdAt", "updatedAt")
                                VALUES ($1, $2, NOW(), NOW())
                                ON CONFLICT (key) DO UPDATE SET value = $2, "updatedAt" = NOW()
                            `, { bind: [row.key, row.value] });
                        } else {
                            await targetSequelize.query(`
                                INSERT INTO bot_settings (key, value, createdAt, updatedAt)
                                VALUES ($1, $2, datetime('now'), datetime('now'))
                                ON CONFLICT(key) DO UPDATE SET value = $2, updatedAt = datetime('now')
                            `, { bind: [row.key, row.value] });
                        }
                        migratedCount++;
                    } catch (err) {
                        console.warn(`⚠️  Failed to migrate setting key="${row.key}":`, err.message);
                    }
                }
                console.log(`✅ Migrated ${migratedCount}/${records.length} settings successfully.`);
            }
        }

        // --- 3. Migrate Console user sessions if available ---
        const sessionsTable = tables.find(t => t.toLowerCase() === 'gifted_sessions');
        if (sessionsTable) {
            console.log('📦 Migrating "gifted_sessions" table...');
            const [sessions] = await sourceSequelize.query('SELECT * FROM gifted_sessions');
            console.log(`📊 Found ${sessions.length} sessions in source`);

            if (sessions.length > 0) {
                await targetSequelize.query(`
                    CREATE TABLE IF NOT EXISTS gifted_sessions (
                        short_id VARCHAR(20) PRIMARY KEY,
                        data TEXT NOT NULL,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `);

                for (const sess of sessions) {
                    const shortId = sess.short_id || sess.shortId;
                    try {
                        if (toArg === 'postgres') {
                            await targetSequelize.query(`
                                INSERT INTO gifted_sessions (short_id, data, created_at)
                                VALUES ($1, $2, NOW())
                                ON CONFLICT (short_id) DO NOTHING
                            `, { bind: [shortId, sess.data] });
                        } else {
                            await targetSequelize.query(`
                                INSERT INTO gifted_sessions (short_id, data, created_at)
                                VALUES ($1, $2, datetime('now'))
                                ON CONFLICT(short_id) DO NOTHING
                            `, { bind: [shortId, sess.data] });
                        }
                    } catch (e) {
                        // Fail silent
                    }
                }
                console.log('✅ Session tables migrated.');
            }
        }

        console.log('\n🎉 [Success] Data Migration Completed Successfully!\n');
    } catch (e) {
        console.error('\n❌ [Failure] Migration failed:', e.message);
        process.exit(1);
    } finally {
        if (sourceSequelize) await sourceSequelize.close();
        if (targetSequelize) await targetSequelize.close();
    }
}

runMigration();
