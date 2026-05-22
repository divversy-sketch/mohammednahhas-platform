import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcRoot = path.join(root, 'src');
const exts = new Set(['.js', '.jsx', '.ts', '.tsx']);
const files = [];

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (exts.has(path.extname(entry.name))) files.push(full);
  }
}
walk(srcRoot);

const rel = (file) => path.relative(root, file).replaceAll(path.sep, '/');
const sizeRows = files
  .map((file) => ({ file: rel(file), kb: Number((fs.statSync(file).size / 1024).toFixed(1)) }))
  .sort((a, b) => b.kb - a.kb)
  .slice(0, 30);

const legacyDirs = ['src/admin', 'src/student', 'src/shared/platformParts'];
const legacyFiles = files.filter((file) => legacyDirs.some((dir) => rel(file).startsWith(`${dir}/`)));
const legacyImports = [];
const importRegex = /(?:import|export)\s+(?:[^'";]+?\s+from\s+)?['"]([^'"]+)['"]/g;
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  for (const match of text.matchAll(importRegex)) {
    const target = match[1];
    if (target.includes('/legacy/') || target.includes('admin/parts') || target.includes('student/parts') || target.includes('shared/platformParts') || target.startsWith('@admin/parts')) {
      legacyImports.push({ file: rel(file), target });
    }
  }
}

const featureDirs = fs.readdirSync(path.join(srcRoot, 'features'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .sort();
const featureIndexMissing = featureDirs.filter((name) => !fs.existsSync(path.join(srcRoot, 'features', name, 'index.js')));

const report = [
  '# Architecture Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Summary',
  '',
  `- Source files scanned: ${files.length}`,
  `- Feature folders: ${featureDirs.length}`,
  `- Feature folders without index.js: ${featureIndexMissing.length}`,
  `- Compatibility/legacy files remaining: ${legacyFiles.length}`,
  `- Legacy import references found: ${legacyImports.length}`,
  '',
  '## Top files by size',
  '',
  '| Size KB | File |',
  '|---:|---|',
  ...sizeRows.map((row) => `| ${row.kb} | \`${row.file}\` |`),
  '',
  '## Feature folders missing index.js',
  '',
  ...(featureIndexMissing.length ? featureIndexMissing.map((name) => `- ${name}`) : ['- None']),
  '',
  '## Legacy import references',
  '',
  ...(legacyImports.length ? legacyImports.slice(0, 80).map((item) => `- \`${item.file}\` -> \`${item.target}\``) : ['- None']),
  '',
  '> ملاحظة: وجود wrappers قديمة مقبول مؤقتًا، لكن التطوير الجديد يجب أن يعتمد على `features` و`@ui`.',
  '',
].join('\n');

fs.writeFileSync(path.join(root, 'ARCHITECTURE_REPORT.md'), report);
console.log(report);
