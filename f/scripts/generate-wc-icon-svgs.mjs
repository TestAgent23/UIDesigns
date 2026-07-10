import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/app/workspace-connect/images/icons');
mkdirSync(outDir, { recursive: true });

function svg(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">${inner}</svg>\n`;
}

function lineSvg(inner, stroke = '#2e44b1') {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>\n`;
}

const icons = {
  'icon-hub.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8b5cf6" />
      <stop offset=".5" stop-color="#2563eb" />
      <stop offset="1" stop-color="#06b6d4" />
    </linearGradient>
    <linearGradient id="n" x1="6" y1="6" x2="18" y2="18" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" />
      <stop offset="1" stop-color="#dbeafe" />
    </linearGradient>
  </defs>
  <circle cx="12" cy="12" r="3.2" fill="url(#g)" />
  <path d="M12 5.2v3.4M12 15.4v3.4M5.2 12h3.4M15.4 12h3.4" stroke="#7c3aed" stroke-width="1.4" stroke-linecap="round" />
  <path d="M7 7 9.4 9.4M14.6 14.6 17 17M17 7l-2.4 2.4M7 17l2.4-2.4" stroke="url(#g)" stroke-width="1.4" stroke-linecap="round" />
  <circle cx="12" cy="5.2" r="1.7" fill="url(#n)" stroke="#c4b5fd" stroke-width=".8" />
  <circle cx="5.2" cy="12" r="1.7" fill="url(#n)" stroke="#93c5fd" stroke-width=".8" />
  <circle cx="18.8" cy="12" r="1.7" fill="url(#n)" stroke="#67e8f9" stroke-width=".8" />
  <circle cx="12" cy="18.8" r="1.7" fill="url(#n)" stroke="#a7f3d0" stroke-width=".8" />
`),

  'icon-cloud.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="5" x2="20" y2="19" gradientUnits="userSpaceOnUse">
      <stop stop-color="#67e8f9" />
      <stop offset=".55" stop-color="#38bdf8" />
      <stop offset="1" stop-color="#2563eb" />
    </linearGradient>
    <linearGradient id="p" x1="9" y1="10" x2="16" y2="17" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" />
      <stop offset="1" stop-color="#dbeafe" />
    </linearGradient>
  </defs>
  <path d="M7.2 17.8a4.6 4.6 0 0 1 .2-9 5.3 5.3 0 0 1 9.8 1.4 3.9 3.9 0 0 1-.6 7.6H7.2Z" fill="url(#g)" />
  <rect x="9.2" y="10.3" width="6.2" height="6.6" rx="1.4" fill="url(#p)" />
  <path d="M10.9 12.1h2.9m-2.9 1.9h2.1" stroke="#2563eb" stroke-width=".8" stroke-linecap="round" />
  <circle cx="16.6" cy="7.4" r="2" fill="#14b8a6" stroke="#ccfbf1" stroke-width=".9" />
