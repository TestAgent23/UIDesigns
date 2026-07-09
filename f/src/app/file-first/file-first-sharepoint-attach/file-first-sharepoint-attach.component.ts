import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';
import { SP_INTEGRATION } from '../../workspace-connect/core/workspace-connect.messages';
import {
  SharePointTenantHierarchyFilter,
  tenantFilterFromClientInfo,
  tenantFiltersEqual,
} from '../../workspace-connect/core/workspace-connect.tenant';
import { WorkspaceConnectIconComponent } from '../../workspace-connect/core/workspace-connect.ui';
import { SharePointItemDto } from '../../workspace-connect/core/workspace-connect.types';
import { formatFileSize } from '../../workspace-connect/core/workspace-connect.utils';
import { SharePointApiService } from '../../workspace-connect/services/sharepoint-api.service';
import { SharePointUserApiService, SharePointUserAuthService } from '../../workspace-connect/services/sharepoint-user.service';
import { SharepointWorkspaceComponent } from '../../workspace-connect/sharepoint-workspace/sharepoint-workspace.component';

@Component({
  selector: 'app-file-first-sharepoint-attach',
  standalone: true,
  imports: [CommonModule, SharepointWorkspaceComponent, WorkspaceConnectIconComponent],
  templateUrl: './file-first-sharepoint-attach.component.html',
  styleUrls: [
    '../../workspace-connect/workspace-connect-shell.css',
    './file-first-sharepoint-attach.component.css',
    '../../workspace-connect/workspace-connect.styles.css',
  ],
  host: {
    '[class.ff-viewer-open]': 'viewerOpen',
  },
})
export class FileFirstSharepointAttachComponent implements OnInit, OnChanges, OnDestroy {
  private readonly api = inject(SharePointApiService);
  private readonly userApi = inject(SharePointUserApiService);
  private readonly auth = inject(SharePointUserAuthService);

  readonly m = SP_INTEGRATION.fileFirst;

  @Input() clientInfoForm: FormGroup | null = null;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() back = new EventEmitter<void>();

  @ViewChild(SharepointWorkspaceComponent)
  protected workspace!: SharepointWorkspaceComponent;

  protected hierarchyFilter: SharePointTenantHierarchyFilter | null = null;
  protected fileLoading = false;
  protected error = '';
  private _viewerOpen = false;
  private clientInfoSub?: Subscription;

  async ngOnInit(): Promise<void> {
    if (this.auth.isConfigured) await this.auth.initialize();
    this.syncHierarchyFilter();
    this.bindClientInfoWatch();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['clientInfoForm']) {
      this.bindClientInfoWatch();
      this.syncHierarchyFilter();
    }
  }

  ngOnDestroy(): void {
    this.clientInfoSub?.unsubscribe();
  }

  protected get accessReady(): boolean {
    return !!this.hierarchyFilter?.regionIdent;
  }

  protected get selectedItem(): SharePointItemDto | null {
    return this.workspace?.selectedItem ?? null;
  }

  protected get hasFileSelected(): boolean {
    const item = this.selectedItem;
    return item != null && !item.isFolder && !this.fileLoading;
  }

  protected get viewerOpen(): boolean {
    return this._viewerOpen;
  }

  protected onViewerOpenChange(open: boolean): void {
    this._viewerOpen = open;
  }

  protected formatSize(bytes: number): string {
    return formatFileSize(bytes);
  }

  protected async useSelectedFile(): Promise<void> {
    const item = this.workspace?.selectedItem;
    if (!item || item.isFolder) return;

    this.workspace?.closeViewer();
    this.fileLoading = true;
    this.error = '';

    const filePath = item.path ?? item.name;

    try {
      const blob = this.workspace?.isModeUser
        ? await firstValueFrom(this.userApi.fetchFileBlob(this.workspace.selectedUserLibraryDriveId(), filePath))
        : await firstValueFrom(this.api.fetchFileBlob(this.workspace.workspaceConnection, filePath));
      this.fileSelected.emit(new File([blob], item.name));
    } catch {
      this.error = this.m.downloadFailed;
    } finally {
      this.fileLoading = false;
    }
  }

  protected goBack(): void {
    this.back.emit();
  }

  private bindClientInfoWatch(): void {
    this.clientInfoSub?.unsubscribe();
    this.clientInfoSub = this.clientInfoForm?.valueChanges.subscribe(() => {
      this.syncHierarchyFilter();
    });
  }

  private syncHierarchyFilter(): void {
    const next = tenantFilterFromClientInfo(this.clientInfoForm?.value ?? null);
    if (tenantFiltersEqual(this.hierarchyFilter, next)) return;
    this.hierarchyFilter = next;
  }
}
