# Workspace Connect — Developer Handoff (Session Changes)

This document inventories **all durable product changes** made for Workspace Connect / SharePoint tenant access filtering in this workstream. Use it when sharing the codebase with developers moving the work to production.

Related older tracking (frontend DI wiring only): [`sharepoint.md`](./sharepoint.md).

---

## 1. Product intent (what this delivers)

| Goal | Detail |
|------|--------|
| Rebrand | **Ingestion Console** → **Workspace Connect** (sidebar + SharePoint module UI). Connectors home: SharePoint Connect (active), Google Drive Connect (coming soon), SharePoint Workspace, Help boilerplate. |
| Register with access scope | When registering a SharePoint application/connector, capture **Region** (required) + optional **Sub-Region / Client / Security Group**. |
| Filter by Process Settings | File-First and Configuration-First workspace dropdowns only show applications matching Process Settings hierarchy. |
| Inactive registration | If SPN / connectivity probe fails, user can still register; row is saved with `isactive = 0` and shown as **Inactive** (red card) on the SharePoint connectors list. |
| List filters | Connectors list supports **Active / Inactive** status filter plus **Region / Sub-Region / Client / Security Group** scope filter (server-side via `sel_application`). |
| List dashboard chart | **Registrations by month** bar chart shows **Internal**, **External**, and **Inactive** series (inactive = `isActive === false`; active tenants counted by type only). |
| Isolate from DI core | Changes stay under SharePoint DB folder, SharePoint plugin API, and Workspace Connect FE surfaces. **Do not rewrite DI business SPs or `process-configuration` internals.** |

### Labeling (final copy)

| UI place | Label |
|----------|--------|
| Sidebar | Workspace Connect |
| Register CTA | Register |
| Free-text Entra field | Tenant |
| Hierarchy client control | Client Dropdown |
| Hierarchy section | Access configuration |
| List scope filter | Access scope (compact toolbar dropdown) |

### Save / “ALL” semantics

| Field | Required? | Empty optional means |
|-------|-----------|----------------------|
| Region | **Yes** | — |
| Sub-Region | No | `ALL` / `All` |
| Client | No | `0` / `All` |
| Security Group | No | `00000000-0000-0000-0000-000000000000` / `All` |

Matching rule (list filter): a registered row matches a Process Settings filter if its stored value equals the filter **or** is the ALL sentinel / NULL.

---

## 2. Database (`Database/SharePoint/` only)

### 2.1 Table — `dbo.di_application`

**Definition file:** `Database/SharePoint/Tables/di_application.sql`

**New columns:**

| Column | Type | Notes |
|--------|------|--------|
| `regionident` | `INT NULL` | Required at app save (API). |
| `regionname` | `NVARCHAR(256) NULL` | |
| `subregioncode` | `NVARCHAR(32) NULL` | Empty → `ALL` in `commit_application`. |
| `subregionname` | `NVARCHAR(256) NULL` | Empty → `All`. |
| `clientident` | `INT NULL` | Empty/≤0 → `0`. |
| `clientname` | `NVARCHAR(256) NULL` | Empty / All client → `All`. |
| `securitygroupid` | `UNIQUEIDENTIFIER NULL` | Empty → all-zero GUID. |
| `securitygroupname` | `NVARCHAR(256) NULL` | Empty → `All`. |

### 2.2 Migration scripts (run on existing DBs)

| Script | Purpose |
|--------|---------|
| `Database/SharePoint/Scripts/alter_di_application_tenant_hierarchy.sql` | Adds region / sub-region / security group columns (idempotent). |
| `Database/SharePoint/Scripts/alter_di_application_client_hierarchy.sql` | Adds `clientident` / `clientname` (idempotent). |

**Production deploy order:** run both alters → deploy SP `CREATE OR ALTER` scripts below.

### 2.3 Stored procedures changed

| Procedure | File | Change |
|-----------|------|--------|
| `dbo.commit_application` | `StoredProcedures/commit_application.sql` | Accepts hierarchy params; normalizes optional fields to ALL sentinels; **`@Isactive BIT = 1`** on INSERT/UPDATE; returns via `sel_applicationbyid`. |
| `dbo.sel_application` | `StoredProcedures/sel_application.sql` | Optional filters `@Regionident`, `@Subregioncode`, `@Clientident`, `@Securitygroupid`; **`@Includeinactive BIT = 0`** (default active-only); SELECT returns `IsActive` + hierarchy columns; ALL matching as above. |
| `dbo.sel_applicationbyid` | `StoredProcedures/sel_applicationbyid.sql` | Returns hierarchy + **`IsActive`** for one application (active or inactive — no `isactive = 1` filter). |

