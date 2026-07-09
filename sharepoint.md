# SharePoint Frontend Integration Tracking

> **Full handoff (DB + API + FE + tenant hierarchy):** see [`WORKSPACE_CONNECT_CHANGES.md`](./WORKSPACE_CONNECT_CHANGES.md).

Frontend changes only, outside `app/sharepoint/`. Two categories: **new SharePoint integration components** vs **existing DI files extended for SharePoint**.

## Scope

| In scope | Out of scope |
|----------|--------------|
| `FRONTEND/src/app/**` except `sharepoint/*` | `app/sharepoint/*` — workspace UI, browse, API services, types (separate module) |
| New components under `file-first/`, `new-process-configuration/` | `app/environments/*` |
| Existing DI screens/services wired to SharePoint | Backend / Function App |

---

## Category 1 — New SharePoint integration components

New files created to embed SharePoint into DI flows. They use `app/sharepoint/sharepoint-workspace` and SharePoint services under the hood.

### Configuration First (process type `6`)

| File | Changes |
|------|---------|
| `new-process-configuration/configuration-first-sharepoint-tab/configuration-first-sharepoint-tab.component.ts` | Hosts workspace in **process-config** mode. Validates application + library selection. Emits `ProcessConfigSharePointSelection` to parent. Reloads saved selection on edit. |
| `new-process-configuration/configuration-first-sharepoint-tab/configuration-first-sharepoint-tab.component.html` | Workspace embed + selection summary (application, site, library, folder). |
| `new-process-configuration/configuration-first-sharepoint-tab/configuration-first-sharepoint-tab.component.css` | Layout and styling for the SharePoint settings tab in the wizard. |
| `new-process-configuration/configuration-first-sharepoint-tab-nav/configuration-first-sharepoint-tab-nav.component.ts` | SharePoint Settings tab button; visible only when process type is SharePoint (`6`). |
| `new-process-configuration/configuration-first-sharepoint-tab-nav/configuration-first-sharepoint-tab-nav.component.html` | Tab nav markup for `sharepoint-settings-tab`. |
| `new-process-configuration/configuration-first-sharepoint-tab-nav/configuration-first-sharepoint-tab-nav.component.css` | Tab nav styling. |

**User flow:** Process type **SharePoint Workspace** → SharePoint Settings tab → pick app / site / library / folder → parent wizard saves IDs on config payload.

### File First upload

| File | Changes |
|------|---------|
| `file-first/file-first-sharepoint-attach/file-first-sharepoint-attach.component.ts` | Standalone component. Embeds workspace in **file-pick** mode. Downloads selected file from SharePoint (delegated or app connection). Emits `File` to parent. |
| `file-first/file-first-sharepoint-attach/file-first-sharepoint-attach.component.html` | Workspace UI + confirm/download actions. |
| `file-first/file-first-sharepoint-attach/file-first-sharepoint-attach.component.css` | Layout for the SharePoint attach overlay. |

**User flow:** File Upload → choose SharePoint source → pick file → blob downloaded → same pipeline as local file upload.

### Related helper (lives in `app/sharepoint/`, not listed above)

`sharepoint/integration/configuration-first.sharepoint.ts` — process type `6`, location type `4`, tab IDs, `resolveLocationTypeId()`, `sharePointFileProcessFields()`.

---

## Category 2 — Existing DI files modified for SharePoint

Original DI screens and services. SharePoint is additive; types 1–3 behavior is unchanged.

### App shell & navigation

| File | What changed |
|------|--------------|
| `app/app.module.ts` | Registers SharePoint components (`ConfigurationFirstSharepointTab*`, `SharepointComponent`, `FileFirstSharepointAttachComponent`, `SharepointWorkspaceComponent`). Provides `SHAREPOINT_ENV` from environment. Registers `GuestInterceptor` for local/guest dev. |
| `app/app-routing.module.ts` | Route `ingestion-console` → SharePoint console. Routes `add-process/:id` and `add-process/:id/:tabName` for editing config and opening SharePoint tab directly. |
| `app/main-layout/main-layout.component.html` | Sidebar link **Ingestion Console** → `/ingestion-console`. |
| `app/app.component.ts` | After MSAL login, syncs account into SharePoint user auth service when configured. |

### Configuration First wizard

