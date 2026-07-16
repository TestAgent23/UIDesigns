import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of, timeout } from 'rxjs';
import { SP_API } from '../core/workspace-connect.messages';
import type { SharePointTenantHierarchyFilter } from '../core/workspace-connect.tenant';
import { ApiEnvelope, ApplicationCatalog, ApplicationDto, ApplicationTypeDto, ExternalSiteConnectivityResultDto, SHAREPOINT_ENV, SharePointItemDto, SharePointLibraryDto, SiteConnectivityCheckRequest, TokenResponse, WorkspaceConnection, WorkspaceDirectoryUserSearchResultDto } from '../core/workspace-connect.types';
import { encodePath64, FALLBACK_APPLICATION_TYPES, filterRegisterableApplicationTypes, filterRegisteredApplications, unwrapApiEnvelope, unwrapSiteConnectivityEnvelope } from '../core/workspace-connect.utils';

@Injectable({ providedIn: 'root' })
export class SharePointApiService {
  private readonly env = inject(SHAREPOINT_ENV);
  private readonly http = inject(HttpClient);
  private readonly baseUrl = this.env.apiBaseUrl.replace(/\/$/, '');

  static encodePath64 = encodePath64;

  private get headers(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }

  listApplicationTypes(): Observable<ApplicationTypeDto[]> {
    return this.http
      .get<ApiEnvelope<ApplicationTypeDto[]>>(`${this.baseUrl}/applications/types`)
      .pipe(
        timeout(20000),
        map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)),
      );
  }

  listApplications(options?: { typeCode?: string; includeInactive?: boolean } & SharePointTenantHierarchyFilter): Observable<ApplicationDto[]> {
    const params = new URLSearchParams();
    if (options?.typeCode) params.set('typeCode', options.typeCode);
    if (options?.includeInactive) params.set('includeInactive', 'true');
    if (options?.regionIdent) params.set('regionIdent', String(options.regionIdent));
    if (options?.subRegionCode) params.set('subRegionCode', options.subRegionCode);
    if (options?.clientIdent) params.set('clientIdent', String(options.clientIdent));
    if (options?.securityGroupId) params.set('securityGroupId', options.securityGroupId);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.http
      .get<ApiEnvelope<ApplicationDto[]>>(`${this.baseUrl}/applications${qs}`)
      .pipe(
        timeout(20000),
        map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)),
      );
  }

  loadApplicationCatalog(filter?: SharePointTenantHierarchyFilter & { includeInactive?: boolean }): Observable<ApplicationCatalog> {
    return forkJoin({
      types: this.listApplicationTypes().pipe(
        map(filterRegisterableApplicationTypes),
        catchError(() => of(FALLBACK_APPLICATION_TYPES)),
      ),
      applications: this.listApplications(filter).pipe(map(filterRegisteredApplications)),
    });
  }

  saveApplication(payload: Partial<ApplicationDto>): Observable<ApplicationDto> {
    return this.http
      .post<ApiEnvelope<ApplicationDto>>(`${this.baseUrl}/applications`, payload, { headers: this.headers })
      .pipe(map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)));
  }

  validateSiteConnectivity(request: SiteConnectivityCheckRequest): Observable<ExternalSiteConnectivityResultDto> {
    return this.http
      .post<ApiEnvelope<ExternalSiteConnectivityResultDto>>(
        `${this.baseUrl}/applications/validate-external-site`,
        {
          siteName: request.siteName,
          hostName: request.hostName?.trim() || undefined,
          internalApplicationId: request.internalApplicationId || undefined,
          tenantId: request.tenantId?.trim() || undefined,
          clientId: request.clientId?.trim() || undefined,
          clientSecret: request.clientSecret?.trim() || undefined,
        },
        { headers: this.headers },
      )
      .pipe(map((res) => unwrapSiteConnectivityEnvelope(res, SP_API.siteConnectivityCheckFailed)));
  }

  recordApplicationUsage(
    applicationId: string,
    payload: { displayName?: string; usedByUpn?: string; usedByDisplayName?: string } = {},
  ): Observable<void> {
    return this.http
      .post<ApiEnvelope<unknown>>(`${this.baseUrl}/applications/${applicationId}/use`, payload, { headers: this.headers })
      .pipe(map(() => undefined));
  }

  deleteApplication(applicationId: string): Observable<void> {
    return this.http
      .delete<ApiEnvelope<unknown>>(`${this.baseUrl}/applications/${applicationId}`)
      .pipe(map(() => undefined));
  }

  searchWorkspaceUsers(term: string, searchType = 'string'): Observable<WorkspaceDirectoryUserSearchResultDto> {
    return this.http
      .post<ApiEnvelope<WorkspaceDirectoryUserSearchResultDto>>(
        `${this.baseUrl}/workspace/user/search-users`,
        { term: term.trim(), searchType },
        { headers: this.headers },
      )
      .pipe(map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)));
  }

  listLibraries(connection: WorkspaceConnection): Observable<SharePointLibraryDto[]> {
    return this.http
      .post<ApiEnvelope<SharePointLibraryDto[]>>(`${this.baseUrl}/applications/libraries`, connection, { headers: this.headers })
      .pipe(map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)));
  }

  browseFolder(connection: WorkspaceConnection, folderPath?: string): Observable<SharePointItemDto[]> {
    return this.http
      .post<ApiEnvelope<SharePointItemDto[]>>(`${this.baseUrl}/workspace/browse`, { credentials: connection, folderPath }, { headers: this.headers })
      .pipe(map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)));
  }

  fetchFileBlob(connection: WorkspaceConnection, filePath: string): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/workspace/fetchfile`, { credentials: connection, filePath }, {
      headers: this.headers,
      responseType: 'blob',
    });
  }

  resolveStreamingUrl(connection: WorkspaceConnection, filePath: string): Observable<string> {
    const appId = connection.applicationId?.trim();
    const apiSecret = connection.consumerSecret?.trim();
    if (appId && apiSecret) {
      return this.generateToken(appId, apiSecret).pipe(
        map((t) => `${this.baseUrl}/workspace/file?${this.workspaceFileQueryParams(filePath, t.accessToken, connection)}`),
      );
    }
    return of(this.buildStreamingUrl(connection, filePath));
  }

  buildStreamingUrl(connection: WorkspaceConnection, filePath: string): string {
    const params = new URLSearchParams();
    params.set('path64', encodePath64(filePath));
    params.set('apiVersion', this.env.apiVersion);
    if (connection.applicationId) {
      params.set('applicationId', connection.applicationId);
      if (connection.libraryName) params.set('libraryName', connection.libraryName);
      if (connection.siteName) params.set('siteName', connection.siteName);
    } else {
      if (connection.tenantId) params.set('tenantId', connection.tenantId);
      if (connection.clientId) params.set('clientId', connection.clientId);
      if (connection.clientSecret) params.set('clientSecret', connection.clientSecret);
      if (connection.hostName) params.set('hostName', connection.hostName);
      if (connection.siteName) params.set('siteName', connection.siteName);
      if (connection.libraryName) params.set('libraryName', connection.libraryName);
    }
    return `${this.baseUrl}/workspace/fetchfile?${params.toString()}`;
  }

  generateToken(applicationId: string, apiSecret: string): Observable<TokenResponse> {
    const headers = new HttpHeaders({
      'x-tpdi-api-version': this.env.apiVersion,
      'x-application-id': applicationId,
      'x-client-secret': apiSecret,
    });
    return this.http
      .post<ApiEnvelope<TokenResponse>>(`${this.baseUrl}/auth/token`, null, { headers })
      .pipe(map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)));
  }

  browseFolderByToken(token: string, folderPath = ''): Observable<SharePointItemDto[]> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'x-tpdi-api-version': this.env.apiVersion,
    });
    const qs = folderPath ? `?path=${encodeURIComponent(folderPath)}` : '';
    return this.http
      .get<ApiEnvelope<SharePointItemDto[]>>(`${this.baseUrl}/workspace/browse${qs}`, { headers })
      .pipe(map((res) => unwrapApiEnvelope(res, SP_API.requestFailed)));
  }

  fetchFileByToken(token: string, filePath: string, connection?: WorkspaceConnection): Observable<Blob> {
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'x-tpdi-api-version': this.env.apiVersion,
      'Content-Type': 'application/json',
      ...(connection?.libraryName?.trim() ? { 'x-library-name': connection.libraryName.trim() } : {}),
      ...(connection?.siteName?.trim() ? { 'x-site-name': connection.siteName.trim() } : {}),
    });
    return this.http.post(`${this.baseUrl}/workspace/file`, { filePath }, {
      headers,
      responseType: 'blob',
    });
  }

  buildStreamingUrlByToken(token: string, filePath: string, connection?: WorkspaceConnection): string {
    return `${this.baseUrl}/workspace/file?${this.workspaceFileQueryParams(filePath, token, connection)}`;
  }

  private workspaceFileQueryParams(filePath: string, accessToken: string, connection?: WorkspaceConnection): string {
    const params = new URLSearchParams({
      path64: encodePath64(filePath),
      access_token: accessToken,
      apiVersion: this.env.apiVersion,
    });
    if (connection?.libraryName?.trim()) params.set('libraryName', connection.libraryName.trim());
    if (connection?.siteName?.trim()) params.set('siteName', connection.siteName.trim());
    return params.toString();
  }
}
