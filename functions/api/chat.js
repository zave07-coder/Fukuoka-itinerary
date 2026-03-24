// Cloudflare Pages Function for AI Chat
export async function onRequestPost(context) {
    try {
        const { message, conversationHistory, currentItinerary } = await context.request.json();

        // Get OpenAI API key from environment
        const apiKey = context.env.OPENAI_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({
                error: 'OpenAI API key not configured',
                message: 'I apologize, but the AI assistant is not configured yet. Please contact the administrator to set up the OpenAI API key in the Cloudflare Pages environment variables.'
            }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        // Build the system prompt
        const systemPrompt = `You are a helpful travel planning assistant for a Fukuoka family trip (June 14-23, 2026).
You can help users modify their itinerary, suggest alternatives, add activities, and update locations.

Current itinerary: ${JSON.stringify(currentItinerary)}

When suggesting changes:
1. Be specific about which day and what to change
2. Consider family-friendly activities (6-year-old daughter)
3. Consider travel distances and timing
4. Provide brief explanations for your suggestions

If you suggest adding new locations, provide them in this format:
MAP_UPDATE: {name: "Location Name", lat: latitude, lng: longitude, type: "category", day: "X"}`;

        // Prepare messages for OpenAI
        const messages = [
            { role: 'system', content: systemPrompt },
            ...conversationHistory,
            { role: 'user', content: message }
        ];

        // Call OpenAI API (using GPT-4o mini for cost efficiency)
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: messages,
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!openaiResponse.ok) {
            throw new Error(`OpenAI API error: ${openaiResponse.statusText}`);
        }

        const openaiData = await openaiResponse.json();
        const aiMessage = openaiData.choices[0].message.content;

        // Parse for map updates
        let mapUpdates = null;
        const mapUpdateMatch = aiMessage.match(/MAP_UPDATE:\s*({.*?})/);
        if (mapUpdateMatch) {
            try {
                const newLocation = JSON.parse(mapUpdateMatch[1]);
                mapUpdates = { addLocations: [newLocation] };
            } catch (e) {
                console.error('Failed to parse map update:', e);
            }
        }

        // Clean up the message (remove MAP_UPDATE markers)
        const cleanMessage = aiMessage.replace(/MAP_UPDATE:\s*{.*?}/g, '').trim();

        return new Response(JSON.stringify({
            message: cleanMessage,
            mapUpdates: mapUpdates
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });

    } catch (error) {
        console.error('Chat API error:', error);
        return new Response(JSON.stringify({
            error: error.message,
            message: 'I apologize, but I encountered an error processing your request. Please try again.'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }
}

// Handle CORS preflight
export async function onRequestOptions() {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    });
}
