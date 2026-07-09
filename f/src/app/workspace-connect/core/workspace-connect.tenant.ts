export const SP_ALL_SUBREGION_CODE = 'ALL';
export const SP_ALL_SUBREGION_NAME = 'All';
export const SP_ALL_CLIENT_IDENT = 0;
export const SP_ALL_CLIENT_NAME = 'All';
export const SP_ALL_SECURITY_GROUP_ID = '00000000-0000-0000-0000-000000000000';
export const SP_ALL_SECURITY_GROUP_NAME = 'All';
export const SP_TENANT_SCOPE_KEY = 'sp_tenant_scope';

export interface SharePointTenantScope {
  regionIdent: number;
  regionName: string;
  subRegionCode: string;
  subRegionName: string;
  clientIdent: number;
  clientName: string;
  securityGroupId: string;
  securityGroupName: string;
}

export interface SharePointTenantHierarchySelection {
  regionIdent: number | null;
  regionName: string;
  subRegionCode: string;
  subRegionName: string;
  clientIdent: number | null;
  clientName: string;
  securityGroupId: string | null;
  securityGroupName: string;
}

export interface SharePointTenantHierarchyFilter {
  regionIdent?: number;
  subRegionCode?: string;
  clientIdent?: number;
  securityGroupId?: string;
}

export interface SharePointHierarchyOption {
  id: string;
  name: string;
}

export function emptyTenantHierarchySelection(): SharePointTenantHierarchySelection {
  return {
    regionIdent: null,
    regionName: '',
    subRegionCode: '',
    subRegionName: SP_ALL_SUBREGION_NAME,
    clientIdent: null,
    clientName: SP_ALL_CLIENT_NAME,
    securityGroupId: null,
    securityGroupName: SP_ALL_SECURITY_GROUP_NAME,
  };
}

export function tenantHierarchySelectionFromDto(app: {
  regionIdent?: number;
  regionName?: string;
  subRegionCode?: string;
  subRegionName?: string;
  clientIdent?: number;
  clientName?: string;
  securityGroupId?: string;
  securityGroupName?: string;
}): SharePointTenantHierarchySelection {
  return {
    regionIdent: app.regionIdent ?? null,
    regionName: app.regionName ?? '',
    subRegionCode: app.subRegionCode && app.subRegionCode !== SP_ALL_SUBREGION_CODE ? app.subRegionCode : '',
    subRegionName: app.subRegionName ?? SP_ALL_SUBREGION_NAME,
    clientIdent: app.clientIdent && app.clientIdent !== SP_ALL_CLIENT_IDENT ? app.clientIdent : null,
    clientName: app.clientName ?? SP_ALL_CLIENT_NAME,
    securityGroupId: app.securityGroupId && app.securityGroupId !== SP_ALL_SECURITY_GROUP_ID ? app.securityGroupId : null,
    securityGroupName: app.securityGroupName ?? SP_ALL_SECURITY_GROUP_NAME,
  };
}

export function normalizeTenantHierarchyForSave(
  selection: SharePointTenantHierarchySelection,
): Required<Pick<SharePointTenantHierarchySelection, 'regionIdent' | 'regionName' | 'subRegionCode' | 'subRegionName' | 'clientIdent' | 'clientName' | 'securityGroupId' | 'securityGroupName'>> {
  const subRegionCode = selection.subRegionCode?.trim() || SP_ALL_SUBREGION_CODE;
  const subRegionName = selection.subRegionName?.trim() || SP_ALL_SUBREGION_NAME;
  const clientIdent = selection.clientIdent && selection.clientIdent > 0 ? selection.clientIdent : SP_ALL_CLIENT_IDENT;
  const clientName = selection.clientName?.trim() || SP_ALL_CLIENT_NAME;
  const securityGroupId = selection.securityGroupId?.trim() || SP_ALL_SECURITY_GROUP_ID;
  const securityGroupName = selection.securityGroupName?.trim() || SP_ALL_SECURITY_GROUP_NAME;
  return {
    regionIdent: selection.regionIdent!,
    regionName: selection.regionName.trim(),
    subRegionCode,
    subRegionName: subRegionCode === SP_ALL_SUBREGION_CODE ? SP_ALL_SUBREGION_NAME : subRegionName,
    clientIdent,
    clientName: clientIdent === SP_ALL_CLIENT_IDENT ? SP_ALL_CLIENT_NAME : clientName,
    securityGroupId,
    securityGroupName: securityGroupId === SP_ALL_SECURITY_GROUP_ID ? SP_ALL_SECURITY_GROUP_NAME : securityGroupName,
  };
}