### 2.4 SharePoint DB objects **not** changed for this feature

These exist under `Database/SharePoint/` but were **not** part of the tenant-hierarchy feature (leave as-is unless other workstreams require them):

- Tables: `di_applicationtype`, `di_applicationsite`, `di_application_usage`, `di_flpSharePointSource`, `di_sharepointlogs`
- SPs: `sel_applicationtypes`, `sel_applicationsites`, `commit_applicationsites`, `commit_applicationdelete`, `commit_sharepointlogs`, `commit_InsertFlpSharePointSource`, `sel_flpSharePointSourceByConfigId`
- Scripts: `sel_sharepoint_getprocesslist_due.sql`, `sharepoint_configuration_first_status_checks.sql`

---

## 3. Backend API (SharePoint plugin)

Root: `Backend/Teleperformance.DataIngestion.API/`

### 3.1 Application model & constants

| File | Change |
|------|--------|
| `Teleperformance.DataIngestion.Sharepoint/Models/Response/ApiResponse.cs` | `Application` model: hierarchy fields + **`bool? IsActive`**. |
| `Teleperformance.DataIngestion.Sharepoint/Constants/Constants.cs` | `ApplicationRegionRequired` message. |

### 3.2 Repository / service / interfaces

| File | Change |
|------|--------|
| `.../Interfaces/V1_0/ISharePointPluginRepository.cs` | `GetApplicationsAsync(..., regionIdent, subRegionCode, clientIdent, securityGroupId, includeInactive)`. |
| `.../Interfaces/V1_0/ISharePointPluginService.cs` | Same filter signature on service. |
| `.../Repositories/V1_0/SharePointPluginRepository.cs` | Passes hierarchy + **`Includeinactive`** to `sel_application`; passes **`Isactive`** to `commit_application`. |
| `.../Services/V1_0/SharePointPluginService.cs` | Forwards filters; **rejects save** if `RegionIdent` missing/≤0; **`ValidateInternalSiteRegistrationAsync` only when `IsActive` is true**; preserves existing `IsActive` on edit when omitted. Spreadsheet filter in `ListChildrenAsync` (see §3.4). |

### 3.3 Controller

| File | Endpoint | Change |
|------|----------|--------|
| `Teleperformance.DataIngestion.API/Controllers/v4.1/SharePointController.cs` | `GET .../applications` | Query: `ownerKey`, `typeCode`, **`regionIdent`**, **`subRegionCode`**, **`clientIdent`**, **`securityGroupId`**, **`includeInactive`** (default `false`). |

Save remains `POST .../applications` with hierarchy fields + optional **`isActive`** on the body (`false` = inactive registration).

### 3.4 Spreadsheet-only browse filter (SharePoint plugin)

| File | Change |
|------|--------|
| `Teleperformance.DataIngestion.Sharepoint/Utilities/CommonUtilities.cs` | `IsSpreadsheetFile()` — allows `.xlsx`, `.xls`, `.xlsb`, `.xlsm`, `.xltx`, `.xltm`, `.csv`, `.tsv`, `.ods`. |
| `Teleperformance.DataIngestion.Sharepoint/Services/V1_0/SharePointPluginService.cs` | `ListChildrenAsync` keeps folders + spreadsheet files only. |

**Note:** User-delegated browse paths that do **not** call `ListChildrenAsync` may still list all file types.

---

## 4. Frontend

Root: `FRONTEND/src/app/workspace-connect/` (Workspace Connect module; SharePoint connector logic isolated here).

### 4.1 Tenant hierarchy (core)

