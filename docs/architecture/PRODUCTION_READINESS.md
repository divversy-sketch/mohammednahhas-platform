# Production Readiness Guide

This project is now organized around feature boundaries. The default development flow should be:

1. Create or edit code inside `src/features/<feature-name>`.
2. Export public APIs from that feature's `index.js`.
3. Import from `@features`/feature barrels, `@shared`, `@ui`, or `@services`.
4. Run `npm run final:check` before handing code to another developer.

## Quality Gates

- `quality:file-size`: prevents a new mega-file from appearing.
- `quality:legacy-imports`: freezes old `@admin`, `@student`, and `@shared/platformParts` imports so they can only decrease.
- `quality:barrels`: ensures every feature has an `index.js`.
- `test:architecture`: runs the same checks through Node's built-in test runner.

## Legacy Cleanup Rule

Old wrappers are allowed only for backward compatibility. New development must not import from old folders. When touching an old wrapper, move the real implementation into the relevant feature first.
