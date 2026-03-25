// Database connection pooling for better performance
import { Pool } from 'pg';

let pool = null;

export function getPool(connectionString) {
    if (!pool) {
        pool = new Pool({
            connectionString,
            ssl: { rejectUnauthorized: false },
            max: 10, // Maximum pool size
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 2000,
        });

        pool.on('error', (err) => {
            console.error('Unexpected database pool error:', err);
        });
    }

    return pool;
}

export async function query(connectionString, text, params) {
    const pool = getPool(connectionString);
    const start = Date.now();

    try {
        const res = await pool.query(text, params);
        const duration = Date.now() - start;

        // Log slow queries
        if (duration > 100) {
            console.warn('Slow query detected:', { text, duration });
        }

        return res;
    } catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
