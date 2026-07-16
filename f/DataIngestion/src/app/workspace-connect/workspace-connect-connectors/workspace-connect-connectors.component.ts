import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ElementRef, EventEmitter, HostBinding, HostListener, NgZone, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgApexchartsModule } from 'ng-apexcharts';
import { SelectDropDownModule, SelectDropDownService } from 'ngx-select-dropdown';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { BusyService } from '../../core/services/busy.service';
import { environment } from '../../environments/environment';
import { WorkspaceConnectTenantHierarchyComponent } from '../core/workspace-connect-tenant-hierarchy.component';
import { MODULE_BRANDING, WC_CONNECTORS, spFileCountLabel, spLibraryCountLabel, spSiteCountLabel } from '../core/workspace-connect.messages';
import { SP_ALL_SECURITY_GROUP_ID, emptyTenantHierarchySelection, normalizeTenantHierarchyForSave, tenantFilterFromScope, tenantHierarchySelectionValid, tenantScopeFromSelection, writeTenantScope, type SharePointTenantHierarchySelection } from '../core/workspace-connect.tenant';
import { ApplicationCatalog, ApplicationDto, ApplicationTypeCode, ApplicationTypeDto, ExternalSiteConnectivityResultDto, SHAREPOINT_ENV, SharePointLibraryDto, SiteConnectivityCheckRequest, WorkspaceDirectoryUserDto } from '../core/workspace-connect.types';
import { SharepointLogoComponent, WorkspaceConnectIconComponent, WorkspaceConnectStatusAlertsComponent, type SpIconName } from '../core/workspace-connect.ui';
import { APPLICATION_TYPE_ID, StatusAlerts, applicationFormFromDto, applicationSiteCount, applicationTypeByCode, applicationTypeById, applicationTypeCodeFromId, applicationTypeDisplayName, awaitApi, buildCurlCommands, registrationTypeOptions as buildRegistrationTypeOptions, curlScriptFilename, delay, downloadCurlScript, emptyApplicationForm, emptyApplicationSite, parseApiError, parseSharePointSiteUrl, partitionRegisteredSites, pickDefaultLibraryName, preferredLibraryNames, type ApplicationFormModel, type ApplicationSiteFormModel } from '../core/workspace-connect.utils';
import { SharePointApiService } from '../services/sharepoint-api.service';

type ConnectivityTestState = 'idle' | 'testing' | 'success' | 'failed';
type SiteTypeCode = 'tp_internal' | 'tp_external' | 'tp_user_delegated';
type ListTypeFilter = 'all' | 'tp_internal' | 'tp_external' | 'draft';

interface ConnectivityGlimpse {
  icon: SpIconName;
  label: string;
  value: string;
}

interface WorkspaceDirectoryUserOption {
  id: string;
  label: string;
  name: string;
  upn: string;
  mail: string;
  avatarSrc: string | null;
}

const CONNECTIVITY_TEST_MIN_DISPLAY_MS = 5000;

