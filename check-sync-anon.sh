#!/bin/bash

SUPABASE_URL="https://gdhyukplodnvokrmxvba.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4"

echo "📊 Checking latest sync records..."
echo ""

# Check sync_metadata table
curl -s "${SUPABASE_URL}/rest/v1/sync_metadata?order=last_sync_at.desc&limit=5" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  | jq -r '.[] | "🔄 Sync Record:\n   User: \(.user_id)\n   Device: \(.device_id)\n   Last Sync: \(.last_sync_at)\n   Status: \(.sync_status // "N/A")\n   Trip Count: \(.trip_count // 0)\n   Updated: \(.updated_at)\n"' 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Note: Unable to parse with jq, showing raw response:"
  curl -s "${SUPABASE_URL}/rest/v1/sync_metadata?order=last_sync_at.desc&limit=5" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
fi

echo ""
echo "📋 Checking latest trips..."
echo ""

# Check trips table
curl -s "${SUPABASE_URL}/rest/v1/trips?order=updated_at.desc&limit=3" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
  | jq -r '.[] | "✈️  Trip:\n   ID: \(.id)\n   User: \(.user_id)\n   Created: \(.created_at)\n   Updated: \(.updated_at)\n"' 2>/dev/null

if [ $? -ne 0 ]; then
  echo "Note: Unable to parse with jq, showing raw response:"
  curl -s "${SUPABASE_URL}/rest/v1/trips?order=updated_at.desc&limit=3" \
    -H "apikey: ${SUPABASE_ANON_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
fi
