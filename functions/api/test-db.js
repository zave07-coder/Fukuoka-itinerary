// Test endpoint using fetch-based database access (no external dependencies)
export async function onRequest(context) {
  try {
    const dbUrl = context.env.NEON_DATABASE_URL;

    // Simple test query using Neon's HTTP SQL-over-HTTP feature
    // This doesn't require any npm packages!
    const response = await fetch('https://api.neon.tech/sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: 'SELECT NOW() as current_time',
        connectionString: dbUrl
      })
    });

    const data = await response.json();

    return new Response(JSON.stringify({
      success: true,
      message: 'Database connection test',
      data: data
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
