#!/usr/bin/env node
/**
 * Check Supabase Database Setup
 * Run with: node check-supabase-setup.js
 */

const SUPABASE_URL = 'https://gdhyukplodnvokrmxvba.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdkaHl1a3Bsb2Rudm9rcm14dmJhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDg5Mjg2NCwiZXhwIjoyMDkwNDY4ODY0fQ.cEt3gBApYN4lDykyQMnrwMZE_iH2mBoDpwClIVstOmk';

const REQUIRED_TABLES = ['users', 'trips', 'sync_metadata', 'poi_images'];

async function checkTable(tableName) {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?select=count`, {
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${tableName.padEnd(20)} - EXISTS (${data[0]?.count || 0} rows)`);
      return true;
    } else {
      const error = await response.json();
      if (error.code === 'PGRST205') {
        console.log(`❌ ${tableName.padEnd(20)} - MISSING`);
        return false;
      }
      console.log(`⚠️  ${tableName.padEnd(20)} - ERROR: ${error.message}`);
      return false;
    }
  } catch (error) {
    console.log(`⚠️  ${tableName.padEnd(20)} - ERROR: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🔍 Checking Supabase Database Setup...\n');
  console.log(`Database: ${SUPABASE_URL}\n`);

  const results = [];
  for (const table of REQUIRED_TABLES) {
    const exists = await checkTable(table);
    results.push({ table, exists });
  }

  const missingTables = results.filter(r => !r.exists);

  console.log('\n' + '='.repeat(50));

  if (missingTables.length === 0) {
    console.log('\n✅ All tables are set up correctly!\n');
    console.log('Your Supabase database is ready to use.');
  } else {
    console.log('\n⚠️  Missing tables:\n');
    missingTables.forEach(({ table }) => {
      console.log(`   - ${table}`);
    });
    console.log('\n📝 To fix this:');
    console.log('   1. Go to https://supabase.com/dashboard/project/gdhyukplodnvokrmxvba/sql');
    console.log('   2. Click "New Query"');
    console.log('   3. Copy and paste the SQL from: add-poi-images-table.sql');
    console.log('   4. Click "Run" (or press Ctrl+Enter)\n');
  }

  console.log('='.repeat(50) + '\n');
}

main().catch(console.error);
