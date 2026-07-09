import { Injectable } from '@angular/core';
import { Resolve } from '@angular/router';
import { SchedulerType, StorageAccount } from '../models/fileProcessConfig';
import { forkJoin, Observable, of, tap } from 'rxjs';

import { ProcessConfigService } from '../services/process-config.service';
import { HttpClient } from '@angular/common/http';
import { ConfigurationService } from '../services/configuration.service';

interface OfflineLookups {
  storageAccounts: StorageAccount[];
  dateTimeFormats: any[];
  fileExtensions: any[];
  dataSliceConfig: any;
  processTypes: any;
  serverDetails: any;
  weekDays: any;
  schedulerTypes: SchedulerType[];
}

@Injectable({
  providedIn: 'root',
})
export class OfflineModuleResolver implements Resolve<OfflineLookups> {
  private readonly lookupsCacheKey = 'offline-lookups-cache';
  private readonly lookupsCacheTokenKey = 'offline-lookups-cache-token';

  constructor(
    private http: HttpClient,
    private processService: ProcessConfigService,
    private configService: ConfigurationService
  ) { }

  resolve(): Observable<OfflineLookups> {
    const currentToken = localStorage.getItem('DIApiToken') ?? '';
    const cachedToken = sessionStorage.getItem(this.lookupsCacheTokenKey) ?? '';
    const cachedLookups = sessionStorage.getItem(this.lookupsCacheKey);

    if (cachedLookups && cachedToken === currentToken) {
      return of(JSON.parse(cachedLookups) as OfflineLookups);
    }

    return forkJoin({
      storageAccounts: this.processService.getStorageAccountDetails$(),
      dateTimeFormats: this.configService.getAllDataTimeFormats$(),
      fileExtensions: this.configService.getFileExtensionNames$(),
      dataSliceConfig: this.processService.getDataSliceConfiguration$(1),
      processTypes: this.processService.getProcessType$(),
      serverDetails: this.processService.getServerDetails$(),
      weekDays: this.processService.getWeekDayName$(),
      schedulerTypes : this.processService.getSchedulerTypes$()
    }).pipe(
      tap((lookups) => {
        sessionStorage.setItem(this.lookupsCacheKey, JSON.stringify(lookups));
        sessionStorage.setItem(this.lookupsCacheTokenKey, currentToken);
      })
    );
  }
}


