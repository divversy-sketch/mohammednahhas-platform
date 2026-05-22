import fs from 'node:fs';
import path from 'node:path';
import { ROOT, countLegacyImports, topSourceFiles, walkFiles } from './shared-scan.mjs';

const output = path.join(ROOT, 'ARCHITECTURE_FINAL_SUMMARY.md');
const legacy = countLegacyImports();
const top = topSourceFiles(25);
const files = walkFiles();
const generatedAt = new Date().toISOString();
const content = `# Final Architecture Summary\n\nGenerated: ${generatedAt}\n\n## Health Snapshot\n\n- Source files scanned: ${files.length}\n- Frozen legacy import count: ${legacy.length}\n- Largest source file: ${top[0]?.size || 0} bytes — ${top[0]?.file || 'n/a'}\n- File hard limit used by guard: 30KB\n\n## Largest Files\n\n${top.map((item) => `- ${item.size} bytes — \`${item.file}\``).join('\n')}\n\n## Legacy Policy\n\nLegacy imports are frozen by baseline. New work should reduce them, not increase them. Use feature barrels and aliases instead.\n\n## Required Checks\n\nRun before delivery:\n\n\`\`\`bash\nnpm run final:check\n\`\`\`\n`;
fs.writeFileSync(output, content);
console.log(`✅ Wrote ${path.relative(ROOT, output)}`);
