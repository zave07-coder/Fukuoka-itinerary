#!/bin/bash

SUPABASE_URL="https://gdhyukplodnvokrmxvba.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4OTI4NjQsImV4cCI6MjA5MDQ2ODg2NH0.Ygoi5WlRHbfxdNx7dQzvlPnXkRElTWbOac1LZQZAkm4"

echo "📊 Latest Sync Records:"
echo "======================"
echo ""

# Check sync_metadata table with correct column name
SYNC_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/sync_metadata?order=last_sync.desc&limit=5" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "$SYNC_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$SYNC_RESPONSE"

echo ""
echo ""
echo "📋 Latest Trips:"
echo "================"
echo ""

# Check trips table
TRIPS_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/trips?order=updated_at.desc&limit=5" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "$TRIPS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$TRIPS_RESPONSE"

echo ""
echo ""
echo "👤 Users:"
echo "========="
echo ""

# Check users table
USERS_RESPONSE=$(curl -s "${SUPABASE_URL}/rest/v1/users?order=created_at.desc&limit=5" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

echo "$USERS_RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$USERS_RESPONSE"
