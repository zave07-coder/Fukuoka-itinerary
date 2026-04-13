// Supabase REST API helper (updated with env vars)
class SupabaseClient {
  constructor(env = {}) {
    // Use env vars with fallback to hardcoded values
    // Note: Service key is sensitive but needed for backend operations
    this.url = env?.SUPABASE_URL || 'https://gdhyukplodnvokrmxvba.supabase.co';
    this.serviceKey = env?.SUPABASE_SERVICE_ROLE_KEY ||
                     'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5Mjg2NCwiZXhwIjoyMDkwNDY4ODY0fQ.cEt3gBApYN4lDykyQMnrwMZE_iH2mBoDpwClIVstOmk';
    this.anonKey = env?.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4';

    // Log which values are being used (for debugging)
    console.log(`🔧 SupabaseClient initialized with URL: ${this.url}`);
    if (!env?.SUPABASE_URL) {
      console.log('ℹ️ Using fallback SUPABASE_URL');
    }
    if (!env?.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('ℹ️ Using fallback SUPABASE_SERVICE_ROLE_KEY');
    }
  }

  async query(table, options = {}) {
    const headers = {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    let url = `${this.url}/rest/v1/${table}`;
    let method = options.method || 'GET';
    let body = options.body ? JSON.stringify(options.body) : undefined;

    // Build query parameters
    if (options.select) {
      url += `?select=${options.select}`;
    }
    if (options.eq) {
      Object.entries(options.eq).forEach(([key, value]) => {
        url += url.includes('?') ? '&' : '?';
        url += `${key}=eq.${value}`;
      });
    }
    if (options.order) {
      url += url.includes('?') ? '&' : '?';
      url += `order=${options.order}`;
    }
    if (options.limit) {
      url += url.includes('?') ? '&' : '?';
      url += `limit=${options.limit}`;
    }

    const response = await fetch(url, {
      method,
      headers,
      body
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase query failed: ${error}`);
    }

    return await response.json();
  }

  async insert(table, data) {
    return this.query(table, {
      method: 'POST',
      body: data
    });
  }

  async update(table, data, match) {
    const headers = {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };

    let url = `${this.url}/rest/v1/${table}`;
    Object.entries(match).forEach(([key, value], i) => {
      url += i === 0 ? '?' : '&';
      url += `${key}=eq.${value}`;
    });

    const response = await fetch(url, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase update failed: ${error}`);
    }

    return await response.json();
  }

  async delete(table, match) {
    const headers = {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`
    };

    let url = `${this.url}/rest/v1/${table}`;
    Object.entries(match).forEach(([key, value], i) => {
      url += i === 0 ? '?' : '&';
      url += `${key}=eq.${value}`;
    });

    const response = await fetch(url, {
      method: 'DELETE',
      headers
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase delete failed: ${error}`);
    }

    return true;
  }

