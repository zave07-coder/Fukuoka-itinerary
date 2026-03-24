// Cloudflare Pages Function to serve Mapbox config dynamically
// Reads MAPBOX_TOKEN from environment variable (set in Cloudflare Pages dashboard)
export async function onRequest(context) {
  const mapboxToken = context.env.MAPBOX_TOKEN;

  if (!mapboxToken) {
    return new Response('console.error("MAPBOX_TOKEN not configured");', {
      headers: { 'Content-Type': 'application/javascript' }
    });
  }

  const script = `window.MAPBOX_CONFIG = { token: '${mapboxToken}' };`;

  return new Response(script, {
    headers: {
      'Content-Type': 'application/javascript',
      'Cache-Control': 'public, max-age=3600'
    }
  });
}
