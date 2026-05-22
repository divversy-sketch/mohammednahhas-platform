import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredAliases = ['@app', '@layouts', '@pages', '@components', '@features', '@shared', '@services', '@config', '@styles', '@ui', '@admin', '@core', '@hooks', '@utils', '@assets'];
const vite = fs.readFileSync(path.join(root, 'vite.config.js'), 'utf8');
const missingAliases = requiredAliases.filter((alias) => !vite.includes(`'${alias}'`) && !vite.includes(`"${alias}"`));

const requiredDocs = ['ARCHITECTURE.md', 'FEATURE_GUIDE.md', 'IMPORT_RULES.md', 'NEW_FEATURE_TEMPLATE.md'];
const missingDocs = requiredDocs.filter((file) => !fs.existsSync(path.join(root, file)));

const featuresRoot = path.join(root, 'src/features');
const missingFeatureIndexes = fs.readdirSync(featuresRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && !entry.name.startsWith('_'))
  .map((entry) => entry.name)
  .filter((name) => !fs.existsSync(path.join(featuresRoot, name, 'index.js')));

const templateRequired = [
  'src/features/_template/index.js',
  'src/features/_template/components/ExampleWidget.jsx',
  'src/features/_template/hooks/useExample.js',
  'src/features/_template/services/exampleService.js',
];
const missingTemplate = templateRequired.filter((file) => !fs.existsSync(path.join(root, file)));

const failures = [];
if (missingAliases.length) failures.push(`Missing aliases: ${missingAliases.join(', ')}`);
if (missingDocs.length) failures.push(`Missing docs: ${missingDocs.join(', ')}`);
if (missingFeatureIndexes.length) failures.push(`Feature folders missing index.js: ${missingFeatureIndexes.join(', ')}`);
if (missingTemplate.length) failures.push(`Missing feature template files: ${missingTemplate.join(', ')}`);

if (failures.length) {
  console.error('Architecture guard failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('Architecture guard passed.');
