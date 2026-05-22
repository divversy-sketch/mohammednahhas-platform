import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './shared-scan.mjs';

const featuresDir = path.join(ROOT, 'src/features');
const ignored = new Set(['_template']);
const missing = [];
for (const entry of fs.readdirSync(featuresDir, { withFileTypes: true })) {
  if (!entry.isDirectory() || ignored.has(entry.name)) continue;
  const indexPath = path.join(featuresDir, entry.name, 'index.js');
  if (!fs.existsSync(indexPath)) missing.push(`src/features/${entry.name}/index.js`);
}
if (missing.length) {
  console.error('Missing feature barrel exports:');
  console.error(missing.map((x) => `- ${x}`).join('\n'));
  process.exit(1);
}
console.log(`✅ Barrel export guard passed for ${fs.readdirSync(featuresDir, { withFileTypes: true }).filter((x) => x.isDirectory() && !ignored.has(x.name)).length} features.`);
