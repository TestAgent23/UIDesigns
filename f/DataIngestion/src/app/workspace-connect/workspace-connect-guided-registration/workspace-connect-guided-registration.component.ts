import { animate, style, transition, trigger } from '@angular/animations';
import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, NgZone, OnDestroy, OnInit, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { environment } from '../../environments/environment';
import { WorkspaceConnectTenantHierarchyComponent } from '../core/workspace-connect-tenant-hierarchy.component';
import { WC_IMAGES } from '../core/workspace-connect.assets';
import { MODULE_BRANDING, SP_GUIDED_REGISTRATION, WC_CONNECTORS } from '../core/workspace-connect.messages';
import {
  normalizeTenantHierarchyForSave,
  SharePointTenantHierarchySelection,
  SP_ALL_SECURITY_GROUP_ID,
  tenantHierarchySelectionValid,
} from '../core/workspace-connect.tenant';
import {
  ApplicationCatalog,
  ApplicationDto,
  ApplicationTypeCode,
  ApplicationTypeDto,
  ExternalSiteConnectivityResultDto,
  SharePointLibraryDto,
  SiteConnectivityCheckRequest,
} from '../core/workspace-connect.types';
import {
  SharepointLogoComponent,
  SpIconName,
  WorkspaceConnectIconComponent,
} from '../core/workspace-connect.ui';
import {
  APPLICATION_TYPE_ID,
  ApplicationFormModel,
  ApplicationSiteFormModel,
  applicationTypeByCode,
  applicationTypeById,
  applicationTypeCodeFromId,
  awaitApi,
  emptyApplicationForm,
  emptyApplicationSite,
  parseApiError,
  parseSharePointSiteUrl,
  pickDefaultLibraryName,
  preferredLibraryNames,
  registrationTypeOptions,
  StatusAlerts,
} from '../core/workspace-connect.utils';
import { SharePointApiService } from '../services/sharepoint-api.service';
import { WorkspaceConnectAudioService } from '../services/workspace-connect-audio.service';

type GuidedMicroStepId =
  | 'identity'
  | 'owner'
  | 'access'
  | 'site-url'
  | 'site-confirm'
  | 'site-type'
  | 'entra-tenant'
  | 'entra-client'
  | 'entra-secret'
  | 'verify'
  | 'library'
  | 'review'
  | 'success';

interface PhaseTrackItem {
  id: string;
  label: string;
  done: boolean;
  active: boolean;
}

interface StepVisual {
  kind: 'icon' | 'logo' | 'image';
  icon?: SpIconName;
  src?: string;
}

const STEP_META: Record<GuidedMicroStepId, Omit<MicroStepMeta, 'coach'> & { coachKey?: keyof typeof SP_GUIDED_REGISTRATION }> = {
  identity: { id: 'identity', phase: SP_GUIDED_REGISTRATION.stepIdentity, title: SP_GUIDED_REGISTRATION.identityTitle, icon: 'building' },
  owner: { id: 'owner', phase: SP_GUIDED_REGISTRATION.stepIdentity, title: SP_GUIDED_REGISTRATION.identityTitle, icon: 'shield' },
  access: { id: 'access', phase: SP_GUIDED_REGISTRATION.stepAccess, title: SP_GUIDED_REGISTRATION.accessTitle, icon: 'hub' },
  'site-url': { id: 'site-url', phase: SP_GUIDED_REGISTRATION.stepSite, title: SP_GUIDED_REGISTRATION.siteTitle, icon: 'folder-open' },
  'site-confirm': { id: 'site-confirm', phase: SP_GUIDED_REGISTRATION.stepSite, title: SP_GUIDED_REGISTRATION.siteDetailsTitle, icon: 'check' },
  'site-type': { id: 'site-type', phase: SP_GUIDED_REGISTRATION.stepType, title: SP_GUIDED_REGISTRATION.typeTitle, icon: 'cloud' },
  'entra-tenant': { id: 'entra-tenant', phase: SP_GUIDED_REGISTRATION.stepCredentials, title: SP_GUIDED_REGISTRATION.credentialsTitle, icon: 'azure' },
  'entra-client': { id: 'entra-client', phase: SP_GUIDED_REGISTRATION.stepCredentials, title: SP_GUIDED_REGISTRATION.credentialsTitle, icon: 'azure' },
  'entra-secret': { id: 'entra-secret', phase: SP_GUIDED_REGISTRATION.stepCredentials, title: SP_GUIDED_REGISTRATION.credentialsTitle, icon: 'shield' },
  verify: { id: 'verify', phase: SP_GUIDED_REGISTRATION.stepVerify, title: SP_GUIDED_REGISTRATION.verifyTitle, icon: 'refresh' },
  library: { id: 'library', phase: SP_GUIDED_REGISTRATION.stepVerify, title: SP_GUIDED_REGISTRATION.libraryTitle, icon: 'folder' },
  review: { id: 'review', phase: SP_GUIDED_REGISTRATION.stepReview, title: SP_GUIDED_REGISTRATION.reviewTitle, icon: 'check' },
  success: { id: 'success', phase: SP_GUIDED_REGISTRATION.stepReview, title: SP_GUIDED_REGISTRATION.reviewTitle, icon: 'sparkles' },
};

