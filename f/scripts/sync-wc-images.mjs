import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'src/app/workspace-connect/images');

if (!existsSync(source)) {
  console.error(`[sync-wc-images] Source not found: ${source}`);
  process.exit(1);
}

const targets = [
  join(root, 'public/assets/workspace-connect/images'),
];

for (const target of targets) {
  mkdirSync(target, { recursive: true });
  cpSync(source, target, { recursive: true });
  console.log(`[sync-wc-images] ${source} -> ${target}`);
}
