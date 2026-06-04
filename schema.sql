-- ============================================================
-- DEKUTCONNECT — Supabase PostgreSQL Schema
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

-- 1. Sessions table (replaces Mega.nz file storage)
-- Stores compressed WhatsApp credentials as text (gzip + base64)
CREATE TABLE IF NOT EXISTS dekutconnect_sessions (
    short_id    VARCHAR(20)  PRIMARY KEY,
    data        TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for fast lookups by creation date (cleanup queries)
CREATE INDEX IF NOT EXISTS idx_sessions_created_at
    ON dekutconnect_sessions (created_at);

-- 2. Bot instances table (tracks each user's bot deployment)
CREATE TABLE IF NOT EXISTS dekutconnect_bots (
    uid         VARCHAR(128) PRIMARY KEY,
    phone       VARCHAR(30),
    session_id  TEXT,
    status      VARCHAR(20)  DEFAULT 'stopped',
    created_at  TIMESTAMPTZ  DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for querying active bots
CREATE INDEX IF NOT EXISTS idx_bots_status
    ON dekutconnect_bots (status);

-- Index for finding bots by phone number
CREATE INDEX IF NOT EXISTS idx_bots_phone
    ON dekutconnect_bots (phone);

-- 3. Command logs table (audit trail for bot commands)
CREATE TABLE IF NOT EXISTS dekutconnect_command_logs (
    id          BIGSERIAL    PRIMARY KEY,
    uid         VARCHAR(128) NOT NULL,
    command     VARCHAR(100) NOT NULL,
    sender_jid  VARCHAR(100),
    group_jid   VARCHAR(100),
    status      VARCHAR(20)  DEFAULT 'executed',
    metadata    JSONB,
    created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Index for querying logs per user
CREATE INDEX IF NOT EXISTS idx_logs_uid
    ON dekutconnect_command_logs (uid, created_at DESC);

-- 4. Bot settings table (per-user configurable settings)
CREATE TABLE IF NOT EXISTS dekutconnect_settings (
    uid         VARCHAR(128) NOT NULL,
    key         VARCHAR(100) NOT NULL,
    value       TEXT,
    updated_at  TIMESTAMPTZ  DEFAULT NOW(),
    PRIMARY KEY (uid, key)
);

-- ============================================================
-- MIGRATION: If old "gifted_sessions" table exists, copy data
-- ============================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gifted_sessions') THEN
        INSERT INTO dekutconnect_sessions (short_id, data, created_at)
        SELECT short_id, data, created_at FROM gifted_sessions
        ON CONFLICT (short_id) DO NOTHING;
        RAISE NOTICE 'Migrated records from gifted_sessions to dekutconnect_sessions';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gifted_bots') THEN
        INSERT INTO dekutconnect_bots (uid, phone, session_id, status, created_at, updated_at)
        SELECT uid, phone, session_id, status, created_at, updated_at FROM gifted_bots
        ON CONFLICT (uid) DO NOTHING;
        RAISE NOTICE 'Migrated records from gifted_bots to dekutconnect_bots';
    END IF;
END $$;

-- ============================================================
-- AUTO-CLEANUP: Delete sessions older than 90 days
-- (Run this as a Supabase scheduled function or cron job)
-- ============================================================
-- DELETE FROM dekutconnect_sessions WHERE created_at < NOW() - INTERVAL '90 days';

-- ============================================================
-- ROW LEVEL SECURITY (optional — enable if using Supabase Auth)
-- ============================================================
-- ALTER TABLE dekutconnect_bots ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can view own bot" ON dekutconnect_bots
--     FOR SELECT USING (uid = auth.uid()::text);
-- CREATE POLICY "Users can update own bot" ON dekutconnect_bots
--     FOR UPDATE USING (uid = auth.uid()::text);
