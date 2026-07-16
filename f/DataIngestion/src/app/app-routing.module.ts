import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AddProcessComponent } from './add-process/add-process.component';
import { ApiSourceUploadComponent } from './api-source-upload/api-source-upload.component';
import { addEIBAccessGuard } from './core/guards/add-eib-access.guard';
import { WorkspaceConnectAccessGuard } from './core/guards/workspace-connect-access.guard';
import { OfflineModuleResolver } from './core/resolvers/offline-module.resolver';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DatasourcesComponent } from './datasources/datasources.component';
import { CreateEibComponent } from './eib/create-eib/create-eib.component';
import { FileProcessingStatusComponent } from './file-processing-status/file-processing-status.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { LoginComponent } from './login/login.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { NewProcessConfigurationComponent } from './new-process-configuration/new-process-configuration.component';
import { ProcessConfigListComponent } from './process-config-list/process-config-list.component';
import { ProcessConfigurationComponent } from './process-configuration/process-configuration.component';
import { ProcessedFileListComponent } from './processed-file-list/processed-file-list.component';
import { RulesetListComponent } from './ruleset-list/ruleset-list.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
import { UserGroupComponent } from './user-group/user-group.component';
// #region Sharepoint Workspace - AY
import { WorkspaceConnectComponent } from './workspace-connect/workspace-connect.component';
// #endregion

const routes: Routes = [
  {
    path: '',
    component: LoginComponent,
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'mainlayout',
    component: MainLayoutComponent,
    // children: [
    //   {
    //     path: 'file-upload',
    //     component: FileUploadComponent
    //   },
    //   {
    //     path: 'process-configuration',
    //     component: ProcessConfigurationComponent
    //   }
    // ]
  },
  {
    path: 'file-upload',
    component: FileUploadComponent,
  },
  {
    path: 'file-processing-status',
    component: FileProcessingStatusComponent,
  },
  {
    path: 'file-processing-status/:id',
    component: FileProcessingStatusComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
  },
  {
    path: 'add',
    component: DatasourcesComponent,
  },
  {
    path: 'user-group',
    component: UserGroupComponent,
  },
  {
    path: 'process-configuration',
    component: ProcessConfigurationComponent,
  },
  {
    path: 'add-process',
    component: AddProcessComponent,
    resolve: { lookups: OfflineModuleResolver }
  },
  {
    path: 'add-process/:id',
    component: NewProcessConfigurationComponent,
    resolve: { lookups: OfflineModuleResolver }
  },
  {
    path: 'add-process/:id/:tabName',
    component: NewProcessConfigurationComponent,
    resolve: { lookups: OfflineModuleResolver }
  },
  {
    path: 'process-config-list',
    component: ProcessConfigListComponent,
  },
  {
    path: 'process-configuration/:id',
    component: NewProcessConfigurationComponent,
    resolve: { lookups: OfflineModuleResolver }
  },
  {
    path: 'process-configuration/:id/:tabName',
    component: NewProcessConfigurationComponent,
    resolve: { lookups: OfflineModuleResolver }
  },
  {
    path: 'processed-file-list',
    component: ProcessedFileListComponent,
  },
  {
    path: 'ruleset-list',
    component: RulesetListComponent,
    //canActivate : [GlobalRuleAccessGuard]
  },
  {
    path: 'eib',
    //component: EibComponent
    loadChildren: () =>
      import('./eib/eib.module').then(m => m.EibModule)
  },
  {
    path: 'profiling',
    //component: EibComponent
    loadChildren: () =>
      import('./profiling/profiling.module').then(m => m.ProfilingModule)
  },
  {
    path: 'create-eib',
    component: CreateEibComponent,
    canActivate: [addEIBAccessGuard]
  },
  {
    path: 'api-source',
    component: ApiSourceUploadComponent
  },
  // #region Workspace Connect - AY
  {
    path: 'workspace-connect',
    component: WorkspaceConnectComponent,
    canActivate: [WorkspaceConnectAccessGuard],
  },
  {
    path: 'ingestion-console',
    redirectTo: 'workspace-connect',
    pathMatch: 'full',
  },
  // #endregion
  {
    path: 'unauthorized',
    component: UnauthorizedComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule { }
