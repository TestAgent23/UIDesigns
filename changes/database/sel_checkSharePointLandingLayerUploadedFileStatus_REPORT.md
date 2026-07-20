# Report: `sel_checkSharePointLandingLayerUploadedFileStatus`

| Field | Value |
|-------|--------|
| **Type** | **New** stored procedure |
| **Feature** | Workspace Connect — SharePoint → Landing Layer |
| **Date** | 2026-07-20 |
| **Deploy script** | `production_release/stored procedures/sel_checkSharePointLandingLayerUploadedFileStatus.sql` |
| **App tree (current)** | `LocalTestingOnly` first (Integration_project deferred until LocalTestingOnly is confirmed) |
| **Impact** | None on Blob/Shared — existing `sel_checkLandingLayerUploadedFileStatus` unchanged |

## New vs existing

| SP | Status | processTypeId |
|----|--------|---------------|
| `sel_checkLandingLayerUploadedFileStatus` | Existing | 2, 3 |
| `sel_checkSharePointLandingLayerUploadedFileStatus` | **New** | 6 |

## Deploy

Run the production_release `.sql` on the DB before SharePoint Landing Layer smoke tests.
