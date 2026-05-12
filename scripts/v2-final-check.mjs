import { existsSync, readFileSync } from 'node:fs';

const requiredFiles = [
  'src/styles/v2-redesign.css',
  'src/ui/components/MobileQuickActions.jsx',
  'src/ui/components/ResponsiveDataCards.jsx',
  'src/ui/hooks/useV2ResponsiveState.js',
  'src/shared/icons/lucide-shim.jsx',
  'docs/reports/V2_PHASE5_6_FINAL_MOBILE_CLEANUP_AR.md',
];

const missing = requiredFiles.filter((file) => !existsSync(file));
if (missing.length) {
  console.error('V2 final check failed. Missing files:');
  for (const file of missing) console.error(`- ${file}`);
  process.exit(1);
}

const iconShim = readFileSync('src/shared/icons/lucide-shim.jsx', 'utf8');
for (const exportName of ['Clock3', 'ShieldCheck']) {
  if (!iconShim.includes(`export const ${exportName}`)) {
    console.error(`V2 final check failed. Missing icon alias: ${exportName}`);
    process.exit(1);
  }
}

const css = readFileSync('src/styles/v2-redesign.css', 'utf8');
for (const token of ['@media (max-width: 767px)', 'v2-mobile-quick-actions', 'prefers-reduced-motion']) {
  if (!css.includes(token)) {
    console.error(`V2 final check failed. Missing CSS token: ${token}`);
    process.exit(1);
  }
}

console.log('V2 final check passed.');
