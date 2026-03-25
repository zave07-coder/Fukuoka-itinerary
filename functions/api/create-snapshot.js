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

    const { itinerary_data, description } = await context.request.json();

    // Get current version number
    const versionResult = await client.query(
      'SELECT current_version FROM current_state WHERE id = 1'
    );
    const currentVersion = versionResult.rows[0].current_version;
    const newVersion = currentVersion + 1;

    // Save snapshot
    const snapshotResult = await client.query(
      'INSERT INTO itinerary_versions (version_number, itinerary_data, description) VALUES ($1, $2, $3) RETURNING *',
      [newVersion, JSON.stringify(itinerary_data), description]
    );

    // Update current state
    await client.query(
      'UPDATE current_state SET current_version = $1, last_snapshot_at = NOW() WHERE id = 1',
      [newVersion]
    );

    return new Response(JSON.stringify({
      success: true,
      version: snapshotResult.rows[0]
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
