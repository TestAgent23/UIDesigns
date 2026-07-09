import { inject, Injectable } from '@angular/core';
import { debounceTime, Observable, of, Subject, switchMap } from 'rxjs';
import { DataSliceService } from '../../core/services/dataslice.service';
import { GraphApiTokenService } from '../../core/services/graph-api-token.service';
import { ProcessConfigService } from '../../core/services/process-config.service';
import { SharePointHierarchyOption } from '../core/workspace-connect.tenant';

@Injectable({ providedIn: 'root' })
export class SharePointTenantHierarchyService {
  private readonly dsService = inject(DataSliceService);
  private readonly graphToken = inject(GraphApiTokenService);
  private readonly processService = inject(ProcessConfigService);
  private readonly securityGroupSearch$ = new Subject<string>();

  constructor() {
    this.securityGroupSearch$
      .pipe(
        debounceTime(300),
        switchMap((term) => {
          if (term.trim().length < 5) return of([] as SharePointHierarchyOption[]);
          return this.graphToken.getAccessToken(['Group.Read.All']).pipe(
            switchMap((token) => this.processService.fetchSecurityGroups(term.trim(), token)),
            switchMap((response) => {
              const options = (response?.value ?? [])
                .slice(0, 10)
                .map((group: { id: string; displayName: string }) => ({
                  id: group.id,
                  name: group.displayName,
                }));
              return of(options);
            }),
          );
        }),
      )
      .subscribe();
  }

  loadRegions(): Observable<SharePointHierarchyOption[]> {
    return new Observable((subscriber) => {
      this.dsService.getRegion2().subscribe({
        next: (response) => {
          if (response?.responseMessage?.[0] === 'Success') {
            subscriber.next(
              (response.result ?? []).map((r) => ({
                id: String(r.region_ident),
                name: r.region,
              })),
            );
          } else {
            subscriber.next([]);
          }
          subscriber.complete();
        },
        error: () => {
          subscriber.next([]);
          subscriber.complete();
        },
      });
    });
  }

  loadSubRegions(regionId: string): Observable<SharePointHierarchyOption[]> {
    if (!regionId) return of([]);
    return new Observable((subscriber) => {
      this.dsService.getSubRegions(regionId).subscribe({
        next: (response) => {
          if (response?.responseMessage?.[0] === 'Success') {
            subscriber.next(
              (response.result ?? []).map((r) => ({
                id: r.subsubregion_code,
                name: r.subsubregion,
              })),
            );
          } else {
            subscriber.next([]);
          }
          subscriber.complete();
        },
        error: () => {
          subscriber.next([]);
          subscriber.complete();
        },
      });
    });
  }

  loadClients(regionId: string, subRegionCode: string): Observable<SharePointHierarchyOption[]> {
    if (!regionId) return of([]);
    const subRegion = subRegionCode?.trim() || 'ALL';
    return new Observable((subscriber) => {
      this.dsService.getClients(regionId, subRegion).subscribe({
        next: (response) => {
          if (response?.responseMessage?.[0] === 'Success') {
            subscriber.next(
              (response.result ?? []).map((r) => ({
                id: String(r.client_ident),
                name: r.client_full_name,
              })),
            );
          } else {
            subscriber.next([]);
          }
          subscriber.complete();
        },
        error: () => {
          subscriber.next([]);
          subscriber.complete();
        },
      });
    });
  }

  searchSecurityGroups(term: string): Observable<SharePointHierarchyOption[]> {
    if (term.trim().length < 5) return of([]);
    return this.graphToken.getAccessToken(['Group.Read.All']).pipe(
      switchMap((token) => this.processService.fetchSecurityGroups(term.trim(), token)),
      switchMap((response) => of(
        (response?.value ?? [])
          .slice(0, 10)
          .map((group: { id: string; displayName: string }) => ({
            id: group.id,
            name: group.displayName,
          })),
      )),
    );
  }
}
