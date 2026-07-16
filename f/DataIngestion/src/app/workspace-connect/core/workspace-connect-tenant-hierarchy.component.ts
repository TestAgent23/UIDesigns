import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, EventEmitter, inject, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgSelectModule } from '@ng-select/ng-select';
import { SharePointTenantHierarchyService } from '../services/sharepoint-tenant-hierarchy.service';
import { SP_TENANT_HIERARCHY } from './workspace-connect.messages';
import {
  emptyTenantHierarchySelection,
  SharePointHierarchyOption,
  SharePointTenantHierarchySelection,
  SP_ALL_CLIENT_NAME,
  SP_ALL_SECURITY_GROUP_ID,
  SP_ALL_SECURITY_GROUP_NAME,
  SP_ALL_SUBREGION_NAME,
  tenantHierarchySelectionValid,
} from './workspace-connect.tenant';
import { WorkspaceConnectIconComponent } from './workspace-connect.ui';

@Component({
  selector: 'sp-tenant-hierarchy',
  standalone: true,
  imports: [CommonModule, FormsModule, NgSelectModule, WorkspaceConnectIconComponent],
  templateUrl: './workspace-connect-tenant-hierarchy.component.html',
  styleUrls: ['./workspace-connect-tenant-hierarchy.component.css'],
})
export class WorkspaceConnectTenantHierarchyComponent implements OnInit, OnChanges {
  private readonly hierarchyService = inject(SharePointTenantHierarchyService);
  private readonly cdr = inject(ChangeDetectorRef);
  readonly m = SP_TENANT_HIERARCHY;

  @Input() selection: SharePointTenantHierarchySelection = emptyTenantHierarchySelection();
  @Input() compact = false;
  @Input() filterToolbar = false;
  @Input() showLegend = true;
  @Input() collapsible = false;
  @Input() open = true;
  @Output() selectionChange = new EventEmitter<SharePointTenantHierarchySelection>();
  @Output() openChange = new EventEmitter<boolean>();

  readonly accessBodyId = 'sp-access-body-' + Math.random().toString(36).slice(2, 9);

  get configured(): boolean {
    return tenantHierarchySelectionValid(this.selection);
  }

  toggleOpen(): void {
    this.open = !this.open;
    this.openChange.emit(this.open);
  }

  subRegions: SharePointHierarchyOption[] = [];
  clients: SharePointHierarchyOption[] = [];
  securityGroups: SharePointHierarchyOption[] = [];
  regionLoading = false;
  subRegionLoading = false;
  clientLoading = false;
  securityGroupLoading = false;
  securityGroupSearchTerm = '';
  selectedSecurityGroups: SharePointHierarchyOption[] = [];
  regions: SharePointHierarchyOption[] = [];
  selectedRegionId: string | null = null;
  selectedSubRegionCode: string | null = null;
  selectedClientId: string | null = null;

  ngOnInit(): void {
    this.syncSelectorsFromSelection();
    this.syncSecurityGroupsFromSelection();
    this.loadRegions();
    if (this.selection.regionIdent) {
      this.loadSubRegions(String(this.selection.regionIdent));
      this.loadClients(String(this.selection.regionIdent), this.selection.subRegionCode);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selection']) {
      this.syncSelectorsFromSelection();
      this.syncSecurityGroupsFromSelection();
      if (this.selection.regionIdent) {
        this.loadSubRegions(String(this.selection.regionIdent));
        this.loadClients(String(this.selection.regionIdent), this.selection.subRegionCode);
      }
    }
  }

  onRegionChange(regionId: string | null): void {
    const region = this.regions.find((r) => r.id === regionId);
    this.selectedRegionId = regionId;
    this.selectedSubRegionCode = null;
    this.selectedClientId = null;
    this.selection = {
      ...this.selection,
      regionIdent: region ? Number(region.id) : null,
      regionName: region?.name ?? '',
      subRegionCode: '',
      subRegionName: SP_ALL_SUBREGION_NAME,
      clientIdent: null,
      clientName: SP_ALL_CLIENT_NAME,
    };
    this.subRegions = [];
    this.clients = [];
    if (region) {
      this.loadSubRegions(region.id);
      this.loadClients(region.id, '');
    }
    this.emitChange();
  }

  onSubRegionChange(subRegionCode: string | null): void {
    this.selectedSubRegionCode = subRegionCode;
    this.selectedClientId = null;
    if (!subRegionCode) {
      this.selection = {
        ...this.selection,
        subRegionCode: '',
        subRegionName: SP_ALL_SUBREGION_NAME,
        clientIdent: null,
        clientName: SP_ALL_CLIENT_NAME,
      };
    } else {
      const subRegion = this.subRegions.find((r) => r.id === subRegionCode);
      this.selection = {
        ...this.selection,
        subRegionCode: subRegion?.id ?? '',
        subRegionName: subRegion?.name ?? SP_ALL_SUBREGION_NAME,
        clientIdent: null,
        clientName: SP_ALL_CLIENT_NAME,
      };
    }
    this.clients = [];
    if (this.selection.regionIdent) {
      this.loadClients(String(this.selection.regionIdent), this.selection.subRegionCode);
    }
    this.emitChange();
  }

