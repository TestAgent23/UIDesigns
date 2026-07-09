import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import {
  MsalBroadcastService,
  MsalGuard,
  MsalGuardConfiguration,
  MsalInterceptor,
  MsalInterceptorConfiguration,
  MsalModule,
  MsalRedirectComponent,
  MsalService,
  MSAL_GUARD_CONFIG,
  MSAL_INSTANCE,
  MSAL_INTERCEPTOR_CONFIG,
} from '@azure/msal-angular';
import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  LogLevel,
  PublicClientApplication,
} from '@azure/msal-browser';
import { NgxPaginationModule } from 'ngx-pagination';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { LoginComponent } from './login/login.component';
import { provideToastr } from 'ngx-toastr';
import {
  HTTP_INTERCEPTORS,
  provideHttpClient,
  withInterceptors,
  withInterceptorsFromDi,
} from '@angular/common/http';

import { environment } from './environments/environment';
import { LoginService } from './core/services/login.service';
import { CoreModule } from './core/core.module';
import { Router, RouterModule } from '@angular/router';
import { ProcessConfigurationComponent } from './process-configuration/process-configuration.component';
//import { DataExplorerComponent } from './data-explorer/data-explorer.component';
import { MainLayoutComponent } from './main-layout/main-layout.component';
import { SharedModule } from './shared/shared.module';
import { FileProcessingStatusComponent } from './file-processing-status/file-processing-status.component';
import { ProcessStatusTemplateComponent } from './process-status-template/process-status-template.component';
import { TreeviewConfig, TreeviewModule } from '@ccondrup/ngx-treeview';
import { DashboardComponent } from './dashboard/dashboard.component';
import { DatasourcesComponent } from './datasources/datasources.component';
import { FileStatusChartComponent } from './file-status-chart/file-status-chart.component';
import { DiUtilizationComponent } from './di-utilization/di-utilization.component';
import { DiUploadsComponent } from './di-uploads/di-uploads.component';
import { AddProcessComponent } from './add-process/add-process.component';
import { ProcessConfigListComponent } from './process-config-list/process-config-list.component';
import { NewProcessConfigurationComponent } from './new-process-configuration/new-process-configuration.component';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { LoadingInterceptor } from './core/interceptors/loading.interceptor';
import { DiRegionComponent } from './di-region/di-region.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { DatePicker } from 'primeng/datepicker';
import { PaginatorModule } from 'primeng/paginator';
import { ToastrModule } from 'ngx-toastr';
import { ErrorInterceptor } from './core/interceptors/error.interceptor';
import { ProcessedFileListComponent } from './processed-file-list/processed-file-list.component';
import { FilePreviewComponent } from './new-process-configuration/file-preview/file-preview.component';
import { AdGroupComponent } from './ad-group/ad-group.component';
import { UserGroupComponent } from './user-group/user-group.component';
import { ConfirmDialogComponent } from './confirm-dialog/confirm-dialog.component';
import { RulesetListComponent } from './ruleset-list/ruleset-list.component';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { CreateRuleComponent } from './create-rule/create-rule.component';
import { UnauthorizedComponent } from './unauthorized/unauthorized.component';
//import { EibComponent } from './eib/eib.component';
import { CreateEibComponent } from './eib/create-eib/create-eib.component';
import { CustomEIBViewComponent } from './eib/custom-eib-view/custom-eib-view.component';
import { NgApexchartsModule } from 'ng-apexcharts';

import { providePrimeNG } from 'primeng/config';
import Aura from '@primeng/themes/aura';
import { RegexBuilderComponent } from './regex-builder/regex-builder.component';
import { FileFirstPreviewComponent } from './file-first-preview/file-first-preview.component';
import { TableColumnNamesComponent } from './table-column-names/table-column-names.component';
import { ApiSourceUploadComponent } from './api-source-upload/api-source-upload.component';
import { NodePropertyComponent } from './api-source-upload/node-property/node-property.component';
// #region Sharepoint Workspace - AY
import { WorkspaceConnectComponent } from './workspace-connect/workspace-connect.component';
import { SharepointWorkspaceComponent } from './workspace-connect/sharepoint-workspace/sharepoint-workspace.component';
import { FileFirstSharepointAttachComponent } from './file-first/file-first-sharepoint-attach/file-first-sharepoint-attach.component';
import { ConfigurationFirstSharepointTabComponent } from './new-process-configuration/configuration-first-sharepoint-tab/configuration-first-sharepoint-tab.component';
import { ConfigurationFirstSharepointTabNavComponent } from './new-process-configuration/configuration-first-sharepoint-tab-nav/configuration-first-sharepoint-tab-nav.component';
import { SHAREPOINT_ENV } from './workspace-connect/core/workspace-connect.types';
// #endregion
//import { ConfirmDialogComponent } from './dialogs/confirm-dialog/confirm-dialog.component';
const isIE =
  window.navigator.userAgent.indexOf('MSIE ') > -1 ||
  window.navigator.userAgent.indexOf('Trident/') > -1; // Remove this line to use Angular Universal

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();
  protectedResourceMap.set(`${environment.redirectUrl}weatherforecast`, [
    `${environment.clientId}/.default`,
  ]);
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/', [
    'user.read', 'GroupMember.Read.All'
  ]);
  // #region Sharepoint Workspace - AY
  protectedResourceMap.set(`${environment.sharepointApiBaseUrl}*`, null as unknown as string[]);
  // #endregion

  return {
    interactionType: InteractionType.Redirect,
    protectedResourceMap: protectedResourceMap,
  };
}

