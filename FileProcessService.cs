// #region SharePoint Workspace - AY
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { environment } from '../../environments/environment';
import { APIResponse } from '../../shared/models/apiResponse';
import { DataSourceType } from '../../shared/enum';
import { SHAREPOINT_PROCESS_TYPE_ID } from '../integration/configuration-first.sharepoint';

interface SharePointProcessFileLocation {
  uploadedId: string;
  fileUrl: string;
  fileSize: number;
}

interface SharePointFlpProcessConfig {
  flpConfigurationId: string;
  processName: string;
  fileProcessingServerTypeId?: number | null;
  sharePointFiles?: SharePointProcessFileLocation[] | null;
}

const EXCEL_EXT = new Set(['.xlsx', '.xls', '.xlsb']);

function spImportEndpoint(fileUrl?: string | null): string | null {
  const ext = fileUrl?.slice(fileUrl.lastIndexOf('.')).toLowerCase();
  if (ext === '.csv') return 'ProcessCsvFile';
  if (ext === '.txt') return 'ProcessTxtFile';
  if (ext && EXCEL_EXT.has(ext)) return 'ProcessExcelFile';
  return null;
}

function spProcessApiVersion(serverTypeId?: number | null): string {
  return serverTypeId === DataSourceType.DataBricks ? '4.0' : '3.0';
}

@Injectable({ providedIn: 'root' })
export class SharePointConfigurationFirstRuntimeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiEndpoint.replace(/\/$/, '') + '/';

  runDueSharePointProcesses(): Observable<void> {
    return this.http
      .post<APIResponse<SharePointFlpProcessConfig[] | null>>(
        `${this.baseUrl}api/Import/GetProcessList`,
        { processTypeId: SHAREPOINT_PROCESS_TYPE_ID },
        { headers: this.headers('1.0') },
      )
      .pipe(
        switchMap((r) => {
          const tasks: Observable<unknown>[] = [];
          for (const cfg of r?.result ?? []) {
            for (const file of cfg.sharePointFiles ?? []) {
              const endpoint = spImportEndpoint(file.fileUrl);
              if (!endpoint) continue;
              tasks.push(
                this.http
                  .post(
                    `${this.baseUrl}api/Import/${endpoint}`,
                    {
                      flpConfigurationId: cfg.flpConfigurationId,
                      processName: cfg.processName,
                      sharePointFileLocation: file,
                    },
                    { headers: this.headers(spProcessApiVersion(cfg.fileProcessingServerTypeId)) },
                  )
                  .pipe(catchError(() => of(null))),
              );
            }
          }
          return tasks.length ? forkJoin(tasks) : of([]);
        }),
        map(() => void 0),
        catchError(() => of(void 0)),
      );
  }

  private headers(apiVersion: string): HttpHeaders {
    let h = new HttpHeaders({
      'Content-Type': 'application/json; charset=utf-8',
      'x-tpdi-api-version': apiVersion,
    });
    const token = localStorage.getItem('DIApiToken');
    const sg = sessionStorage.getItem('GUID');
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    if (sg) h = h.set('x-tpdi-api-sg', sg);
    return h;
  }
}
// #endregion
