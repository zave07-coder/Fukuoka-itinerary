/**
 * Cloudflare Queue Consumer for Background Trip Generation
 * This runs separately from the main Worker with longer timeout limits
 */

// Import the GPT generation function (you'll need to extract this to a shared file)
import { generateWithGPT, validateLocationCoordinates, getCoverImageForDestination } from './_worker.js';

/**
 * Queue consumer handler
 * Processes trip generation jobs in the background
 */
export default {
  async queue(batch, env) {
    console.log(`📦 Processing ${batch.messages.length} queued trip generation jobs`);

    for (const message of batch.messages) {
      const { jobId, prompt, userId, timestamp } = message.body;

      try {
        console.log(`🔄 [Job ${jobId}] Starting trip generation for user ${userId}`);
        console.log(`📝 [Job ${jobId}] Prompt: ${prompt.substring(0, 100)}...`);

        // Generate trip with GPT (no time pressure here!)
        const streamResponse = await generateWithGPT(prompt, env);
        const reader = streamResponse.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullContent = '';

        // Read the entire stream
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
                  fullContent += content;
                }
              } catch (e) {
                // Skip invalid JSON
              }
            }
          }
        }

        // Parse the complete trip data
        const tripData = JSON.parse(fullContent);
        console.log(`✅ [Job ${jobId}] Trip generated: ${tripData.name}`);

        // Validate and fix data
        if (!tripData.coverImage) {
          tripData.coverImage = getCoverImageForDestination(tripData.destination);
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

        // Save to database via Supabase
        const db = new SupabaseClient(env);

        // Create a trip record in the database
        await db.insert('trips', {
          id: jobId,
          user_id: userId,
          name: tripData.name,
          destination: tripData.destination,
          start_date: tripData.startDate,
          end_date: tripData.endDate,
          cover_image: tripData.coverImage,
          data: tripData,
          status: 'completed',
          created_at: new Date(timestamp).toISOString(),
          updated_at: new Date().toISOString()
        });

        console.log(`💾 [Job ${jobId}] Trip saved to database`);

        // Optionally: Send notification (email, push, etc.)
        // await notifyUser(userId, jobId, tripData.name, env);

        // Mark message as successfully processed
        message.ack();
        console.log(`✅ [Job ${jobId}] Completed successfully`);

      } catch (error) {
        console.error(`❌ [Job ${jobId}] Failed:`, error);

        // Save error state to database
        try {
          const db = new SupabaseClient(env);
          await db.insert('trips', {
            id: jobId,
            user_id: userId,
            status: 'failed',
            error: error.message,
            created_at: new Date(timestamp).toISOString(),
            updated_at: new Date().toISOString()
          });
        } catch (dbError) {
          console.error(`❌ [Job ${jobId}] Failed to save error state:`, dbError);
        }

        // Retry the message (will go to DLQ after max_retries)
        message.retry();
      }
    }
  }
};

// Supabase client helper
class SupabaseClient {
  constructor(env) {
    this.url = env.SUPABASE_URL;
    this.serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  }

  async insert(table, data) {
    const response = await fetch(`${this.url}/rest/v1/${table}`, {
      method: 'POST',
      headers: {
        'apikey': this.serviceKey,
        'Authorization': `Bearer ${this.serviceKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Supabase insert failed: ${error}`);
    }

    return await response.json();
  }
}
