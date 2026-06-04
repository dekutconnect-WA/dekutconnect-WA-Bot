const fs = require('fs');
const { Client } = require('pg');
const { execSync } = require('child_process');

const logFile = 'db_debug.log';
fs.writeFileSync(logFile, '=== Database Connectivity Debug Log ===\n');

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

const host = 'aws-1-eu-central-1.pooler.supabase.com';
const user = 'postgres.zxhevmgbqecqsunoedwc';
const password = '0711660741@Aa';
const database = 'postgres';

async function testPg(port) {
    log(`\nTesting direct pg connection to ${host}:${port}...`);
    const client = new Client({
        host,
        port,
        user,
        password,
        database,
        connectionTimeoutMillis: 5000,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        log(`✅ pg successfully connected to port ${port}!`);
        const res = await client.query('SELECT NOW()');
        log(`Database time: ${res.rows[0].now}`);
        await client.end();
    } catch (e) {
        log(`❌ pg failed on port ${port}: ${e.message}`);
    }
}

function testExec(port) {
    log(`\nTesting checkPostgresReachable command simulation on port ${port}...`);
    const checkCmd = `"${process.execPath}" -e "const net = require('net'); const client = net.connect({ host: '${host}', port: ${port}, timeout: 3500 }, () => { client.end(); process.exit(0); }); client.on('error', (e) => { console.log(e.message); process.exit(1); }); client.on('timeout', () => { console.log('timeout'); process.exit(1); });"`;
    try {
        const out = execSync(checkCmd, { timeout: 4500 });
        log(`✅ Command succeeded! Output: ${out.toString().trim()}`);
    } catch (err) {
        log(`❌ Command failed: ${err.message}`);
        if (err.stdout) log(`Stdout: ${err.stdout.toString()}`);
        if (err.stderr) log(`Stderr: ${err.stderr.toString()}`);
    }
}

async function run() {
    log(`Node version: ${process.version}`);
    log(`Node execPath: ${process.execPath}`);
    log(`DATABASE_URL Env: ${process.env.DATABASE_URL ? 'PRESENT' : 'MISSING'}`);
    
    await testPg(5432);
    await testPg(6543);
    
    testExec(5432);
    testExec(6543);
    
    log('\n=== Debug Finished ===');
}

run();
