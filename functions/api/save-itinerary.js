// Cloudflare Pages Function to save itinerary changes to NEON database
import { neon } from '@neondatabase/serverless';

export async function onRequestPost(context) {
    try {
        const { userId, changes, mapUpdates } = await context.request.json();

        // Get database connection string from environment
        const databaseUrl = context.env.DATABASE_URL;

        if (!databaseUrl) {
            // Fallback to localStorage if no database configured
            return new Response(JSON.stringify({
                success: false,
                message: 'Database not configured. Changes saved to browser only.',
                useLocalStorage: true
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(databaseUrl);

        // Create table if it doesn't exist
        await sql`
            CREATE TABLE IF NOT EXISTS itinerary_changes (
                id SERIAL PRIMARY KEY,
                user_id TEXT NOT NULL,
                changes JSONB NOT NULL,
                map_updates JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Save the changes
        const result = await sql`
            INSERT INTO itinerary_changes (user_id, changes, map_updates)
            VALUES (${userId || 'default'}, ${JSON.stringify(changes)}, ${JSON.stringify(mapUpdates)})
            RETURNING id, created_at
        `;

        return new Response(JSON.stringify({
            success: true,
            id: result[0].id,
            timestamp: result[0].created_at
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Save itinerary error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message,
            useLocalStorage: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

export async function onRequestGet(context) {
    try {
        const url = new URL(context.request.url);
        const userId = url.searchParams.get('userId') || 'default';

        const databaseUrl = context.env.DATABASE_URL;

        if (!databaseUrl) {
            return new Response(JSON.stringify({
                success: false,
                useLocalStorage: true
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        const sql = neon(databaseUrl);

        // Get latest changes for user
        const results = await sql`
            SELECT changes, map_updates, created_at
            FROM itinerary_changes
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT 10
        `;

        return new Response(JSON.stringify({
            success: true,
            history: results
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Load itinerary error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: error.message
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle CORS
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