interface MicroStepMeta {
  id: GuidedMicroStepId;
  phase: string;
  title: string;
  coach: string;
  icon: SpIconName;
}

@Component({
  selector: 'app-workspace-connect-guided-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    WorkspaceConnectIconComponent,
    WorkspaceConnectTenantHierarchyComponent,
    SharepointLogoComponent,
  ],
  templateUrl: './workspace-connect-guided-registration.component.html',
  styleUrls: ['./workspace-connect-guided-registration.component.css', '../workspace-connect.styles.css'],
  animations: [
    trigger('stepTransition', [
      transition(':increment', [
        style({ opacity: 0, transform: 'translateX(28px) scale(0.97)' }),
        animate('380ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateX(0) scale(1)' })),
      ]),
      transition(':decrement', [
        style({ opacity: 0, transform: 'translateX(-28px) scale(0.97)' }),
        animate('380ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateX(0) scale(1)' })),
      ]),
    ]),
    trigger('coachSwap', [
      transition('* => *', [
        style({ opacity: 0, transform: 'translateY(6px)' }),
        animate('300ms 60ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('visualFloat', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.88) translateY(8px)' }),
        animate('500ms cubic-bezier(0.22, 1, 0.36, 1)', style({ opacity: 1, transform: 'scale(1) translateY(0)' })),
      ]),
    ]),
  ],
})
export class WorkspaceConnectGuidedRegistrationComponent implements OnInit, OnDestroy {
  private readonly api = inject(SharePointApiService);
  private readonly ngZone = inject(NgZone);
  private readonly audio = inject(WorkspaceConnectAudioService);

  @Output() readonly useApplication = new EventEmitter<ApplicationDto>();
  @Output() readonly navigateHome = new EventEmitter<void>();
  @Output() readonly navigateConnectors = new EventEmitter<void>();

  readonly m = SP_GUIDED_REGISTRATION;
  readonly branding = MODULE_BRANDING;
  readonly WC_CONNECTORS = WC_CONNECTORS;
  readonly images = WC_IMAGES;

  microStepId: GuidedMicroStepId = 'identity';
  stepAnimationCounter = 0;
  applicationForm: ApplicationFormModel = emptyApplicationForm(APPLICATION_TYPE_ID.internal, {
    includeDefaultSite: false,
  });
  activeSiteIndex = 0;
  siteUrlInput = '';
  applicationTypes: ApplicationTypeDto[] = [];
  availableLibraries: SharePointLibraryDto[] = [];
  appSecretVisible = false;

  siteUrlParsing = false;
  siteUrlParsed = false;
  siteParsedSnapshot: { hostName: string; siteName: string; libraryName: string; folderPath: string } | null = null;

  checkingConnectivity = false;
  connectivityResult: ExternalSiteConnectivityResultDto | null = null;
  connectivityError = '';

  saving = false;
  savedApplication: ApplicationDto | null = null;
  status = new StatusAlerts();

  private parseUrlDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private siteUrlParseFinishTimer: ReturnType<typeof setTimeout> | null = null;
  private siteUrlParseStartedAt = 0;
  private readonly siteUrlParseMinMs = 420;

  get soundEnabled(): boolean {
    return this.audio.enabled;
  }

