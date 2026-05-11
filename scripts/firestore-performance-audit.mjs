#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'src');
const docsDir = path.join(root, 'docs');
fs.mkdirSync(docsDir, { recursive: true });

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
walk(srcDir);

const findings = [];
for (const file of files) {
  const text = fs.readFileSync(file, 'utf8');
  const rel = path.relative(root, file).replaceAll('\\\\', '/');
  const lines = text.split('\n');
  lines.forEach((line, idx) => {
    if ((line.includes('getDocs(') || line.includes('onSnapshot(')) && line.includes('collection(') && !line.includes('limit(')) {
      findings.push({ file: rel, line: idx + 1, type: 'possible-unbounded-query', code: line.trim().slice(0, 180) });
    }
  });
}

const report = [
  '# Firestore Performance Audit',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  findings.length ? '| Type | File | Line | Code |\n| --- | --- | ---: | --- |\n' + findings.map((f) => `| ${f.type} | ${f.file} | ${f.line} | \`${f.code.replace(/\|/g, '/') }\` |`).join('\n') : 'No obvious unbounded one-line Firestore collection reads found.',
  '',
  'Recommended pattern: always use orderBy + limit + pagination helpers for students, results, messages, logs, and payment requests.',
  ''
].join('\n');

fs.writeFileSync(path.join(docsDir, 'FIRESTORE_PERFORMANCE_AUDIT.md'), report, 'utf8');
console.log(report);
