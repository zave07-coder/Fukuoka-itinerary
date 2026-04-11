#!/bin/bash

# Wahgola Supabase credentials (from MEMORY.md)
SUPABASE_URL="https://gdhyukplodnvokrmxvba.supabase.co"

echo "Checking if we have Supabase credentials..."
echo ""

# Try to get the service key from wrangler.toml or check if it's in Cloudflare
if [ -f "wrangler.toml" ]; then
  echo "📄 Found wrangler.toml"
  grep -A 10 "\[vars\]" wrangler.toml | head -20
fi

echo ""
echo "Note: Supabase credentials are stored as secrets in Cloudflare Pages."
echo "To check sync status, we can:"
echo "1. Check Supabase dashboard directly"
echo "2. Check browser console logs"
echo "3. Use the sync diagnostic page in the app"
echo ""
echo "Can you share:"
echo "- What did you see in the browser when you clicked sync?"
echo "- Any console errors or success messages?"
echo "- The sync status indicator (color/text)?"