  get activeSite(): ApplicationSiteFormModel {
    if (!this.applicationForm.sites.length) return emptyApplicationSite();
    return this.applicationForm.sites[this.activeSiteIndex] ?? emptyApplicationSite();
  }

  get isExternalForm(): boolean {
    return this.applicationForm.applicationTypeCode === 'tp_external';
  }

  get isInternalForm(): boolean {
    return this.applicationForm.applicationTypeCode === 'tp_internal';
  }

  get typeOptions(): ApplicationTypeDto[] {
    return registrationTypeOptions(this.applicationTypes);
  }

  get selectedTypeName(): string {
    const type = applicationTypeById(this.applicationTypes, this.applicationForm.applicationTypeId);
    return type?.displayName ?? this.m.emptyValue;
  }

  get scopeSummary(): string {
    const h = this.applicationForm.tenantHierarchy;
    const parts: string[] = [];
    if (h.regionIdent) parts.push(h.regionName || String(h.regionIdent));
    if (h.subRegionCode) parts.push(h.subRegionName || h.subRegionCode);
    if (h.clientIdent) parts.push(h.clientName || String(h.clientIdent));
    if (h.securityGroupId) parts.push(h.securityGroupName || h.securityGroupId);
    return parts.length ? parts.join(' / ') : this.m.emptyValue;
  }

  get connectivityTestState(): 'idle' | 'checking' | 'success' | 'error' {
    if (this.checkingConnectivity) return 'checking';
    if (this.connectivityError) return 'error';
    if (this.connectivityResult?.isConnected) return 'success';
    return 'idle';
  }

  get stepPath(): GuidedMicroStepId[] {
    const path: GuidedMicroStepId[] = [
      'identity',
      'owner',
      'access',
      'site-url',
      'site-confirm',
      'site-type',
    ];
    if (this.isExternalForm) {
      path.push('entra-tenant', 'entra-client', 'entra-secret');
    }
    path.push('verify');
    if (this.needsLibraryStep) path.push('library');
    path.push('review');
    return path;
  }

  get currentStepIndex(): number {
    return this.stepPath.indexOf(this.microStepId);
  }

  get totalSteps(): number {
    return this.stepPath.length;
  }

  get progressPct(): number {
    if (this.microStepId === 'success') return 100;
    const idx = Math.max(0, this.currentStepIndex);
    return Math.round(((idx + 1) / this.totalSteps) * 100);
  }

  get stepOfLabel(): string {
    if (this.microStepId === 'success') return this.m.stepOf(this.totalSteps, this.totalSteps);
    return this.m.stepOf(this.currentStepIndex + 1, this.totalSteps);
  }

  get currentMeta(): MicroStepMeta {
    const base = STEP_META[this.microStepId];
    return {
      ...base,
      coach: this.coachMessage(),
    };
  }

  get stepVisual(): StepVisual {
    switch (this.microStepId) {
      case 'identity':
        return { kind: 'image', src: this.images.hero.building };
      case 'owner':
        return { kind: 'image', src: this.images.hero.shield };
      case 'access':
        return { kind: 'image', src: this.images.hero.hub };
      case 'site-url':
      case 'site-confirm':
        return { kind: 'logo' };
      case 'site-type':
        return { kind: 'image', src: this.images.sharepointGlyph };
      case 'entra-tenant':
      case 'entra-client':
      case 'entra-secret':
        return { kind: 'image', src: this.images.hero.azure };
      case 'verify':
        return { kind: 'image', src: this.images.hero.connector };
      case 'library':
        return { kind: 'image', src: this.images.folderGold };
      case 'review':
        return { kind: 'image', src: this.images.hero.workspace };
      case 'success':
        return { kind: 'icon', icon: 'sparkles' };
      default:
        return { kind: 'icon', icon: 'connector' };
    }
  }

  get phaseTrack(): PhaseTrackItem[] {
    const groups: { id: string; label: string; steps: GuidedMicroStepId[] }[] = [
      { id: 'identity', label: this.m.stepIdentity, steps: ['identity', 'owner'] },
      { id: 'access', label: this.m.stepAccess, steps: ['access'] },
      { id: 'site', label: this.m.stepSite, steps: ['site-url', 'site-confirm'] },
      { id: 'type', label: this.m.stepType, steps: ['site-type'] },
    ];
    if (this.isExternalForm) {
      groups.push({
        id: 'credentials',
        label: this.m.stepCredentials,
        steps: ['entra-tenant', 'entra-client', 'entra-secret'],
      });
    }
    groups.push({
      id: 'verify',
      label: this.m.stepVerify,
      steps: this.needsLibraryStep ? ['verify', 'library'] : ['verify'],
    });
    groups.push({ id: 'review', label: this.m.stepReview, steps: ['review', 'success'] });

    const currentIdx = groups.findIndex((g) => g.steps.includes(this.microStepId));
    return groups.map((g, i) => ({
      id: g.id,
      label: g.label,
      done: i < currentIdx || this.microStepId === 'success',
      active: i === currentIdx,
    }));
  }

  get focusQuestion(): string {
    return this.currentMeta.title;
  }

  get isFirstMicroStep(): boolean {
    return this.currentStepIndex <= 0;
  }

  get canContinue(): boolean {
    switch (this.microStepId) {
      case 'identity':
        return !!this.applicationForm.displayName.trim();
      case 'owner':
        return !!this.applicationForm.owner.trim();
      case 'access':
        return tenantHierarchySelectionValid(this.applicationForm.tenantHierarchy);
      case 'site-url':
        return !!this.activeSite.siteName.trim() && !!this.resolveSiteHost(this.activeSite);
      case 'site-confirm':
        return true;
      case 'site-type':
        return !!this.applicationForm.applicationTypeCode;
      case 'entra-tenant':
        return !!this.applicationForm.tenantId.trim();
      case 'entra-client':
        return !!this.applicationForm.clientId.trim();
      case 'entra-secret':
        return !!this.applicationForm.clientSecret.trim();
      case 'verify':
        return this.connectivityTestState === 'success' || (this.canTest && !this.checkingConnectivity);
      case 'library':
        return !!this.activeSite.libraryName.trim();
      case 'review':
        return !this.saving;
      default:
        return false;
    }
  }

  get continueLabel(): string {
    if (this.microStepId === 'site-confirm') return this.m.looksGood;
    if (this.microStepId === 'verify') {
      return this.connectivityTestState === 'success' ? this.m.continue : this.m.testConnection;
    }
    if (this.microStepId === 'review') {
      return this.reviewIsActive ? this.m.registerActive : this.m.registerAsInactive;
    }
    return this.m.continue;
  }

  get needsLibraryStep(): boolean {
    return this.availableLibraries.length > 1;
  }

  get canTest(): boolean {
    const site = this.activeSite;
    return (
      !!site.siteName.trim() &&
      !!this.resolveSiteHost(site) &&
      (!this.isExternalForm ||
        !!(this.applicationForm.tenantId.trim() && this.applicationForm.clientId.trim() && this.applicationForm.clientSecret.trim()))
    );
  }

  get reviewIsActive(): boolean {
    return !!this.connectivityResult?.isConnected;
  }

  ngOnInit(): void {
    this.applyDefaultOwner();
    this.applyDefaultSecurityGroup();
    void this.loadApplicationCatalog();
  }

  ngOnDestroy(): void {
    if (this.parseUrlDebounceTimer) clearTimeout(this.parseUrlDebounceTimer);
    if (this.siteUrlParseFinishTimer) clearTimeout(this.siteUrlParseFinishTimer);
  }

  coachMessage(): string {
    switch (this.microStepId) {
      case 'identity':
        return this.m.identityCoach;
      case 'owner':
        return this.m.ownerCoach;
      case 'access':
        return this.m.accessCoach;
      case 'site-url':
        return this.m.siteUrlCoach;
      case 'site-confirm':
        return this.m.siteConfirmCoach;
      case 'site-type':
        return this.m.typeCoach;
      case 'entra-tenant':
        return this.m.entraTenantCoach;
      case 'entra-client':
        return this.m.entraClientCoach;
      case 'entra-secret':
        return this.m.entraSecretCoach;
      case 'verify':
        if (this.connectivityTestState === 'checking') return this.m.verifyCoachTesting;
        if (this.connectivityTestState === 'success') return this.m.verifyCoachSuccess;
        if (this.connectivityTestState === 'error') return this.m.verifyCoachFailed;
        return this.m.verifyCoachIdle;
      case 'library':
        return this.m.libraryCoach;
      case 'review':
        return this.reviewIsActive ? this.m.reviewCoachActive : this.m.reviewCoachInactive;
      case 'success':
        return this.savedApplication?.isActive === false
          ? this.m.successInactive(this.savedApplication.displayName)
          : this.m.successActive(this.savedApplication?.displayName ?? '');
      default:
        return '';
    }
  }

