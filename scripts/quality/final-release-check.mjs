import { spawnSync } from 'node:child_process';

const commands = [
  ['npm', ['run', 'source:health']],
  ['npm', ['run', 'architecture:guard']],
  ['npm', ['run', 'quality:file-size']],
  ['npm', ['run', 'quality:legacy-imports']],
  ['npm', ['run', 'quality:barrels']],
  ['npm', ['run', 'test:architecture']],
  ['npm', ['run', 'build']],
  ['npm', ['run', 'quality:summary']],
];

for (const [command, args] of commands) {
  console.log(`\n$ ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log('\n✅ Final release check passed.');