  onClientChange(clientId: string | null): void {
    this.selectedClientId = clientId;
    if (!clientId) {
      this.selection = {
        ...this.selection,
        clientIdent: null,
        clientName: SP_ALL_CLIENT_NAME,
      };
    } else {
      const client = this.clients.find((c) => c.id === clientId);
      this.selection = {
        ...this.selection,
        clientIdent: client ? Number(client.id) : null,
        clientName: client?.name ?? SP_ALL_CLIENT_NAME,
      };
    }
    this.emitChange();
  }

  onSecurityGroupSearch(term: string): void {
    this.securityGroupSearchTerm = term;
    if (term.trim().length < 5) {
      this.securityGroups = [];
      this.cdr.markForCheck();
      return;
    }
    this.securityGroupLoading = true;
    this.hierarchyService.searchSecurityGroups(term).subscribe({
      next: (groups) => {
        this.securityGroups = groups;
        this.securityGroupLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.securityGroups = [];
        this.securityGroupLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  selectSecurityGroup(group: SharePointHierarchyOption): void {
    if (this.selectedSecurityGroups.some((x) => x.id === group.id)) {
      this.securityGroupSearchTerm = '';
      this.securityGroups = [];
      this.cdr.markForCheck();
      return;
    }

    this.selectedSecurityGroups = [...this.selectedSecurityGroups, group];
    const primary = this.selectedSecurityGroups[0] ?? null;
    this.selection = {
      ...this.selection,
      securityGroupId: primary?.id ?? null,
      securityGroupName: primary?.name ?? SP_ALL_SECURITY_GROUP_NAME,
      securityGroups: this.selectedSecurityGroups.map((x) => ({ id: x.id, name: x.name })),
    };
    this.securityGroupSearchTerm = '';
    this.securityGroups = [];
    this.emitChange();
  }

  removeSecurityGroup(groupId: string): void {
    this.selectedSecurityGroups = this.selectedSecurityGroups.filter((x) => x.id !== groupId);
    const primary = this.selectedSecurityGroups[0] ?? null;
    this.selection = {
      ...this.selection,
      securityGroupId: primary?.id ?? null,
      securityGroupName: primary?.name ?? SP_ALL_SECURITY_GROUP_NAME,
      securityGroups: this.selectedSecurityGroups.map((x) => ({ id: x.id, name: x.name })),
    };
    this.emitChange();
  }

  clearSecurityGroup(): void {
    this.selectedSecurityGroups = [];
    this.selection = {
      ...this.selection,
      securityGroupId: null,
      securityGroupName: SP_ALL_SECURITY_GROUP_NAME,
      securityGroups: [],
    };
    this.securityGroupSearchTerm = '';
    this.emitChange();
  }

  get hasSelectedSecurityGroups(): boolean {
    return this.selectedSecurityGroups.length > 0;
  }

  get availableSecurityGroups(): SharePointHierarchyOption[] {
    if (!this.securityGroups.length) return [];
    const selectedIds = new Set(this.selectedSecurityGroups.map((x) => x.id));
    return this.securityGroups.filter((x) => !selectedIds.has(x.id));
  }

  private syncSelectorsFromSelection(): void {
    this.selectedRegionId = this.selection.regionIdent != null ? String(this.selection.regionIdent) : null;
    this.selectedSubRegionCode = this.selection.subRegionCode || null;
    this.selectedClientId = this.selection.clientIdent ? String(this.selection.clientIdent) : null;
  }

  private syncSecurityGroupsFromSelection(): void {
    const groups = this.selection.securityGroups ?? [];
    if (groups.length) {
      this.selectedSecurityGroups = groups.map((x) => ({ id: x.id, name: x.name }));
      return;
    }

    if (this.selection.securityGroupId && this.selection.securityGroupId !== SP_ALL_SECURITY_GROUP_ID) {
      this.selectedSecurityGroups = [{
        id: this.selection.securityGroupId,
        name: this.selection.securityGroupName || this.selection.securityGroupId,
      }];
      return;
    }

    this.selectedSecurityGroups = [];
  }

  private loadRegions(): void {
    this.regionLoading = true;
    this.hierarchyService.loadRegions().subscribe({
      next: (regions) => {
        this.regions = regions;
        this.regionLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.regions = [];
        this.regionLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadSubRegions(regionId: string): void {
    this.subRegionLoading = true;
    this.hierarchyService.loadSubRegions(regionId).subscribe({
      next: (subRegions) => {
        this.subRegions = subRegions;
        this.subRegionLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.subRegions = [];
        this.subRegionLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private loadClients(regionId: string, subRegionCode: string): void {
    this.clientLoading = true;
    this.hierarchyService.loadClients(regionId, subRegionCode).subscribe({
      next: (clients) => {
        this.clients = clients;
        this.clientLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.clients = [];
        this.clientLoading = false;
        this.cdr.markForCheck();
      },
    });
  }

  private emitChange(): void {
    this.selectionChange.emit({ ...this.selection });
    this.cdr.markForCheck();
  }
}
