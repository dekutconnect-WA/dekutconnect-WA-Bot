import pool from './db';
import { v4 as uuidv4 } from 'uuid';

const ensureTableExists = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS chats (
            id UUID PRIMARY KEY,
            username TEXT NOT NULL,
            message TEXT NOT NULL,
            device_id TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    `;
    await pool.query(query);

    // Migration for existing table
    try {
        await pool.query('ALTER TABLE chats ADD COLUMN IF NOT EXISTS device_id TEXT');
    } catch (e) {
        // Ignore if column already exists
    }
};

const chatService = {
    getChats: async (after = null) => {
        await ensureTableExists();
        
        if (after) {
            const query = `
                SELECT * FROM chats 
                WHERE created_at > $1
                ORDER BY created_at ASC
                LIMIT 500
            `;
            const result = await pool.query(query, [after]);
            return result.rows;
        } else {
            const query = `
                SELECT * FROM (
                    SELECT * FROM chats ORDER BY created_at DESC LIMIT 500
                ) sub
                ORDER BY created_at ASC
            `;
            const result = await pool.query(query);
            return result.rows;
        }
    },

    getLatestTimestamp: async () => {
        await ensureTableExists();
        const query = 'SELECT created_at FROM chats ORDER BY created_at DESC LIMIT 1';
        const result = await pool.query(query);
        if (result.rows.length === 0) return null;
        return new Date(result.rows[0].created_at).toISOString();
    },

    checkSpam: async (deviceId) => {
        await ensureTableExists();
        if (!deviceId) return false;
        
        const query = `
            SELECT created_at FROM chats 
            WHERE device_id = $1 
            ORDER BY created_at DESC 
            LIMIT 1
        `;
        const result = await pool.query(query, [deviceId]);
        
        if (result.rows.length > 0) {
            const lastTime = new Date(result.rows[0].created_at).getTime();
            const now = Date.now();
            if (now - lastTime < 2000) {
                return true;
            }
        }
        return false;
    },

    addChat: async (username, message, deviceId) => {
        await ensureTableExists();
        const id = uuidv4();
        
        try {
            await pool.query(
                'INSERT INTO chats (id, username, message, device_id) VALUES ($1, $2, $3, $4)',
                [id, username, message, deviceId]
            );

            // Prune to keep only 500 messages (auto cleanup)
            const cleanupQuery = `
                DELETE FROM chats 
                WHERE id NOT IN (
                    SELECT id FROM chats 
                    ORDER BY created_at DESC 
                    LIMIT 500
                )
            `;
            await pool.query(cleanupQuery);

            return { id, username, message, device_id: deviceId, created_at: new Date() };
        } catch (error) {
            console.error("Database Chat Error:", error);
            throw new Error('Failed to send message.');
        }
    }
};

export default chatService;