`),

  'icon-settings.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#8b5cf6" />
      <stop offset=".48" stop-color="#3b82f6" />
      <stop offset="1" stop-color="#14b8a6" />
    </linearGradient>
    <linearGradient id="c" x1="8" y1="8" x2="16" y2="16" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" />
      <stop offset="1" stop-color="#e0f2fe" />
    </linearGradient>
  </defs>
  <path d="m12 3.8 1.7 2.6 3.1.4.4 3.1 2.5 1.7-1.8 2.5.4 3.1-3.1.4-2.5 1.9-2.5-1.9-3.1-.4.4-3.1-1.9-2.5 2.6-1.7.4-3.1 3.1-.4L12 3.8Z" fill="url(#g)" />
  <circle cx="12" cy="12" r="4.4" fill="url(#c)" />
  <circle cx="12" cy="12" r="1.65" fill="url(#g)" />
  <path d="m8.2 10 2 2-2 2M15.8 10l-2 2 2 2" stroke="#6366f1" stroke-width="1.05" stroke-linecap="round" stroke-linejoin="round" />
`),

  'icon-refresh.svg': svg(`
  <defs>
    <linearGradient id="g" x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60a5fa" />
      <stop offset=".5" stop-color="#4f46e5" />
      <stop offset="1" stop-color="#14b8a6" />
    </linearGradient>
  </defs>
  <circle cx="12" cy="12" r="7.8" fill="#eef2ff" />
  <path d="M18.3 9.1a6.8 6.8 0 0 0-11-2.1" stroke="url(#g)" stroke-width="2.2" stroke-linecap="round" />
  <path d="M18.4 5.3v4.2h-4.2" stroke="#4f46e5" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M5.7 14.9a6.8 6.8 0 0 0 11 2.1" stroke="url(#g)" stroke-width="2.2" stroke-linecap="round" />
  <path d="M5.6 18.7v-4.2h4.2" stroke="#14b8a6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
  <circle cx="12" cy="12" r="1.7" fill="#ffffff" stroke="#93c5fd" stroke-width=".9" />
`),

  'icon-shield.svg': svg(`
  <defs>
    <linearGradient id="g" x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#34d399" />
      <stop offset=".55" stop-color="#10b981" />
      <stop offset="1" stop-color="#0f766e" />
    </linearGradient>
  </defs>
  <path d="M12 2.8 19 5.7v5.6c0 4.7-2.9 8-7 9.9-4.1-1.9-7-5.2-7-9.9V5.7l7-2.9Z" fill="url(#g)" />
  <path d="M8.6 12.2 11 14.5l4.8-5.1" stroke="#ecfdf5" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" />
  <path d="M12 5.4v12.2" stroke="#bbf7d0" stroke-width=".8" stroke-linecap="round" opacity=".5" />
`),

  'icon-building.svg': svg(`
  <defs>
    <linearGradient id="g" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#38bdf8" />
      <stop offset=".55" stop-color="#2563eb" />
      <stop offset="1" stop-color="#4338ca" />
    </linearGradient>
    <linearGradient id="w" x1="8" y1="7" x2="16" y2="17" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ecfeff" />
      <stop offset="1" stop-color="#bfdbfe" />
    </linearGradient>
  </defs>
  <path d="M6.3 20.4V5.8c0-1 .8-1.8 1.8-1.8h7.8c1 0 1.8.8 1.8 1.8v14.6H6.3Z" fill="url(#g)" />
  <path d="M4.2 20.4v-6.7c0-1 .8-1.8 1.8-1.8h2.1v8.5H4.2Zm11.7 0v-8.5H18c1 0 1.8.8 1.8 1.8v6.7h-3.9Z" fill="#67e8f9" opacity=".85" />
  <path d="M9 7.3h2.2M12.8 7.3H15M9 10.4h2.2M12.8 10.4H15M9 13.5h2.2M12.8 13.5H15M10.1 20.3v-3.8h3.8v3.8" stroke="url(#w)" stroke-width="1.15" stroke-linecap="round" />
`),

  'icon-database.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="20" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8" />
      <stop offset=".55" stop-color="#2563eb" />
      <stop offset="1" stop-color="#0891b2" />
    </linearGradient>
  </defs>
  <ellipse cx="12" cy="5.6" rx="7.6" ry="3.2" fill="#dbeafe" />
  <path d="M4.4 5.6v8.9c0 1.8 3.4 3.2 7.6 3.2s7.6-1.4 7.6-3.2V5.6" fill="url(#g)" />
  <ellipse cx="12" cy="5.6" rx="7.6" ry="3.2" fill="#bfdbfe" opacity=".8" />
  <ellipse cx="12" cy="5.6" rx="4.7" ry="1.5" fill="#60a5fa" opacity=".75" />
  <path d="M4.6 10c.8 1.5 3.8 2.6 7.4 2.6s6.6-1.1 7.4-2.6M4.6 14.3c.8 1.5 3.8 2.6 7.4 2.6s6.6-1.1 7.4-2.6" stroke="#eff6ff" stroke-width=".95" stroke-linecap="round" opacity=".85" />
`),

  'icon-search.svg': svg(`
  <defs>
    <linearGradient id="g" x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#67e8f9" />
      <stop offset=".55" stop-color="#38bdf8" />
      <stop offset="1" stop-color="#2563eb" />
    </linearGradient>
  </defs>
  <circle cx="10.8" cy="10.8" r="6.5" fill="url(#g)" />
  <circle cx="10.8" cy="10.8" r="4.2" fill="#ecfeff" opacity=".92" />
  <path d="m15.6 15.6 4 4" stroke="#1d4ed8" stroke-width="2.6" stroke-linecap="round" />
  <path d="M8.4 9.3a3.2 3.2 0 0 1 4-1.1" stroke="#7dd3fc" stroke-width="1.1" stroke-linecap="round" />
