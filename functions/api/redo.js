import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  if (context.request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const sql = neon(context.env.NEON_DATABASE_URL);

    // Get the last undone change
    const lastUndoneResult = await sql(
      'SELECT * FROM change_log WHERE is_undone = TRUE ORDER BY undone_at DESC LIMIT 1'
    );

    if (lastUndoneResult.length === 0) {
      return new Response(JSON.stringify({
        success: false,
        message: 'Nothing to redo'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const lastUndone = lastUndoneResult[0];

    // Mark as not undone (redo)
    await sql(
      'UPDATE change_log SET is_undone = FALSE, undone_at = NULL WHERE id = $1',
      [lastUndone.id]
    );

    return new Response(JSON.stringify({
      success: true,
      redone_change: {
        id: lastUndone.id,
        operation_type: lastUndone.operation_type,
        description: lastUndone.description,
        after_state: lastUndone.after_state
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
