const { Client } = require('pg');

async function test(port) {
    console.log(`Testing port ${port}...`);
    const client = new Client({
        host: 'aws-0-eu-central-1.pooler.supabase.com',
        port: port,
        user: 'postgres.zxhevmgbqecqsunoedwc',
        password: '0711660741@Aa',
        database: 'postgres',
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log(`✅ Success on port ${port}!`);
        await client.end();
    } catch (err) {
        console.error(`❌ Error on port ${port}:`);
        console.error(err.message);
    }
}

async function run() {
    await test(5432);
    await test(6543);
}

run();
