# Deploy SharePoint / Workspace Connect DB changes to local SharepointPlugin.
# Usage: .\Deploy-WorkspaceConnect.ps1
# Optional: .\Deploy-WorkspaceConnect.ps1 -Server ".\SQLEXPRESS" -Database "SharepointPlugin"

param(
    [string]$Server = ".",
    [string]$Database = "SharepointPlugin"
)

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot

function Invoke-DbScript([string]$Path) {
    Write-Host ">> $Path"
    sqlcmd -S $Server -d $Database -E -b -i $Path
    if ($LASTEXITCODE -ne 0) { throw "sqlcmd failed: $Path" }
}

Invoke-DbScript (Join-Path $root "Scripts\alter_di_application_tenant_hierarchy.sql")
Invoke-DbScript (Join-Path $root "Scripts\alter_di_application_client_hierarchy.sql")
Invoke-DbScript (Join-Path $root "StoredProcedures\sel_application.sql")
Invoke-DbScript (Join-Path $root "StoredProcedures\sel_applicationbyid.sql")
Invoke-DbScript (Join-Path $root "StoredProcedures\commit_application.sql")

Write-Host "SharePoint Workspace Connect DB deploy complete on $Server / $Database."
