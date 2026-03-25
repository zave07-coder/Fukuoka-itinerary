import { neon } from '@neondatabase/serverless';

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

        // Build the enhanced system prompt with all operation types
        const systemPrompt = `You are a helpful travel planning assistant for a Fukuoka family trip (June 14-23, 2026).
You can help users modify their itinerary through natural language commands.

Current itinerary: ${JSON.stringify(currentItinerary)}

IMPORTANT: You can execute 6 types of operations. Always output operations in JSON format using these markers:

1. ADD - Add new location
   Format: OPERATION: {"type": "add", "day": "Day X", "location": {"name": "...", "lat": X.XX, "lng": X.XX, "type": "category", "time": "HH:MM"}, "position": "after Location Y" (optional)}
   Example: "add TeamLab after Canal City on Day 3"

2. REMOVE - Remove existing location
   Format: OPERATION: {"type": "remove", "day": "Day X", "location_name": "Location Name"}
   Example: "remove Ohori Park from Day 2"

3. MOVE - Move location between days
   Format: OPERATION: {"type": "move", "location_name": "...", "from_day": "Day X", "to_day": "Day Y", "position": "start|end|after Location Z"}
   Example: "move Ohori Park from Day 2 to Day 3"

4. UPDATE - Modify location details (name, time, notes)
   Format: OPERATION: {"type": "update", "day": "Day X", "location_name": "...", "changes": {"time": "18:00", "notes": "..."}}
   Example: "change Ramen Stadium time to 6pm"

5. REORDER - Swap or reorder locations within a day
   Format: OPERATION: {"type": "reorder", "day": "Day X", "location_name": "...", "new_position": "after Location Y"}
   Example: "swap locations A and B on Day 4"

6. REPLACE - Replace entire day or location
   Format: OPERATION: {"type": "replace", "target": "Day X" or "location_name", "replacement": {...}}
   Example: "replace Day 5 with a beach day"

Guidelines:
- Consider family-friendly activities (6-year-old daughter)
- Account for travel distances and timing
- Provide brief explanations for suggestions
- Always output exactly ONE operation per response
- Use proper JSON format in OPERATION markers`;

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

        // Parse for operations
        let operations = [];
        const operationMatch = aiMessage.match(/OPERATION:\s*({[\s\S]*?})/);

        if (operationMatch) {
            try {
                const operation = JSON.parse(operationMatch[1]);
                operations.push(operation);

                // Save to database using enhanced change_log system
                try {
                    const sql = neon(context.env.NEON_DATABASE_URL);

                    // Build before/after states based on operation type
                    let beforeState = null;
                    let afterState = null;
                    let description = '';
                    let locationId = null;

                    switch(operation.type) {
                        case 'add':
                            afterState = operation.location;
                            locationId = operation.location?.name;
                            description = `Add ${operation.location?.name} to ${operation.day}`;
                            break;

                        case 'remove':
                            beforeState = { name: operation.location_name };
                            locationId = operation.location_name;
                            description = `Remove ${operation.location_name} from ${operation.day}`;
                            break;

                        case 'move':
                            beforeState = { day: operation.from_day, name: operation.location_name };
                            afterState = { day: operation.to_day, name: operation.location_name, position: operation.position };
                            locationId = operation.location_name;
                            description = `Move ${operation.location_name} from ${operation.from_day} to ${operation.to_day}`;
                            break;

                        case 'update':
                            beforeState = { name: operation.location_name };
                            afterState = { name: operation.location_name, ...operation.changes };
                            locationId = operation.location_name;
                            description = `Update ${operation.location_name} on ${operation.day}`;
                            break;

                        case 'reorder':
                            beforeState = { name: operation.location_name };
                            afterState = { name: operation.location_name, position: operation.new_position };
                            locationId = operation.location_name;
                            description = `Reorder ${operation.location_name} on ${operation.day}`;
                            break;

                        case 'replace':
                            beforeState = { target: operation.target };
                            afterState = operation.replacement;
                            locationId = operation.target;
                            description = `Replace ${operation.target}`;
                            break;
                    }

                    // Insert into change_log
                    await sql(
                        `INSERT INTO change_log
                         (operation_type, day, location_id, before_state, after_state, description)
                         VALUES ($1, $2, $3, $4, $5, $6)`,
                        [
                            operation.type,
                            operation.day || operation.from_day || null,
                            locationId,
                            JSON.stringify(beforeState),
                            JSON.stringify(afterState),
                            description
                        ]
                    );

                    // Also insert into legacy table
                    await sql(
                        'INSERT INTO itinerary_changes (change_type, day, location_data) VALUES ($1, $2, $3)',
                        [operation.type, operation.day || operation.from_day, JSON.stringify(afterState)]
                    );
                } catch (dbError) {
                    console.error('Database save error:', dbError);
                }
            } catch (e) {
                console.error('Failed to parse operation:', e);
            }
        }

        // Clean up the message (remove OPERATION markers)
        const cleanMessage = aiMessage.replace(/OPERATION:\s*{[\s\S]*?}/g, '').trim();

        return new Response(JSON.stringify({
            message: cleanMessage,
            operations: operations
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
