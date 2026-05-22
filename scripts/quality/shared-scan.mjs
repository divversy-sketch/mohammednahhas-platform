import fs from 'node:fs';
import path from 'node:path';

export const ROOT = process.cwd();
export const SRC_DIR = path.join(ROOT, 'src');
export const JS_EXTENSIONS = new Set(['.js', '.jsx', '.ts', '.tsx']);

export function walkFiles(dir = SRC_DIR) {
  const files = [];
  if (!fs.existsSync(dir)) return files;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === 'dist') continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walkFiles(full));
    else if (JS_EXTENSIONS.has(path.extname(entry.name))) files.push(full);
  }
  return files;
}

export function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join('/');
}

export function read(file) {
  return fs.readFileSync(file, 'utf8');
}

export function extractImports(source) {
  const imports = [];
  const patterns = [
    /import\s+(?:[^'"()]+?\s+from\s+)?['"]([^'"]+)['"]/g,
    /import\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /export\s+[^'"()]+?\s+from\s+['"]([^'"]+)['"]/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(source))) imports.push(match[1]);
  }
  return imports;
}

export function countLegacyImports() {
  const offenders = [];
  for (const file of walkFiles()) {
    const source = read(file);
    for (const spec of extractImports(source)) {
      if (spec.startsWith('@admin/') || spec.startsWith('@student/') || spec.startsWith('@shared/platformParts')) {
        offenders.push({ file: rel(file), spec });
      }
    }
  }
  return offenders;
}

export function topSourceFiles(limit = 30) {
  return walkFiles()
    .map((file) => ({ file: rel(file), size: fs.statSync(file).size }))
    .sort((a, b) => b.size - a.size)
    .slice(0, limit);
}
