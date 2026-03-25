import { Client } from 'pg';

export async function onRequest(context) {
  const client = new Client({
    connectionString: context.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const result = await client.query(
      'SELECT * FROM itinerary_changes ORDER BY timestamp DESC LIMIT 100'
    );

    return new Response(JSON.stringify({
      success: true,
      changes: result.rows
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  } finally {
    await client.end();
  }
}
