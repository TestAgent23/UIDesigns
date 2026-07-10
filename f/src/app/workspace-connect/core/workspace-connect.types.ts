import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';
import { environment } from '../../environments/environment';

export type ApplicationTypeCode = 'tp_internal' | 'tp_external' | 'tp_user_delegated' | 'user_delegated';

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApplicationTypeDto {
  applicationTypeId: number;
  code: string;
  displayName: string;
  description?: string;
}

export interface ExternalSiteConnectivityResultDto {
  isConnected: boolean;
  requiresAccessRequest: boolean;
  siteName: string;
  hostName: string;
  siteTitle?: string;
  libraryCount: number;
  libraries?: SharePointLibraryDto[];
  fileCount: number;
  message: string;
}

export interface ApplicationSiteDto {
  applicationSiteId?: string;
  applicationId?: string;
  hostName: string;
  siteName: string;
  libraryName?: string;
  folderPath?: string;
  sortOrder?: number;
}

export interface ApplicationDto {
  applicationId: string;
  sourceInternalApplicationId?: string;
  applicationTypeId?: number;
  applicationTypeCode: string;
  applicationTypeName: string;
  ownerKey: string;
  displayName: string;
  tenantId: string;
  clientId: string;
  clientSecret: string;
  consumerClientId?: string;
  consumerSecret?: string;
  hostName: string;
  siteName?: string;
  libraryName?: string;
  sites?: ApplicationSiteDto[];
  owner: string;
  ownerUpn?: string;
  coOwner?: string;
  coOwnerUpn?: string;
  notes?: string;
  regionIdent?: number;
  regionName?: string;
  subRegionCode?: string;
  subRegionName?: string;
  clientIdent?: number;
  clientName?: string;
  securityGroupId?: string;
  securityGroupName?: string;
  isActive?: boolean;
  createdOn: string;
  modifiedOn?: string;
}

export interface SharePointLibraryDto {
  id: string;
  name: string;
  description?: string;
  webUrl?: string;
}

export interface SharePointItemDto {
  id: string;
  name: string;
  isFolder: boolean;
  size: number;
  mimeType?: string;
  lastModifiedDateTime?: string;
  webUrl?: string;
  path?: string;
  childCount?: number;
}

export interface UserConnectSiteRequest {
  siteUrl?: string;
  siteName?: string;
  hostName?: string;
}

export interface UserConnectSiteResultDto {
  siteTitle: string;
  siteSlug: string;
  hostName: string;
  libraries: SharePointLibraryDto[];
}

export interface MeDrivesDiscoveryEntryDto {
  index: number;
  name?: string;
  id?: string;
  webUrl?: string;
  driveType?: string;
  passesDocumentLibraryFilter: boolean;
  strictSiteAndHostMatch: boolean;
  siteSlugPathMatch: boolean;
  matchResult: string;
  siteName: string;
}

export interface MeDrivesDiscoveryReportDto {
  requestSiteUrl?: string;
  requestSiteName?: string;
  requestHostName?: string;
  resolvedSiteSlug: string;
  resolvedHostName: string;
  strictPathMarker: string;
  filteringSummary: string;
  totalDriveCount: number;
  documentLibraryCandidateCount: number;
  strictMatchCount: number;
  siteSlugOnlyMatchCount: number;
  rawMeDrivesResponsePages: string[];
  drives: MeDrivesDiscoveryEntryDto[];
}

export interface UserBrowseRequest {
  driveId: string;
  folderPath?: string;
}

export interface UserFileRequest {
  driveId: string;
  filePath: string;
}

export const PROCESS_TYPE_SHAREPOINT_WORKSPACE = 6;

export interface ProcessConfigSharePointSelection {
  sharePointApplicationId: string;
  sharePointApplicationSiteId: string;
  sharePointLibraryName: string;
  sharePointFolderPath: string;
}

export interface WorkspaceConnection {
  applicationId?: string | null;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
  consumerClientId?: string;
  consumerSecret?: string;
  hostName?: string;
  siteName?: string;
  libraryName?: string;
}

export type FileKind =
  | 'video' | 'audio' | 'pdf' | 'word' | 'excel' | 'csv'
  | 'powerpoint' | 'text' | 'image' | 'folder' | 'unknown';

export type RichPreviewMode = 'pdf' | 'docx' | 'excel' | 'csv' | 'pptx';

export interface ApplicationCatalog {
  types: ApplicationTypeDto[];
  applications: ApplicationDto[];
}

export interface SiteConnectivityCheckRequest {
  siteName: string;
  hostName?: string;
  internalApplicationId?: string;
  tenantId?: string;
  clientId?: string;
  clientSecret?: string;
}

export interface WorkspaceDirectoryUserDto {
  id?: string;
  displayName?: string;
  givenName?: string;
  surname?: string;
  userPrincipalName?: string;
  mail?: string;
  jobTitle?: string | null;
  department?: string | null;
  officeLocation?: string | null;
  mobilePhone?: string | null;
  companyName?: string | null;
}

export interface WorkspaceDirectoryUserSearchResultDto {
  users: WorkspaceDirectoryUserDto[];
  count: number;
}

export interface TokenResponse {
  accessToken: string;
  tokenType: string;
  expiresInSeconds: number;
}

// --- SharePoint connector environment ---

export interface SharepointEnvironment {
  production: boolean;
  apiBaseUrl: string;
  apiVersion: string;
  ownerKey: string;
  defaultLibraryName: string;
  tenantName: string;
  clientId: string;
  authority: string;
  hostName: string;
  siteName: string;
  libraryName: string;
  userGraphScopes: string[];
}

export type SharepointUserConfig = Pick<
  SharepointEnvironment,
  'tenantName' | 'clientId' | 'authority' | 'hostName' | 'siteName' | 'libraryName' | 'userGraphScopes'
>;

export const SHAREPOINT_ENV = new InjectionToken<SharepointEnvironment>('SHAREPOINT_ENV');

export function provideSharepoint(config: SharepointEnvironment = environment): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: SHAREPOINT_ENV, useValue: config }]);
}
