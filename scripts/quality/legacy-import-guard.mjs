import fs from 'node:fs';
import path from 'node:path';
import { countLegacyImports, ROOT } from './shared-scan.mjs';

const baselinePath = path.join(ROOT, 'docs/architecture/legacy-import-baseline.json');
const offenders = countLegacyImports();
let baseline = { allowedCount: offenders.length, generatedAt: new Date().toISOString() };
if (fs.existsSync(baselinePath)) baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));

console.log(`Legacy import guard: current=${offenders.length}, allowed=${baseline.allowedCount}`);
if (offenders.length > baseline.allowedCount) {
  console.error('\nLegacy imports increased. New development must use @features/@shared/@ui boundaries, not @admin/@student/platformParts.');
  console.error(offenders.slice(0, 20).map((x) => `- ${x.file} -> ${x.spec}`).join('\n'));
  process.exit(1);
}
if (offenders.length) {
  console.log('\nExisting legacy imports are frozen by baseline and should only go down:');
  console.log(offenders.slice(0, 20).map((x) => `- ${x.file} -> ${x.spec}`).join('\n'));
  if (offenders.length > 20) console.log(`...and ${offenders.length - 20} more`);
}
console.log('\n✅ Legacy import guard passed.');
