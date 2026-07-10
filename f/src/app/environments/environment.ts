export const DI_TENANT_ID = '638fcbaf-ba4c-43e1-adae-5475c970fe10';
export const DI_AUTHORITY = `https://login.microsoftonline.com/${DI_TENANT_ID}`;

export const environment = {
  production: false,

  /** App deploy prefix (e.g. '' or '/myapp'). Used to build static asset URLs. */
  appBaseUrl: 'http://localhost:4200',

  apiBaseUrl: 'http://localhost:5178/',
  apiEndpoint: 'http://localhost:5178/',
  graphApiEndpoint: 'https://graph.microsoft.com/v1.0',
  appId: 'YOUR_APP_ID',
  clientKey: 'YOUR_CLIENT_KEY',
  isAdmin: 'false',
  refreshInterval: 10000,
  userFullName: '',
  userId: '',
  redirectUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4200',

  // #region Sharepoint Workspace - AY
  sharepointApiBaseUrl: 'http://localhost:5178/api/',
  apiVersion: '1.0',
  ownerKey: 'system',
  defaultLibraryName: 'Documents',
  tenantName: DI_TENANT_ID,
  clientId: '0938c00e-9f05-4c53-9837-d9c5c674eb04',
  authority: DI_AUTHORITY,
  hostName: 'nocompany102.sharepoint.com',
  siteName: 'Sharepoint_PluginTest',
  libraryName: 'Documents',
  userGraphScopes: [
    'https://graph.microsoft.com/User.Read',
    'https://graph.microsoft.com/Files.Read',
    'https://graph.microsoft.com/Sites.Read.All',
  ],
  // #endregion
};
