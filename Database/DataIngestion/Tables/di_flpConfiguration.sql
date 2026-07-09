SET NOCOUNT ON;
GO

IF COL_LENGTH('dbo.di_flpConfiguration', 'sharePointApplicationId') IS NULL
    ALTER TABLE dbo.di_flpConfiguration ADD sharePointApplicationId UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH('dbo.di_flpConfiguration', 'sharePointApplicationSiteId') IS NULL
    ALTER TABLE dbo.di_flpConfiguration ADD sharePointApplicationSiteId UNIQUEIDENTIFIER NULL;
GO

IF COL_LENGTH('dbo.di_flpConfiguration', 'sharePointLibraryName') IS NULL
    ALTER TABLE dbo.di_flpConfiguration ADD sharePointLibraryName NVARCHAR(256) NULL;
GO

IF COL_LENGTH('dbo.di_flpConfiguration', 'sharePointFolderPath') IS NULL
    ALTER TABLE dbo.di_flpConfiguration ADD sharePointFolderPath NVARCHAR(512) NULL;
GO
