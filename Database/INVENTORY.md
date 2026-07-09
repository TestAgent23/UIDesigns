# Database script inventory

Verified against `SharepointPlugin` on `Server=.` (June 2026). Full deploy via `Deploy.ps1` succeeds on this database.

`commit_InsertFlpConfiguration` uses runtime schema detection (dynamic SQL) so the same script deploys to slim local dev and full `DataIngestionV2` production schemas.

## Folder layout

```
Database/
├── SharePoint/          New SharePoint-only objects
└── DataIngestion/       Modified existing Data Ingestion objects
```

Each database object has its own script file. Run scripts individually with `sqlcmd` in dependency order: **SharePoint objects first**, then **DataIngestion** changes.

---

## 1. New SharePoint tables

| Object | Script | Purpose |
|--------|--------|---------|
| `dbo.di_application` | `SharePoint/Tables/di_application.sql` | Registered SharePoint app credentials (workspace browse) |
| `dbo.di_applicationsite` | `SharePoint/Tables/di_applicationsite.sql` | Sites/libraries per application |
| `dbo.di_applicationtype` | `SharePoint/Tables/di_applicationtype.sql` | App type lookup + seed |
| `dbo.di_application_usage` | `SharePoint/Tables/di_application_usage.sql` | App usage audit |
| `dbo.di_sharepointlogs` | `SharePoint/Tables/di_sharepointlogs.sql` | SharePoint plugin API logs |
| `dbo.di_flpSharePointSource` | `SharePoint/Tables/di_flpSharePointSource.sql` | Configuration First source location (app/site/library/folder) per process |

---

## 2. New SharePoint stored procedures

| Object | Script | Purpose |
|--------|--------|---------|
| `dbo.sel_applicationtypes` | `SharePoint/StoredProcedures/sel_applicationtypes.sql` | List application types |
| `dbo.sel_application` | `SharePoint/StoredProcedures/sel_application.sql` | List applications |
| `dbo.sel_applicationbyid` | `SharePoint/StoredProcedures/sel_applicationbyid.sql` | Load one application |
| `dbo.sel_applicationsites` | `SharePoint/StoredProcedures/sel_applicationsites.sql` | List sites for an app |
| `dbo.commit_application` | `SharePoint/StoredProcedures/commit_application.sql` | Register/update application |
| `dbo.commit_applicationsites` | `SharePoint/StoredProcedures/commit_applicationsites.sql` | Register/update sites |
| `dbo.commit_applicationdelete` | `SharePoint/StoredProcedures/commit_applicationdelete.sql` | Soft-delete application |
| `dbo.commit_sharepointlogs` | `SharePoint/StoredProcedures/commit_sharepointlogs.sql` | Write plugin log row |
| `dbo.commit_InsertFlpSharePointSource` | `SharePoint/StoredProcedures/commit_InsertFlpSharePointSource.sql` | Upsert SharePoint source for a process config |
| `dbo.sel_flpSharePointSourceByConfigId` | `SharePoint/StoredProcedures/sel_flpSharePointSourceByConfigId.sql` | Load SharePoint source by config id |

---

## 3. Modified Data Ingestion tables

| Object | Script | Change | Required? |
|--------|--------|--------|-----------|
| `dbo.di_info_processType` | `DataIngestion/Tables/di_info_processType.sql` | Seed process type **6** — SharePoint Workspace | **Yes** |
| `dbo.di_flpConfiguration` | `DataIngestion/Tables/di_flpConfiguration.sql` | Optional `sharePoint*` columns | **No** if using side table (`di_flpSharePointSource`) only |

No other `di_*` table structures were changed. SharePoint location data is stored in `di_flpSharePointSource`, not on `di_flpConfiguration`, in the deployed side-table approach.

---

## 4. Modified Data Ingestion stored procedures / functions

| Object | Script | Why modified |
|--------|--------|--------------|
| `dbo.commit_InsertFlpConfiguration` | `DataIngestion/StoredProcedures/commit_InsertFlpConfiguration.sql` | Four `@sharePoint*` parameters; `processTypeId = 6` sets `sourcePath` from folder path; calls `commit_InsertFlpSharePointSource`; skips blob source insert when type 6; scheduler save/update unchanged |
| `dbo.sel_processConfigurationById` | `DataIngestion/StoredProcedures/sel_processConfigurationById.sql` | Edit/load: `LEFT JOIN di_flpSharePointSource` + app/site display names in result set 1 |
| `dbo.sel_flpConfigurationList` | `DataIngestion/StoredProcedures/sel_flpConfigurationList.sql` | Runtime/scheduler: `LEFT JOIN di_flpSharePointSource`; returns SharePoint fields for `processTypeId = 6` |
| `dbo.fn_decrypt` | `DataIngestion/Functions/fn_decrypt.sql` | Used by `sel_flpConfigurationList` for storage/file-server secrets (existing runtime pattern) |

---

## 5. Reason summary per modification

| Change | Reason |
|--------|--------|
| `di_flpSharePointSource` + insert/select SPs | Persist SharePoint app/site/library/folder separately from core FLP config |
| `commit_InsertFlpConfiguration` params + type 6 branch | API save sends SharePoint fields; delegate persistence to side table |
| `sel_processConfigurationById` join | Configuration First edit reload and list detail |
| `sel_flpConfigurationList` join | Scheduler/runtime `GetProcessList(6)` needs SharePoint source fields |
| `di_info_processType` type 6 | Wizard process type dropdown and routing |
| `di_flpConfiguration` column script | Alternate production layout (columns on main table); skip if using side table only |
| `fn_decrypt` | Required by existing `sel_flpConfigurationList` SELECT list |

---

## Script order

Run SharePoint table scripts, then SharePoint stored procedures, then DataIngestion tables/functions/stored procedures. `commit_InsertFlpConfiguration` depends on `commit_InsertFlpSharePointSource`.
