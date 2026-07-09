-- SharePoint-only: tenant hierarchy columns on di_application (Workspace Connect registration).
-- Safe to re-run. Does NOT modify any Data Ingestion stored procedures.
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_application', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.di_application', 'regionident') IS NULL
        ALTER TABLE dbo.di_application ADD regionident INT NULL;

    IF COL_LENGTH('dbo.di_application', 'regionname') IS NULL
        ALTER TABLE dbo.di_application ADD regionname NVARCHAR(256) NULL;

    IF COL_LENGTH('dbo.di_application', 'subregioncode') IS NULL
        ALTER TABLE dbo.di_application ADD subregioncode NVARCHAR(32) NULL;

    IF COL_LENGTH('dbo.di_application', 'subregionname') IS NULL
        ALTER TABLE dbo.di_application ADD subregionname NVARCHAR(256) NULL;

    IF COL_LENGTH('dbo.di_application', 'securitygroupid') IS NULL
        ALTER TABLE dbo.di_application ADD securitygroupid UNIQUEIDENTIFIER NULL;

    IF COL_LENGTH('dbo.di_application', 'securitygroupname') IS NULL
        ALTER TABLE dbo.di_application ADD securitygroupname NVARCHAR(256) NULL;
END
GO

PRINT 'SharePoint tenant hierarchy columns on di_application are ready.';
GO
