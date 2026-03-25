export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(context.env.NEON_DATABASE_URL);

    // Get the last non-undone change
    const lastChangeResult = await sql(
      'SELECT * FROM change_log WHERE is_undone = FALSE ORDER BY created_at DESC LIMIT 1'
    );

    if (lastChangeResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Nothing to undo'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const lastChange = lastChangeResult[0];

    // Mark as undone
    await sql(
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
  }
}
