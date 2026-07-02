import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const DIST_DIR = path.resolve('dist');
const MAX_TOTAL_JS_KB = 12000;

async function collectJsSizes(dir) {
  let total = 0;
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await collectJsSizes(fullPath);
      continue;
    }
    if (entry.isFile() && entry.name.endsWith('.js')) {
      const fileStat = await stat(fullPath);
      total += fileStat.size;
    }
  }

  return total;
}

const totalBytes = await collectJsSizes(DIST_DIR);
const totalKb = Math.round(totalBytes / 1024);

if (totalKb > MAX_TOTAL_JS_KB) {
  console.error(`Bundle too large: ${totalKb} KB JS (limit ${MAX_TOTAL_JS_KB} KB)`);
  process.exit(1);
}

console.log(`Bundle size OK: ${totalKb} KB JS (limit ${MAX_TOTAL_JS_KB} KB)`);