| File | What changed |
|------|--------------|
| `new-process-configuration/new-process-configuration.component.ts` | Process type `6`: hide blob/on-prem fields and validators. Load SharePoint source on edit (`getSharePointSourceByConfigId`). Validate SharePoint tab before save. Add SharePoint fields to save payload. Map `processTypeId` → `locationTypeId` `4` via `resolveLocationTypeId()`. |
| `new-process-configuration/new-process-configuration.component.html` | SharePoint tab nav + tab pane components in wizard when process type is SharePoint. |
| `new-process-configuration/new-process-configuration.component.css` | Wizard layout adjustments for SharePoint tab. |

### File First upload

| File | What changed |
|------|--------------|
| `file-upload/file-upload.component.ts` | Local vs SharePoint source toggle. `onSharepointFileSelected()` passes downloaded SharePoint file into existing `onFileChange` / preview flow. |
| `file-upload/file-upload.component.html` | Source toggle buttons. Conditional render of `file-first-sharepoint-attach` when SharePoint is selected. |
| `file-upload/file-upload.component.css` | Styles when SharePoint attach overlay is active. |

### Process configuration list

| File | What changed |
|------|--------------|
| `process-config-list/process-config-list.component.ts` | For process type `6`: fetch SharePoint source details for view modal. Edit navigates to `/add-process/:id/sharepoint-settings-tab`. |
| `process-config-list/process-config-list.component.html` | Detail modal shows application, site, library, folder for SharePoint configs. |

### Core models & services

| File | What changed |
|------|--------------|
| `core/models/fileProcessConfig.ts` | SharePoint fields on save model (`sharePointApplicationId`, `sharePointApplicationSiteId`, `sharePointLibraryName`, `sharePointFolderPath`). Same fields + display names on load model. New `FlpSharePointSourceDetail` for edit API response. |
| `core/services/configuration.service.ts` | `getSharePointSourceByConfigId()` calling `GET api/ProcessConfiguration/GetSharePointSourceByConfigId`. |

### Auth & guest dev

| File | What changed |
|------|--------------|
| `core/config/msal.config.ts` | MSAL client, authority, and Graph scopes aligned with SharePoint environment for delegated file access. |
| `core/interceptors/guest.interceptor.ts` | SharePoint plugin APIs always call real backend. Config save/list endpoints also call real backend in guest mode so SharePoint configs can persist. |
| `core/interceptors/error.interceptor.ts` | Bypass DI token gate for Graph URLs and SharePoint plugin API URLs. |
| `core/guest/guest-mock.data.ts` | Process type `6` in mock process types. Extra guest mocks so configuration-first save and naming work offline. |

---

## User journeys → files

| Journey | New components (Cat. 1) | DI modifications (Cat. 2) |
|---------|-------------------------|----------------------------|
| Create SharePoint process config | `configuration-first-sharepoint-tab*` | `new-process-configuration.*`, `fileProcessConfig.ts`, `configuration.service.ts` |
| Edit SharePoint config from list | `configuration-first-sharepoint-tab*` | `process-config-list.*`, `configuration.service.ts` |
| Open Ingestion Console | — | `app-routing`, `main-layout`, `app.module` → `sharepoint.component` |
| Upload from SharePoint (file-first) | `file-first-sharepoint-attach` | `file-upload.*` |
| Guest / local dev with SharePoint | — | `guest.interceptor`, `guest-mock.data`, `msal.config`, `app.component` |

---

## Not covered here

- **`app/sharepoint/*`** — full SharePoint module (applications, workspace browser, preview, API layer).
- **`app/environments/*`** — API base URL, Graph scopes, Entra settings.
- **Backend** — persist SharePoint source, scheduler, file ingestion.

---

## File First — SharePoint integration

We added SharePoint as a file source option in the File First upload section. The user chooses Local upload or SharePoint before attaching a file. (In `file-upload.component.ts` we added the `showSharepoint` flag, `toggleFileSource()` to switch between Local and SharePoint, and `onSharepointFileSelected()` to receive the downloaded file from the child component and pass it into the existing `onFileChange()` flow.)

When the user picks SharePoint, the attach screen opens and they browse app, site, library, and folder to select a file. (In `file-upload.component.html` we added the Local / SharePoint toggle and conditionally render `file-first-sharepoint-attach` when SharePoint is selected. The new `file-first-sharepoint-attach.component.ts` embeds `sharepoint-workspace` in file-pick mode — same browse UI as Ingestion Console, but only for picking one file, not saving process config. Selecting SharePoint sets `showSharepoint = true`.)

The user clicks **Select this file** and the file is downloaded from SharePoint. (In `file-first-sharepoint-attach.component.ts`, `useSelectedFile()` reads the selected item from the workspace, calls `fetchFileBlob()` on `SharePointApiService` or `SharePointUserApiService` depending on connection mode, builds a browser `File` object, and emits it to the parent via the `fileSelected` output.)

