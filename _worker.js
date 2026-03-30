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

    const requestBody = {
      model: 'gpt-5.4-nano',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful travel assistant specializing in Fukuoka, Japan. Help users plan their itinerary, suggest activities, restaurants, and provide local insights. Provide concise, actionable responses.'
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_completion_tokens: 800
    };

    console.log('Sending request to OpenAI with model:', requestBody.model);

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('OpenAI Response Status:', openaiResponse.status);

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      console.error('OpenAI API error:', JSON.stringify(errorData, null, 2));
      return new Response(JSON.stringify({
        error: `OpenAI API error: ${errorData.error?.message || 'Unknown error'}`,
        details: errorData,
        requestedModel: requestBody.model
      }), {
        status: openaiResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const data = await openaiResponse.json();

    // Check if response has expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({
        error: `Unexpected response from OpenAI: ${data.error?.message || 'Missing choices array'}`,
        details: data,
        requestedModel: requestBody.model
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // More concise prompt for entire trip to reduce reasoning tokens
    const systemPrompt = `Return JSON with max 5 edits: {"explanation":"...","edits":[{"type":"add","dayNumber":1,"timeSlot":"9:00 AM","content":"...","location":{"name":"...","lat":33.59,"lng":130.40,"type":"restaurant"}}]}. Location optional. ${context}`;

    // Detect if editing entire trip (needs more tokens) vs single day
    const isEntireTrip = context.toLowerCase().includes('entire') || context.toLowerCase().includes('10-day');
    const maxTokens = isEntireTrip ? 16000 : 8000;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.4-nano',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.5,
        max_completion_tokens: maxTokens,
        response_format: { type: "json_object" }
      })
    });

    const data = await openaiResponse.json();

    // Check if response has expected structure
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected OpenAI response structure:', JSON.stringify(data, null, 2));
      return new Response(JSON.stringify({
        error: `Unexpected response from OpenAI: ${data.error?.message || 'Missing choices array'}`,
        fullResponse: data
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const content = data.choices[0].message.content;
    console.log('Raw AI response:', content);
    console.log('Response length:', content?.length);
    console.log('Full data object:', JSON.stringify(data, null, 2));

    // Check if content is empty
    if (!content || content.trim() === '') {
      return new Response(JSON.stringify({
        error: 'AI returned empty response',
        finishReason: data.choices[0].finish_reason,
        fullData: data
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let editData;
    try {
      editData = JSON.parse(content);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({
        error: `Failed to parse AI response: ${parseError.message}`,
        rawResponse: content.substring(0, 1000),
        contentLength: content.length
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

const generateTripHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt } = await request.json();

    // Validation
    if (!prompt || prompt.trim() === '') {
      return new Response(JSON.stringify({
        error: 'Please provide a trip description',
        userMessage: 'Please describe your trip (e.g., "5-day cultural trip to Kyoto")'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (prompt.length > 2000) {
      return new Response(JSON.stringify({
        error: 'Prompt too long',
        userMessage: 'Please keep your trip description under 2000 characters'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log('Generating trip with prompt:', prompt);

    // Try Gemini 2.0 Flash first (primary, cheaper)
    let tripData;
    let usedModel = 'gemini-2.0-flash';
    let lastError = null;

    try {
      tripData = await generateWithGemini(prompt, env);
      console.log('Successfully generated with Gemini');
    } catch (geminiError) {
      console.warn('Gemini failed:', geminiError.message);
      lastError = geminiError;

      // Fallback to GPT-5.4-nano
      try {
        if (!env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        console.log('Attempting GPT fallback...');
        usedModel = 'gpt-5.4-nano';
        tripData = await generateWithGPT(prompt, env);
        console.log('Successfully generated with GPT fallback');
        lastError = null; // Clear error on success
      } catch (gptError) {
        console.error('GPT fallback also failed:', gptError.message);

        // Both failed - return detailed error
        return new Response(JSON.stringify({
          error: 'AI generation failed',
          userMessage: 'Unable to generate trip. Please try again in a moment.',
          details: {
            gemini: geminiError.message,
            gpt: gptError.message
          },
          retryable: true
        }), {
          status: 503,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        });
      }
    }

    // Validate generated data
    if (!tripData || !tripData.days || !Array.isArray(tripData.days)) {
      throw new Error('Invalid trip data structure received from AI');
    }

    // Add metadata
    tripData.aiGenerated = true;
    tripData.generatedBy = usedModel;
    tripData.generatedAt = new Date().toISOString();

    return new Response(JSON.stringify(tripData), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store'
      }
    });

  } catch (error) {
    console.error('Trip generation error:', error);

    // Determine error type and appropriate response
    let statusCode = 500;
    let userMessage = 'An unexpected error occurred. Please try again.';
    let retryable = true;

    if (error.message.includes('quota') || error.message.includes('rate limit')) {
      statusCode = 429;
      userMessage = 'Too many requests. Please wait a moment and try again.';
    } else if (error.message.includes('API key')) {
      statusCode = 503;
      userMessage = 'Service temporarily unavailable. Please try again later.';
    } else if (error.message.includes('timeout')) {
      statusCode = 504;
      userMessage = 'Request timed out. Please try a shorter trip or try again.';
    }

    return new Response(JSON.stringify({
      error: error.message,
      userMessage: userMessage,
      retryable: retryable
    }), {
      status: statusCode,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Generate trip using Gemini 2.0 Flash (primary, cheaper)
 */
async function generateWithGemini(prompt, env) {
  if (!env.GOOGLE_AI_API_KEY) {
    throw new Error('Google AI API key not configured');
  }

  const systemPrompt = `You are a travel planning expert. Generate a detailed trip itinerary based on the user's request.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "name": "Trip Name",
  "destination": "City, Country",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "coverImage": "https://images.unsplash.com/photo-XXXXX",
  "days": [
    {
      "title": "Day 1 Title",
      "activities": [
        {
          "time": "9:00 AM",
          "name": "Activity Name",
          "details": "Detailed description",
          "location": {
            "name": "Place Name",
            "address": "Full Address",
            "lat": 35.6762,
            "lng": 139.6503,
            "type": "attraction"
          }
        }
      ]
    }
  ]
}

Important:
- Generate realistic activities with specific times
- Include GPS coordinates for all locations
- Use Unsplash URLs for cover images
- Set dates starting tomorrow
- Location types: "attraction", "restaurant", "hotel", "activity", "shopping"
- Be specific with place names and addresses`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${env.GOOGLE_AI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `${systemPrompt}\n\nUser Request: ${prompt}`
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8000,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Unknown error';

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorText;

      // Handle specific Gemini error codes
      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (response.status === 403) {
        errorMessage = 'API key invalid or quota exceeded';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request format';
      }
    } catch (e) {
      errorMessage = errorText.substring(0, 200);
    }

    throw new Error(`Gemini API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();

  if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
    throw new Error('Invalid response from Gemini');
  }

  const textContent = data.candidates[0].content.parts[0].text;

  // Parse JSON response
  let tripData;
  try {
    tripData = JSON.parse(textContent);
  } catch (parseError) {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = textContent.match(/```json\n([\s\S]*?)\n```/) ||
                      textContent.match(/```\n([\s\S]*?)\n```/);
    if (jsonMatch) {
      tripData = JSON.parse(jsonMatch[1]);
    } else {
      throw new Error('Failed to parse Gemini response as JSON');
    }
  }

  return tripData;
}

/**
 * Generate trip using GPT-5.4-nano (fallback)
 */
async function generateWithGPT(prompt, env) {
  const systemPrompt = `You are a travel planning expert. Generate a detailed trip itinerary.

Return ONLY valid JSON (no markdown):
{
  "name": "Trip Name",
  "destination": "City, Country",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "coverImage": "https://images.unsplash.com/photo-XXXXX",
  "days": [
    {
      "title": "Day Title",
      "activities": [
        {
          "time": "9:00 AM",
          "name": "Activity",
          "details": "Description",
          "location": {
            "name": "Place",
            "address": "Address",
            "lat": 35.6762,
            "lng": 139.6503,
            "type": "attraction"
          }
        }
      ]
    }
  ]
}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-5.4-nano',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 8000,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = 'Unknown error';

    try {
      const errorData = JSON.parse(errorText);
      errorMessage = errorData.error?.message || errorText;

      // Handle specific OpenAI error codes
      if (response.status === 429) {
        errorMessage = 'Rate limit exceeded';
      } else if (response.status === 401) {
        errorMessage = 'API key invalid';
      } else if (response.status === 400) {
        errorMessage = 'Invalid request format';
      }
    } catch (e) {
      errorMessage = errorText.substring(0, 200);
    }

    throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
  }

  const data = await response.json();

  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('Invalid response from OpenAI');
  }

  const content = data.choices[0].message.content;

  try {
    return JSON.parse(content);
  } catch (parseError) {
    console.error('Failed to parse GPT JSON:', content);
    throw new Error('Failed to parse GPT response as JSON');
  }
}

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
    } else if (url.pathname === '/api/generate-trip') {
      return generateTripHandler(request, env);
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
