#!/bin/bash

ACCOUNT_ID="e68acd0e8f88fde010e6deda37b7f6ad"
API_TOKEN="vHU0n07EEs3KtEA3Y3Dx8Qf_kW8gRrUaA829dRaE"
PROJECT_NAME="fukuoka-itinerary-git"
UNSPLASH_ACCESS_KEY="6XtKN91B5qSCs2hKtVJoHH8H6u2P65s67reicVMGmmE"

echo "🔧 Adding UNSPLASH_ACCESS_KEY to Cloudflare Pages..."
echo ""

# Add Unsplash access key to production
echo "🔑 Adding UNSPLASH_ACCESS_KEY to production environment..."
PATCH_RESPONSE=$(curl -s -X PATCH \
  "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/pages/projects/${PROJECT_NAME}" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "deployment_configs": {
      "production": {
        "env_vars": {
          "UNSPLASH_ACCESS_KEY": {
            "type": "secret_text",
            "value": "'"${UNSPLASH_ACCESS_KEY}"'"
          }
        }
      }
    }
  }')

echo "$PATCH_RESPONSE" | jq '.' 2>/dev/null || echo "$PATCH_RESPONSE"

if echo "$PATCH_RESPONSE" | grep -q '"success":true'; then
  echo ""
  echo "✅ Successfully added UNSPLASH_ACCESS_KEY!"
else
  echo ""
  echo "❌ Failed to add secret. Check response above."
fi