The parent takes that file and continues the normal File First pipeline. (In `file-upload.component.ts`, `onSharepointFileSelected()` sets `showSharepoint = false` to close the overlay, then calls `onFileChange()` with the SharePoint file so preview, column mapping, validation, and submit all use the same existing logic as a local upload.)

---

## Configuration First — SharePoint integration

Configuration First now supports **process type 6 (SharePoint Workspace)**. When the user selects this process type in the wizard, blob and on-prem source fields are hidden and a dedicated **SharePoint Settings** tab is shown instead. (In `new-process-configuration.component.ts`, `onProcessTypeChange()` detects process type 6 via `isSharePointProcessType()` from `configuration-first.sharepoint.ts` and clears validators / values on `blobStorageAccount`, `blobContainerName`, `blobSourcePath`, `serverLocationId`, `baseFolderName`, and `sourceFolderLocation` so only SharePoint source applies.)

The wizard gets a new tab in the header and a new tab pane for SharePoint source selection. (In `new-process-configuration.component.html` we added `<app-configuration-first-sharepoint-tab-nav>` and `<app-configuration-first-sharepoint-tab>`. The nav component `configuration-first-sharepoint-tab-nav.component.ts` renders the **SharePoint Settings** tab button when `processType === 6` using constants `SHAREPOINT_PROCESS_TYPE_ID` and `SHAREPOINT_SETTINGS_TAB_ID` from `configuration-first.sharepoint.ts`.)

Inside the SharePoint tab, the user picks application, site, document library, and optional folder — this is where files will be picked up from on schedule. (The new `configuration-first-sharepoint-tab.component.ts` embeds `sharepoint-workspace` in **process-config** mode — not file-pick. It accepts `initialApplicationId`, `initialApplicationSiteId`, `initialLibraryName`, `initialFolderPath` for edit mode, calls `reloadProcessConfigInitials()` on the workspace when those change, exposes `validateSelection()` which requires `sharePointApplicationId` and `sharePointLibraryName`, and emits `selectionChange` to the parent. `onWorkspaceSelectionChange()` caches the `ProcessConfigSharePointSelection` and passes it up.)

Before save, the parent validates that SharePoint source is complete and redirects to the SharePoint tab if not. (In `new-process-configuration.component.ts`, `isSharePointSettingsTabValid()` delegates to `sharePointTab.validateSelection()` or checks `sharePointCachedSelection`. `activateSharePointSettingsTab()` focuses the tab. Save / tab-change handlers call these checks so the user cannot save without application and library selected.)

On save, SharePoint fields are added to the config payload sent to the backend. (In `new-process-configuration.component.ts`, the save builder sets `locationTypeId` via `resolveLocationTypeId()` which maps process type 6 → `locationTypeId` 4 (`SOURCE_LOCATION_SHAREPOINT`). It spreads `sharePointFileProcessFields()` into the `FileProcessConfig` object with `sharePointApplicationId`, `sharePointApplicationSiteId`, `sharePointLibraryName`, and `sharePointFolderPath`. In `fileProcessConfig.ts` we added these optional fields on `FileProcessConfig` and the `FlpSharePointSourceDetail` interface for the edit API response.)

On edit, saved SharePoint source is loaded and pre-filled in the workspace. (In `new-process-configuration.component.ts`, `loadSharePointSourceForEdit()` calls `configuration.service.ts` → `getSharePointSourceByConfigId()` which hits `GET api/ProcessConfiguration/GetSharePointSourceByConfigId`. The response populates `sharePointInitialApplicationId`, `sharePointInitialApplicationSiteId`, `sharePointInitialLibraryName`, and `sharePointInitialFolderPath`, which are passed as `@Input()` into `configuration-first-sharepoint-tab` so the workspace reopens on the saved location.)

The process config list shows and edits SharePoint configs correctly. (In `process-config-list.component.ts`, opening details for process type 6 calls `getSharePointSourceByConfigId()` to show application, site, library, and folder in the view modal. Edit routes to `/add-process/:configId/sharepoint-settings-tab` instead of the generic configuration route so the SharePoint tab opens directly.)

After config is saved, the Function App scheduler uses the stored SharePoint folder path to browse and process files — that runtime path is backend (`FileLoadingProcessConfigurationService.GetSharePointFileLocationList` → `ProcessCsvFile` / `ProcessExcelFile` / `ProcessTxtFile`). Frontend responsibility ends at persisting the SharePoint source selection in the wizard.
