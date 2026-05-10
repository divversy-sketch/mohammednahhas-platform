import fs from 'node:fs';
import path from 'node:path';

const assetsDir = path.join(process.cwd(), 'dist', 'assets');
if (!fs.existsSync(assetsDir)) {
  console.log('dist/assets not found. Run npm run build first.');
  process.exit(0);
}

const rows = fs.readdirSync(assetsDir)
  .filter((file) => file.endsWith('.js') || file.endsWith('.css'))
  .map((file) => {
    const size = fs.statSync(path.join(assetsDir, file)).size;
    return { file, kb: Math.round(size / 1024) };
  })
  .sort((a, b) => b.kb - a.kb);

const report = [
  '# Build Bundle Report',
  '',
  '| File | Size KB |',
  '| --- | ---: |',
  ...rows.map((row) => `| ${row.file} | ${row.kb} |`),
  '',
  `Generated: ${new Date().toISOString()}`,
  ''
].join('\n');

fs.mkdirSync(path.join(process.cwd(), 'docs'), { recursive: true });
fs.writeFileSync(path.join(process.cwd(), 'docs', 'BUNDLE_REPORT.md'), report);
console.log(report);
