#!/bin/bash

echo "🖼️  Setting up POI Image Caching System"
echo "========================================"
echo ""

# Step 1: Create poi_images table in Supabase
echo "📦 Step 1: Creating poi_images table in Supabase..."
echo ""
echo "Please run the following SQL in your Supabase SQL Editor:"
echo "https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/sql"
echo ""
cat poi_images_schema.sql
echo ""
echo "Press Enter when you've executed the SQL above..."
read

# Step 2: Get API keys
echo ""
echo "🔑 Step 2: API Key Setup"
echo "========================"
echo ""
echo "For best POI image quality, you need:"
echo ""
echo "1. Google Places API Key (REQUIRED - best quality)"
echo "   - Go to: https://console.cloud.google.com/apis/credentials"
echo "   - Enable 'Places API' and 'Places Photos API'"
echo "   - Create API key"
echo ""
echo "2. Unsplash Access Key (OPTIONAL - fallback)"
echo "   - Go to: https://unsplash.com/developers"
echo "   - Create new app"
echo "   - Get 'Access Key'"
echo ""
read -p "Do you have a Google Places API key? (y/n): " has_google
read -p "Do you have an Unsplash Access Key? (y/n): " has_unsplash

GOOGLE_KEY=""
UNSPLASH_KEY=""

if [ "$has_google" = "y" ]; then
  read -p "Enter your Google Places API key: " GOOGLE_KEY
fi

if [ "$has_unsplash" = "y" ]; then
  read -p "Enter your Unsplash Access Key: " UNSPLASH_KEY
fi

# Step 3: Set Cloudflare environment variables
echo ""
echo "☁️  Step 3: Setting Cloudflare Environment Variables..."
echo ""

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
  echo "❌ CLOUDFLARE_API_TOKEN not found in environment"
  echo "Please set it first: export CLOUDFLARE_API_TOKEN=your_token"
  exit 1
fi

if [ -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
  echo "❌ CLOUDFLARE_ACCOUNT_ID not found in environment"
  echo "Please set it first: export CLOUDFLARE_ACCOUNT_ID=your_account_id"
  exit 1
fi

PROJECT_NAME="fkk-zavecoder-com"

# Set Google Places API key
if [ -n "$GOOGLE_KEY" ]; then
  echo "Setting GOOGLE_PLACES_API_KEY..."
  curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"deployment_configs\":{\"production\":{\"env_vars\":{\"GOOGLE_PLACES_API_KEY\":{\"value\":\"$GOOGLE_KEY\"}}}}}"
  echo "✅ GOOGLE_PLACES_API_KEY set"
else
  echo "⚠️  Skipping GOOGLE_PLACES_API_KEY (not provided)"
fi

# Set Unsplash Access Key
if [ -n "$UNSPLASH_KEY" ]; then
  echo "Setting UNSPLASH_ACCESS_KEY..."
  curl -X PATCH "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/pages/projects/$PROJECT_NAME" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"deployment_configs\":{\"production\":{\"env_vars\":{\"UNSPLASH_ACCESS_KEY\":{\"value\":\"$UNSPLASH_KEY\"}}}}}"
  echo "✅ UNSPLASH_ACCESS_KEY set"
else
  echo "⚠️  Skipping UNSPLASH_ACCESS_KEY (not provided - will use placeholders)"
fi

echo ""
echo "✅ POI Image Caching System Setup Complete!"
echo ""
echo "📋 Summary:"
echo "==========="
echo "✓ Database table 'poi_images' created"
if [ -n "$GOOGLE_KEY" ]; then
  echo "✓ Google Places API configured"
else
  echo "⚠️  Google Places API NOT configured (using Unsplash only)"
fi
if [ -n "$UNSPLASH_KEY" ]; then
  echo "✓ Unsplash API configured"
else
  echo "⚠️  Unsplash API NOT configured (using placeholders)"
fi
echo ""
echo "🚀 Next Steps:"
echo "1. Deploy your code: wrangler pages deploy ."
echo "2. Test POI images in your trip planner"
echo "3. Monitor costs in Google Cloud Console (first 100k free/month)"
echo ""
