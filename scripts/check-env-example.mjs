import { readFile } from 'node:fs/promises';

const envExample = await readFile('.env.example', 'utf8');
const requiredHints = ['OPENROUTER_API_KEY', 'REQUIRE_REDIS', 'UPSTASH_REDIS_REST_URL'];

const missing = requiredHints.filter((hint) => !envExample.includes(hint));
if (missing.length > 0) {
  console.error(`Missing env hints in .env.example: ${missing.join(', ')}`);
  process.exit(1);
}

console.log('Env example contains required production hints.');