`),

  'icon-connector.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="5" x2="20" y2="19" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f472b6" />
      <stop offset=".48" stop-color="#6366f1" />
      <stop offset="1" stop-color="#06b6d4" />
    </linearGradient>
  </defs>
  <path d="M9.9 8.1 8.6 6.8a3.1 3.1 0 0 0-4.4 4.4l2.3 2.3a3.1 3.1 0 0 0 4.4 0l.6-.6" stroke="url(#g)" stroke-width="2.35" stroke-linecap="round" />
  <path d="m14.1 15.9 1.3 1.3a3.1 3.1 0 1 0 4.4-4.4l-2.3-2.3a3.1 3.1 0 0 0-4.4 0l-.6.6" stroke="url(#g)" stroke-width="2.35" stroke-linecap="round" />
  <path d="m9.2 14.8 5.6-5.6" stroke="#eef2ff" stroke-width="1.45" stroke-linecap="round" />
  <circle cx="6.2" cy="9" r="1.5" fill="#ecfeff" />
  <circle cx="17.8" cy="15" r="1.5" fill="#ecfeff" />
`),

  'icon-folder.svg': svg(`
  <defs>
    <linearGradient id="g" x1="3" y1="6" x2="21" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fbbf24" />
      <stop offset=".45" stop-color="#fb923c" />
      <stop offset="1" stop-color="#f97316" />
    </linearGradient>
    <linearGradient id="b" x1="4" y1="9" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fde68a" />
      <stop offset="1" stop-color="#f59e0b" />
    </linearGradient>
  </defs>
  <path d="M3.4 7.6c0-1 .8-1.8 1.8-1.8h4.4l2 2.2h7.2c1 0 1.8.8 1.8 1.8v1.1H3.4V7.6Z" fill="url(#g)" />
  <path d="M3.4 9.4h17.2v7.1c0 1.3-1 2.3-2.3 2.3H5.7c-1.3 0-2.3-1-2.3-2.3V9.4Z" fill="url(#b)" />
  <path d="M5.7 12h12.6" stroke="#fff7ed" stroke-width="1" stroke-linecap="round" opacity=".8" />
`),

  'icon-azure.svg': svg(`
  <defs>
    <linearGradient id="g" x1="5" y1="4" x2="19" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#0ea5e9" />
      <stop offset=".52" stop-color="#38bdf8" />
      <stop offset="1" stop-color="#2563eb" />
    </linearGradient>
  </defs>
  <path d="M7.2 17.7a4.2 4.2 0 0 1 .2-8.4A5.2 5.2 0 0 1 17.2 11a3.5 3.5 0 0 1-.5 6.7H7.2Z" fill="url(#g)" />
  <path d="m11.7 7.2-3.5 8h3.2l3.9-8h-3.6Z" fill="#eff6ff" opacity=".9" />
  <path d="m14.7 9.2 2.1 6h-4.2l.9-1.8h1.1l-.8-2.2.9-2Z" fill="#dbeafe" />
  <circle cx="8.2" cy="17.2" r=".7" fill="#ecfeff" opacity=".7" />
`),

  'icon-file.svg': svg(`
  <defs>
    <linearGradient id="g" x1="6" y1="3" x2="18" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60a5fa" />
      <stop offset=".55" stop-color="#2563eb" />
      <stop offset="1" stop-color="#4f46e5" />
    </linearGradient>
  </defs>
  <path d="M6.2 3.4h7.3l4.3 4.5v11c0 1-.8 1.8-1.8 1.8H6.2c-1 0-1.8-.8-1.8-1.8V5.2c0-1 .8-1.8 1.8-1.8Z" fill="url(#g)" />
  <path d="M13.4 3.6v3.5c0 .8.6 1.4 1.4 1.4h3" fill="#bfdbfe" />
  <path d="M7.8 11.5h7.1M7.8 14.5h6M7.8 17.4h4.2" stroke="#eff6ff" stroke-width="1.05" stroke-linecap="round" />
`),

  'icon-aws.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="5" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fde68a" />
      <stop offset=".45" stop-color="#f59e0b" />
      <stop offset="1" stop-color="#ea580c" />
    </linearGradient>
    <linearGradient id="s" x1="6" y1="12" x2="18" y2="18" gradientUnits="userSpaceOnUse">
      <stop stop-color="#ffffff" />
      <stop offset="1" stop-color="#fed7aa" />
    </linearGradient>
  </defs>
  <path d="M5.2 8.4 7.1 4.7h9.8l1.9 3.7v8.2c0 1.7-1.4 3.1-3.1 3.1H8.3c-1.7 0-3.1-1.4-3.1-3.1V8.4Z" fill="url(#g)" />
  <path d="M5.6 8.4h12.8M8.8 8.4V5M15.2 8.4V5" stroke="#fff7ed" stroke-width="1.1" stroke-linecap="round" opacity=".9" />
  <path d="M8.2 13.9c1.4 1.3 3.2 1.9 5 1.9 1.3 0 2.5-.3 3.6-1" stroke="url(#s)" stroke-width="1.25" stroke-linecap="round" />
  <path d="m15.3 13.6 1.5.2-.2 1.5" stroke="#7c2d12" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" opacity=".7" />
