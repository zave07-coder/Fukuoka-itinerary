import { Client } from 'pg';

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const client = new Client({
    connectionString: context.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();

    const { change_type, day, location_data } = await context.request.json();

    const result = await client.query(
      'INSERT INTO itinerary_changes (change_type, day, location_data) VALUES ($1, $2, $3) RETURNING *',
      [change_type, day, JSON.stringify(location_data)]
    );

    return new Response(JSON.stringify({
      success: true,
      change: result.rows[0]
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
