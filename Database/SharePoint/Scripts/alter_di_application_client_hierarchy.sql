-- SharePoint-only: client hierarchy on di_application (Workspace Connect registration).
SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_application', N'U') IS NOT NULL
BEGIN
    IF COL_LENGTH('dbo.di_application', 'clientident') IS NULL
        ALTER TABLE dbo.di_application ADD clientident INT NULL;

    IF COL_LENGTH('dbo.di_application', 'clientname') IS NULL
        ALTER TABLE dbo.di_application ADD clientname NVARCHAR(256) NULL;
END
GO

PRINT 'SharePoint client hierarchy columns on di_application are ready.';
GO
