import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const storyDirs = [
  path.join(ROOT, 'src/ui/components/__stories__'),
  path.join(ROOT, 'src/components/common/__stories__')
];
const stories = storyDirs.flatMap((dir) => fs.existsSync(dir)
  ? fs.readdirSync(dir).filter((name) => /\.stories\.(jsx|js|tsx|ts)$/.test(name)).map((name) => path.join(dir, name))
  : []);

if (stories.length === 0) {
  console.error('❌ No component story files found.');
  process.exit(1);
}

const missingDefaultExport = stories.filter((file) => !/export\s+default\s+/.test(fs.readFileSync(file, 'utf8')));
if (missingDefaultExport.length) {
  console.error('❌ Story files missing default export:');
  for (const file of missingDefaultExport) console.error(`- ${path.relative(ROOT, file)}`);
  process.exit(1);
}

console.log(`✅ Storybook readiness passed with ${stories.length} story file(s).`);
