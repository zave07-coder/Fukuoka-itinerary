# Wahgola API - Vercel Deployment

This is the AI generation API for Wahgola, deployed on Vercel to bypass Cloudflare Workers' 30-second timeout limit.

## Features

- **No timeout limits**: 60-second max duration (vs 30s on CF Workers)
- **Higher token limit**: 12,000 tokens (vs 4,000 on CF Workers)
- **Better quality**: More detailed trip descriptions
- **Streaming responses**: Progressive updates to frontend

## Deployment

This is automatically deployed via GitHub integration:
- Push to `main` branch → Auto-deploys to Vercel
- URL: `https://wahgola-api.vercel.app`

## Environment Variables

Set these in Vercel dashboard:
- `OPENAI_API_KEY` - Your OpenAI API key

## API Endpoints

### POST /api/generate-trip
Generate a trip itinerary with AI.

**Request:**
```json
{
  "prompt": "5-day cultural trip to Kyoto"
}
```

**Response:** Server-Sent Events (SSE) stream
```
data: {"type":"progress","content":"...","percentage":20}
data: {"type":"progress","content":"...","percentage":40}
data: {"type":"complete","data":{...},"percentage":100}
```
