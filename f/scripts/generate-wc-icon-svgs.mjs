import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/app/workspace-connect/images/icons');
mkdirSync(outDir, { recursive: true });

const stroke = '#2e44b1';

const icons = {
  'icon-hub.svg': '<circle cx="12" cy="12" r="3" /><path d="M12 2v4" /><path d="M12 18v4" /><path d="m4.93 4.93 2.83 2.83" /><path d="m16.24 16.24 2.83 2.83" /><path d="M2 12h4" /><path d="M18 12h4" /><path d="m4.93 19.07 2.83-2.83" /><path d="m16.24 7.76 2.83-2.83" />',
  'icon-cloud.svg': '<path d="M17.5 19H9a7 7 0 1 1 4.7-12.3A5.5 5.5 0 0 1 17.5 19Z" />',
  'icon-settings.svg': '<path d="M12 15.5A3.5 3.5 0 1 0 12 8.5a3.5 3.5 0 0 0 0 7Z" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z" />',
  'icon-refresh.svg': '<path d="M21 2v6h-6" /><path d="M3 12a9 9 0 0 1 15-6.7L21 8" /><path d="M3 22v-6h6" /><path d="M21 12a9 9 0 0 1-15 6.7L3 16" />',
  'icon-shield.svg': '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />',
  'icon-building.svg': '<path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" />',
  'icon-database.svg': '<ellipse cx="12" cy="5" rx="9" ry="3" /><path d="M3 5v14a9 3 0 0 0 18 0V5" /><path d="M3 12a9 3 0 0 0 18 0" />',
  'icon-search.svg': '<circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />',
  'icon-connector.svg': '<path d="M10 13a5 5 0 0 0 7.07 0l2.12-2.12a5 5 0 0 0-7.07-7.07l-1.41 1.41" /><path d="M14 11a5 5 0 0 0-7.07 0l-2.12 2.12a5 5 0 0 0 7.07 7.07l1.41-1.41" />',
  'icon-folder.svg': '<path d="M3 7h5l2 3h11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />',
  'icon-azure.svg': '<path d="M3 18L12 4l9 14H3z" /><path d="M12 4l3 6H9l3-6z" />',
  'icon-file.svg': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6" />',
  'icon-aws.svg': '<path d="M4 8h16v10a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" /><path d="M4 8l2-4h12l2 4" />',
  'icon-workspace.svg': '<path d="M3 7h5l2 3h11v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" /><path d="M3 7V5a2 2 0 0 1 2-2h4l2 4" />',
  'icon-dropbox.svg': '<path d="M12 4l8 5-8 5-8-5z" /><path d="M4 14l8 5 8-5" />',
  'icon-slack.svg': '<path d="M8 12a2 2 0 1 1-4 0V9a2 2 0 0 1 4 0v3z" /><path d="M16 12a2 2 0 1 1-4 0V9a2 2 0 0 1 4 0v3z" /><path d="M12 8a2 2 0 1 1 0-4h3a2 2 0 0 1 0 4h-3z" /><path d="M12 16a2 2 0 1 1 0 4h3a2 2 0 0 1 0-4h-3z" />',
  'icon-folder-open.svg': '<path d="M6 14h12" /><path d="M6 18h12" /><path d="M6 10h12" /><path d="M8 6h8l2 4H6l2-4Z" />',
  'icon-sparkles.svg': '<path d="M12 2l1.5 5L18 8l-4.5 1.5L12 15l-1.5-5.5L6 8l4.5-1.5Z" /><path d="M19 14l.8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8Z" />',
  'icon-info.svg': '<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />',
  'folder-gold.svg': '<path fill="#a67c00" d="M4 7V5.5A1.5 1.5 0 0 1 5.5 4H10l1.5 1.5H4V7z"/><path fill="#d4a72c" d="M4 7h6.2L12.5 9H20a2 2 0 0 1 2 2v8.5A2.5 2.5 0 0 1 19.5 22H4.5A2.5 2.5 0 0 1 2 19.5V7z"/>',
  'sharepoint-glyph.svg': '<circle cx="22" cy="14" r="9.5" fill="#036C70" opacity="0.55" /><circle cx="31" cy="23" r="9.5" fill="#1A9BA1" opacity="0.5" /><circle cx="22" cy="32" r="9.5" fill="#37C6D0" opacity="0.45" /><circle cx="13" cy="23" r="9.5" fill="#038387" opacity="0.5" />',
  'chevron-down.svg': '<path d="m6 9 6 6 6-6" />',
};

for (const [file, inner] of Object.entries(icons)) {
  const filled = file === 'folder-gold.svg' || file === 'sharepoint-glyph.svg';
  const viewBox = file === 'sharepoint-glyph.svg' ? '0 0 48 48' : '0 0 24 24';
  const attrs = filled
    ? `xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"`
    : `xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"`;
  const svg = `<svg ${attrs}>${inner}</svg>\n`;
  writeFileSync(join(outDir, file), svg, 'utf8');
  console.log(`[generate-wc-icon-svgs] ${file}`);
}
