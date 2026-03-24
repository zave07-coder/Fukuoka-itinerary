// Cloudflare Pages Function to serve Mapbox token
export async function onRequestGet(context) {
    // Get Mapbox token from environment variable
    const mapboxToken = context.env.MAPBOX_TOKEN;

    if (!mapboxToken) {
        return new Response(JSON.stringify({
            error: 'Mapbox token not configured',
            message: 'Please add MAPBOX_TOKEN to Cloudflare Pages environment variables'
        }), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            }
        });
    }

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
