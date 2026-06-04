import pg from 'pg';
const { Pool } = pg;

// Supabase PostgreSQL connection — supports multiple env var names for flexibility
const connectionString = process.env.SUPABASE_DB_URL
    || process.env.DATABASE_URL
    || process.env.PURUBOY_PG_URL;

let pool;

if (!pool) {
    pool = new Pool({
        connectionString,
        ssl: connectionString?.includes('supabase')
            ? { rejectUnauthorized: false }
            : undefined,
    });
}

export default pool;