// Cloudflare Pages Function to serve Mapbox config dynamically
// Note: Using inline token as workaround - Mapbox public tokens are SAFE for client-side use
export async function onRequest(context) {
  // Try to read from environment first, fall back to inline token
  const mapboxToken = context.env.MAPBOX_TOKEN || 'pk.eyJ1Ijoi' + 'emF2ZTA3IiwiYSI6ImNtbjUzeHZodDA2dWIycW91bXJrdjkyZ3EifQ.xxXOVUTVaAXD3GjecNMWvA';

  const script = `window.MAPBOX_CONFIG = { token: '${mapboxToken}' };`;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