| File | Role |
|------|------|
| `core/workspace-connect.tenant.ts` | Types, ALL constants, normalize/validate/save helpers, `tenantFilterFromClientInfo()`, `tenantFilterFromScope()`, session key `sp_tenant_scope`. |
| `core/workspace-connect-tenant-hierarchy.component.*` | Access configuration UI (`sp-tenant-hierarchy`). Supports **`filterToolbar`** mode: single-row 4-column compact layout for list-page scope filter (smaller labels/inputs). |
| `services/sharepoint-tenant-hierarchy.service.ts` | Loads Region/Sub-Region/Client via DataSlice; Security Group via Graph search. |
| `services/sharepoint-tenant-scope.service.ts` | Session-scoped tenant filter (`sp_tenant_scope`). |

### 4.2 Connectors list & registration (`workspace-connect-connectors/*`)

| Behavior | Implementation |
|----------|----------------|
| **Inactive registration** | Connectivity probe failure no longer blocks save. Register sends `isActive: false`; success message explains inactive state. Button label becomes **Register as inactive** after failed probe. |
| **List includes inactive** | `loadApplicationCatalog({ includeInactive: true, ...hierarchy })` — admin list only; workspace browse keeps default active-only. |
| **Status filter** | Client-side Active / Inactive / All on cards + table; inactive cards use red styling (`sp-app-card--inactive`); table has Status column. |
| **Registrations chart** | Apex bar chart with three series — Internal (blue), External (teal), Inactive (red). Counts by `createdOn` month; inactive tenants are not double-counted in Internal/External. |
| **Hierarchy list filter** | Toolbar **Access scope** compact dropdown (`filterToolbar` on `sp-tenant-hierarchy`); aligned inline with Status + Type filters; shows scope summary when set; reloads catalog with server-side hierarchy query params. |
| **Registration hierarchy** | Form embeds `sp-tenant-hierarchy`; Region required; optional fields normalize to ALL sentinels on save. |

### 4.3 API service

| File | Change |
|------|--------|
| `services/sharepoint-api.service.ts` | `listApplications` / `loadApplicationCatalog` accept **`includeInactive`** + hierarchy query params. |

### 4.4 Workspace browse & DI surfaces

| File | Change |
|------|--------|
| `workspace-connect-workspace/*` | `@Input() hierarchyFilter`; reloads catalog when filter signature changes; **active-only** catalog (no `includeInactive`). |
| `workspace-connect-home/*` | Connectors home: SharePoint Connect, Google Drive Coming soon, Help boilerplate, breadcrumbs. |
| `main-layout/main-layout.component.html` | Sidebar: **Workspace Connect** → `/workspace-connect` (legacy `/ingestion-console` redirects). |
| `file-first/file-first-sharepoint-attach/*` | Builds `hierarchyFilter` from parent `clientInfoForm` via `tenantFilterFromClientInfo`. |
| `new-process-configuration/new-process-configuration.component.*` | Memoized `sharePointHierarchyFilterValue`; passes into SharePoint tab. |
| `new-process-configuration/configuration-first-sharepoint-tab/*` | Forwards `hierarchyFilter` into embedded workspace. |

### 4.5 Earlier SharePoint↔DI integration (still in tree; covered in `sharepoint.md`)

These were built in the broader SharePoint integration work (not only tenant hierarchy). Developers should treat them as part of the SharePoint handoff package:

- `new-process-configuration/configuration-first-sharepoint-tab*`
- `new-process-configuration/configuration-first-sharepoint-tab-nav*`
- `file-first/file-first-sharepoint-attach*`
- `sharepoint/integration/configuration-first.sharepoint.ts` (process type `6`, location type `4`)
- Wiring in `app.module.ts`, `app-routing.module.ts`, process list, etc. (see `sharepoint.md`)

---

## 5. Explicitly out of scope / do not touch for this feature

| Area | Reason |
|------|--------|
| Data Ingestion core SPs outside `Database/SharePoint/` | Isolation requirement. |
| `process-configuration.component.ts` DI internals | Hierarchy comes from Process Settings **as-is**; SharePoint only **reads** values. |
| Guest mock / guest util patches for DI dropdowns | Explored/replaced; production uses real DataSlice + Graph. |
| Tenants-list “dashboard redesign” | Implemented then **fully reverted** — original cards UI remains. |

---

## 6. Deploy checklist (production)

