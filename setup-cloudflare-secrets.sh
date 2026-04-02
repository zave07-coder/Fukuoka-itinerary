#!/bin/bash

# Setup Cloudflare Pages secrets for Supabase
# Run this script to add the environment variables to your Cloudflare Pages deployment

PROJECT_NAME="wahgola"  # Change this to your Cloudflare Pages project name

echo "Setting up Cloudflare Pages secrets..."
echo "Project: $PROJECT_NAME"
echo ""

# Read from .env file
source .env

# Set secrets using wrangler
echo "Setting SUPABASE_URL..."
echo "$SUPABASE_URL" | npx wrangler pages secret put SUPABASE_URL --project-name="$PROJECT_NAME"

echo "Setting SUPABASE_ANON_KEY..."
echo "$SUPABASE_ANON_KEY" | npx wrangler pages secret put SUPABASE_ANON_KEY --project-name="$PROJECT_NAME"

echo "Setting SUPABASE_SERVICE_ROLE_KEY..."
echo "$SUPABASE_SERVICE_ROLE_KEY" | npx wrangler pages secret put SUPABASE_SERVICE_ROLE_KEY --project-name="$PROJECT_NAME"

echo ""
echo "✅ All secrets set! Your Cloudflare Pages deployment now has access to Supabase."
echo ""
echo "Note: You may need to redeploy for changes to take effect."