export function tenantHierarchySelectionValid(selection: SharePointTenantHierarchySelection): boolean {
  return selection.regionIdent != null && selection.regionIdent > 0 && !!selection.regionName.trim();
}

export function tenantScopeFromSelection(selection: SharePointTenantHierarchySelection): SharePointTenantScope | null {
  if (!tenantHierarchySelectionValid(selection)) return null;
  const normalized = normalizeTenantHierarchyForSave(selection);
  return {
    regionIdent: normalized.regionIdent,
    regionName: normalized.regionName,
    subRegionCode: normalized.subRegionCode,
    subRegionName: normalized.subRegionName,
    clientIdent: normalized.clientIdent,
    clientName: normalized.clientName,
    securityGroupId: normalized.securityGroupId,
    securityGroupName: normalized.securityGroupName,
  };
}

export function tenantFilterFromScope(scope: SharePointTenantScope | null): SharePointTenantHierarchyFilter | undefined {
  if (!scope?.regionIdent) return undefined;
  return {
    regionIdent: scope.regionIdent,
    subRegionCode: scope.subRegionCode !== SP_ALL_SUBREGION_CODE ? scope.subRegionCode : undefined,
    clientIdent: scope.clientIdent !== SP_ALL_CLIENT_IDENT ? scope.clientIdent : undefined,
    securityGroupId: scope.securityGroupId !== SP_ALL_SECURITY_GROUP_ID ? scope.securityGroupId : undefined,
  };
}

export interface DiClientInfoAccess {
  RegionId?: number | string | null;
  SubRegionId?: number | string | null;
  ClientId?: number | string | null;
  security_group?: Array<{
    id?: string;
    securityGroupId?: string;
    displayName?: string;
    securityGroupName?: string;
  }> | null;
}

/** Maps DI Process Settings (Region / Sub-Region / Client / Security Group) to SharePoint tenant filter. */
export function tenantFilterFromClientInfo(
  clientInfo: DiClientInfoAccess | null | undefined,
): SharePointTenantHierarchyFilter | null {
  if (!clientInfo) return null;

  const regionIdent = Number(clientInfo.RegionId);
  if (!Number.isFinite(regionIdent) || regionIdent <= 0) return null;

  const subRegionRaw = clientInfo.SubRegionId;
  const subRegionCode =
    subRegionRaw != null && String(subRegionRaw).trim() !== '' ? String(subRegionRaw) : undefined;

  const clientIdentNum = Number(clientInfo.ClientId);
  const clientIdent =
    Number.isFinite(clientIdentNum) && clientIdentNum > 0 ? clientIdentNum : undefined;

  const firstGroup = clientInfo.security_group?.[0];
  const securityGroupId = firstGroup?.securityGroupId ?? firstGroup?.id;
  const normalizedSg =
    securityGroupId && securityGroupId !== SP_ALL_SECURITY_GROUP_ID ? securityGroupId : undefined;

  return {
    regionIdent,
    subRegionCode,
    clientIdent,
    securityGroupId: normalizedSg,
  };
}

export function tenantFilterSignature(filter: SharePointTenantHierarchyFilter | null | undefined): string {
  if (!filter) return '';
  return [
    filter.regionIdent ?? '',
    filter.subRegionCode ?? '',
    filter.clientIdent ?? '',
    filter.securityGroupId ?? '',
  ].join('|');
}

export function tenantFiltersEqual(
  a: SharePointTenantHierarchyFilter | null | undefined,
  b: SharePointTenantHierarchyFilter | null | undefined,
): boolean {
  return tenantFilterSignature(a) === tenantFilterSignature(b);
}

export function readTenantScope(): SharePointTenantScope | null {
  try {
    const raw = sessionStorage.getItem(SP_TENANT_SCOPE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SharePointTenantScope;
  } catch {
    return null;
  }
}

export function writeTenantScope(scope: SharePointTenantScope): void {
  sessionStorage.setItem(SP_TENANT_SCOPE_KEY, JSON.stringify(scope));
}

export function clearTenantScope(): void {
  sessionStorage.removeItem(SP_TENANT_SCOPE_KEY);
}

export function resolveTenantFilter(
  explicit?: SharePointTenantHierarchyFilter | null,
): SharePointTenantHierarchyFilter | undefined {
  if (explicit?.regionIdent) return explicit;
  const scoped = tenantFilterFromScope(readTenantScope());
  if (scoped?.regionIdent) return scoped;
  const sessionSg = sessionStorage.getItem('GUID');
  if (sessionSg) return { securityGroupId: sessionSg };
  return undefined;
}
