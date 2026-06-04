const { Client } = require('pg');

const regions = [
    'us-east-1',
    'us-east-2',
    'us-west-1',
    'us-west-2',
    'eu-west-1',
    'eu-west-2',
    'eu-west-3',
    'eu-central-1',
    'ap-southeast-1',
    'ap-southeast-2',
    'ap-northeast-1',
    'ap-northeast-2',
    'sa-east-1',
    'ca-central-1',
    'ap-south-1',
    'ap-east-1',
    'me-central-1',
    'af-south-1'
];

async function testRegion(region) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    
    const client = new Client({
        host,
        port: 6543,
        user: 'postgres.zxhevmgbqecqsunoedwc',
        password: '0711660741@Aa',
        database: 'postgres',
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log(`\n🎉 SUCCESS! Connected to Supabase pooler in region: ${region}`);
        console.log(`Connection string: ${connectionString}`);
        await client.end();
        return true;
    } catch (err) {
        process.stdout.write(`\n❌ [${region}] ${err.message}\n`);
        return false;
    }
}

async function run() {
    console.log('🔍 Scanning Supabase regions for active connection pooler...');
    for (const region of regions) {
        const ok = await testRegion(region);
        if (ok) {
            process.exit(0);
        }
    }
    console.log('\n❌ FAILED! Could not find any active region for project zxhevmgbqecqsunoedwc');
    process.exit(1);
}

run();