export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.clientId,
      authority: `https://login.microsoftonline.com/638fcbaf-ba4c-43e1-adae-5475c970fe10`,
      redirectUri: environment.redirectUrl,
      postLogoutRedirectUri: environment.redirectUrl,
      navigateToLoginRequestUrl: true,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
      storeAuthStateInCookie: isIE, // set to true for IE 11
    },
    system: {
      allowNativeBroker: false,
      allowRedirectInIframe: true,
      loggerOptions: {
        loggerCallback,
        logLevel: LogLevel.Info,
        piiLoggingEnabled: false,
      },
    },
  });
}

export function loggerCallback(logLevel: LogLevel, message: string) {
  //console.log(message);
}

export function MSALGuardConfigFactory(): MsalGuardConfiguration {
  return {
    interactionType: InteractionType.Redirect,
    authRequest: {
      scopes: [`${environment.clientId}/.default`],
    },
  };
}

@NgModule({
  declarations: [
    AppComponent,
    FileUploadComponent,
    LoginComponent,
    //DataExplorerComponent,
    FileProcessingStatusComponent,
    //ProcessingFileComponent,
    ProcessStatusTemplateComponent,
    ProcessConfigurationComponent,
    MainLayoutComponent,
    DashboardComponent,
    DatasourcesComponent,
    FileStatusChartComponent,
    DiUtilizationComponent,
    DiUploadsComponent,
    AddProcessComponent,
    ProcessConfigListComponent,
    NewProcessConfigurationComponent,
    DiRegionComponent,
    ProcessedFileListComponent,
    FilePreviewComponent,
    AdGroupComponent,
    UserGroupComponent,
    ConfirmDialogComponent,
    RulesetListComponent,
    CreateRuleComponent,
    UnauthorizedComponent,
    //EibComponent,
    CreateEibComponent,
    CustomEIBViewComponent,
    RegexBuilderComponent,
    FileFirstPreviewComponent,
    TableColumnNamesComponent,
    ApiSourceUploadComponent,
    NodePropertyComponent,
    // #region Sharepoint Workspace - AY
    ConfigurationFirstSharepointTabComponent,
    ConfigurationFirstSharepointTabNavComponent,
    // #endregion
  ],
  imports: [
    BrowserModule,
    CommonModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    CoreModule,
    SharedModule,
    MsalModule,  
    NgApexchartsModule,
    TreeviewModule,
    NgbModule,
    TableModule,
    ButtonModule,
    DatePicker,
    PaginatorModule,
    //DragDropModule,
    NgxPaginationModule,    
    ToastrModule.forRoot({
      preventDuplicates: true,
      resetTimeoutOnDuplicate: true,
      countDuplicates: true,
    }),
    // #region Sharepoint Workspace - AY
    WorkspaceConnectComponent,
    SharepointWorkspaceComponent,
    FileFirstSharepointAttachComponent,
    // #endregion
  ],
  providers: [
    providePrimeNG({
            theme: {
                preset: Aura
            }
        }),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: MsalInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: LoadingInterceptor,
      multi: true,
    },
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true,
    },
    {
      provide: MSAL_INSTANCE,
      useFactory: MSALInstanceFactory,
    },
    {
      provide: MSAL_GUARD_CONFIG,
      useFactory: MSALGuardConfigFactory,
    },
    {
      provide: MSAL_INTERCEPTOR_CONFIG,
      useFactory: MSALInterceptorConfigFactory,
    },
   
    MsalService,
    MsalGuard,
    MsalBroadcastService,
    LoginService,
    TreeviewConfig,
    provideAnimations(),
    provideToastr(),
    provideHttpClient(withInterceptorsFromDi()),
    // #region Sharepoint Workspace - AY
    {
      provide: SHAREPOINT_ENV,
      useValue: {
        production: environment.production,
        apiBaseUrl: environment.sharepointApiBaseUrl,
        apiVersion: environment.apiVersion,
        ownerKey: environment.ownerKey,
        defaultLibraryName: environment.defaultLibraryName,
        tenantName: environment.tenantName,
        clientId: environment.clientId,
        authority: environment.authority,
        hostName: environment.hostName,
        siteName: environment.siteName,
        libraryName: environment.libraryName,
        userGraphScopes: environment.userGraphScopes,
      },
    },
    // #endregion
  ],
  bootstrap: [AppComponent, MsalRedirectComponent],
})
export class AppModule {}
