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

    // Get the last non-undone change
    const lastChangeResult = await client.query(
      'SELECT * FROM change_log WHERE is_undone = FALSE ORDER BY created_at DESC LIMIT 1'
    );

    if (lastChangeResult.rows.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Nothing to undo'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const lastChange = lastChangeResult.rows[0];

    // Mark as undone
    await client.query(
      'UPDATE change_log SET is_undone = TRUE, undone_at = NOW() WHERE id = $1',
      [lastChange.id]
    );

    return new Response(JSON.stringify({
      success: true,
      undone_change: {
        id: lastChange.id,
        operation_type: lastChange.operation_type,
        description: lastChange.description,
        before_state: lastChange.before_state
      }
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
