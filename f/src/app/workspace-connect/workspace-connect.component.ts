import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { WorkspaceConnectHomeComponent } from './workspace-connect-home/workspace-connect-home.component';
import { WorkspaceConnectConnectorsComponent } from './workspace-connect-connectors/workspace-connect-connectors.component';
import { WorkspaceConnectGuidedRegistrationComponent } from './workspace-connect-guided-registration/workspace-connect-guided-registration.component';
import { SharepointWorkspaceComponent } from './sharepoint-workspace/sharepoint-workspace.component';
import { ApplicationDto } from './core/workspace-connect.types';
import { MODULE_BRANDING } from './core/workspace-connect.messages';
import { fireAndForget } from './core/workspace-connect.utils';
import { SharePointApiService } from './services/sharepoint-api.service';
import { SharePointUserAuthService } from './services/sharepoint-user.service';
import {
  WorkspaceConnectBreadcrumbComponent,
  WcModuleBreadcrumbId,
  WcModuleBreadcrumbItem,
} from './core/workspace-connect.ui';

type WcView = 'home' | 'connectors' | 'guided-registration' | 'sharepoint-workspace';

@Component({
  selector: 'app-workspace-connect',
  standalone: true,
  imports: [
    CommonModule,
    WorkspaceConnectHomeComponent,
    WorkspaceConnectConnectorsComponent,
    WorkspaceConnectGuidedRegistrationComponent,
    SharepointWorkspaceComponent,
    WorkspaceConnectBreadcrumbComponent,
  ],
  templateUrl: './workspace-connect.component.html',
  styleUrls: ['./workspace-connect-shell.css', './workspace-connect.styles.css'],
})
export class WorkspaceConnectComponent implements OnInit {
  private readonly auth = inject(SharePointUserAuthService);
  private readonly api = inject(SharePointApiService);
  readonly branding = MODULE_BRANDING;

  @ViewChild(WorkspaceConnectConnectorsComponent) private connectorsRef?: WorkspaceConnectConnectorsComponent;

  view: WcView = 'home';
  pendingApplicationId: string | null = null;
  connectorsSubView: 'list' | 'form' = 'list';
  connectorsFormTitle = '';

  async ngOnInit(): Promise<void> {
    if (this.auth.isConfigured) await this.auth.initialize();
  }

  get moduleBreadcrumbs(): WcModuleBreadcrumbItem[] {
    const root: WcModuleBreadcrumbItem = { id: 'home', label: this.branding.breadcrumbRoot };
    switch (this.view) {
      case 'home':
        return [root];
      case 'connectors': {
        const items: WcModuleBreadcrumbItem[] = [
          root,
          { id: 'connector-sharepoint', label: this.branding.sharePointConnectNavTitle },
        ];
        if (this.connectorsSubView === 'form') {
          items.push({
            id: 'connector-register',
            label: this.connectorsFormTitle || this.branding.connectorRegisterNavTitle,
          });
        }
        return items;
      }
      case 'guided-registration':
        return [root, { id: 'guided-register', label: this.branding.guidedRegisterNavTitle }];
      case 'sharepoint-workspace':
        return [root, { id: 'sharepoint-workspace', label: this.branding.browseNavTitle }];
      default:
        return [root];
    }
  }

  onBreadcrumbNavigate(id: WcModuleBreadcrumbId): void {
    switch (id) {
      case 'home':
        this.goHome();
        break;
      case 'connector-sharepoint':
        this.goConnectors();
        void this.connectorsRef?.showList();
        break;
      case 'connector-register':
        this.goRegister();
        break;
      case 'guided-register':
        this.goGuidedRegister();
        break;
      case 'sharepoint-workspace':
        this.goSharepointWorkspace();
        break;
      default:
        break;
    }
  }

  onConnectorsViewChange(event: { view: 'list' | 'form'; formTitle?: string }): void {
    this.connectorsSubView = event.view;
    this.connectorsFormTitle = event.formTitle ?? '';
  }

  goHome(): void {
    this.view = 'home';
    this.pendingApplicationId = null;
    this.connectorsSubView = 'list';
    this.connectorsFormTitle = '';
  }

  goConnectors(): void {
    this.view = 'connectors';
    this.pendingApplicationId = null;
    this.connectorsSubView = 'list';
    this.connectorsFormTitle = '';
  }

  goRegister(): void {
    this.view = 'connectors';
    this.pendingApplicationId = null;
    this.connectorsSubView = 'form';
    this.connectorsFormTitle = '';
    setTimeout(() => this.connectorsRef?.showForm(), 0);
  }

  goGuidedRegister(): void {
    this.view = 'guided-registration';
    this.pendingApplicationId = null;
    this.connectorsSubView = 'list';
    this.connectorsFormTitle = '';
  }

  goSharepointWorkspace(): void {
    this.view = 'sharepoint-workspace';
  }

  onUseApplication(app: ApplicationDto): void {
    this.pendingApplicationId = app.applicationId;
    this.view = 'sharepoint-workspace';
    const account = this.auth.account();
    fireAndForget(this.api.recordApplicationUsage(app.applicationId, {
      displayName: app.displayName,
      usedByUpn: account?.username,
      usedByDisplayName: account?.name,
    }));
  }

  onLaunchApplicationConsumed(): void {
    this.pendingApplicationId = null;
  }
}