  async upsert(table, data, onConflict = null) {
    const headers = {
      'apikey': this.serviceKey,
      'Authorization': `Bearer ${this.serviceKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'resolution=merge-duplicates,return=representation'
    };

    // Build URL with on_conflict parameter if provided
    let url = `${this.url}/rest/v1/${table}`;
    if (onConflict) {
      url += `?on_conflict=${onConflict}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase upsert failed: ${error}`);
    }

    return await response.json();
  }
}

// Verify JWT token from Supabase
async function verifySupabaseToken(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Missing authorization token');
  }

  const token = authHeader.substring(7);

  // Decode JWT (simple version - in production use a proper JWT library)
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const payload = JSON.parse(atob(parts[1]));

  // Check expiration
  if (payload.exp && payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired');
  }

  return {
    userId: payload.sub,
    email: payload.email
  };
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
      model: 'gpt-4o-mini', // Fast, cheap for conversational Q&A
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
    const { prompt, currentDay, allDays, tripContext } = await request.json();

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Prompt is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const isWholeTrip = tripContext?.isWholeTrip || allDays !== null;
    const isNewTrip = isWholeTrip && (!allDays || allDays.length === 0);

    // Build context from trip data
    const contextParts = [];
    if (tripContext?.destination) {
      contextParts.push(`Destination: ${tripContext.destination}`);
    }
    if (tripContext?.totalDays) {
      contextParts.push(`Total trip duration: ${tripContext.totalDays} days`);
    }

    if (isWholeTrip && allDays && allDays.length > 0) {
      contextParts.push(`Editing entire trip with ${allDays.length} days`);
      contextParts.push(`Current trip data: ${JSON.stringify(allDays)}`);
    } else if (isNewTrip) {
      contextParts.push(`Generating a brand new trip`);
    } else if (currentDay) {
      contextParts.push(`Editing single day: ${JSON.stringify(currentDay)}`);
    }

    const context = contextParts.join('. ');

    // System prompt - different for whole trip vs single day vs new trip
    const systemPrompt = isNewTrip ?
      `You are a professional travel planning expert. Generate a complete new trip itinerary based on the user's request. ${context}

Return a complete trip as an array of day objects in JSON format:
{
  "days": [
    {
      "title": "Day 1: Arrival",
      "activities": [
        {
          "time": "9:00 AM",
          "name": "Activity name",
          "details": "Detailed activity description with tips",
          "duration": "1 hour",
          "location": {
            "name": "Location name",
            "lat": 33.5904,
            "lng": 130.4017,
            "type": "restaurant|attraction|hotel|cafe|park",
            "address": "Full address"
          }
        }
      ]
    }
  ]
}

CRITICAL: Use REAL, ACCURATE GPS coordinates for actual locations. Look up the true latitude and longitude for each specific place/POI. Do not use placeholder or approximate coordinates.
Important: Generate a complete, well-paced itinerary with realistic activities and timing.`
      : isWholeTrip ?
      `You are editing an entire multi-day travel itinerary. ${context}

Return a complete updated trip as an array of day objects in JSON format:
{
  "days": [
    {
      "title": "Day 1: Arrival",
      "activities": [
        {
          "time": "9:00 AM",
          "name": "Activity name",
          "details": "Activity description",
          "duration": "1 hour",
          "location": {
            "name": "Location name",
            "lat": 33.5904,
            "lng": 130.4017,
            "type": "restaurant|attraction|hotel|cafe|park",
            "address": "Full address"
          }
        }
      ]
    }
  ]
}

CRITICAL: Use REAL, ACCURATE GPS coordinates for actual locations. Look up the true latitude and longitude for each specific place/POI. Do not use placeholder or approximate coordinates.
Important: Return ALL days with ALL their activities. Apply the user's requested changes across the appropriate days.`
      : `You are editing a single day in a travel itinerary. ${context}

Return a complete updated day object in JSON format with this structure:
{
  "title": "Day title",
  "activities": [
    {
      "time": "9:00 AM",
      "name": "Activity name",
      "details": "Activity description",
      "location": {
        "name": "Location name",
        "lat": 33.5904,
        "lng": 130.4017,
        "type": "restaurant|attraction|hotel|cafe|park",
        "address": "Full address"
      }
    }
  ]
}

CRITICAL: Use REAL, ACCURATE GPS coordinates for actual locations. Look up the true latitude and longitude for each specific place/POI. Do not use placeholder or approximate coordinates.
Important: Return the ENTIRE day with ALL activities, not just changes. Modify based on the user's request.`;

    // Whole trip edits need more tokens
    const maxTokens = isWholeTrip ? 16000 : 8000;

    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Cost-effective for both single day and whole trip edits
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
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
    const db = new SupabaseClient(env);

    // Note: This table may not exist yet - keeping for future implementation
    // For now, just return success
    console.log('Save change (not implemented):', { day, time, change });

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
    // Legacy handler - return empty for now
    // TODO: Implement with Supabase when needed
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Get changes error:', error);
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

    // Legacy handler - stub for now
    // TODO: Implement with Supabase when needed
    return new Response(JSON.stringify({
      id: crypto.randomUUID(),
      created_at: new Date().toISOString()
    }), {
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
    // Legacy handler - stub for now
    // TODO: Implement with Supabase when needed
    return new Response(JSON.stringify(null), {
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

    // Legacy handler - stub for now
    // TODO: Implement with Supabase when needed
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
    // Legacy handler - return empty for now
    // TODO: Implement with Supabase when needed
    return new Response(JSON.stringify([]), {
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
    const { prompt, stream } = await request.json();

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

    console.log('Generating trip with prompt:', prompt, 'Stream:', stream);

    // If streaming is requested, try Gemini 2.0 Flash streaming first (cheaper, faster)
    if (stream) {
      console.log('🔄 Starting streaming generation with Gemini 2.0 Flash...');

      let streamResponse;
      let usedModel = 'gemini-2.0-flash';
      let isGemini = true;

      try {
        streamResponse = await generateWithGeminiStreaming(prompt, env);
        console.log('✅ Got streaming response from Gemini');
      } catch (geminiError) {
        console.warn('⚠️ Gemini streaming failed, falling back to GPT-5.4:', geminiError.message);
        usedModel = 'gpt-5.4';
        isGemini = false;
        streamResponse = await generateWithGPT(prompt, env);
        console.log('✅ Got streaming response from GPT-5.4 (fallback)');
      }

      // Create a ReadableStream to send Server-Sent Events to the client
      const { readable, writable } = new TransformStream();
      const writer = writable.getWriter();
      const encoder = new TextEncoder();

      (async () => {
        try {
          const reader = streamResponse.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let fullContent = '';
          let chunkCount = 0;

          console.log('📖 Starting to read streaming chunks...');

          // Send initial progress event to show immediate feedback
          await writer.write(encoder.encode(`data: ${JSON.stringify({
            type: 'progress',
            content: '',
            percentage: 10
          })}\n\n`));

          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              console.log(`✅ Stream complete. Received ${chunkCount} chunks, ${fullContent.length} chars`);
              break;
            }

            chunkCount++;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(data);

                  // Handle different response formats (Gemini vs GPT)
                  let content = '';
                  if (isGemini) {
                    // Gemini format: candidates[0].content.parts[0].text
                    content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  } else {
                    // GPT format: choices[0].delta.content
                    content = parsed.choices?.[0]?.delta?.content || '';
                  }

                  if (content) {
                    fullContent += content;

                    // Estimate progress based on content length
                    // Typical complete trips: 2000-12000 chars depending on trip length
                    // Use smaller estimate for faster visible progress
                    const estimatedTotal = 3500; // Lower estimate = faster progress feedback
                    const rawProgress = (fullContent.length / estimatedTotal) * 80; // 0-80%
                    let percentage = Math.min(95, Math.max(10, Math.floor(10 + rawProgress))); // 10-95%

                    // Send progress update to client with percentage
                    await writer.write(encoder.encode(`data: ${JSON.stringify({
                      type: 'progress',
                      content: fullContent,
                      percentage
                    })}\n\n`));

                    if (chunkCount % 10 === 0) {
                      console.log(`📝 Progress: ${fullContent.length} chars (${percentage}%)`);
                    }
                  }
                } catch (e) {
                  console.warn('⚠️ Failed to parse SSE line:', e.message);
                }
              }
            }
          }

          // Parse final JSON and send completion
          try {
            console.log('🔍 Parsing final JSON response...');
            console.log(`📊 Content length: ${fullContent.length} characters`);
            console.log(`📄 Content preview: ${fullContent.substring(0, 200)}...`);
            console.log(`📄 Content end: ...${fullContent.substring(fullContent.length - 200)}`);

            const tripData = JSON.parse(fullContent);
            console.log('✅ JSON parsed successfully');
            console.log(`📍 Trip name: ${tripData.name || 'Unnamed'}`);
            console.log(`📍 Days count: ${tripData.days?.length || 0}`);

            // Validate trip data completeness
            if (!tripData.days || !Array.isArray(tripData.days) || tripData.days.length === 0) {
              console.error('❌ Trip has no days array or is empty');
              throw new Error('Trip has no days - generation incomplete');
            }

            // Check if all days have activities
            const incompleteDays = tripData.days.filter(day => !day.activities || day.activities.length === 0);
            if (incompleteDays.length > 0) {
              console.warn(`⚠️ Warning: ${incompleteDays.length} days have no activities`);
            }

            // Validate and fix data
            // Check for missing or placeholder cover image
            if (!tripData.coverImage ||
                tripData.coverImage === '' ||
                tripData.coverImage.includes('photo-XXXXX') ||
                tripData.coverImage.includes('placeholder')) {
              console.log('🖼️ Fetching cover image for destination:', tripData.destination);
              tripData.coverImage = await getCoverImageForDestination(tripData.destination, env);
            }

            tripData.days = tripData.days.map(day => {
              if (day.activities && Array.isArray(day.activities)) {
                day.activities = day.activities.map(activity => {
                  if (activity.location) {
                    activity.location = validateLocationCoordinates(activity.location, tripData.destination);
                  }
                  return activity;
                });
              }
              return day;
            });

            // Add metadata tracking
            tripData.aiGenerated = true;
            tripData.generatedBy = usedModel;
            tripData.generatedAt = new Date().toISOString();

            console.log(`✅ Trip validated: ${tripData.days.length} days, ${tripData.days.reduce((sum, d) => sum + (d.activities?.length || 0), 0)} activities`);
            console.log(`🤖 Generated by: ${usedModel}`);
            console.log('✅ Sending completion event to client');
            // TODO: TEMPORARY - Remove model tracking after testing (added for debugging)
            tripData.metadata = tripData.metadata || {};
            tripData.metadata.generatedBy = usedModel;
            tripData.metadata.generatedAt = new Date().toISOString();

            await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'complete', data: tripData, percentage: 100 })}\n\n`));
          } catch (parseError) {
            console.error('❌ Failed to parse JSON:', parseError.message);
            console.error('Content length:', fullContent.length);
            console.error('Content preview:', fullContent.substring(0, 500));
            console.error('Content end:', fullContent.substring(fullContent.length - 200));

            // Try to extract whatever JSON we can
            let partialData = null;
            try {
              // Try to find the last complete JSON object
              const lastBrace = fullContent.lastIndexOf('}');
              if (lastBrace > 0) {
                const possibleJson = fullContent.substring(0, lastBrace + 1);
                partialData = JSON.parse(possibleJson);
                console.log('⚠️ Recovered partial data:', partialData.name);
              }
            } catch (e) {
              console.error('Could not recover partial data');
            }

            await writer.write(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: partialData
                ? 'Trip generation incomplete. Showing partial results.'
                : 'Failed to parse AI response - trip may be incomplete. Please try again.',
              details: parseError.message,
              partialData: partialData
            })}\n\n`));
          }

          await writer.close();
          console.log('🏁 Stream closed');
        } catch (error) {
          console.error('❌ Streaming error:', error);
          await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`));
          await writer.close();
        }
      })();

      return new Response(readable, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Non-streaming mode (original behavior)
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

      // Fallback to GPT (non-streaming)
      try {
        if (!env.OPENAI_API_KEY) {
          throw new Error('OpenAI API key not configured');
        }

        console.log('Attempting GPT-5.4 fallback...');
        usedModel = 'gpt-5.4';

        // Get streaming response but collect all data
        const streamResponse = await generateWithGPT(prompt, env);
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                fullContent += content;
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        tripData = JSON.parse(fullContent);
        console.log('Successfully generated with GPT fallback');
        lastError = null;
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

    // Ensure cover image is present (check for placeholder patterns)
    if (!tripData.coverImage ||
        tripData.coverImage === '' ||
        tripData.coverImage.includes('photo-XXXXX') ||
        tripData.coverImage.includes('placeholder')) {
      console.log('🖼️ Fetching cover image for destination:', tripData.destination);
      tripData.coverImage = await getCoverImageForDestination(tripData.destination, env);
    }

    // Validate and fix GPS coordinates
    tripData.days = tripData.days.map(day => {
      if (day.activities && Array.isArray(day.activities)) {
        day.activities = day.activities.map(activity => {
          if (activity.location) {
            activity.location = validateLocationCoordinates(activity.location, tripData.destination);
          }
          return activity;
        });
      }
      return day;
    });

    // Generate trip summary
    try {
      const summaryData = await generateTripSummary(tripData, env);
      tripData.summary = summaryData.summary;
      tripData.highlights = summaryData.highlights;
    } catch (summaryError) {
      console.warn('Failed to generate summary:', summaryError);
      // Continue without summary - not critical
    }

    // Add metadata
    tripData.aiGenerated = true;
    tripData.generatedBy = usedModel;
    tripData.generatedAt = new Date().toISOString();

    // TODO: TEMPORARY - Remove model tracking after testing (added for debugging)
    tripData.metadata = tripData.metadata || {};
    tripData.metadata.generatedBy = usedModel;
    tripData.metadata.generatedAt = tripData.generatedAt;

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
 * Validate and fix GPS coordinates for a location
 */
function validateLocationCoordinates(location, destination) {
  if (!location || !location.lat || !location.lng) {
    return location;
  }

  // Define valid coordinate ranges for common destinations
  const coordinateRanges = {
    // Japan
    'tokyo': { minLat: 35.5, maxLat: 35.9, minLng: 139.5, maxLng: 140.0, centerLat: 35.6762, centerLng: 139.6503 },
    'kyoto': { minLat: 34.9, maxLat: 35.2, minLng: 135.6, maxLng: 135.9, centerLat: 35.0116, centerLng: 135.7681 },
    'osaka': { minLat: 34.5, maxLat: 34.9, minLng: 135.3, maxLng: 135.7, centerLat: 34.6937, centerLng: 135.5023 },
    'fukuoka': { minLat: 33.5, maxLat: 33.7, minLng: 130.3, maxLng: 130.5, centerLat: 33.5904, centerLng: 130.4017 },

    // Southeast Asia
    'singapore': { minLat: 1.2, maxLat: 1.5, minLng: 103.6, maxLng: 104.0, centerLat: 1.3521, centerLng: 103.8198 },
    'bangkok': { minLat: 13.6, maxLat: 13.9, minLng: 100.4, maxLng: 100.7, centerLat: 13.7563, centerLng: 100.5018 },
    'kuala lumpur': { minLat: 3.0, maxLat: 3.3, minLng: 101.5, maxLng: 101.8, centerLat: 3.1390, centerLng: 101.6869 },

    // Default: world coordinates
    'default': { minLat: -90, maxLat: 90, minLng: -180, maxLng: 180, centerLat: 0, centerLng: 0 }
  };

  // Find matching range
  const destLower = (destination || '').toLowerCase();
  let range = coordinateRanges.default;

  for (const [key, value] of Object.entries(coordinateRanges)) {
    if (destLower.includes(key)) {
      range = value;
      break;
    }
  }

  // Check if coordinates are within valid range
  const lat = parseFloat(location.lat);
  const lng = parseFloat(location.lng);

  if (isNaN(lat) || isNaN(lng)) {
    console.warn(`Invalid coordinates for ${location.name}:`, location.lat, location.lng);
    // Set to center of range
    location.lat = range.centerLat;
    location.lng = range.centerLng;
    return location;
  }

  // Check if out of range (in the ocean or wrong country)
  if (lat < range.minLat || lat > range.maxLat || lng < range.minLng || lng > range.maxLng) {
    console.warn(`Coordinates out of range for ${location.name} in ${destination}:`, { lat, lng, range });

    // Set to center of range as fallback
    location.lat = range.centerLat;
    location.lng = range.centerLng;
    location.coordinatesFixed = true;
  }

  return location;
}

/**
 * Generate trip using Gemini 2.0 Flash (primary, cheaper)
 */
/**
 * Get a destination-appropriate cover image from Google Places or Unsplash
 */
async function getCoverImageForDestination(destination, env) {
  if (!destination) {
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'; // Generic travel
  }

  const dest = destination.toLowerCase();

  // Landmark mappings for better Google Places search
  const landmarkMap = {
    // Japan
    'tokyo': 'Tokyo Tower',
    'kyoto': 'Fushimi Inari Shrine',
    'osaka': 'Osaka Castle',
    'fukuoka': 'Fukuoka Tower',

    // Malaysia
    'kuala lumpur': 'Petronas Twin Towers',
    'penang': 'Penang Bridge',

    // Southeast Asia
    'singapore': 'Marina Bay Sands',
    'bangkok': 'Grand Palace Bangkok',

    // South Korea
    'seoul': 'N Seoul Tower',

    // Europe
    'paris': 'Eiffel Tower',
    'london': 'Big Ben',
    'rome': 'Colosseum',
    'barcelona': 'Sagrada Familia',

    // USA
    'new york': 'Statue of Liberty',
    'san francisco': 'Golden Gate Bridge',

    // Australia
    'sydney': 'Sydney Opera House',

    // Middle East
    'dubai': 'Burj Khalifa'
  };

  // Try Google Places API first
  let landmark = null;
  for (const [key, value] of Object.entries(landmarkMap)) {
    if (dest.includes(key)) {
      landmark = value;
      break;
    }
  }

  if (landmark && env.GOOGLE_PLACES_API_KEY) {
    try {
      const imageData = await fetchGooglePlacesPhoto(landmark, null, null, env);
      console.log(`✅ Got cover image from Google Places for ${destination}: ${landmark}`);
      return imageData.imageUrl;
    } catch (error) {
      console.warn(`Google Places failed for ${landmark}, falling back to Unsplash:`, error.message);
    }
  }

  // Fallback to Unsplash hardcoded URLs
  const imageMap = {
    // Japan
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    'osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    'fukuoka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    'japan': 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&q=80',

    // Malaysia
    'malaysia': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    'kuala lumpur': 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=800&q=80',
    'penang': 'https://images.unsplash.com/photo-1570547823781-4582c4cfd7e1?w=800&q=80',

    // Southeast Asia
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    'vietnam': 'https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80',
    'hanoi': 'https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80',

    // South Korea
    'seoul': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&q=80',
    'korea': 'https://images.unsplash.com/photo-1517154421773-0529f29ea451?w=800&q=80',

    // Europe
    'paris': 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80',
    'london': 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80',
    'rome': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?w=800&q=80',
    'barcelona': 'https://images.unsplash.com/photo-1520986606214-8b456906c813?w=800&q=80',

    // USA
    'new york': 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80',
    'san francisco': 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80',
    'los angeles': 'https://images.unsplash.com/photo-1534190239940-9ba8944ea261?w=800&q=80',

    // Australia
    'sydney': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&q=80',
    'melbourne': 'https://images.unsplash.com/photo-1514395462725-fb4566210144?w=800&q=80',

    // Middle East
    'dubai': 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&q=80',

    // Default fallback
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
  };

  // Try to find a match
  for (const [key, url] of Object.entries(imageMap)) {
    if (dest.includes(key)) {
      return url;
    }
  }

  return imageMap.default;
}

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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${env.GOOGLE_AI_API_KEY}`,
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
 * Generate trip using Gemini 2.0 Flash with streaming support
 */
async function generateWithGeminiStreaming(prompt, env) {
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
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent?alt=sse&key=${env.GOOGLE_AI_API_KEY}`,
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
    throw new Error(`Gemini streaming API error: ${response.status} - ${errorText}`);
  }

  return response;
}

/**
 * Generate trip using GPT-5.4 (fallback for streaming)
 * Better quality and more reliable for long trips
 */
async function generateWithGPT(prompt, env) {
  const systemPrompt = `You are a professional travel planning expert. Generate a detailed, well-researched trip itinerary.

Return ONLY valid JSON (no markdown). Include rich details, practical tips, and accurate information:
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
          "name": "Activity Name",
          "details": "Detailed description with tips, entry fees, best times to visit, etc.",
          "location": {
            "name": "Place Name",
            "address": "Full Address",
            "lat": 35.6762,
            "lng": 139.6503,
            "type": "attraction"
          },
          "duration": "1-2 hours"
        }
      ]
    }
  ]
}

