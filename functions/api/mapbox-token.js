// Cloudflare Pages Function to serve Mapbox token
export async function onRequestGet(context) {
    // Get Mapbox token from environment variable
    // Set MAPBOX_TOKEN in Cloudflare Pages settings
    const mapboxToken = context.env.MAPBOX_TOKEN;

    return new Response(JSON.stringify({
        token: mapboxToken
    }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}