@Component({
  selector: 'app-workspace-connect-connectors',
  standalone: true,
  imports: [CommonModule, FormsModule, SelectDropDownModule, NgApexchartsModule, WorkspaceConnectIconComponent, SharepointLogoComponent, WorkspaceConnectStatusAlertsComponent, WorkspaceConnectTenantHierarchyComponent],
  templateUrl: './workspace-connect-connectors.component.html',
  styleUrls: ['./workspace-connect-connectors.component.css', '../workspace-connect.styles.css'],
})
export class WorkspaceConnectConnectorsComponent implements OnInit, OnDestroy {
  private readonly env = inject(SHAREPOINT_ENV);
  private readonly api = inject(SharePointApiService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly ngZone = inject(NgZone);
  private readonly dropdownSvc = inject(SelectDropDownService);
  private readonly busyService = inject(BusyService);
  @ViewChild('accessConfigPanel') private accessConfigPanel?: ElementRef<HTMLElement>;
  @HostBinding('class.sp-host--form') get isFormHost(): boolean { return this.view === 'form'; }
  readonly branding = MODULE_BRANDING;
  readonly m = WC_CONNECTORS;
  readonly status = new StatusAlerts();

  @Output() useApplication = new EventEmitter<ApplicationDto>();
  @Output() navigateHome = new EventEmitter<void>();
  @Output() viewChange = new EventEmitter<{ view: 'list' | 'form'; formTitle?: string }>();

  view: 'list' | 'form' = 'list';
  displayMode: 'cards' | 'table' = 'cards';
  searchTerm = '';
  typeFilter: ListTypeFilter = 'all';
  statusFilter: 'all' | 'active' | 'inactive' = 'all';
  listHierarchySelection: SharePointTenantHierarchySelection = emptyTenantHierarchySelection();
  listHierarchyFilterOpen = false;
  loading = true;
  selectedInternalAppDropdown: { label?: string } | null = null;
  applicationTypes: ApplicationTypeDto[] = [];
  applications: ApplicationDto[] = [];

  get activeCount(): number {
    return this.applications.filter(a => a.isDraft !== true && a.isActive !== false).length;
  }

  get inactiveCount(): number {
    return this.applications.filter(a => a.isDraft !== true && a.isActive === false).length;
  }

  get draftCount(): number {
    return this.applications.filter(a => a.isDraft === true).length;
  }

  get statusActivePct(): number {
    const total = this.applications.length;
    return total ? (this.activeCount / total) * 100 : 0;
  }

  get statusInactivePct(): number {
    const total = this.applications.length;
    return total ? (this.inactiveCount / total) * 100 : 0;
  }

  readonly tenantChartColors = ['#1d4ed8', '#038387', '#dc2626'];
  readonly inactiveChartLabel = WC_CONNECTORS.list.inactiveChartLabel;
  tenantChartCategories: string[] = [];
  tenantChartSeries: { name: string; data: number[] }[] = [];
  tenantChartOptions: Record<string, unknown> = {
    chart: { type: 'bar', height: 168, toolbar: { show: false }, animations: { enabled: true, easing: 'easeinout', speed: 600 } },
    plotOptions: { bar: { borderRadius: 5, columnWidth: '68%' } },
    xaxis: {
      categories: [],
      labels: { style: { colors: '#64748b', fontSize: '11px', fontWeight: 600 } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { style: { colors: '#64748b', fontSize: '11px' } },
      tickAmount: 4,
      min: 0,
      forceNiceScale: true,
    },
    grid: { borderColor: 'rgba(226, 232, 240, 0.6)', strokeDashArray: 4 },
    legend: { position: 'top', horizontalAlign: 'right', fontSize: '11px', fontWeight: 600, markers: { radius: 3 } },
    dataLabels: { enabled: false },
    tooltip: { theme: 'light', y: { formatter: (v: number) => `${v} tenant${v === 1 ? '' : 's'}` } },
  };

  private tenantMonthlyTrend(): { labels: string[]; internal: number[]; external: number[]; inactive: number[] } {
    const relevant = this.applications.filter((a) =>
      a.isDraft !== true
      && (a.applicationTypeCode === 'tp_internal' || a.applicationTypeCode === 'tp_external')
    );
    const now = new Date();
    const months: { key: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      months.push({ key, label });
    }
    const internal = months.map(() => 0);
    const external = months.map(() => 0);
    const inactive = months.map(() => 0);
    for (const app of relevant) {
      const raw = app.createdOn || app.modifiedOn;
      if (!raw) continue;
      const d = new Date(raw);
      if (Number.isNaN(d.getTime())) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const idx = months.findIndex((m) => m.key === key);
      if (idx < 0) continue;
      if (app.isActive === false) {
        inactive[idx]++;
        continue;
      }
      if (app.applicationTypeCode === 'tp_internal') internal[idx]++;
      else external[idx]++;
    }
    return { labels: months.map((m) => m.label), internal, external, inactive };
  }

  applicationForm: ApplicationFormModel = emptyApplicationForm();
  activeSiteIndex = 0;
  siteUrlInput = '';
  availableLibraries: SharePointLibraryDto[] = [];
  siteUrlParsed = false;
  siteUrlParsing = false;
  siteDetailsOpen = false;
  private siteUrlDebounce: ReturnType<typeof setTimeout> | null = null;
  private siteUrlParseFinishTimer: ReturnType<typeof setTimeout> | null = null;
  private siteUrlParseStartedAt = 0;
  private readonly siteUrlParseMinMs = 420;
  appSecretVisible = false;
  appConsumerSecretVisible = false;
  checkingConnectivity = false;
  connectivityTestState: ConnectivityTestState = 'idle';
  connectivityInlineResult: ExternalSiteConnectivityResultDto | null = null;
  connectivityInlineError: string | null = null;
  private readonly siteConnectivityByIndex = new Map<number, {
    state: ConnectivityTestState;
    result: ExternalSiteConnectivityResultDto | null;
    error: string | null;
  }>();
  private readonly siteLibrariesByIndex = new Map<number, SharePointLibraryDto[]>();
  advancedSettingsOpen = false;
  accessConfigOpen = true;
  private accessConfigAutoCollapsed = false;
  connectivityVerifyPhaseIndex = 0;
  connectivityGlimpse: ConnectivityGlimpse | null = null;
  connectivityGlimpseKey = 0;
  connectivityAwaitingGlimpse = false;
  private verifyPhaseTimer: ReturnType<typeof setInterval> | null = null;
  private glimpseTimers: ReturnType<typeof setTimeout>[] = [];
  ownerUserOptions: WorkspaceDirectoryUserOption[] = [];
  coOwnerUserOptions: WorkspaceDirectoryUserOption[] = [];
  ownerUserSearchLoading = false;
  coOwnerUserSearchLoading = false;
  ownerUserSearchOpen = false;
  coOwnerUserSearchOpen = false;
  private readonly ownerSearchTerms$ = new Subject<string>();
  private readonly coOwnerSearchTerms$ = new Subject<string>();
  private readonly userSearchSubscriptions = new Subscription();
  private ownerSearchSeq = 0;
  private coOwnerSearchSeq = 0;

  ngOnDestroy(): void {
    if (this.siteUrlDebounce) clearTimeout(this.siteUrlDebounce);
    if (this.siteUrlParseFinishTimer) clearTimeout(this.siteUrlParseFinishTimer);
    this.stopVerifyPhaseCycle();
    this.clearConnectivityGlimpses();
    this.userSearchSubscriptions.unsubscribe();
    this.status.destroy();
  }

  async ngOnInit(): Promise<void> {
    this.userSearchSubscriptions.add(
      this.ownerSearchTerms$
        .pipe(debounceTime(260), distinctUntilChanged())
        .subscribe((term) => { void this.searchWorkspaceUsers('owner', term); }),
    );
    this.userSearchSubscriptions.add(
      this.coOwnerSearchTerms$
        .pipe(debounceTime(260), distinctUntilChanged())
        .subscribe((term) => { void this.searchWorkspaceUsers('coOwner', term); }),
    );
    await this.loadApplicationCatalog();
    this.emitViewChange();
  }

  private emitViewChange(): void {
    this.viewChange.emit({
      view: this.view,
      formTitle: this.view === 'form'
        ? (this.applicationForm.applicationId ? this.m.form.editApplication : this.m.form.registerApplication)
        : undefined,
    });
  }

  get isExternalForm(): boolean { return this.applicationForm.applicationTypeId === APPLICATION_TYPE_ID.external; }
  get isInternalForm(): boolean { return this.applicationForm.applicationTypeId === APPLICATION_TYPE_ID.internal; }
  get isUserForm(): boolean { return this.applicationForm.applicationTypeId === APPLICATION_TYPE_ID.userDelegated; }
  get showFullCredentialForm(): boolean { return this.isExternalForm; }
  get needsConnectivityTest(): boolean { return this.isInternalForm || this.isExternalForm || this.isUserForm; }
  get isEditMode(): boolean { return !!this.applicationForm.applicationId; }

  get activeSite(): ApplicationSiteFormModel {
    if (!this.applicationForm.sites.length) {
      return emptyApplicationSite();
    }
    return this.applicationForm.sites[this.activeSiteIndex] ?? this.applicationForm.sites[0];
  }

  siteCountLabel(app: ApplicationDto): string {
    return spSiteCountLabel(applicationSiteCount(app));
  }

  resolveSiteHost(site: ApplicationSiteFormModel): string {
    const fromSite = site.hostName.trim();
    if (fromSite) return fromSite;
    if (this.isInternalForm) return this.env.hostName?.trim() || '';
    return '';
  }

  get isFormValid(): boolean {
    const f = this.applicationForm;
    const ownerOk = !!f.owner.trim();
    const siteOk = f.sites.some((s) => !!s.siteName.trim());
    const displayOk = !!f.displayName.trim();
    const hostOk = f.sites.some((s) => !!this.resolveSiteHost(s));
    const hierarchyOk = tenantHierarchySelectionValid(f.tenantHierarchy);
    if (this.isUserForm || this.isInternalForm) {
      return ownerOk && siteOk && displayOk && hostOk && hierarchyOk;
    }
    const base = ownerOk && displayOk && hierarchyOk && f.tenantId.trim() && f.clientId.trim() && f.clientSecret.trim() && hostOk;
    if (!f.applicationId) return base && siteOk;
    return base;
  }

  get registerSubmitLabel(): string {
    if (this.applicationForm.applicationId) return this.m.form.saveChanges;
    if (this.formUi.connectivity && this.connectivityTestState === 'failed') {
      return this.m.connectivity.registerApplicationInactive;
    }
    return this.m.form.registerApplication;
  }

  get formUi() { return { entra: this.isExternalForm, connectivity: this.needsConnectivityTest && !this.isEditMode }; }

  get internalApplications(): ApplicationDto[] {
    return this.applications.filter((app) => app.applicationTypeCode === 'tp_internal');
  }

  get selectedInternalSourceLabel(): string {
    return this.selectedInternalAppDropdown?.label?.trim() ?? '';
  }

  get filteredApplications(): ApplicationDto[] {
    const q = this.searchTerm.trim().toLowerCase();
    return this.applications.filter((app) => {
      const typeOk = this.typeFilter === 'all'
        || (this.typeFilter === 'draft' && app.isDraft === true)
        || (this.typeFilter !== 'draft' && app.isDraft !== true && app.applicationTypeCode === this.typeFilter);
      const searchOk = !q || [app.displayName, app.owner, app.coOwner, app.applicationTypeName, app.hostName, app.siteName, app.libraryName, app.clientId, app.applicationId, app.tenantId]
        .some((v) => (v ?? '').toLowerCase().includes(q));
      const appStatus = app.isActive !== undefined ? app.isActive : true;
      const statusOk = this.statusFilter === 'all' ||
        (app.isDraft !== true && this.statusFilter === 'active' && appStatus === true) ||
        (app.isDraft !== true && this.statusFilter === 'inactive' && appStatus === false);
      return typeOk && searchOk && statusOk;
    });
  }

  get registrationTypeOptions() { return buildRegistrationTypeOptions(this.applicationTypes); }

  get internalTypeLabel(): string {
    return applicationTypeByCode(this.applicationTypes, 'tp_internal')?.displayName ?? WC_CONNECTORS.typeFallback.internal;
  }

  get externalTypeLabel(): string {
    return applicationTypeByCode(this.applicationTypes, 'tp_external')?.displayName ?? WC_CONNECTORS.typeFallback.external;
  }

  get userTypeLabel(): string {
    return applicationTypeById(this.applicationTypes, APPLICATION_TYPE_ID.userDelegated)?.displayName ?? WC_CONNECTORS.typeFallback.userDelegated;
  }

  get connectivityHint(): string {
    if (this.isInternalForm) return WC_CONNECTORS.connectivity.hintInternal;
    if (this.isUserForm) return WC_CONNECTORS.connectivity.hintUser;
    return WC_CONNECTORS.connectivity.hintExternal;
  }

  get connectivitySuccessDetail(): string {
    const r = this.connectivityInlineResult;
    if (!r) return '';
    const parts = [r.siteTitle, r.siteName, r.hostName].map((s) => s?.trim()).filter((s): s is string => !!s);
    parts.push(`${spLibraryCountLabel(r.libraryCount)}, ${spFileCountLabel(r.fileCount)}`);
    return parts.join(' · ');
  }

  get connectivityPreviewHost(): string {
    return this.connectivityInlineResult?.hostName?.trim() || this.resolveSiteHost(this.activeSite) || '';
  }

  get connectivityPreviewSite(): string {
    return this.connectivityInlineResult?.siteTitle?.trim()
      || this.connectivityInlineResult?.siteName?.trim()
      || this.activeSite.siteName.trim()
      || MODULE_BRANDING.siteLabel;
  }

  get connectivityPreviewLibraries(): SharePointLibraryDto[] {
    const libraries = this.connectivityInlineResult?.libraries?.length
      ? this.connectivityInlineResult.libraries
      : this.availableLibraries;
    return libraries.filter((library) => !!library?.name?.trim()).slice(0, 3);
  }

  get connectivityPreviewStateLabel(): string {
    if (this.connectivityTestState === 'success' && this.connectivityInlineResult?.isConnected) {
      return 'Ready';
    }
    if (this.connectivityTestState === 'testing') {
      return 'Checking';
    }
    if (this.connectivityTestState === 'failed') {
      return 'Needs attention';
    }
    return 'Awaiting probe';
  }

  get connectivityPreviewSubtitle(): string {
    if (this.connectivityTestState === 'success' && this.connectivityInlineResult?.isConnected) {
      return 'Site access is confirmed. A clean snapshot will appear here.';
    }
    if (this.connectivityTestState === 'testing') {
      return 'We are checking access and preparing a preview.';
    }
    if (this.connectivityTestState === 'failed') {
      return this.connectivityInlineError || this.connectivityInlineResult?.message || WC_CONNECTORS.connectivity.verifyFailedDetail;
    }
    return 'Run the check to reveal a polished site snapshot.';
  }

  get connectivityPreviewSummary(): string {
    const pieces = [this.connectivityPreviewHost, this.connectivityPreviewSite].filter((piece) => !!piece);
    if (this.connectivityInlineResult?.isConnected) {
      pieces.push(`${spLibraryCountLabel(this.connectivityInlineResult.libraryCount)} · ${spFileCountLabel(this.connectivityInlineResult.fileCount)}`);
    }
    return pieces.join(' · ');
  }

  get connectivityPreviewIsLive(): boolean {
    return this.connectivityTestState === 'success' && !!this.connectivityInlineResult?.isConnected;
  }

  get connectivityAriaLabel(): string {
    const { connectivityTestState: state, connectivityInlineError: err, connectivityInlineResult: result } = this;
    if (state === 'testing') return WC_CONNECTORS.connectivity.ariaTesting(this.connectivityVerifyPhaseLabel, this.connectivityTestTarget);
    if (state === 'success') return WC_CONNECTORS.connectivity.ariaSuccess(this.connectivitySuccessDetail);
    if (state === 'failed') return err || result?.message || WC_CONNECTORS.connectivity.ariaFailed;
    return WC_CONNECTORS.connectivity.ariaIdle;
  }

  get connectivityVerifyPhaseLabel(): string {
    const phases = this.verifyPhases();
    return phases[this.connectivityVerifyPhaseIndex] ?? phases[0];
  }

  get verifyProgressPct(): number {
    const total = this.verifyPhases().length || 1;
    return ((this.connectivityVerifyPhaseIndex + 1) / total) * 100;
  }

  verifyPhases(): readonly string[] {
    return this.isExternalForm ? WC_CONNECTORS.connectivity.phasesExternal : WC_CONNECTORS.connectivity.phasesInternal;
  }

  verifyPhaseShort(index: number): string {
    const shorts = this.isExternalForm ? WC_CONNECTORS.connectivity.phaseShortExternal : WC_CONNECTORS.connectivity.phaseShortInternal;
    return shorts[index] ?? `${index + 1}`;
  }

  get connectivityTestTarget(): string {
    const site = this.activeSite;
    const siteName = site.siteName.trim();
    const host = this.resolveSiteHost(site);
    if (host && siteName) return `${host}${WC_CONNECTORS.connectivity.testTargetSeparator}${siteName}`;
    return siteName || MODULE_BRANDING.siteLabel;
  }

  get canTestConnectivity(): boolean {
    const site = this.activeSite;
    if (!site.siteName.trim() || !this.resolveSiteHost(site)) return false;
    if (this.isInternalForm || this.isUserForm) return true;
    const f = this.applicationForm;
    return !!(f.tenantId.trim() && f.clientId.trim() && f.clientSecret.trim());
  }

  async showList(): Promise<void> {
    this.view = 'list';
    await this.loadApplicationCatalog();
    this.status.clear();
    this.emitViewChange();
  }

  showForm(): void {
    this.view = 'form';
    this.advancedSettingsOpen = false;
    this.accessConfigOpen = true;
    this.accessConfigAutoCollapsed = false;
    this.siteDetailsOpen = false;
    this.siteUrlParsed = false;
    this.siteUrlParsing = false;
    this.activeSiteIndex = 0;
    this.applicationForm = emptyApplicationForm(APPLICATION_TYPE_ID.internal, { includeDefaultSite: false });
    this.siteUrlInput = '';
    this.availableLibraries = [];
    this.clearAllSiteConnectivity();
    this.applyDefaultOwner();
    this.applyDefaultSecurityGroup();
    this.resetUserSearchState();
    this.resetConnectivityTest();
    this.status.clear();
    this.emitViewChange();
  }

  private applyDefaultSecurityGroup(): void {
    const current = this.applicationForm.tenantHierarchy;
    if (current.securityGroupId) return;

    const securityGroupId = sessionStorage.getItem('GUID')?.trim() || '';
    if (!securityGroupId || securityGroupId === SP_ALL_SECURITY_GROUP_ID) return;

    const securityGroupName = sessionStorage.getItem('UserDefaultGroup')?.trim() || securityGroupId;
    this.applicationForm.tenantHierarchy = {
      ...current,
      securityGroupId,
      securityGroupName,
      securityGroups: [{ id: securityGroupId, name: securityGroupName }],
    };
  }

  setRegistrationType(applicationTypeId: number): void {
    if (this.applicationForm.applicationTypeId === applicationTypeId) return;
    this.applicationForm.applicationTypeId = applicationTypeId;
    this.applicationForm.applicationTypeCode = applicationTypeCodeFromId(this.applicationTypes, applicationTypeId);
    this.availableLibraries = [];
    this.clearAllSiteConnectivity();
    this.applyDefaultOwner();
    if (this.siteUrlInput.trim()) this.applySiteUrl({ silent: true });
  }

  applySiteUrl(options?: { silent?: boolean }): boolean {
    const trimmed = this.siteUrlInput.trim();
    if (!trimmed) {
      this.siteUrlParsed = false;
      return false;
    }
    const parsed = parseSharePointSiteUrl(trimmed);
    if (!parsed) {
      this.siteUrlParsed = false;
      if (!options?.silent) {
        this.status.setApiErrorMessage(WC_CONNECTORS.validation.urlParse);
      }
      return false;
    }
    this.status.clear();
    if (!this.applicationForm.sites.length) {
      this.applicationForm.sites = [emptyApplicationSite()];
      this.activeSiteIndex = 0;
    }
    const site = this.applicationForm.sites[this.activeSiteIndex];
    if (parsed.hostName) site.hostName = parsed.hostName;
    if (parsed.siteName) site.siteName = parsed.siteName;
    if (parsed.libraryName) site.libraryName = parsed.libraryName;
    if (parsed.folderPath) site.folderPath = parsed.folderPath;
    this.syncFieldsFromActiveSite();
    this.siteUrlParsed = !!parsed.siteName;
    this.syncLibraryFromAvailable();
    this.invalidateActiveSiteConnectivity();
    this.siteUrlInput = '';
    this.siteUrlParsed = false;
    this.cdr.markForCheck();
    return true;
  }

  private beginSiteUrlParse(): void {
    this.siteUrlParsing = true;
    this.siteUrlParseStartedAt = Date.now();
    this.cdr.markForCheck();
  }

  private endSiteUrlParse(): void {
    if (this.siteUrlParseFinishTimer) clearTimeout(this.siteUrlParseFinishTimer);
    const elapsed = Date.now() - this.siteUrlParseStartedAt;
    const remaining = Math.max(0, this.siteUrlParseMinMs - elapsed);
    this.siteUrlParseFinishTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.siteUrlParsing = false;
        this.siteUrlParseFinishTimer = null;
        this.cdr.markForCheck();
      });
    }, remaining);
  }

  onSiteUrlInput(): void {
    const trimmed = this.siteUrlInput.trim();
    if (!trimmed) {
      this.siteUrlParsing = false;
      this.siteUrlParsed = false;
      if (this.siteUrlDebounce) clearTimeout(this.siteUrlDebounce);
      return;
    }
    this.beginSiteUrlParse();
    if (this.siteUrlDebounce) clearTimeout(this.siteUrlDebounce);
    this.siteUrlDebounce = setTimeout(() => {
      this.ngZone.run(() => {
        this.applySiteUrl({ silent: true });
        this.endSiteUrlParse();
      });
    }, 450);
  }

  onSiteUrlBlur(): void {
    if (this.siteUrlDebounce) {
      clearTimeout(this.siteUrlDebounce);
      this.siteUrlDebounce = null;
    }
    if (!this.siteUrlInput.trim()) return;
    this.beginSiteUrlParse();
    this.applySiteUrl();
    this.endSiteUrlParse();
  }

  onSiteUrlPaste(): void {
    setTimeout(() => {
      this.ngZone.run(() => {
        if (!this.siteUrlInput.trim()) return;
        this.beginSiteUrlParse();
        this.applySiteUrl();
        this.endSiteUrlParse();
      });
    }, 0);
  }

  toggleSiteDetails(): void {
    this.siteDetailsOpen = !this.siteDetailsOpen;
  }

  private syncApplicationTypeFromCatalog(): void {
    const type = applicationTypeById(this.applicationTypes, this.applicationForm.applicationTypeId)
      ?? applicationTypeByCode(this.applicationTypes, this.applicationForm.applicationTypeCode);
    if (!type) return;
    this.applicationForm.applicationTypeId = type.applicationTypeId;
    this.applicationForm.applicationTypeCode = type.code as ApplicationTypeCode;
  }

  private syncFieldsFromActiveSite(): void {
    if (!this.applicationForm.sites.length) return;
    const site = this.applicationForm.sites[this.activeSiteIndex] ?? this.applicationForm.sites[0];
    this.applicationForm.hostName = site.hostName;
    this.applicationForm.siteName = site.siteName;
    this.applicationForm.libraryName = site.libraryName;
    this.applicationForm.folderPath = site.folderPath;
  }

  private syncFieldsToActiveSite(): void {
    if (!this.applicationForm.sites.length) return;
    const site = this.applicationForm.sites[this.activeSiteIndex];
    if (!site) return;
    site.hostName = this.applicationForm.hostName;
    site.siteName = this.applicationForm.siteName;
    site.libraryName = this.applicationForm.libraryName;
    site.folderPath = this.applicationForm.folderPath;
  }

  private saveActiveSiteConnectivity(): void {
    this.siteConnectivityByIndex.set(this.activeSiteIndex, {
      state: this.connectivityTestState,
      result: this.connectivityInlineResult,
      error: this.connectivityInlineError,
    });
    this.siteLibrariesByIndex.set(this.activeSiteIndex, [...this.availableLibraries]);
  }

  private loadActiveSiteConnectivity(): void {
    const cached = this.siteConnectivityByIndex.get(this.activeSiteIndex);
    this.connectivityTestState = cached?.state ?? 'idle';
    this.connectivityInlineResult = cached?.result ?? null;
    this.connectivityInlineError = cached?.error ?? null;
    this.availableLibraries = [...(this.siteLibrariesByIndex.get(this.activeSiteIndex) ?? [])];
  }

  private invalidateActiveSiteConnectivity(): void {
    this.siteConnectivityByIndex.delete(this.activeSiteIndex);
    this.siteLibrariesByIndex.delete(this.activeSiteIndex);
    this.resetConnectivityTest();
  }

  private clearAllSiteConnectivity(): void {
    this.siteConnectivityByIndex.clear();
    this.siteLibrariesByIndex.clear();
    this.resetConnectivityTest();
  }

  private allSitesConnectivityVerified(): boolean {
    return this.applicationForm.sites.every(
      (site, index) => !site.siteName.trim() || this.siteConnectivityByIndex.get(index)?.state === 'success',
    );
  }

  private firstUnverifiedSiteIndex(): number | null {
    for (let i = 0; i < this.applicationForm.sites.length; i++) {
      const site = this.applicationForm.sites[i];
      if (!site.siteName.trim()) continue;
      if (this.siteConnectivityByIndex.get(i)?.state !== 'success') return i;
    }
    return null;
  }

  selectSite(index: number): void {
    if (index < 0 || index >= this.applicationForm.sites.length) return;
    this.saveActiveSiteConnectivity();
    this.syncFieldsToActiveSite();
    this.activeSiteIndex = index;
    this.syncFieldsFromActiveSite();
    this.loadActiveSiteConnectivity();
    this.siteUrlInput = '';
    this.siteUrlParsed = false;
    this.cdr.markForCheck();
  }

  addSite(): void {
    if (this.applicationForm.sites.length) {
      this.saveActiveSiteConnectivity();
      this.syncFieldsToActiveSite();
    }
    this.applicationForm.sites.push(emptyApplicationSite());
    this.activeSiteIndex = this.applicationForm.sites.length - 1;
    this.siteUrlInput = '';
    this.siteUrlParsed = false;
    this.syncFieldsFromActiveSite();
    this.loadActiveSiteConnectivity();
    this.resetConnectivityTest();
    this.cdr.markForCheck();
  }

  removeSite(index: number): void {
    if (this.applicationForm.sites.length <= 1) return;
    this.applicationForm.sites.splice(index, 1);
    this.clearAllSiteConnectivity();
    if (this.activeSiteIndex >= this.applicationForm.sites.length) {
      this.activeSiteIndex = this.applicationForm.sites.length - 1;
    }
    this.syncFieldsFromActiveSite();
    this.siteUrlInput = '';
    this.siteUrlParsed = false;
    this.cdr.markForCheck();
  }

  private buildSiteUrlInput(site: ApplicationSiteFormModel): string {
    const host = this.resolveSiteHost(site);
    const path = site.siteName.trim();
    if (!path) return '';
    if (host) {
      const tail = [path, site.libraryName, site.folderPath].filter((p) => p?.trim()).join('/');
      return `https://${host}/${tail}`;
    }
    return path;
  }

  private syncLibraryFromAvailable(): void {
    if (!this.availableLibraries.length) return;
    this.applicationForm.libraryName = pickDefaultLibraryName(
      this.availableLibraries,
      preferredLibraryNames({
        primary: this.applicationForm.libraryName,
        libraryName: this.env.libraryName,
        defaultLibraryName: this.env.defaultLibraryName,
      }),
    );
  }

  private applyLibrariesFromProbe(libs?: SharePointLibraryDto[]): void {
    this.availableLibraries = libs ?? [];
    this.syncLibraryFromAvailable();
    this.cdr.markForCheck();
  }

  onSiteFieldChange(): void {
    this.syncFieldsToActiveSite();
    this.onConnectivityInputsChange();
  }

  trackBySiteIndex(index: number): number {
    return index;
  }

  isSiteConnectivityVerified(index: number): boolean {
    return this.siteConnectivityByIndex.get(index)?.state === 'success';
  }

  onConnectivityInputsChange(): void {
    if (this.connectivityTestState === 'testing') return;
    if (this.connectivityTestState !== 'idle') this.invalidateActiveSiteConnectivity();
  }

  resetConnectivityTest(): void {
    this.stopVerifyPhaseCycle();
    this.clearConnectivityGlimpses();
    this.connectivityTestState = 'idle';
    this.connectivityInlineResult = null;
    this.connectivityInlineError = null;
    this.connectivityVerifyPhaseIndex = 0;
    this.availableLibraries = [];
  }

  setTypeFilter(filter: ListTypeFilter): void {
    this.typeFilter = filter;
    if (filter === 'draft') this.statusFilter = 'all';
  }

  setStatusFilter(filter: 'all' | 'active' | 'inactive'): void { this.statusFilter = filter; }

  get listHierarchyConfigured(): boolean {
    return tenantHierarchySelectionValid(this.listHierarchySelection);
  }

  get listHierarchySummary(): string {
    const s = this.listHierarchySelection;
    if (!this.listHierarchyConfigured) return '';
    const parts = [s.regionName];
    if (s.subRegionCode && s.subRegionName && s.subRegionName !== 'All') parts.push(s.subRegionName);
    if (s.clientIdent && s.clientName && s.clientName !== 'All') parts.push(s.clientName);
    if (s.securityGroupId && s.securityGroupName && s.securityGroupName !== 'All') parts.push(s.securityGroupName);
    return parts.join(' · ');
  }

  toggleListHierarchyFilter(): void {
    this.listHierarchyFilterOpen = !this.listHierarchyFilterOpen;
  }

  async onListHierarchyChange(selection: SharePointTenantHierarchySelection): Promise<void> {
    this.listHierarchySelection = selection;
    await this.loadApplicationCatalog();
  }

  async clearListHierarchyFilter(): Promise<void> {
    this.listHierarchySelection = emptyTenantHierarchySelection();
    await this.loadApplicationCatalog();
  }

  get showListToolbar(): boolean {
    return !this.loading && (this.applications.length > 0 || this.listHierarchyConfigured);
  }

  get showTrueEmptyCatalog(): boolean {
    return !this.loading && !this.applications.length && !this.listHierarchyConfigured;
  }

  get showNoMatchEmpty(): boolean {
    if (this.loading) return false;
    if (this.listHierarchyConfigured && !this.applications.length) return true;
    return this.applications.length > 0 && !this.filteredApplications.length;
  }

  async clearListFilters(): Promise<void> {
    this.searchTerm = '';
    this.typeFilter = 'all';
    this.statusFilter = 'all';
    this.listHierarchyFilterOpen = false;
    if (this.listHierarchyConfigured) {
      await this.clearListHierarchyFilter();
      return;
    }
    this.cdr.markForCheck();
  }

  private listCatalogFilter() {
    return {
      includeInactive: true as const,
      ...tenantFilterFromScope(tenantScopeFromSelection(this.listHierarchySelection)),
    };
  }

  toggleAdvancedSettings(): void {
    this.advancedSettingsOpen = !this.advancedSettingsOpen;
  }

  private applyDefaultOwner(): void {
    if (!this.applicationForm.owner.trim()) {
      const name =
        sessionStorage.getItem('userFullName')?.trim() ||
        sessionStorage.getItem('FullName')?.trim() ||
        environment.userFullName?.trim() ||
        '';
      if (name) this.applicationForm.owner = name;
    }
    if (!this.applicationForm.ownerUpn.trim()) {
      const upn =
        sessionStorage.getItem('upn')?.trim() ||
        sessionStorage.getItem('emailID')?.trim() ||
        sessionStorage.getItem('fullUPN')?.trim() ||
        '';
      if (upn) this.applicationForm.ownerUpn = upn;
    }
  }

  async testSiteConnectivity(): Promise<void> {
    const siteLabel = MODULE_BRANDING.siteLabel.toLowerCase();
    if (!this.applicationForm.sites.length) {
      this.status.setApiErrorMessage(WC_CONNECTORS.connectivity.addSiteBeforeTest(siteLabel));
      return;
    }
    this.syncFieldsToActiveSite();
    const site = this.applicationForm.sites[this.activeSiteIndex];
    const siteName = site.siteName.trim();
    if (!siteName) {
      this.status.setApiErrorMessage(WC_CONNECTORS.connectivity.enterSiteBeforeTest(siteLabel));
      return;
    }
    if (!this.canTestConnectivity) {
      this.status.setApiErrorMessage(this.connectivityValidationMessage());
      return;
    }
    await this.runSiteConnectivityCheck(siteName, false);
  }

  setDisplayMode(mode: 'cards' | 'table'): void { this.displayMode = mode; }

  editApplication(app: ApplicationDto): void {
    this.view = 'form';
    this.applicationForm = applicationFormFromDto(app);
    this.syncApplicationTypeFromCatalog();
    this.activeSiteIndex = 0;
    this.syncFieldsFromActiveSite();
    this.siteUrlInput = this.buildSiteUrlInput(this.activeSite);
    this.siteUrlParsed = !!this.activeSite.siteName.trim();
    this.resetConnectivityTest();
    this.resetUserSearchState();
    this.accessConfigOpen = !tenantHierarchySelectionValid(this.applicationForm.tenantHierarchy);
    this.accessConfigAutoCollapsed = !this.accessConfigOpen;
    this.status.clear();
    this.emitViewChange();
  }

  get showOwnerUserDropdown(): boolean {
    const q = this.applicationForm.owner.trim();
    return this.ownerUserSearchOpen && q.length >= 2;
  }

  get showCoOwnerUserDropdown(): boolean {
    const q = this.applicationForm.coOwner.trim();
    return this.coOwnerUserSearchOpen && q.length >= 2;
  }

  onOwnerInputChange(value: string): void {
    if (this.applicationForm.ownerUpn.trim()) {
      const normalizedName = this.applicationForm.owner.trim().toLowerCase();
      const normalizedUpn = this.applicationForm.ownerUpn.trim().toLowerCase();
      if (normalizedName !== normalizedUpn) {
        this.applicationForm.ownerUpn = '';
      }
    }
    this.queueUserSearch('owner', value);
  }

  onOwnerInputFocus(): void {
    this.ownerUserSearchOpen = true;
    this.queueUserSearch('owner', this.applicationForm.owner);
  }

  onOwnerInputBlur(): void {
    setTimeout(() => {
      this.ownerUserSearchOpen = false;
      this.cdr.markForCheck();
    }, 140);
  }

  selectOwnerUser(option: WorkspaceDirectoryUserOption): void {
    this.applicationForm.owner = option.name;
    this.applicationForm.ownerUpn = option.upn || option.mail;
    this.ownerUserOptions = [];
    this.ownerUserSearchOpen = false;
  }

  onCoOwnerInputChange(value: string): void {
    if (this.applicationForm.coOwnerUpn.trim()) {
      const normalizedName = this.applicationForm.coOwner.trim().toLowerCase();
      const normalizedUpn = this.applicationForm.coOwnerUpn.trim().toLowerCase();
      if (normalizedName !== normalizedUpn) {
        this.applicationForm.coOwnerUpn = '';
      }
    }
    this.queueUserSearch('coOwner', value);
  }

  onCoOwnerInputFocus(): void {
    this.coOwnerUserSearchOpen = true;
    this.queueUserSearch('coOwner', this.applicationForm.coOwner);
  }

  onCoOwnerInputBlur(): void {
    setTimeout(() => {
      this.coOwnerUserSearchOpen = false;
      this.cdr.markForCheck();
    }, 140);
  }

  selectCoOwnerUser(option: WorkspaceDirectoryUserOption): void {
    this.applicationForm.coOwner = option.name;
    this.applicationForm.coOwnerUpn = option.upn || option.mail;
    this.coOwnerUserOptions = [];
    this.coOwnerUserSearchOpen = false;
  }

  private resetUserSearchState(): void {
    this.ownerUserOptions = [];
    this.coOwnerUserOptions = [];
    this.ownerUserSearchLoading = false;
    this.coOwnerUserSearchLoading = false;
    this.ownerUserSearchOpen = false;
    this.coOwnerUserSearchOpen = false;
  }

  private queueUserSearch(target: 'owner' | 'coOwner', value: string): void {
    const term = value.trim();
    if (term.length < 2) {
      if (target === 'owner') {
        this.ownerUserOptions = [];
        this.ownerUserSearchLoading = false;
      } else {
        this.coOwnerUserOptions = [];
        this.coOwnerUserSearchLoading = false;
      }
      return;
    }
    if (target === 'owner') {
      this.ownerUserSearchLoading = true;
      this.ownerSearchTerms$.next(term);
    } else {
      this.coOwnerUserSearchLoading = true;
      this.coOwnerSearchTerms$.next(term);
    }
  }

  private async searchWorkspaceUsers(target: 'owner' | 'coOwner', term: string): Promise<void> {
    const seq = target === 'owner' ? ++this.ownerSearchSeq : ++this.coOwnerSearchSeq;
    if (target === 'owner') this.ownerUserSearchLoading = true;
    else this.coOwnerUserSearchLoading = true;
    this.cdr.markForCheck();

    const result = await awaitApi(this.api.searchWorkspaceUsers(term, 'string'), WC_CONNECTORS.api.loadFailed);
    const latestSeq = target === 'owner' ? this.ownerSearchSeq : this.coOwnerSearchSeq;
    if (seq !== latestSeq) return;

    const options = result.ok
      ? (result.value.users ?? [])
        .map((u) => this.toDirectoryUserOption(u))
        .filter((u): u is WorkspaceDirectoryUserOption => !!u)
      : [];

    if (target === 'owner') {
      this.ownerUserOptions = options;
      this.ownerUserSearchLoading = false;
    } else {
      this.coOwnerUserOptions = options;
      this.coOwnerUserSearchLoading = false;
    }
    this.cdr.markForCheck();
  }

  private toDirectoryUserOption(user: WorkspaceDirectoryUserDto): WorkspaceDirectoryUserOption | null {
    const upn = (user.userPrincipalName ?? '').trim();
    const mail = (user.mail ?? '').trim();
    const name = this.resolveDirectoryUserName(user, upn || mail);
    const label = (upn || mail) ? `${name} (${upn || mail})` : name;
    if (!label.trim()) return null;
    return {
      id: (user.id ?? upn ?? mail ?? name).trim() || name,
      label,
      name,
      upn,
      mail,
      avatarSrc: this.buildAvatarDataUrl(name || upn || mail || 'U'),
    };
  }

  private buildAvatarDataUrl(name: string): string {
    const initials = this.initialsFromName(name);
    const hue = this.colorHue(name);
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><defs><linearGradient id='g' x1='0' x2='1' y1='0' y2='1'><stop offset='0%' stop-color='hsl(${hue},72%,56%)'/><stop offset='100%' stop-color='hsl(${(hue + 28) % 360},68%,44%)'/></linearGradient></defs><circle cx='20' cy='20' r='20' fill='url(#g)'/><text x='50%' y='54%' dominant-baseline='middle' text-anchor='middle' font-family='Segoe UI, Arial, sans-serif' font-size='14' font-weight='700' fill='white'>${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }

  private initialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'U';
    const first = parts[0][0] ?? 'U';
    const second = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return `${first}${second}`.toUpperCase();
  }

  private colorHue(value: string): number {
    let hash = 0;
    for (let i = 0; i < value.length; i++) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 360;
  }

  private resolveDirectoryUserName(user: WorkspaceDirectoryUserDto, fallback: string): string {
    const displayName = (user.displayName ?? '').trim();
    if (displayName) return displayName;
    const fullName = [user.givenName?.trim(), user.surname?.trim()]
      .filter((part): part is string => !!part)
      .join(' ')
      .trim();
    if (fullName) return fullName;
    return fallback.trim();
  }

  private resolvePayloadContactName(name: string, upn: string): string {
    const trimmedName = name.trim();
    if (trimmedName) return trimmedName;
    return upn.trim();
  }

  private resolvePayloadUpn(upn: string, name: string): string {
    const trimmedUpn = upn.trim();
    if (trimmedUpn) return trimmedUpn;
    const trimmedName = name.trim();
    return trimmedName.includes('@') ? trimmedName : '';
  }

  async saveApplication(): Promise<void> {
    const f = this.applicationForm;
    if (!this.isFormValid) {
      this.status.setApiErrorMessage(this.formValidationMessage());
      return;
    }
    if (!f.applicationId) {
      const active = !this.needsConnectivityTest || this.allSitesConnectivityVerified();
      if (!active) {
        if (this.canTestConnectivity && this.connectivityTestState === 'idle') {
          const site = this.applicationForm.sites[this.activeSiteIndex];
          await this.runSiteConnectivityCheck(site.siteName.trim(), true);
          return;
        }
        await this.persistApplication(false);
        return;
      }
      if (this.allSitesConnectivityVerified()) {
        await this.persistApplication(true);
        return;
      }
      const pendingIndex = this.firstUnverifiedSiteIndex();
      if (pendingIndex !== null && pendingIndex !== this.activeSiteIndex) {
        this.selectSite(pendingIndex);
        this.status.setApiErrorMessage(WC_CONNECTORS.connectivity.testSiteBeforeRegister(this.applicationForm.sites[pendingIndex].siteName.trim()));
        return;
      }
      if (!this.canTestConnectivity) {
        this.status.setApiErrorMessage(this.connectivityValidationMessage());
        return;
      }
      const site = this.applicationForm.sites[this.activeSiteIndex];
      await this.runSiteConnectivityCheck(site.siteName.trim(), true);
      return;
    }
    await this.persistApplication(f.isActive !== false, false);
  }

  async saveDraft(): Promise<void> {
    if (!this.applicationForm.displayName.trim()) {
      this.status.setApiErrorMessage(WC_CONNECTORS.validation.nameRequired);
      return;
    }
    await this.persistApplication(false, true);
  }

  private async persistApplication(isActive = true, isDraft = false): Promise<void> {
    const f = this.applicationForm;
    const isNew = !f.applicationId;
    const resolvedActive =
      !isNew && this.needsConnectivityTest && this.allSitesConnectivityVerified()
        ? true
        : isActive;
    this.syncFieldsToActiveSite();
    const sites = f.sites
      .filter((s) => s.siteName.trim())
      .map((s, index) => ({
        hostName: this.resolveSiteHost(s),
        siteName: s.siteName.trim(),
        libraryName: s.libraryName.trim() || undefined,
        folderPath: s.folderPath.trim() || undefined,
        sortOrder: index,
      }));
    const primary = sites[0];
    const hierarchy = normalizeTenantHierarchyForSave(f.tenantHierarchy);
    const ownerUpn = this.resolvePayloadUpn(f.ownerUpn, f.owner);
    const coOwnerUpn = this.resolvePayloadUpn(f.coOwnerUpn, f.coOwner);
    const ownerName = this.resolvePayloadContactName(f.owner, ownerUpn);
    const coOwnerName = this.resolvePayloadContactName(f.coOwner, coOwnerUpn);
    const payload: Partial<ApplicationDto> = {
      applicationId: f.applicationId ?? undefined,
      applicationTypeCode: f.applicationTypeCode,
      ownerKey: this.env.ownerKey,
      owner: ownerName,
      ownerUpn: ownerUpn || undefined,
      coOwner: coOwnerName || undefined,
      coOwnerUpn: coOwnerUpn || undefined,
      notes: f.notes.trim() || undefined,
      displayName: f.displayName.trim(),
      regionIdent: hierarchy.regionIdent,
      regionName: hierarchy.regionName,
      subRegionCode: hierarchy.subRegionCode,
      subRegionName: hierarchy.subRegionName,
      clientIdent: hierarchy.clientIdent,
      clientName: hierarchy.clientName,
      securityGroupId: hierarchy.securityGroupId,
      securityGroupName: hierarchy.securityGroupName,
      isActive: resolvedActive,
      isDraft,
      siteName: primary?.siteName,
      libraryName: primary?.libraryName,
      hostName: primary?.hostName ?? this.resolveSiteHost(this.activeSite),
      sites,
      ...(this.isExternalForm
        ? {
          tenantId: f.tenantId.trim(),
          clientId: f.clientId.trim(),
          clientSecret: f.clientSecret.trim(),
        }
        : {
          tenantId: '',
          clientId: '',
          clientSecret: '',
        }),
    };

    const result = await awaitApi(this.api.saveApplication(payload), WC_CONNECTORS.api.saveFailed);
    if (!result.ok) {
      this.status.setApiError(result.error, WC_CONNECTORS.api.saveFailed);
      return;
    }
    const saved = result.value;
    this.applicationForm = applicationFormFromDto(saved);
    this.persistTenantScopeFromForm();
    this.syncApplicationTypeFromCatalog();
    this.applicationForm.consumerClientId = saved.consumerClientId ?? this.applicationForm.consumerClientId;
    this.applicationForm.consumerSecret = saved.consumerSecret ?? this.applicationForm.consumerSecret;
    this.activeSiteIndex = 0;
    this.syncFieldsFromActiveSite();
    if (isNew) {
      if (saved.isDraft === true) {
        this.status.setSuccess(WC_CONNECTORS.list.saveDraftSuccess(saved.displayName));
      } else if (saved.isActive === false) {
        this.status.setSuccess(WC_CONNECTORS.list.saveInactiveSuccess(saved.displayName));
      } else {
        this.status.setSuccess(WC_CONNECTORS.list.saveSuccess(saved.displayName));
      }
      await this.showList();
    } else {
      this.status.setSuccess(
        saved.isDraft === true
          ? WC_CONNECTORS.list.saveDraftSuccess(saved.displayName)
          : saved.isActive === false
            ? WC_CONNECTORS.list.saveInactiveSuccess(saved.displayName)
            : WC_CONNECTORS.list.saveSuccess(saved.displayName),
      );
      await this.loadApplicationCatalog();
    }
  }

  private formValidationMessage(): string {
    const v = WC_CONNECTORS.validation;
    if (!this.applicationForm.owner.trim()) return v.ownerRequired;
    if (!tenantHierarchySelectionValid(this.applicationForm.tenantHierarchy)) return v.regionRequired;
    if (!this.applicationForm.displayName.trim()) return v.nameRequired;
    if (!this.applicationForm.sites.some((s) => s.siteName.trim())) return v.siteRequired;
    if (!this.applicationForm.sites.some((s) => this.resolveSiteHost(s))) {
      return this.isInternalForm
        ? v.internalHostMissing
        : v.hostExtractHint(MODULE_BRANDING.hostLabel.toLowerCase());
    }
    if (this.isExternalForm) return v.entraRequired;
    return v.fieldsRequired;
  }

  private connectivityValidationMessage(): string {
    const v = WC_CONNECTORS.validation;
    const site = this.activeSite;
    if (!site.siteName.trim()) return v.sitePathBeforeTest;
    if (!this.resolveSiteHost(site)) return v.hostUnresolved;
    return v.entraBeforeTest;
  }

  private buildConnectivityRequest(siteName: string): SiteConnectivityCheckRequest {
    const f = this.applicationForm;
    const hostName = this.resolveSiteHost(this.activeSite);
    if (this.isInternalForm || this.isUserForm) {
      return { siteName, hostName };
    }
    return {
      siteName,
      hostName,
      tenantId: f.tenantId.trim(),
      clientId: f.clientId.trim(),
      clientSecret: f.clientSecret.trim(),
    };
  }

  private syncConnectivityView(): void {
    this.cdr.markForCheck();
  }

  private startVerifyPhaseCycle(): void {
    this.stopVerifyPhaseCycle();
    this.connectivityVerifyPhaseIndex = 0;
    this.verifyPhaseTimer = setInterval(() => {
      this.ngZone.run(() => {
        this.connectivityVerifyPhaseIndex = (this.connectivityVerifyPhaseIndex + 1) % this.verifyPhases().length;
        this.syncConnectivityView();
      });
    }, 1650);
  }

  private stopVerifyPhaseCycle(): void {
    if (this.verifyPhaseTimer !== null) {
      clearInterval(this.verifyPhaseTimer);
      this.verifyPhaseTimer = null;
    }
  }

  private clearConnectivityGlimpses(): void {
    for (const timer of this.glimpseTimers) clearTimeout(timer);
    this.glimpseTimers = [];
    this.connectivityGlimpse = null;
    this.connectivityAwaitingGlimpse = false;
  }

  private queueGlimpse(glimpse: ConnectivityGlimpse, showAtMs: number, visibleMs: number): void {
    const showTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.connectivityGlimpseKey += 1;
        this.connectivityGlimpse = glimpse;
        this.connectivityAwaitingGlimpse = false;
        this.syncConnectivityView();
      });
    }, showAtMs);
    const hideTimer = setTimeout(() => {
      this.ngZone.run(() => {
        if (this.connectivityGlimpse === glimpse) this.connectivityGlimpse = null;
        this.syncConnectivityView();
      });
    }, showAtMs + visibleMs);
    this.glimpseTimers.push(showTimer, hideTimer);
  }

  private scheduleConnectivityGlimpses(data: ExternalSiteConnectivityResultDto): void {
    const glimpses: ConnectivityGlimpse[] = [];
    const host = data.hostName?.trim() || this.applicationForm.hostName.trim();
    const site = data.siteTitle?.trim() || data.siteName?.trim() || this.applicationForm.siteName.trim();
    const g = WC_CONNECTORS.connectivity;
    if (host) glimpses.push({ icon: 'building', label: g.glimpseHost, value: host });
    if (site) glimpses.push({ icon: 'cloud', label: g.glimpseSite, value: site });
    if (data.isConnected) {
      glimpses.push({ icon: 'folder', label: g.glimpseLibraries, value: spLibraryCountLabel(data.libraryCount) });
      glimpses.push({ icon: 'file', label: g.glimpseFiles, value: spFileCountLabel(data.fileCount) });
    }
    if (!glimpses.length && data.message?.trim()) {
      glimpses.push({ icon: 'info', label: g.glimpseResponse, value: data.message.trim() });
    }
    if (!glimpses.length) return;

    const visibleMs = 1150;
    const gapMs = 180;
    const startMs = 320;
    glimpses.forEach((glimpse, index) => {
      this.queueGlimpse(glimpse, startMs + index * (visibleMs + gapMs), visibleMs);
    });
  }

  private async runSiteConnectivityCheck(siteName: string, proceedToSave: boolean): Promise<void> {
    this.syncFieldsToActiveSite();
    this.checkingConnectivity = true;
    this.connectivityTestState = 'testing';
    this.connectivityInlineResult = null;
    this.connectivityInlineError = null;
    this.status.clear();
    this.clearConnectivityGlimpses();
    this.connectivityAwaitingGlimpse = true;
    this.startVerifyPhaseCycle();
    this.syncConnectivityView();
    const startedAt = Date.now();
    try {
      const result = await awaitApi(
        this.api.validateSiteConnectivity(this.buildConnectivityRequest(siteName)),
        WC_CONNECTORS.connectivity.couldNotVerify,
      );
      if (result.ok) {
        this.scheduleConnectivityGlimpses(result.value);
      } else {
        const host = this.applicationForm.hostName.trim();
        if (host) {
          this.queueGlimpse(
            { icon: 'alert', label: WC_CONNECTORS.connectivity.glimpseCheckFailed, value: result.message.slice(0, 48) },
            400,
            1400,
          );
        }
      }
      const remainingMs = CONNECTIVITY_TEST_MIN_DISPLAY_MS - (Date.now() - startedAt);
      if (remainingMs > 0) await delay(remainingMs);
      if (!result.ok) {
        this.connectivityTestState = 'failed';
        this.connectivityInlineError = result.message;
        this.saveActiveSiteConnectivity();
        if (proceedToSave) await this.persistApplication(false);
        return;
      }
      const connectivity = result.value;
      if (connectivity?.isConnected) {
        this.connectivityTestState = 'success';
        this.connectivityInlineResult = connectivity;
        this.applyLibrariesFromProbe(connectivity.libraries);
        this.saveActiveSiteConnectivity();
        if (proceedToSave) {
          if (this.allSitesConnectivityVerified()) {
            await this.persistApplication(true);
          } else {
            this.status.setApiErrorMessage(WC_CONNECTORS.connectivity.testEachSiteBeforeRegister);
          }
        }
        return;
      }
      this.connectivityTestState = 'failed';
      this.connectivityInlineResult = connectivity ?? null;
      this.saveActiveSiteConnectivity();
      if (proceedToSave) {
        await this.persistApplication(false);
      }
    } catch (error) {
      this.connectivityTestState = 'failed';
      this.connectivityInlineError = parseApiError(error, WC_CONNECTORS.connectivity.couldNotVerify);
      this.saveActiveSiteConnectivity();
      if (proceedToSave) await this.persistApplication(false);
    } finally {
      this.checkingConnectivity = false;
      this.stopVerifyPhaseCycle();
      this.clearConnectivityGlimpses();
      this.syncConnectivityView();
    }
  }

  downloadCurlForApp(
    applicationId = this.applicationForm.applicationId,
    displayName = this.applicationForm.displayName,
    apiSecret = this.applicationForm.consumerSecret,
  ): void {
    if (!applicationId || !apiSecret?.trim()) return;
    const result = buildCurlCommands({
      apiBaseUrl: this.env.apiBaseUrl,
      apiVersion: this.env.apiVersion,
      applicationId,
      apiSecret: apiSecret.trim(),
      displayName: displayName.trim(),
    });
    downloadCurlScript(result.fullText, curlScriptFilename(displayName));
  }

  async deleteApplication(app: ApplicationDto): Promise<void> {
    if (!confirm(WC_CONNECTORS.list.deleteConfirm(app.displayName))) return;
    const result = await awaitApi(this.api.deleteApplication(app.applicationId), WC_CONNECTORS.api.deleteFailed);
    if (!result.ok) {
      this.status.setApiError(result.error, WC_CONNECTORS.api.deleteFailed);
      return;
    }
    this.status.setSuccess(WC_CONNECTORS.list.deleted(app.displayName));
    await this.loadApplicationCatalog();
  }

  applicationTypeName(code: string): string { return applicationTypeDisplayName(this.applicationTypes, code); }
  trackByApplicationId(_index: number, app: ApplicationDto): string { return app.applicationId; }
  countByType(type: SiteTypeCode): number {
    return this.applications.filter((a) => a.isDraft !== true && a.applicationTypeCode === type).length;
  }

  onTenantHierarchyChange(selection: ApplicationFormModel['tenantHierarchy']): void {
    this.applicationForm = {
      ...this.applicationForm,
      tenantHierarchy: selection,
    };
    this.cdr.markForCheck();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (this.view !== 'form' || !this.accessConfigOpen) return;
    if (!tenantHierarchySelectionValid(this.applicationForm.tenantHierarchy)) return;

    const panel = this.accessConfigPanel?.nativeElement;
    const target = event.target;
    if (!panel || !(target instanceof Node)) return;

    const targetElement = target instanceof Element ? target : null;
    if (targetElement?.closest('.ng-dropdown-panel')) return;
    if (panel.contains(target)) return;

    this.accessConfigOpen = false;
    this.accessConfigAutoCollapsed = true;
    this.cdr.markForCheck();
  }

  private persistTenantScopeFromForm(): void {
    const scope = tenantScopeFromSelection(this.applicationForm.tenantHierarchy);
    if (scope) writeTenantScope(scope);
  }

  private applyApplicationCatalog(catalog: ApplicationCatalog): void {
    this.applicationTypes = catalog.types;
    const partitioned = partitionRegisteredSites(catalog.applications);
    this.applications = partitioned.applications;
    this.updateTenantChartModel();
  }

  private updateTenantChartModel(): void {
    const trend = this.tenantMonthlyTrend();
    this.tenantChartCategories = trend.labels;
    this.tenantChartSeries = [
      { name: this.internalTypeLabel, data: trend.internal },
      { name: this.externalTypeLabel, data: trend.external },
      { name: this.inactiveChartLabel, data: trend.inactive },
    ];

    this.tenantChartOptions = {
      ...this.tenantChartOptions,
      xaxis: {
        ...(this.tenantChartOptions['xaxis'] as Record<string, unknown>),
        categories: this.tenantChartCategories,
      },
    };
  }

  private async loadApplicationCatalog(): Promise<void> {
    this.loading = true;
    this.cdr.markForCheck();
    this.busyService.busy();
    try {
      const result = await awaitApi(this.api.loadApplicationCatalog(this.listCatalogFilter()), WC_CONNECTORS.api.loadFailed);
      if (!result.ok) {
        this.status.setApiError(result.error, WC_CONNECTORS.api.loadFailed);
        return;
      }
      this.applyApplicationCatalog(result.value);
    } finally {
      this.busyService.idle();
      this.loading = false;
      this.cdr.markForCheck();
    }
  }
}