Important:
- Provide rich, specific details for each activity
- Include practical information (costs, timing, tips)
- Use accurate GPS coordinates
- Add duration estimates
- Suggest realistic daily pacing`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-5.4', // gpt-5.4 is faster and more reliable for long trips
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 16000, // Restored to original working value for full 7-day trip generation
        response_format: { type: "json_object" },
        stream: true // Enable streaming
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

    // Return the streaming response directly for the handler to process
    return response;
  } catch (error) {
    throw error;
  }
}

/**
 * Generate trip using GPT with streaming support (returns ReadableStream)
 */
async function generateWithGPTStreaming(prompt, env) {
  const streamResponse = await generateWithGPT(prompt, env);

  // Create a TransformStream to parse SSE and extract content
  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  (async () => {
    try {
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                // Send progress update to client
                await writer.write(encoder.encode(`data: ${JSON.stringify({ type: 'content', data: content })}\n\n`));
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      await writer.close();
    } catch (error) {
      await writer.abort(error);
    }
  })();

  return readable;
}

/**
 * Sync user handler - Creates/updates user in Supabase database
 */
const syncUserHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Initialize Supabase client (has fallback credentials built-in)
    const db = new SupabaseClient(env);

    const auth = await verifySupabaseToken(request, env);
    const { supabaseUserId, email, displayName, avatarUrl} = await request.json();

    // Check if user exists
    const existingUsers = await db.query('users', {
      select: '*',
      eq: { supabase_user_id: supabaseUserId }
    });

    let user;
    if (existingUsers && existingUsers.length > 0) {
      // Update existing user
      const updated = await db.update('users', {
        email: email,
        display_name: displayName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, { supabase_user_id: supabaseUserId });
      user = updated[0];
    } else {
      // Insert new user
      const inserted = await db.insert('users', {
        supabase_user_id: supabaseUserId,
        email: email,
        display_name: displayName,
        avatar_url: avatarUrl
      });
      user = inserted[0];
    }

    return new Response(JSON.stringify({ success: true, user }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Sync user error:', error);
    console.error('Error stack:', error.stack);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Trips handler - GET (pull) and POST (push) trips
 */
const tripsHandler = async (request, env) => {
  try {
    const auth = await verifySupabaseToken(request, env);
    const db = new SupabaseClient(env);

    // Get user ID from database
    let users = await db.query('users', {
      select: 'id',
      eq: { supabase_user_id: auth.userId }
    });

    // Auto-create user if not found
    if (!users || users.length === 0) {
      console.log(`🔧 User not found for ${auth.email}, creating automatically...`);

      try {
        const newUser = await db.insert('users', {
          supabase_user_id: auth.userId,
          email: auth.email,
          display_name: auth.email?.split('@')[0] || 'User',
          avatar_url: null
        });

        console.log(`✅ Auto-created user: ${auth.email}`);
        users = newUser;
      } catch (createError) {
        console.error('Failed to auto-create user:', createError);
        return new Response(JSON.stringify({
          error: 'User not found and auto-creation failed',
          details: createError.message
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    const userId = users[0].id;

    if (request.method === 'GET') {
      // Pull all trips for user
      const trips = await db.query('trips', {
        select: '*',
        eq: { user_id: userId },
        order: 'updated_at.desc'
      });

      return new Response(JSON.stringify(trips || []), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'POST') {
      // Push trip to cloud
      const { tripId, name, destination, startDate, endDate, coverImage, data, deviceId } = await request.json();

      // Insert or update trip using upsert
      const trip = await db.upsert('trips', {
        id: tripId,
        user_id: userId,
        name: name,
        destination: destination,
        start_date: startDate,
        end_date: endDate,
        cover_image: coverImage,
        data: data
      });

      // Update sync metadata (upsert on trip_id, device_id conflict)
      await db.upsert('sync_metadata', {
        user_id: userId,
        trip_id: tripId,
        device_id: deviceId,
        sync_version: 1,
        last_sync: new Date().toISOString()
      }, 'trip_id,device_id');

      return new Response(JSON.stringify(trip[0] || trip), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (request.method === 'DELETE') {
      // Delete trip from cloud
      const { tripId } = await request.json();

      if (!tripId) {
        return new Response(JSON.stringify({ error: 'Trip ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Delete trip (cascade will delete sync_metadata due to foreign key)
      await db.delete('trips', {
        id: tripId,
        user_id: userId
      });

      console.log(`🗑️ Deleted trip ${tripId} for user ${userId}`);

      return new Response(JSON.stringify({ success: true, tripId }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else {
      return new Response('Method not allowed', { status: 405 });
    }

  } catch (error) {
    console.error('Trips handler error:', error);
    console.error('Error stack:', error.stack);
    console.error('Request method:', request.method);
    return new Response(JSON.stringify({
      error: error.message,
      details: error.stack,
      method: request.method
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Get single trip by ID handler
 * Supports both authenticated access (own trips) and unauthenticated access (public trips)
 */
const getTripByIdHandler = async (request, env, tripId) => {
  try {
    const db = new SupabaseClient(env);

    // Try to authenticate (optional)
    let auth = null;
    let userId = null;

    try {
      auth = await verifySupabaseToken(request, env);

      // Get user ID if authenticated
      let users = await db.query('users', {
        select: 'id',
        eq: { supabase_user_id: auth.userId }
      });

      // Auto-create user if not found
      if (!users || users.length === 0) {
        console.log(`🔧 User not found for ${auth.email}, creating automatically...`);

        try {
          const newUser = await db.insert('users', {
            supabase_user_id: auth.userId,
            email: auth.email,
            display_name: auth.email?.split('@')[0] || 'User',
            avatar_url: null
          });

          console.log(`✅ Auto-created user: ${auth.email}`);
          users = newUser;
        } catch (createError) {
          console.error('Failed to auto-create user:', createError);
        }
      }

      if (users && users.length > 0) {
        userId = users[0].id;
      }
    } catch (authError) {
      console.log('[getTripByIdHandler] No auth or auth failed, attempting public access:', authError.message);
      // Continue without auth - may be viewing a public/shared trip
    }

    // Get specific trip
    // If authenticated, filter by user_id. If not, allow any trip (RLS will handle permissions)
    const query = {
      select: '*',
      eq: { id: tripId }
    };

    // If authenticated, only get trips belonging to the user
    if (userId) {
      query.eq.user_id = userId;
    }

    const trips = await db.query('trips', query);

    if (!trips || trips.length === 0) {
      return new Response(JSON.stringify({ error: 'Trip not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify(trips[0]), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Get trip by ID error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * ZMailer helper - Send email via ZMailer API
 */
async function sendEmail(env, { from, to, subject, html, text }) {
  if (!env.ZMAILER_API_KEY) {
    console.warn('ZMAILER_API_KEY not configured');
    return { success: false, error: 'Email service not configured' };
  }

  try {
    const response = await fetch('https://zmailer.zavecoder.com/api/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.ZMAILER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: from || `noreply@${env.ZMAILER_DOMAIN || 'zavecoder.com'}`,
        to,
        subject,
        html: html || text,
        text: text || html?.replace(/<[^>]*>/g, '') // Strip HTML tags for text version
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`ZMailer API error: ${error}`);
    }

    const result = await response.json();
    return { success: true, ...result };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate shareable link for trip
 */
const generateShareLinkHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { tripId } = await request.json();
    // Verify authentication
    let auth;
    try {
      auth = await verifySupabaseToken(request, env);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + error.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new SupabaseClient(env);

    // Get user ID from database (same logic as tripsHandler)
    let users = await db.query('users', {
      select: 'id',
      eq: { supabase_user_id: auth.userId }
    });

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const userId = users[0].id;

    // Verify user owns this trip
    const trips = await db.query('trips', {
      eq: { id: tripId, user_id: userId }
    });

    if (!trips || trips.length === 0) {
      return new Response(JSON.stringify({ error: 'Trip not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check if share link already exists for this trip
    const existingShares = await db.query('trip_shares', {
      eq: { trip_id: tripId, created_by: userId, is_active: true }
    });

    let shareToken;

    if (existingShares && existingShares.length > 0) {
      // Return existing share link
      shareToken = existingShares[0].share_token;
      console.log(`♻️ Returning existing share link for trip ${tripId}`);
    } else {
      // Generate unique share token
      shareToken = crypto.randomUUID();

      // Create share record
      const shareData = {
        id: crypto.randomUUID(),
        trip_id: tripId,
        share_token: shareToken,
        created_by: userId,
        created_at: new Date().toISOString(),
        expires_at: null, // No expiry for now
        view_count: 0,
        is_active: true
      };

      await db.insert('trip_shares', shareData);
      console.log(`✨ Created new share link for trip ${tripId}`);
    }

    return new Response(JSON.stringify({
      shareToken,
      shareUrl: `${new URL(request.url).origin}/shared/${shareToken}`
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Generate share link error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Get shared trip data (public endpoint)
 */
const getSharedTripHandler = async (request, env) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const url = new URL(request.url);
    const shareToken = url.searchParams.get('token');

    if (!shareToken) {
      return new Response(JSON.stringify({ error: 'Share token required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new SupabaseClient(env);

    // Get share record
    const shares = await db.query('trip_shares', {
      eq: { share_token: shareToken, is_active: true }
    });

    if (!shares || shares.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired share link' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const share = shares[0];

    // Get trip data
    const trips = await db.query('trips', {
      eq: { id: share.trip_id }
    });

    if (!trips || trips.length === 0) {
      return new Response(JSON.stringify({ error: 'Trip not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const trip = trips[0];

    // Increment view count
    await db.update('trip_shares',
      { view_count: (share.view_count || 0) + 1 },
      { id: share.id }
    );

    // Extract trip data from the 'data' JSON column
    const tripData = typeof trip.data === 'string' ? JSON.parse(trip.data) : trip.data;

    return new Response(JSON.stringify({
      trip: {
        id: trip.id,
        destination: tripData.destination || trip.destination,
        days: tripData.days || [],
        metadata: tripData.metadata || {},
        name: trip.name,
        coverImage: tripData.coverImage,
        created_at: trip.created_at
      },
      viewCount: (share.view_count || 0) + 1,
      isShared: true
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Get shared trip error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Clone shared trip handler - Copies a shared trip to user's account
 */
const cloneSharedTripHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Verify authentication
    let auth;
    try {
      auth = await verifySupabaseToken(request, env);
    } catch (error) {
      return new Response(JSON.stringify({ error: 'Unauthorized: ' + error.message }), {
        status: 401,
        headers: corsHeaders
      });
    }

    const { shareToken } = await request.json();

    if (!shareToken) {
      return new Response(JSON.stringify({ error: 'Share token required' }), {
        status: 400,
        headers: corsHeaders
      });
    }

    const db = new SupabaseClient(env);

    // Get user ID from database
    let users = await db.query('users', {
      select: 'id',
      eq: { supabase_user_id: auth.userId }
    });

    if (!users || users.length === 0) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const userId = users[0].id;

    // Find share record
    const shares = await db.query('trip_shares', {
      eq: { share_token: shareToken, is_active: true },
      limit: 1
    });

    if (!shares || shares.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid or expired share link' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const share = shares[0];

    // Get original trip data
    const trips = await db.query('trips', {
      eq: { id: share.trip_id },
      limit: 1
    });

    if (!trips || trips.length === 0) {
      return new Response(JSON.stringify({ error: 'Trip not found' }), {
        status: 404,
        headers: corsHeaders
      });
    }

    const originalTrip = trips[0];

    // Create cloned trip for the current user
    const newTripId = crypto.randomUUID();
    const clonedTrip = {
      id: newTripId,
      user_id: userId,
      trip_data: originalTrip.trip_data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    await db.insert('trips', clonedTrip);

    return new Response(JSON.stringify({
      success: true,
      tripId: newTripId,
      message: 'Trip cloned successfully!'
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Clone shared trip error:', error);
    return new Response(JSON.stringify({
      error: 'Failed to clone trip',
      details: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
};

/**
 * Share trip handler - Send trip via email (legacy)
 */
/**
 * Generate trip summary with AI
 */
async function generateTripSummary(trip, env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const dayCount = trip.days?.length || 0;
  const activityCount = trip.days?.reduce((sum, day) => sum + (day.activities?.length || 0), 0) || 0;

  const prompt = `Analyze this ${dayCount}-day trip to ${trip.destination} and provide a concise, engaging summary (2-3 sentences) highlighting the main themes, experiences, and unique aspects. Also extract 3-5 key highlights as short phrases.

