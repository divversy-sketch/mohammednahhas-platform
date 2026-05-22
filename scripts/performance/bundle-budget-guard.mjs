import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const distAssets = path.join(ROOT, 'dist/assets');
const reportPath = path.join(ROOT, 'docs/performance/BUNDLE_BUDGET_REPORT.md');

if (!fs.existsSync(distAssets)) {
  console.error('❌ dist/assets not found. Run npm run build first.');
  process.exit(1);
}

const budgets = {
  maxJsKb: 450,
  maxCssKb: 150,
  maxPdfWorkerKb: 1500,
  maxTotalAssetsKb: 3600
};

const files = fs.readdirSync(distAssets)
  .map((name) => {
    const full = path.join(distAssets, name);
    const stat = fs.statSync(full);
    return { name, sizeKb: Number((stat.size / 1024).toFixed(2)) };
  })
  .sort((a, b) => b.sizeKb - a.sizeKb);

const totalAssetsKb = Number(files.reduce((sum, file) => sum + file.sizeKb, 0).toFixed(2));
const violations = [];

for (const file of files) {
  if (/pdf\.worker/i.test(file.name) && file.sizeKb > budgets.maxPdfWorkerKb) violations.push(`${file.name} exceeds PDF worker budget: ${file.sizeKb}KB`);
  else if (/\.js$/.test(file.name) && file.sizeKb > budgets.maxJsKb) violations.push(`${file.name} exceeds JS budget: ${file.sizeKb}KB`);
  else if (/\.css$/.test(file.name) && file.sizeKb > budgets.maxCssKb) violations.push(`${file.name} exceeds CSS budget: ${file.sizeKb}KB`);
}
if (totalAssetsKb > budgets.maxTotalAssetsKb) violations.push(`Total assets exceed budget: ${totalAssetsKb}KB`);

const lines = [
  '# Bundle Budget Report',
  '',
  'Budgets:',
  '',
  `- Max JS chunk: ${budgets.maxJsKb}KB`,
  `- Max CSS chunk: ${budgets.maxCssKb}KB`,
  `- Max PDF worker asset: ${budgets.maxPdfWorkerKb}KB`,
  `- Max total assets: ${budgets.maxTotalAssetsKb}KB`,
  '',
  `Total assets: ${totalAssetsKb}KB`,
  '',
  '## Largest assets',
  '',
  '| File | Size |',
  '|---|---:|',
  ...files.slice(0, 20).map((file) => `| ${file.name} | ${file.sizeKb}KB |`),
  '',
  '## Status',
  '',
  violations.length ? violations.map((item) => `- ❌ ${item}`).join('\n') : '✅ Bundle budgets passed.',
  ''
];
fs.writeFileSync(reportPath, lines.join('\n'));

if (violations.length) {
  console.error(lines.join('\n'));
  process.exit(1);
}
console.log(`✅ Bundle budget guard passed. Wrote ${path.relative(ROOT, reportPath)}.`);
