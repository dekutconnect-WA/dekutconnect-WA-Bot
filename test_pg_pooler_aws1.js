const { Client } = require('pg');

async function test() {
    console.log('Connecting to aws-1-eu-central-1.pooler.supabase.com:6543...');
    const client = new Client({
        host: 'aws-1-eu-central-1.pooler.supabase.com',
        port: 6543,
        user: 'postgres.zxhevmgbqecqsunoedwc',
        password: '0711660741@Aa',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('✅ PostgreSQL connection successfully established!');
        const res = await client.query('SELECT NOW()');
        console.log('Database Time:', res.rows[0].now);
        await client.end();
    } catch (err) {
        console.error('❌ Connection failed:');
        console.error(err);
    }
}

test();