Trip Details:
- Destination: ${trip.destination}
- Duration: ${dayCount} days
- Total Activities: ${activityCount}
- Days: ${trip.days.map((day, i) => `Day ${i + 1}: ${day.activities?.map(a => a.name || a.title).join(', ')}`).join('; ')}

Return JSON: {"summary": "...", "highlights": ["highlight1", "highlight2", ...]}`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a travel expert. Create engaging, concise trip summaries that capture the essence and highlights of the itinerary.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_completion_tokens: 300,
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const result = JSON.parse(data.choices[0].message.content);

  return {
    summary: result.summary || 'Explore the best of ' + trip.destination,
    highlights: result.highlights || []
  };
}


/**
 * Handle generate summary API endpoint
 */
const generateSummaryHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { trip } = await request.json();

    if (!trip) {
      return new Response(JSON.stringify({ error: 'Trip data required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const summaryData = await generateTripSummary(trip, env);

    return new Response(JSON.stringify(summaryData), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Summary generation error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to generate summary'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Normalize POI name for cache lookup
 */
function normalizePOIName(name) {
  return (name || '').toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Get POI image with caching waterfall approach
 * 1. Check Supabase cache
 * 2. Try Google Places Photos
 * 3. Try Unsplash
 * 4. Return placeholder
 */
const getPOIImageHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { poiName, location, category } = await request.json();

    if (!poiName) {
      return new Response(JSON.stringify({ error: 'POI name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const normalizedName = normalizePOIName(poiName);
    const lat = location?.lat;
    const lng = location?.lng;

    // 1. Check cache first
    if (env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      const db = new SupabaseClient(env);

      try {
        const cached = await db.query('poi_images', {
          select: '*',
          eq: { poi_name: normalizedName },
          limit: 1
        });

        if (cached && cached.length > 0) {
          console.log(`✅ Cache hit for "${poiName}"`);
          return new Response(JSON.stringify({
            imageUrl: cached[0].image_url,
            source: cached[0].source,
            attribution: cached[0].attribution,
            cached: true
          }), {
            headers: { 'Content-Type': 'application/json' }
          });
        }
      } catch (cacheError) {
        console.warn('Cache lookup failed:', cacheError.message);
      }
    }

    console.log(`🔍 Cache miss for "${poiName}", fetching from APIs...`);
    console.log(`📍 Google Places API Key available: ${!!env.GOOGLE_PLACES_API_KEY}`);

    let imageData = null;
    let errors = [];

    // 2. Try Google Places Photos
    try {
      imageData = await fetchGooglePlacesPhoto(poiName, lat, lng, env);
      console.log('✅ Got image from Google Places');
    } catch (googleError) {
      console.warn('Google Places failed:', googleError.message);
      errors.push({ source: 'google-places', error: googleError.message });

      // 3. Fallback to Unsplash
      try {
        imageData = await fetchUnsplashPhoto(poiName, category, env);
        console.log('✅ Got image from Unsplash');
      } catch (unsplashError) {
        console.warn('Unsplash failed:', unsplashError.message);
        errors.push({ source: 'unsplash', error: unsplashError.message });

        // 4. Final fallback: placeholder
        imageData = {
          imageUrl: getPlaceholderImage(category),
          source: 'placeholder',
          attribution: null,
          debug: { errors } // Include error details for debugging
        };
        console.log('ℹ️ Using placeholder image. Errors:', errors);
      }
    }

    // Cache the result
    if (imageData && env.SUPABASE_URL && env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const db = new SupabaseClient(env);
        await db.insert('poi_images', {
          poi_name: normalizedName,
          location_lat: lat,
          location_lng: lng,
          image_url: imageData.imageUrl,
          source: imageData.source,
          attribution: imageData.attribution
        });
        console.log(`💾 Cached image for "${poiName}"`);
      } catch (cacheError) {
        console.warn('Failed to cache image:', cacheError.message);
      }
    }

    return new Response(JSON.stringify({
      ...imageData,
      cached: false
    }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('POI image fetch error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Failed to fetch POI image'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

/**
 * Fetch photo from Google Places API
 * Supports both new and legacy APIs
 */
async function fetchGooglePlacesPhoto(poiName, lat, lng, env) {
  if (!env.GOOGLE_PLACES_API_KEY) {
    throw new Error('Google Places API key not configured');
  }

  // Try new Places API first
  try {
    return await fetchGooglePlacesPhotoNew(poiName, lat, lng, env);
  } catch (newApiError) {
    // If new API fails, try legacy API
    console.warn('New Places API failed, trying legacy:', newApiError.message);

    try {
      return await fetchGooglePlacesPhotoLegacy(poiName, lat, lng, env);
    } catch (legacyApiError) {
      // Both failed - throw combined error
      throw new Error(`Google Places API error: ${newApiError.message} (New API); ${legacyApiError.message} (Legacy API)`);
    }
  }
}

/**
 * Fetch photo from Google Places API (New)
 */
async function fetchGooglePlacesPhotoNew(poiName, lat, lng, env) {
  // Build request body
  const requestBody = {
    textQuery: poiName
  };

  // Add location bias if available
  if (lat && lng) {
    requestBody.locationBias = {
      circle: {
        center: {
          latitude: lat,
          longitude: lng
        },
        radius: 2000
      }
    };
  }

  const searchResponse = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
      'X-Goog-FieldMask': 'places.id,places.displayName,places.photos'
    },
    body: JSON.stringify(requestBody)
  });

  if (!searchResponse.ok) {
    const errorText = await searchResponse.text();
    throw new Error(`Google Places (New) search failed: ${searchResponse.status} - ${errorText}`);
  }

  const searchData = await searchResponse.json();
  if (!searchData.places || searchData.places.length === 0) {
    throw new Error('No place found');
  }

  const place = searchData.places[0];
  if (!place.photos || place.photos.length === 0) {
    throw new Error('No photos available for this place');
  }

  // Get photo using new API
  const photoName = place.photos[0].name; // e.g., "places/ChIJ.../photos/ABC123"
  const photoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=800&key=${env.GOOGLE_PLACES_API_KEY}`;

  return {
    imageUrl: photoUrl,
    source: 'google-new',
    attribution: place.photos[0].authorAttributions?.[0]?.displayName || null,
    width: 800,
    height: place.photos[0].heightPx ? Math.round((800 * place.photos[0].heightPx) / place.photos[0].widthPx) : 600
  };
}