1. **SQL:** Run `alter_di_application_tenant_hierarchy.sql` then `alter_di_application_client_hierarchy.sql`.
2. **SQL:** Deploy `commit_application`, `sel_application`, `sel_applicationbyid` (`CREATE OR ALTER`).
   - **Local one-liner:** `Database/SharePoint/Deploy-WorkspaceConnect.ps1`
   - **Symptom if skipped:** `GET /api/applications` returns **500** — `sel_application has too many arguments specified` (DB SP missing `@Includeinactive`).
3. **API:** Deploy SharePoint plugin + `SharePointController` changes; recycle app pool / restart.
4. **FE:** Deploy Angular build that includes Workspace Connect + hierarchy + Process Settings filter wiring.
5. **Smoke:**
   - Register SharePoint Connect app with Region only → verify ALL sentinels in DB.
   - Register with full hierarchy → verify exact values.
   - **Register with failed connectivity probe → verify `isactive = 0`, red inactive card, Inactive filter works.**
   - **Connectors list Access scope filter → verify API returns scoped tenants (ALL sentinel matching).**
   - **Registrations chart → verify Internal / External / Inactive legend and monthly bars.**
   - Configuration First: set Process Settings → SharePoint Settings tab → application dropdown filtered (active only).
   - File First: SharePoint source → Process Settings Region required → workspace apps filtered (active only).
   - Hard refresh browser cache after FE deploy.

---

## 7. Known gaps / follow-ups for developers

1. **Multiple security groups** on Process Settings: filter currently uses **first** security group only (`tenantFilterFromClientInfo`).
2. **Internal apps** may show empty Tenant ID / Entra App ID by design (“platform credentials”).
3. **Delegated user browse** may not use spreadsheet-only `ListChildrenAsync` — confirm if that path must match app browse filtering.
4. Route URL is `/workspace-connect` (legacy `/ingestion-console` redirects).
5. Config-first / file-first consumers must pass a **stable** hierarchy filter object (value equality / signature) — do not bind a getter that allocates a new object every change-detection cycle.
6. **Activating inactive tenants:** edit tenant, pass connectivity probe for all sites, save — `isActive` is set to `true` automatically when all sites verify successfully.

---

## 8. Cleanup performed before handoff

| Item | Status |
|------|--------|
| Temporary Python patch scripts (`_patch_list_ui.py`, `_revert_list_ui.py`, `_revert_css.py`, etc.) | **Removed earlier** in session |
| Project-root / `Integration_Project` scratch `*.py` build helpers | **None found** on final scan |
| Prototype “File Process Status runtime” SharePoint FE service files | **Not present** in tree (removed when that spike was abandoned) |
| Accidental `temp`/`scratch` scripts under Integration_Project (excl. `node_modules`) | **None relevant found** |

No additional disposable test files were left that need deletion for developer sharing.

---

## 9. Quick file index (primary touch list)

```
Database/SharePoint/
  Deploy-WorkspaceConnect.ps1
  Tables/di_application.sql
  Scripts/alter_di_application_tenant_hierarchy.sql
  Scripts/alter_di_application_client_hierarchy.sql
  StoredProcedures/commit_application.sql
  StoredProcedures/sel_application.sql
  StoredProcedures/sel_applicationbyid.sql

Backend/.../Teleperformance.DataIngestion.Sharepoint/
  Models/Response/ApiResponse.cs
  Constants/Constants.cs
  Interfaces/V1_0/ISharePointPlugin*.cs
  Repositories/V1_0/SharePointPluginRepository.cs
  Services/V1_0/SharePointPluginService.cs
  Utilities/CommonUtilities.cs

Backend/.../Controllers/v4.1/SharePointController.cs

FRONTEND/src/app/
  workspace-connect/
    core/workspace-connect.tenant.ts
    core/workspace-connect-tenant-hierarchy.component.*
    core/workspace-connect.messages.ts | types | utils
    services/sharepoint-api.service.ts
    services/sharepoint-tenant-hierarchy.service.ts
    workspace-connect-connectors/*
    workspace-connect-workspace/*
    workspace-connect-home/*
  main-layout/main-layout.component.html
  file-first/file-first-sharepoint-attach/*
  new-process-configuration/new-process-configuration.component.{ts,html}
  new-process-configuration/configuration-first-sharepoint-tab/*
```

---

*Last updated: inactive registration, list filters, chart inactive series, compact access-scope toolbar, `Deploy-WorkspaceConnect.ps1`. Prefer updating this file if production follow-ups land on the same feature.*
