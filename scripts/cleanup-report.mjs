#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const srcDir = path.join(root, 'src');
fs.mkdirSync(docsDir, { recursive: true });

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(js|jsx|ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
if (fs.existsSync(srcDir)) walk(srcDir);

const large = files.map((file) => ({ file: path.relative(root, file).replaceAll('\\\\', '/'), lines: fs.readFileSync(file, 'utf8').split('\n').length }))
  .filter((row) => row.lines >= 700)
  .sort((a, b) => b.lines - a.lines);

const activeArchiveLeak = files.filter((file) => file.includes(`${path.sep}archive-code${path.sep}`));
const tempFiles = fs.readdirSync(root).filter((name) => /build-error|\.tmp$|\.bak$/.test(name));

const report = [
  '# Cleanup Report',
  '',
  `Generated: ${new Date().toISOString()}`,
  '',
  '## Large active files',
  large.length ? '| File | Lines |\n| --- | ---: |\n' + large.map((r) => `| ${r.file} | ${r.lines} |`).join('\n') : 'No active source file exceeds 700 lines.',
  '',
  '## Archive leaks inside src',
  activeArchiveLeak.length ? activeArchiveLeak.map((f) => `- ${path.relative(root, f)}`).join('\n') : 'No archive-code files found under src.',
  '',
  '## Temporary root files',
  tempFiles.length ? tempFiles.map((f) => `- ${f}`).join('\n') : 'No temporary build/error files found in project root.',
  ''
].join('\n');

fs.writeFileSync(path.join(docsDir, 'CLEANUP_REPORT.md'), report, 'utf8');
console.log(report);
if (activeArchiveLeak.length) process.exit(1);