`),

  'icon-workspace.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#2dd4bf" />
      <stop offset=".5" stop-color="#0ea5e9" />
      <stop offset="1" stop-color="#6366f1" />
    </linearGradient>
  </defs>
  <rect x="4" y="4" width="7" height="7" rx="2" fill="#99f6e4" />
  <rect x="13" y="4" width="7" height="7" rx="2" fill="#bfdbfe" />
  <rect x="4" y="13" width="7" height="7" rx="2" fill="#c7d2fe" />
  <rect x="13" y="13" width="7" height="7" rx="2" fill="url(#g)" />
  <path d="M6.2 7.5h2.6M15.2 7.5h2.6M6.2 16.5h2.6M15.2 16.5h2.6" stroke="#ffffff" stroke-width="1.05" stroke-linecap="round" opacity=".85" />
`),

  'icon-dropbox.svg': svg(`
  <defs>
    <linearGradient id="g" x1="4" y1="5" x2="20" y2="19" gradientUnits="userSpaceOnUse">
      <stop stop-color="#60a5fa" />
      <stop offset=".55" stop-color="#2563eb" />
      <stop offset="1" stop-color="#1d4ed8" />
    </linearGradient>
  </defs>
  <path d="m7.8 4.3 4.2 2.8-4.2 2.8-4.2-2.8 4.2-2.8Zm8.4 0 4.2 2.8-4.2 2.8L12 7.1l4.2-2.8ZM7.8 11.2 12 14l-4.2 2.8L3.6 14l4.2-2.8Zm8.4 0 4.2 2.8-4.2 2.8L12 14l4.2-2.8Z" fill="url(#g)" />
  <path d="m7.8 18 4.2-2.8 4.2 2.8-4.2 2.7L7.8 18Z" fill="#93c5fd" />
  <path d="m12 7.1 4.2 4.1M12 14v1.2" stroke="#eff6ff" stroke-width=".9" stroke-linecap="round" opacity=".55" />
`),

  'icon-slack.svg': svg(`
  <defs>
    <linearGradient id="a" x1="4" y1="4" x2="20" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#22c55e" />
      <stop offset=".33" stop-color="#0ea5e9" />
      <stop offset=".66" stop-color="#f59e0b" />
      <stop offset="1" stop-color="#ef4444" />
    </linearGradient>
  </defs>
  <rect x="5.2" y="3.7" width="4.3" height="8.2" rx="2.15" fill="#22c55e" />
  <rect x="14.5" y="12.1" width="4.3" height="8.2" rx="2.15" fill="#ef4444" />
  <rect x="3.7" y="14.5" width="8.2" height="4.3" rx="2.15" fill="#0ea5e9" />
  <rect x="12.1" y="5.2" width="8.2" height="4.3" rx="2.15" fill="#f59e0b" />
  <circle cx="12" cy="12" r="2.15" fill="url(#a)" />
  <circle cx="7.4" cy="16.6" r=".8" fill="#ecfeff" opacity=".8" />
`),

  'icon-folder-open.svg': svg(`
  <defs>
    <linearGradient id="g" x1="3" y1="5" x2="21" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fcd34d" />
      <stop offset=".55" stop-color="#f59e0b" />
      <stop offset="1" stop-color="#ea580c" />
    </linearGradient>
  </defs>
  <path d="M3.7 8.4V6.5c0-.9.7-1.6 1.6-1.6h4.2l1.8 2h6.8c.9 0 1.6.7 1.6 1.6v1H3.7Z" fill="#f59e0b" />
  <path d="M4.8 9.4h15.8l-1.8 8.1c-.2.9-1 1.6-2 1.6H5.2c-1.1 0-2-.9-2-2V10.9c0-.8.7-1.5 1.6-1.5Z" fill="url(#g)" />
  <path d="M7 12.3h10" stroke="#fff7ed" stroke-width="1.1" stroke-linecap="round" opacity=".8" />
`),

  'icon-sparkles.svg': svg(`
  <defs>
    <linearGradient id="g" x1="5" y1="3" x2="19" y2="21" gradientUnits="userSpaceOnUse">
      <stop stop-color="#f59e0b" />
      <stop offset=".45" stop-color="#ec4899" />
      <stop offset="1" stop-color="#8b5cf6" />
    </linearGradient>
  </defs>
  <path d="m11.5 2.8 1.6 5.2 5 1.7-5 1.7-1.6 5.4-1.7-5.4-5-1.7 5-1.7 1.7-5.2Z" fill="url(#g)" />
  <path d="m18.7 14.2.8 2.3 2.2.8-2.2.8-.8 2.3-.8-2.3-2.2-.8 2.2-.8.8-2.3ZM5.4 15.2l.6 1.7 1.6.6-1.6.6-.6 1.7-.6-1.7-1.6-.6 1.6-.6.6-1.7Z" fill="#38bdf8" />
  <circle cx="17.7" cy="5.8" r="1.2" fill="#fef3c7" />
`),

  'icon-info.svg': lineSvg('<circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" />'),
  'chevron-down.svg': lineSvg('<path d="m6 9 6 6 6-6" />'),

  'folder-gold.svg': svg(`
  <defs>
    <linearGradient id="g" x1="3" y1="6" x2="21" y2="20" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fde68a" />
      <stop offset=".45" stop-color="#fbbf24" />
      <stop offset="1" stop-color="#f59e0b" />
    </linearGradient>
    <linearGradient id="h" x1="4" y1="8" x2="20" y2="18" gradientUnits="userSpaceOnUse">
      <stop stop-color="#fff7ed" />
      <stop offset="1" stop-color="#fef3c7" />
    </linearGradient>
  </defs>
  <path d="M4 7.2c0-1 .8-1.8 1.8-1.8h4.3l1.6 1.8H20c1 0 1.8.8 1.8 1.8v1H4V7.2Z" fill="#d97706" />
  <path d="M4 8.2h17.8v7.9c0 1.5-1.2 2.6-2.6 2.6H6.6C5.2 18.7 4 17.5 4 16.1V8.2Z" fill="url(#g)" />
  <path d="M6.1 11.3h11.8" stroke="url(#h)" stroke-width="1.1" stroke-linecap="round" opacity=".9" />
  <path d="M6.1 13.8h9.4" stroke="#fff7ed" stroke-width=".95" stroke-linecap="round" opacity=".7" />
`),
  'sharepoint-glyph.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <circle cx="22" cy="14" r="9.5" fill="#036C70" opacity="0.55" />
  <circle cx="31" cy="23" r="9.5" fill="#1A9BA1" opacity="0.5" />
  <circle cx="22" cy="32" r="9.5" fill="#37C6D0" opacity="0.45" />
  <circle cx="13" cy="23" r="9.5" fill="#038387" opacity="0.5" />
</svg>
`,
};

for (const [file, content] of Object.entries(icons)) {
  writeFileSync(join(outDir, file), content.trim() + '\n', 'utf8');
  console.log(`[generate-wc-icon-svgs] ${file}`);
}
