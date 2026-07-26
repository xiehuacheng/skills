#!/usr/bin/env node

const { main } = require('./github-asset-manager');

// Inject the audit command if not already present
const args = process.argv.slice(2);
if (args.length === 0 || (!args.includes('audit') && !args.some(a => ['stars', 'repos', 'profile', 'draft'].includes(a)))) {
  process.argv.splice(2, 0, 'audit');
}

main();
