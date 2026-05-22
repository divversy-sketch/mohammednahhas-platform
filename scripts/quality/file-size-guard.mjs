import { topSourceFiles } from './shared-scan.mjs';

const HARD_LIMIT = Number(process.env.FILE_SIZE_HARD_LIMIT || 30000);
const WARNING_LIMIT = Number(process.env.FILE_SIZE_WARNING_LIMIT || 20000);
const top = topSourceFiles(50);
const hardFailures = top.filter((item) => item.size > HARD_LIMIT);
const warnings = top.filter((item) => item.size > WARNING_LIMIT);

console.log(`File size guard: hard limit ${HARD_LIMIT} bytes, warning limit ${WARNING_LIMIT} bytes.`);
if (warnings.length) {
  console.log('\nLargest files above warning limit:');
  for (const item of warnings) console.log(`- ${item.size.toString().padStart(6)}  ${item.file}`);
}
if (hardFailures.length) {
  console.error('\nFiles above hard limit must be split before merge.');
  process.exit(1);
}
console.log('\n✅ File size guard passed.');
