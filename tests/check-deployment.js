#!/usr/bin/env node

/**
 * Quick deployment check - verifies files are accessible and not cached
 */

const https = require('https');

const BASE_URL = 'https://wahgola.zavecoder.com';

const checks = [
  { name: 'Dashboard HTML', url: '/dashboard.html', checkFor: 'v=6' },
  { name: 'Dashboard JS', url: '/dashboard-v2.js?v=6', checkFor: 'getCurrentUser' },
  { name: 'Trip Planner HTML', url: '/trip-planner.html', checkFor: 'v=6' },
  { name: 'Trip Planner JS', url: '/trip-planner-v2.js?v=6', checkFor: 'getCurrentUser' },
  { name: 'Auth Service JS', url: '/auth-service.js?v=6', checkFor: 'isAuthenticated' },
  { name: 'Worker JS', url: '/_worker.js', checkFor: 'getCoverImageForDestination' },
];

async function checkURL(check) {
  return new Promise((resolve) => {
    const url = `${BASE_URL}${check.url}`;

    https.get(url, { headers: { 'Cache-Control': 'no-cache' } }, (res) => {
      let data = '';

      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const hasContent = check.checkFor ? data.includes(check.checkFor) : true;
        const status = res.statusCode;

        resolve({
          ...check,
          status,
          ok: status === 200 && hasContent,
          hasContent,
          size: data.length
        });
      });
    }).on('error', err => {
      resolve({
        ...check,
        ok: false,
        error: err.message
      });
    });
  });
}

async function runChecks() {
  console.log('🔍 Checking deployment...\n');

  const results = await Promise.all(checks.map(checkURL));

  let allGood = true;

  results.forEach(result => {
    const icon = result.ok ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
    console.log(`   URL: ${result.url}`);
    console.log(`   Status: ${result.status || 'ERROR'}`);

    if (result.checkFor) {
      console.log(`   Contains "${result.checkFor}": ${result.hasContent ? 'YES' : 'NO'}`);
    }

    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.size) {
      console.log(`   Size: ${(result.size / 1024).toFixed(2)} KB`);
    }

    console.log('');

    if (!result.ok) allGood = false;
  });

  if (allGood) {
    console.log('🎉 All checks passed!');
  } else {
    console.log('❌ Some checks failed - deployment may be incomplete or cached');
    process.exit(1);
  }
}

runChecks().catch(console.error);