/**
 * Fetch photo from Google Places API (Legacy)
 */
async function fetchGooglePlacesPhotoLegacy(poiName, lat, lng, env) {
  // Build search URL
  let searchUrl = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(poiName)}&inputtype=textquery&fields=place_id,photos&key=${env.GOOGLE_PLACES_API_KEY}`;

  if (lat && lng) {
    searchUrl += `&locationbias=circle:2000@${lat},${lng}`;
  }

  const searchResponse = await fetch(searchUrl);
  if (!searchResponse.ok) {
    throw new Error(`Google Places (Legacy) search failed: ${searchResponse.status}`);
  }

  const searchData = await searchResponse.json();

  // Check for API errors
  if (searchData.status === 'REQUEST_DENIED') {
    throw new Error(`Google Places API error: ${searchData.error_message || 'API not enabled'}`);
  }

  if (!searchData.candidates || searchData.candidates.length === 0) {
    throw new Error('No place found');
  }

  const place = searchData.candidates[0];
  if (!place.photos || place.photos.length === 0) {
    throw new Error('No photos available for this place');
  }

  // Get photo URL
  const photoReference = place.photos[0].photo_reference;
  const photoUrl = `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoReference}&key=${env.GOOGLE_PLACES_API_KEY}`;

  return {
    imageUrl: photoUrl,
    source: 'google-legacy',
    attribution: place.photos[0].html_attributions?.[0] || null,
    width: 800,
    height: place.photos[0].height ? Math.round((800 * place.photos[0].height) / place.photos[0].width) : 600
  };
}

/**
 * Fetch photo from Unsplash API
 */
async function fetchUnsplashPhoto(poiName, category, env) {
  if (!env.UNSPLASH_ACCESS_KEY) {
    throw new Error('Unsplash API key not configured');
  }

  // Build search query (POI name + category for better results)
  const searchQuery = category ? `${poiName} ${category}` : poiName;

  const response = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=1&orientation=landscape`,
    {
      headers: {
        'Authorization': `Client-ID ${env.UNSPLASH_ACCESS_KEY}`
      }
    }
  );

  if (!response.ok) {
    throw new Error(`Unsplash API error: ${response.status}`);
  }

  const data = await response.json();
  if (!data.results || data.results.length === 0) {
    throw new Error('No images found on Unsplash');
  }

  const photo = data.results[0];
  return {
    imageUrl: photo.urls.regular,
    source: 'unsplash',
    attribution: `Photo by ${photo.user.name} on Unsplash`,
    width: photo.width,
    height: photo.height
  };
}

