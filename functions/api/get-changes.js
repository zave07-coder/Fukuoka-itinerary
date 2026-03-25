import { neon } from '@neondatabase/serverless';

export async function onRequest(context) {
  try {
    const sql = neon(context.env.NEON_DATABASE_URL);

    const result = await sql(
      'SELECT * FROM itinerary_changes ORDER BY timestamp DESC LIMIT 100'
    );

    return new Response(JSON.stringify({
      success: true,
      changes: result
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
