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

    const {
      operation_type,  // 'add', 'remove', 'move', 'update', 'reorder', 'replace'
      day,
      location_id,
      before_state,
      after_state,
      description
    } = await context.request.json();

    // Legacy support - convert old change_type to operation_type
    const opType = operation_type || 'add';

    // Insert into both tables for backward compatibility
    await client.query(
      'INSERT INTO itinerary_changes (change_type, day, location_data) VALUES ($1, $2, $3)',
      [opType, day, JSON.stringify(after_state)]
    );

    // Insert into change_log for undo/redo
    const result = await client.query(
      `INSERT INTO change_log
       (operation_type, day, location_id, before_state, after_state, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        opType,
        day,
        location_id,
        JSON.stringify(before_state || null),
        JSON.stringify(after_state || null),
        description || `${opType} operation on ${day || 'itinerary'}`
      ]
    );

    // Update total changes counter
    await client.query(
      'UPDATE current_state SET total_changes = total_changes + 1 WHERE id = 1'
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
