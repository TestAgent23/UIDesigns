import { environment } from '../../environments/environment';

const WC_IMAGES_DIR = 'assets/workspace-connect/images';

function normalizeAppBase(base: string): string {
  return base.trim().replace(/\/$/, '');
}

/** Build a workspace-connect image URL using environment.appBaseUrl. */
export function wcImageUrl(file: string): string {
  const base = normalizeAppBase(environment.appBaseUrl ?? '');
  return base ? `${base}/${WC_IMAGES_DIR}/${file}` : `/${WC_IMAGES_DIR}/${file}`;
}

function icon(file: string): string {
  return wcImageUrl(`icons/${file}`);
}

/** Workspace Connect static images — all local files under workspace-connect/images. */
export const WC_IMAGES = {
  connector: wcImageUrl('connector.svg'),
  sharepointMark: wcImageUrl('sharepoint-mark.svg'),
  googleDrive: wcImageUrl('google-drive-2020.svg'),
  tepPa: wcImageUrl('tep-pa.svg'),
  tepPaBig: wcImageUrl('tep-pa-big.svg'),
  tepPaBigD: wcImageUrl('tep-pa-big-d.svg'),
  folderGold: wcImageUrl('icons/folder-gold.svg'),
  sharepointGlyph: wcImageUrl('icons/sharepoint-glyph.svg'),
  chevronDown: wcImageUrl('icons/chevron-down.svg'),
  hero: {
    hub: icon('icon-hub.svg'),
    cloud: icon('icon-cloud.svg'),
    settings: icon('icon-settings.svg'),
    refresh: icon('icon-refresh.svg'),
    shield: icon('icon-shield.svg'),
    building: icon('icon-building.svg'),
    database: icon('icon-database.svg'),
    search: icon('icon-search.svg'),
    connector: icon('icon-connector.svg'),
    folder: icon('icon-folder.svg'),
    azure: icon('icon-azure.svg'),
    file: icon('icon-file.svg'),
    aws: icon('icon-aws.svg'),
    workspace: icon('icon-workspace.svg'),
    dropbox: icon('icon-dropbox.svg'),
    slack: icon('icon-slack.svg'),
  },
} as const;
