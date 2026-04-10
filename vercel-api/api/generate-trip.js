/**
 * Vercel Serverless Function for AI Trip Generation
 * No 30-second timeout limit - can handle large trips with high token counts
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt } = req.body;

    // Validation
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({
        error: 'Please provide a trip description',
        userMessage: 'Please describe your trip (e.g., "5-day cultural trip to Kyoto")'
      });
    }

    if (prompt.length > 2000) {
      return res.status(400).json({
        error: 'Prompt too long',
        userMessage: 'Please keep your trip description under 2000 characters'
      });
    }

    console.log('🚀 Generating trip with prompt:', prompt);

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

    // Set response headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Start streaming to client
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Switched from gpt-4o-mini for better streaming performance
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_completion_tokens: 12000,
        response_format: { type: "json_object" },
        stream: true
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      return res.status(response.status).json({
        error: 'OpenAI API error',
        details: errorText
      });
    }

    // Stream the response
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    let chunkCount = 0;

    console.log('📖 Starting to stream response...');

    // Send initial progress
    res.write(`data: ${JSON.stringify({
      type: 'progress',
      content: '',
      percentage: 10
    })}\n\n`);

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log(`✅ Stream complete. ${chunkCount} chunks, ${fullContent.length} chars`);
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
            const content = parsed.choices[0]?.delta?.content || '';
            if (content) {
              fullContent += content;

              // Calculate progress (estimate 6000 chars for average trip)
              const estimatedTotal = 6000;
              const rawProgress = (fullContent.length / estimatedTotal) * 80;
              let percentage = Math.min(95, Math.max(10, Math.floor(10 + rawProgress)));

              // Send progress update
              res.write(`data: ${JSON.stringify({
                type: 'progress',
                content: fullContent,
                percentage
              })}\n\n`);

              if (chunkCount % 20 === 0) {
                console.log(`📝 Progress: ${fullContent.length} chars (${percentage}%)`);
              }
            }
          } catch (e) {
            console.warn('Failed to parse SSE line:', e.message);
          }
        }
      }
    }

    // Parse final JSON
    console.log('🔍 Parsing final JSON...');
    const tripData = JSON.parse(fullContent);

    // Validate and enhance data
    if (!tripData.coverImage) {
      tripData.coverImage = getCoverImageForDestination(tripData.destination);
    }

    // Add metadata
    tripData.aiGenerated = true;
    tripData.generatedBy = 'gpt-4o-vercel';
    tripData.generatedAt = new Date().toISOString();

    console.log(`✅ Trip generated: ${tripData.name} (${tripData.days?.length} days)`);

    // Send completion
    res.write(`data: ${JSON.stringify({
      type: 'complete',
      data: tripData,
      percentage: 100
    })}\n\n`);

    res.end();

  } catch (error) {
    console.error('Generation error:', error);

    // Try to send error as SSE if headers not sent yet
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'text/event-stream');
    }

    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: error.message || 'Failed to generate trip'
    })}\n\n`);

    res.end();
  }
}

/**
 * Get a destination-appropriate cover image from Unsplash
 */
function getCoverImageForDestination(destination) {
  if (!destination) {
    return 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80';
  }

  const dest = destination.toLowerCase();

  const imageMap = {
    'tokyo': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80',
    'kyoto': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800&q=80',
    'osaka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    'fukuoka': 'https://images.unsplash.com/photo-1590559899731-a382839e5549?w=800&q=80',
    'japan': 'https://images.unsplash.com/photo-1542640244-7e672d6cef4e?w=800&q=80',
    'chiang mai': 'https://images.unsplash.com/photo-1598970434795-0c54fe7c0648?w=800&q=80',
    'thailand': 'https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80',
    'bangkok': 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?w=800&q=80',
    'singapore': 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&q=80',
    'default': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&q=80'
  };

  for (const [key, url] of Object.entries(imageMap)) {
    if (dest.includes(key)) {
      return url;
    }
  }

  return imageMap.default;
}
