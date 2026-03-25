export async function onRequest(context) {
  try {
    const { neon } = await import('@neondatabase/serverless');
    const sql = neon(context.env.NEON_DATABASE_URL);

    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const includeUndone = url.searchParams.get('includeUndone') === 'true';

    let query = 'SELECT * FROM change_log';
    if (!includeUndone) {
      query += ' WHERE is_undone = FALSE';
    }
    query += ' ORDER BY created_at DESC LIMIT $1';

    const result = await sql(query, [limit]);

    return new Response(JSON.stringify({
      success: true,
      history: result
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
