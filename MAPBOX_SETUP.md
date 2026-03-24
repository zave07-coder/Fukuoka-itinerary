# Mapbox Configuration Setup

## For Cloudflare Pages Deployment

The site needs a `config.js` file to work. This file is gitignored to avoid GitHub's secret detection.

### Option 1: Using Cloudflare Pages Build Command (Recommended)

Add this build command in Cloudflare Pages settings:

```bash
echo "window.MAPBOX_CONFIG = { token: '$MAPBOX_TOKEN' };" > config.js
```

Then add environment variable:
- **Variable name:** `MAPBOX_TOKEN`
- **Value:** Your Mapbox public token (starts with `pk.`)

### Option 2: Create config.js manually

Create a file named `config.js` in the project root with:

```javascript
window.MAPBOX_CONFIG = {
    token: 'YOUR_MAPBOX_PUBLIC_TOKEN_HERE'
};
```

## Security Note

**Mapbox public tokens are SAFE to expose in browser code.** They are designed for client-side use. You can restrict token usage by:

1. Going to your Mapbox account settings
2. Restricting the token to specific URLs (e.g., `*.pages.dev`, your domain)
3. Setting rate limits

Public tokens cannot be used to modify your Mapbox account or incur charges beyond usage limits.
# Trigger deployment
