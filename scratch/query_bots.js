const { Client } = require('pg');

const host = 'aws-1-eu-central-1.pooler.supabase.com';
const user = 'postgres.zxhevmgbqecqsunoedwc';
const password = '0711660741@Aa';
const database = 'postgres';

async function run() {
    const client = new Client({
        host,
        port: 6543,
        user,
        password,
        database,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('--- DEKUTCONNECT_BOTS ---');
        const bots = await client.query('SELECT * FROM dekutconnect_bots');
        console.table(bots.rows);
        
        console.log('--- DEKUTCONNECT_SESSIONS ---');
        const sessions = await client.query('SELECT session_id, phone, created_at FROM dekutconnect_sessions');
        console.table(sessions.rows);
        
        await client.end();
    } catch (e) {
        console.error('Failed to query DB:', e);
    }
}

run();
