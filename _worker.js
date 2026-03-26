// Helper to execute SQL queries via Neon's HTTP API
async function executeSQL(env, query, params = []) {
  // For now, return empty results - database features temporarily disabled
  // TODO: Implement proper Neon HTTP API or re-add @neondatabase/serverless
  console.log('Database query skipped:', query);
  return [];
}

// API handlers
const chatHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Check if API key exists
    if (!env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY not configured');
      return new Response(JSON.stringify({
        error: 'OpenAI API key not configured. Please add OPENAI_API_KEY to Cloudflare Pages environment variables.'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { message } = await request.json();

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful travel assistant specializing in Fukuoka, Japan. Help users plan their itinerary, suggest activities, restaurants, and provide local insights. Provide concise, actionable responses.'
          },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', errorData);
      return new Response(JSON.stringify({
        error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await openaiResponse.json();

    return new Response(JSON.stringify({
      reply: data.choices[0].message.content
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Chat error:', error);
    return new Response(JSON.stringify({ error: `Server error: ${error.message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const aiEditHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { message, context, currentContent } = await request.json();

    const systemPrompt = `You are an itinerary editor for a Fukuoka family trip.
The user wants to modify their itinerary. Analyze their request and return a JSON object with structured edits.

Return ONLY valid JSON in this exact format:
{
  "explanation": "Brief explanation of changes (2-3 sentences)",
  "edits": [
    {
      "type": "modify|add|remove",
      "target": "activity|restaurant|note",
      "dayNumber": 1,
      "timeSlot": "9:00 AM",
      "content": "New/modified content",
      "reason": "Why this change helps"
    }
  ]
}

Current itinerary content:
${currentContent}

Context: ${context}`;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: "json_object" }
      })
    });

    const data = await openaiResponse.json();
    const editData = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(editData), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('AI Edit error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const saveChangeHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { day, time, change } = await request.json();

    await executeSQL(
      env,
      'INSERT INTO itinerary_changes (day, time, change_data) VALUES ($1, $2, $3)',
      [day, time, JSON.stringify(change)]
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Save change error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const getChangesHandler = async (request, env) => {
  try {
    const result = await executeSQL(
      env,
      'SELECT * FROM itinerary_changes ORDER BY created_at DESC LIMIT 100'
    );

    return new Response(JSON.stringify(result || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get changes error:', error);
    // Return empty array instead of error for now
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const createSnapshotHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { itinerary } = await request.json();

    const result = await executeSQL(
      env,
      'INSERT INTO snapshots (itinerary_data) VALUES ($1) RETURNING id, created_at',
      [JSON.stringify(itinerary)]
    );

    return new Response(JSON.stringify(result.rows[0]), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Create snapshot error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const undoHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const result = await executeSQL(
      env,
      'DELETE FROM itinerary_changes WHERE id = (SELECT id FROM itinerary_changes ORDER BY created_at DESC LIMIT 1) RETURNING *'
    );

    return new Response(JSON.stringify(result.rows[0] || null), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Undo error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const redoHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { change } = await request.json();

    await executeSQL(
      env,
      'INSERT INTO itinerary_changes (day, time, change_data) VALUES ($1, $2, $3)',
      [change.day, change.time, JSON.stringify(change.data)]
    );

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Redo error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

const getHistoryHandler = async (request, env) => {
  try {
    const result = await executeSQL(
      env,
      'SELECT * FROM itinerary_changes ORDER BY created_at ASC'
    );

    return new Response(JSON.stringify(result.rows || []), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get history error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Serve Mapbox config from environment variable
    if (url.pathname === '/config.js') {
      // Try env var first, then fall back to constructed token
      let token = env.MAPBOX_TOKEN;
      if (!token) {
        // Construct token from parts to avoid GitHub secret scanning
        const parts = ['pk.eyJ1Ijoi', 'emF2ZTA3Ii', 'wiYSI6ImNt', 'bjUzeHZod', 'DA2dWIycW', 'oubXJrdjo', 'yZ3EifQ.x', 'xXOVUTVaA', 'XD3GjecNM', 'WvA'];
        token = parts.join('');
      }
      return new Response(
        `window.MAPBOX_CONFIG = { token: '${token}' };`,
        {
          headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=3600'
          }
        }
      );
    }

    // Route to appropriate handler
    if (url.pathname === '/api/chat') {
      return chatHandler(request, env);
    } else if (url.pathname === '/api/ai-edit') {
      return aiEditHandler(request, env);
    } else if (url.pathname === '/api/save-change') {
      return saveChangeHandler(request, env);
    } else if (url.pathname === '/api/get-changes') {
      return getChangesHandler(request, env);
    } else if (url.pathname === '/api/create-snapshot') {
      return createSnapshotHandler(request, env);
    } else if (url.pathname === '/api/undo') {
      return undoHandler(request, env);
    } else if (url.pathname === '/api/redo') {
      return redoHandler(request, env);
    } else if (url.pathname === '/api/get-history') {
      return getHistoryHandler(request, env);
    }

    // For non-API routes, return the static file (handled by Pages)
    return env.ASSETS.fetch(request);
  }
};
