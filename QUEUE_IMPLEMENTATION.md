# Cloudflare Queue Implementation for Background Trip Generation

## Overview

This guide shows how to implement background trip generation using Cloudflare Queues,
eliminating timeout issues and improving user experience.

## Architecture

```
User Request → Worker (immediate response)
                  ↓
            Queue Job Created
                  ↓
        Queue Consumer (background)
                  ↓
          Generate Trip with AI
                  ↓
        Save to Database
                  ↓
      Notify User (optional)
```

## Benefits

1. **No Timeout Issues** - Queue consumers have longer execution limits
2. **Better UX** - Users don't wait, can close browser
3. **Scalability** - Handles traffic bursts automatically
4. **Reliability** - Automatic retries on failure
5. **Still Serverless** - No servers to manage

## Implementation Steps

### Step 1: Enable Queues in Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Workers & Pages
2. Navigate to your project → Queues
3. Create a new queue: `trip-generation-queue`
4. Create dead letter queue: `trip-generation-dlq`

### Step 2: Update wrangler.toml

Already done! See the updated file.

### Step 3: Modify Worker to Queue Jobs

In `_worker.js`, update the `generateTripHandler` function:

```javascript
const generateTripHandler = async (request, env) => {
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { prompt, useBackground } = await request.json();

    // Validate prompt
    if (!prompt || prompt.trim() === '') {
      return new Response(JSON.stringify({
        error: 'Please provide a trip description'
      }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    // Get user authentication
    const auth = await verifySupabaseToken(request, env);
    if (!auth) {
      return new Response(JSON.stringify({
        error: 'Unauthorized'
      }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // If background generation is requested, queue the job
    if (useBackground && env.TRIP_QUEUE) {
      const jobId = crypto.randomUUID();

      await env.TRIP_QUEUE.send({
        jobId,
        prompt,
        userId: auth.user.id,
        timestamp: Date.now()
      });

      return new Response(JSON.stringify({
        jobId,
        status: 'queued',
        message: 'Your trip is being generated! Check back in a moment.',
        estimatedTime: 30 // seconds
      }), {
        status: 202, // Accepted
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Otherwise, use existing streaming logic
    // ... (keep your current streaming code)
  } catch (error) {
    console.error('Generation error:', error);
    return new Response(JSON.stringify({
      error: error.message
    }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
};
```

### Step 4: Add Status Check Endpoint

Add a new endpoint to check job status:

```javascript
const checkJobStatusHandler = async (request, env, jobId) => {
  try {
    const auth = await verifySupabaseToken(request, env);
    if (!auth) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = new SupabaseClient(env);
    const trips = await db.query('trips', {
      select: '*',
      eq: { id: jobId, user_id: auth.user.id }
    });

    if (trips.length === 0) {
      return new Response(JSON.stringify({
        status: 'pending',
        message: 'Trip is still being generated...'
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const trip = trips[0];

    if (trip.status === 'failed') {
      return new Response(JSON.stringify({
        status: 'failed',
        error: trip.error
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      status: 'completed',
      trip: trip.data
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Add to your router:
// } else if (url.pathname.startsWith('/api/jobs/')) {
//   const jobId = url.pathname.split('/api/jobs/')[1];
//   return checkJobStatusHandler(request, env, jobId);
// }
```

### Step 5: Update Frontend

In `dashboard.js`, add polling logic:

```javascript
async function generateTripWithQueue() {
  const prompt = document.getElementById('aiPrompt').value.trim();

  if (!prompt) {
    alert('Please describe your trip');
    return;
  }

  try {
    // Submit to queue
    const response = await fetch('/api/generate-trip', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, useBackground: true })
    });

    const result = await response.json();

    if (result.status === 'queued') {
      // Show "generating" UI
      showGeneratingMessage(result.jobId);

      // Poll for completion
      pollJobStatus(result.jobId);
    }
  } catch (error) {
    alert('Failed to start generation: ' + error.message);
  }
}

function pollJobStatus(jobId) {
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}`);
      const result = await response.json();

      if (result.status === 'completed') {
        clearInterval(pollInterval);

        // Create trip locally
        const trip = tripManager.createTrip(result.trip);

        // Show success and redirect
        showToast('Trip generated successfully!');
        openTrip(trip.id);

      } else if (result.status === 'failed') {
        clearInterval(pollInterval);
        alert('Generation failed: ' + result.error);
      }

      // Otherwise keep polling (status: pending)
    } catch (error) {
      console.error('Polling error:', error);
      // Keep polling - don't fail on transient errors
    }
  }, 2000); // Poll every 2 seconds

  // Timeout after 2 minutes
  setTimeout(() => {
    clearInterval(pollInterval);
    showToast('Generation is taking longer than expected. Please check back later.');
  }, 120000);
}
```

## Deployment

### 1. Deploy Queue Consumer

```bash
wrangler queues create trip-generation-queue
wrangler queues create trip-generation-dlq
wrangler pages deploy
```

### 2. Test

```bash
# Send a test message to the queue
wrangler queues send trip-generation-queue \
  '{"jobId":"test-123","prompt":"3 day trip to Tokyo","userId":"test-user","timestamp":1234567890}'

# Check queue metrics
wrangler queues list
```

## Cost Considerations

- **Queues**: First 1M operations/month FREE
- **Queue Consumers**: Use Workers CPU time (same pricing)
- **Overall**: Minimal additional cost, better reliability

## Migration Strategy

### Phase 1: Dual Mode (Recommended)
- Keep streaming mode for simple trips (< 5 days)
- Use queue for complex trips (> 5 days)
- Let users choose via UI toggle

### Phase 2: Queue-Only
- Move all generation to queue
- Simpler architecture
- Better scalability

## Monitoring

Check queue metrics in Cloudflare Dashboard:
- Messages queued
- Messages processed
- Dead letter queue (failed jobs)
- Consumer errors

## Troubleshooting

### Jobs stuck in queue?
- Check consumer logs in Cloudflare Dashboard
- Verify SUPABASE credentials are set
- Check dead letter queue for failed jobs

### Jobs timing out?
- Increase `max_batch_timeout` in wrangler.toml
- Check OpenAI API rate limits
- Verify network connectivity

## Alternative: Keep Streaming (Simpler)

If you prefer the current streaming approach:
- ✅ Simpler code
- ✅ Immediate feedback
- ✅ No polling needed
- ⚠️ Timeout risk for complex trips

**Recommendation**: Start with streaming, add queues only if you see frequent timeouts.