  resolveSiteHost(site: ApplicationSiteFormModel): string {
    return site.hostName.trim() || (this.isInternalForm ? (environment.hostName ?? '') : '');
  }

  isInternalType(id: number): boolean {
    return applicationTypeCodeFromId(this.applicationTypes, id) === 'tp_internal';
  }

  typeDescription(id: number): string {
    return this.isInternalType(id) ? this.m.typeInternalHint : this.m.typeExternalHint;
  }

  setType(id: number): void {
    const wasExternal = this.isExternalForm;
    this.setRegistrationType(id);
    if (wasExternal !== this.isExternalForm && this.isOnEntraStep()) {
      this.microStepId = 'site-type';
      this.speakCurrentGuidance();
    }
  }

  toggleSound(): void {
    if (this.audio.toggle()) {
      this.speakCurrentGuidance();
    }
  }

  primeAudio(): void {
    this.audio.prime();
  }

  onSiteUrlChange(): void {
    const trimmed = this.siteUrlInput.trim();
    if (!trimmed) {
      this.siteUrlParsing = false;
      this.siteUrlParsed = false;
      if (this.parseUrlDebounceTimer) clearTimeout(this.parseUrlDebounceTimer);
      return;
    }
    this.beginSiteUrlParse();
    if (this.parseUrlDebounceTimer) clearTimeout(this.parseUrlDebounceTimer);
    this.parseUrlDebounceTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.applySiteUrl({ silent: true });
        this.endSiteUrlParse();
      });
    }, 450);
  }

  applySiteUrl(options?: { silent?: boolean }): void {
    const trimmed = this.siteUrlInput.trim();
    if (!trimmed) return;
    const parsed = parseSharePointSiteUrl(trimmed);
    if (!parsed) {
      this.siteUrlParsed = false;
      if (!options?.silent) {
        this.status.setApiErrorMessage(this.WC_CONNECTORS.validation.urlParse);
      }
      return;
    }
    this.status.clear();
    if (!this.applicationForm.sites.length) {
      this.applicationForm.sites = [emptyApplicationSite()];
      this.activeSiteIndex = 0;
    }
    const site = this.activeSite;
    if (parsed.hostName) site.hostName = parsed.hostName;
    if (parsed.siteName) site.siteName = parsed.siteName;
    if (parsed.libraryName) site.libraryName = parsed.libraryName;
    if (parsed.folderPath) site.folderPath = parsed.folderPath;
    this.setActiveSiteHostFromEnv();
    this.siteParsedSnapshot = {
      hostName: this.resolveSiteHost(site),
      siteName: site.siteName,
      libraryName: site.libraryName,
      folderPath: site.folderPath,
    };
    this.siteUrlParsed = true;
    this.siteUrlInput = '';
    this.connectivityResult = null;
    this.connectivityError = '';
    this.availableLibraries = [];
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

  onTenantHierarchyChange(selection: SharePointTenantHierarchySelection): void {
    this.applicationForm.tenantHierarchy = selection;
  }

  onLibraryChange(libraryName: string): void {
    this.activeSite.libraryName = libraryName;
  }

  previousStep(): void {
    if (this.microStepId === 'success') {
      this.stepAnimationCounter--;
      this.microStepId = 'review';
      this.speakCurrentGuidance();
      return;
    }
    const idx = this.currentStepIndex - 1;
    if (idx >= 0) {
      this.stepAnimationCounter--;
      this.microStepId = this.stepPath[idx];
      this.speakCurrentGuidance();
    }
  }

  async continueStep(): Promise<void> {
    if (this.microStepId === 'verify') {
      if (this.connectivityTestState === 'success') {
        this.advanceMicroStep();
        return;
      }
      await this.testConnectivity();
      return;
    }
    if (this.microStepId === 'review') {
      await this.finish(!this.reviewIsActive);
      return;
    }
    this.advanceMicroStep();
  }

  cancel(event?: Event): void {
    event?.stopPropagation();
    this.audio.stop();
    if (this.savedApplication) {
      this.browseWorkspace();
    } else {
      this.navigateHome.emit();
    }
  }

  async testConnectivity(): Promise<void> {
    const site = this.activeSite;
    const siteName = site.siteName.trim();
    const hostName = this.resolveSiteHost(site);

    if (!siteName) {
      this.connectivityError = this.WC_CONNECTORS.validation.sitePathBeforeTest;
      return;
    }
    if (!hostName) {
      this.connectivityError = this.WC_CONNECTORS.validation.hostUnresolved;
      return;
    }
    if (
      this.isExternalForm &&
      !(this.applicationForm.tenantId.trim() && this.applicationForm.clientId.trim() && this.applicationForm.clientSecret.trim())
    ) {
      this.connectivityError = this.WC_CONNECTORS.validation.entraRequired;
      return;
    }

    this.connectivityError = '';
    this.connectivityResult = null;
    this.checkingConnectivity = true;
    this.availableLibraries = [];
    this.audio.speak(this.m.verifyCoachTesting);

    try {
      const request = this.buildConnectivityRequest(siteName);
      const result = await awaitApi(this.api.validateSiteConnectivity(request), this.WC_CONNECTORS.api.validateFailed);
      if (!result.ok) {
        this.connectivityError = parseApiError(result.error, this.WC_CONNECTORS.api.validateFailed);
        this.audio.speak(this.m.verifyCoachFailed);
        return;
      }
      this.connectivityResult = result.value;
      if (result.value.isConnected) {
        this.availableLibraries = result.value.libraries ?? [];
        this.activeSite.libraryName =
          pickDefaultLibraryName(
            this.availableLibraries,
            preferredLibraryNames({ primary: environment.libraryName || environment.defaultLibraryName }),
          ) || this.activeSite.libraryName;
        this.connectivityError = '';
        this.audio.speak(this.m.verifyCoachSuccess);
      } else {
        this.connectivityError = this.WC_CONNECTORS.api.validateFailed;
        this.audio.speak(this.m.verifyCoachFailed);
      }
    } catch (err) {
      this.connectivityError = parseApiError(err, this.WC_CONNECTORS.api.validateFailed);
      this.audio.speak(this.m.verifyCoachFailed);
    } finally {
      this.checkingConnectivity = false;
    }
  }

  async finish(asInactive = false): Promise<void> {
    if (this.saving) return;
    this.saving = true;
    this.status.clear();
    try {
      const payload = this.buildSavePayload(asInactive);
      const result = await awaitApi(this.api.saveApplication(payload), this.WC_CONNECTORS.api.saveFailed);
      if (!result.ok) {
        this.status.setApiError(result.error, this.WC_CONNECTORS.api.saveFailed);
        return;
      }
      this.savedApplication = result.value;
      this.navigateConnectors.emit();
      return;
    } catch (err) {
      this.status.setApiError(parseApiError(err, this.WC_CONNECTORS.api.saveFailed), this.WC_CONNECTORS.api.saveFailed);
      this.audio.speak(this.WC_CONNECTORS.api.saveFailed);
    } finally {
      this.saving = false;
    }
  }

  browseWorkspace(): void {
    if (this.savedApplication) {
      this.useApplication.emit(this.savedApplication);
    }
  }

  skipToReview(): void {
    this.stepAnimationCounter++;
    this.microStepId = 'review';
    this.speakCurrentGuidance();
  }

  private advanceMicroStep(): void {
    const idx = this.currentStepIndex + 1;
    if (idx < this.stepPath.length) {
      this.stepAnimationCounter++;
      this.microStepId = this.stepPath[idx];
      this.speakCurrentGuidance();
    }
  }

  private speakCurrentGuidance(): void {
    this.audio.speak(this.coachMessage());
  }

  private isOnEntraStep(): boolean {
    return ['entra-tenant', 'entra-client', 'entra-secret'].includes(this.microStepId);
  }

  private beginSiteUrlParse(): void {
    this.siteUrlParsing = true;
    this.siteUrlParseStartedAt = Date.now();
  }

  private endSiteUrlParse(): void {
    if (this.siteUrlParseFinishTimer) clearTimeout(this.siteUrlParseFinishTimer);
    const elapsed = Date.now() - this.siteUrlParseStartedAt;
    const remaining = Math.max(0, this.siteUrlParseMinMs - elapsed);
    this.siteUrlParseFinishTimer = setTimeout(() => {
      this.ngZone.run(() => {
        this.siteUrlParsing = false;
        this.siteUrlParseFinishTimer = null;
      });
    }, remaining);
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

  private setRegistrationType(applicationTypeId: number): void {
    const type = applicationTypeById(this.applicationTypes, applicationTypeId);
    this.applicationForm.applicationTypeId = applicationTypeId;
    this.applicationForm.applicationTypeCode = (type?.code ??
      applicationTypeCodeFromId(this.applicationTypes, applicationTypeId)) as ApplicationTypeCode;
    this.setActiveSiteHostFromEnv();
    this.connectivityResult = null;
    this.connectivityError = '';
    this.availableLibraries = [];
  }

  private setActiveSiteHostFromEnv(): void {
    const site = this.activeSite;
    if (!site) return;
    if (this.isInternalForm) {
      site.hostName = environment.hostName ?? '';
    }
  }

  private buildConnectivityRequest(siteName: string): SiteConnectivityCheckRequest {
    const hostName = this.resolveSiteHost(this.activeSite);
    if (this.isInternalForm) {
      return { siteName, hostName };
    }
    return {
      siteName,
      hostName,
      tenantId: this.applicationForm.tenantId.trim(),
      clientId: this.applicationForm.clientId.trim(),
      clientSecret: this.applicationForm.clientSecret.trim(),
    };
  }

  private buildSavePayload(asInactive: boolean): Partial<ApplicationDto> {
    const f = this.applicationForm;
    const site = this.activeSite;
    const hierarchy = normalizeTenantHierarchyForSave(f.tenantHierarchy);
    const hostName = this.resolveSiteHost(site);
    const siteName = site.siteName.trim();
    const isActive = !asInactive && !!this.connectivityResult?.isConnected;

    return {
      applicationTypeCode: f.applicationTypeCode,
      ownerKey: environment.ownerKey ?? 'system',
      owner: f.owner.trim(),
      ownerUpn: f.ownerUpn.trim() || undefined,
      displayName: f.displayName.trim() || siteName,
      regionIdent: hierarchy.regionIdent,
      regionName: hierarchy.regionName,
      subRegionCode: hierarchy.subRegionCode,
      subRegionName: hierarchy.subRegionName,
      clientIdent: hierarchy.clientIdent,
      clientName: hierarchy.clientName,
      securityGroupId: hierarchy.securityGroupId,
      securityGroupName: hierarchy.securityGroupName,
      isActive,
      hostName,
      siteName,
      libraryName: site.libraryName.trim() || undefined,
      sites: [
        {
          hostName,
          siteName,
          libraryName: site.libraryName.trim() || undefined,
          folderPath: site.folderPath.trim() || undefined,
          sortOrder: 0,
        },
      ],
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
  }

  private async loadApplicationCatalog(): Promise<void> {
    try {
      const result = await awaitApi(this.api.loadApplicationCatalog(), this.WC_CONNECTORS.api.catalogFailed);
      if (!result.ok) {
        this.status.setApiError(result.error, this.WC_CONNECTORS.api.catalogFailed);
        return;
      }
      const catalog: ApplicationCatalog = result.value;
      this.applicationTypes = catalog.types ?? [];

      const preferredInternal = applicationTypeByCode(this.applicationTypes, 'tp_internal');
      if (preferredInternal) {
        this.setRegistrationType(preferredInternal.applicationTypeId);
      } else if (this.applicationTypes.length) {
        this.setRegistrationType(this.applicationTypes[0].applicationTypeId);
      }
    } catch (err) {
      this.status.setApiError(parseApiError(err, this.WC_CONNECTORS.api.catalogFailed), this.WC_CONNECTORS.api.catalogFailed);
    }
  }
}