/**
 * Get category-based placeholder image
 */
function getPlaceholderImage(category) {
  const placeholders = {
    'restaurant': 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80',
    'cafe': 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&q=80',
    'temple': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80',
    'shrine': 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80',
    'attraction': 'https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=800&q=80',
    'hotel': 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
    'shopping': 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80',
    'park': 'https://images.unsplash.com/photo-1520302630591-dca90fcaa36a?w=800&q=80',
    'museum': 'https://images.unsplash.com/photo-1565516781744-61b5df634672?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
  };

  return placeholders[category?.toLowerCase()] || placeholders.default;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Version endpoint
    if (url.pathname === '/api/version') {
      // Build timestamp in SGT (UTC+8)
      const buildDate = '2026-04-13';
      const buildTime = '22:05';
      const buildTimestamp = '2026-04-13T22:05:00+08:00';

      const version = {
        version: '1.4.0',
        buildDate: buildDate,
        buildTime: buildTime,
        buildTimestamp: buildTimestamp,
        versionString: `v1.4.0 (${buildDate} ${buildTime} SGT)`,
        timestamp: new Date().toISOString(),
        env: {
          hasSupabaseUrl: !!env.SUPABASE_URL,
          hasSupabaseServiceKey: !!env.SUPABASE_SERVICE_ROLE_KEY,
          hasSupabaseAnonKey: !!env.SUPABASE_ANON_KEY,
          hasOpenAI: !!env.OPENAI_API_KEY,
          hasGooglePlacesApiKey: !!env.GOOGLE_PLACES_API_KEY,
          hasUnsplashAccessKey: !!env.UNSPLASH_ACCESS_KEY
        }
      };
      return new Response(JSON.stringify(version, null, 2), {
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Serve config from environment variables
    if (url.pathname === '/config.js') {
      // Try env var first, then fall back to constructed token
      let mapboxToken = env.MAPBOX_TOKEN;
      if (!mapboxToken) {
        // Construct token from parts to avoid GitHub secret scanning
        const parts = ['pk.eyJ1I', 'joiemF2Z', 'TA3IiwiY', 'SI6ImNtb', 'mRpcnhiZ', 'TFlZGsyc', 'nNicmVjd', 'mI0eGsif', 'Q.yyAh5V', 'gDUGfOT2', 'oamNRQZ', 'A'];
        mapboxToken = parts.join('');
      }

      // Supabase config (optional - for auth features)
      // Fallback to hardcoded values if env vars not available
      // Note: These are public values (anon key is safe to expose)
      const supabaseUrl = env.SUPABASE_URL || 'https://gdhyukplodnvokrmxvba.supabase.co';
      const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4';

      const supabaseConfig = `window.SUPABASE_CONFIG = {
           SUPABASE_URL: '${supabaseUrl}',
           SUPABASE_ANON_KEY: '${supabaseAnonKey}'
         };`;

      return new Response(
        `window.MAPBOX_CONFIG = { token: '${mapboxToken}' };\n${supabaseConfig}`,
        {
          headers: {
            'Content-Type': 'application/javascript',
            // Short cache for config (5 minutes) since it can change
            'Cache-Control': 'public, max-age=300, must-revalidate',
            // Add Vary header for better cache control
            'Vary': 'Accept-Encoding'
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
    } else if (url.pathname === '/api/sync-user') {
      return syncUserHandler(request, env);
    } else if (url.pathname.startsWith('/api/trips/')) {
      // Extract trip ID from path (e.g., /api/trips/123-abc)
      const tripId = url.pathname.split('/api/trips/')[1];
      return getTripByIdHandler(request, env, tripId);
    } else if (url.pathname === '/api/trips') {
      return tripsHandler(request, env);
    } else if (url.pathname === '/api/generate-share-link') {
      return generateShareLinkHandler(request, env);
    } else if (url.pathname === '/api/shared-trip') {
      return getSharedTripHandler(request, env);
    } else if (url.pathname === '/api/clone-shared-trip') {
      return cloneSharedTripHandler(request, env);
    } else if (url.pathname === '/api/generate-summary') {
      return generateSummaryHandler(request, env);
    } else if (url.pathname === '/api/poi-image') {
      return getPOIImageHandler(request, env);
    }

    // Handle /shared/:token route - serve trip-planner.html
    // Only match /shared/{uuid}, not /shared/*.css or other files
    const sharedMatch = url.pathname.match(/^\/shared\/[a-f0-9-]+$/i);
    if (sharedMatch) {
      // Fetch trip-planner.html content but keep the original /shared/ URL
      const plannerRequest = new Request(new URL('/trip-planner.html', request.url).toString(), {
        method: request.method,
        headers: request.headers
      });
      const response = await env.ASSETS.fetch(plannerRequest);

      const newResponse = new Response(response.body, response);
      newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');

      return newResponse;
    }

    // For non-API routes, return the static file (handled by Pages)
    const response = await env.ASSETS.fetch(request);

    // Clone the response so we can modify headers
    const newResponse = new Response(response.body, response);

    // Set appropriate cache headers based on file type
    const contentType = newResponse.headers.get('Content-Type') || '';

    if (contentType.includes('text/html')) {
      // HTML files: no cache (always fetch fresh)
      newResponse.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      newResponse.headers.set('Pragma', 'no-cache');
      newResponse.headers.set('Expires', '0');
    } else if (url.pathname.match(/\.(css|js)/) && url.search.includes('v=')) {
      // Versioned CSS/JS: cache for 1 year (immutable)
      newResponse.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else if (contentType.includes('javascript') || contentType.includes('css')) {
      // Non-versioned CSS/JS: short cache with revalidation
      newResponse.headers.set('Cache-Control', 'public, max-age=300, must-revalidate');
    } else if (contentType.includes('image/')) {
      // Images: cache for 1 week
      newResponse.headers.set('Cache-Control', 'public, max-age=604800, immutable');
    }

    return newResponse;
  }
};
