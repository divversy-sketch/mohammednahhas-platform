import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, countLegacyImports, topSourceFiles } from '../../scripts/quality/shared-scan.mjs';

test('feature barrels exist', () => {
  const featuresDir = path.join(ROOT, 'src/features');
  const missing = fs.readdirSync(featuresDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== '_template')
    .filter((entry) => !fs.existsSync(path.join(featuresDir, entry.name, 'index.js')))
    .map((entry) => entry.name);
  assert.deepEqual(missing, []);
});

test('source files stay below the final hard size limit', () => {
  const tooLarge = topSourceFiles(100).filter((item) => item.size > 30000);
  assert.deepEqual(tooLarge, []);
});

test('legacy imports do not exceed the frozen baseline', () => {
  const baseline = JSON.parse(fs.readFileSync(path.join(ROOT, 'docs/architecture/legacy-import-baseline.json'), 'utf8'));
  assert.ok(countLegacyImports().length <= baseline.allowedCount);
});
