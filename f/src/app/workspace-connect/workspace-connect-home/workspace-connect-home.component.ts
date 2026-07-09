import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MODULE_BRANDING, SP_HOME_HELP, SP_HOME_PAGE } from '../core/workspace-connect.messages';
import { WC_IMAGES } from '../core/workspace-connect.assets';
import {
  GoogleDriveLogoComponent,
  WorkspaceConnectIconComponent,
  SharepointLogoComponent,
} from '../core/workspace-connect.ui';

@Component({
  selector: 'app-workspace-connect-home',
  standalone: true,
  imports: [CommonModule, WorkspaceConnectIconComponent, SharepointLogoComponent, GoogleDriveLogoComponent],
  templateUrl: './workspace-connect-home.component.html',
  styleUrls: ['./workspace-connect-home.component.css', '../workspace-connect.styles.css'],
})
export class WorkspaceConnectHomeComponent {
  @Output() openSharepointWorkspace = new EventEmitter<void>();
  @Output() openConnectors = new EventEmitter<void>();
  @Output() openRegister = new EventEmitter<void>();
  @Output() openGuidedRegister = new EventEmitter<void>();

  readonly branding = MODULE_BRANDING;
  readonly page = SP_HOME_PAGE;
  readonly help = SP_HOME_HELP;
  readonly images = WC_IMAGES;

  readonly particles = Array.from({ length: 14 }, (_, i) => i);
}
