SET NOCOUNT ON;
GO

IF NOT EXISTS (SELECT 1 FROM dbo.di_info_processType WHERE processTypeId = 6)
BEGIN
    INSERT INTO dbo.di_info_processType (processTypeId, processTypeName, active, processConfigurationDisplay)
    VALUES (6, N'SharePoint Workspace', 1, 1);
END
GO
