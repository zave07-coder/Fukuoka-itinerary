#!/bin/bash

ACCOUNT_ID="e68acd0e8f88fde010e6deda37b7f6ad"
API_TOKEN="vHU0n07EEs3KtEA3Y3Dx8Qf_kW8gRrUaA829dRaE"
PROJECT_NAME="fukuoka-itinerary-git"
GOOGLE_PLACES_KEY="AIzaSyBRaCjDtoLx_DnzjCQ4RyImwL_KwpVY8yo"

echo "🔧 Adding GOOGLE_PLACES_API_KEY to Cloudflare Pages..."
echo ""

# Get project ID first
echo "📋 Getting project details..."
PROJECT_RESPONSE=$(curl -s -X GET \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json")

echo "Project response: $PROJECT_RESPONSE" | jq '.' 2>/dev/null || echo "$PROJECT_RESPONSE"

# Add environment variable to production
echo ""
echo "🔑 Adding GOOGLE_PLACES_API_KEY to production environment..."
PATCH_RESPONSE=$(curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_configs": {
      "production": {
        "env_vars": {
          "GOOGLE_PLACES_API_KEY": {
            "type": "secret_text",
            "value": "'"${GOOGLE_PLACES_KEY}"'"
          }
        }
      }
    }
  }')

echo "$PATCH_RESPONSE" | jq '.' 2>/dev/null || echo "$PATCH_RESPONSE"

if echo "$PATCH_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Successfully added GOOGLE_PLACES_API_KEY!"
  echo "⚠️  You may need to trigger a new deployment for changes to take effect"
else
  echo ""
  echo "❌ Failed to add secret. Response above shows the error."
fi
