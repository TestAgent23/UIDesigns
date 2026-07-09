SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_flpSharePointSource', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.di_flpSharePointSource (
        flpConfigurationId          NVARCHAR(100)    NOT NULL,
        sharePointApplicationId     UNIQUEIDENTIFIER NULL,
        sharePointApplicationSiteId UNIQUEIDENTIFIER NULL,
        sharePointLibraryName       NVARCHAR(256)    NULL,
        sharePointFolderPath        NVARCHAR(512)    NULL,
        active                      BIT              NOT NULL CONSTRAINT DF_di_flpSharePointSource_active DEFAULT (1),
        createdOn                   DATETIME2(3)     NOT NULL CONSTRAINT DF_di_flpSharePointSource_createdOn DEFAULT (SYSUTCDATETIME()),
        modifiedOn                  DATETIME2(3)     NULL,
        CONSTRAINT PK_di_flpSharePointSource PRIMARY KEY CLUSTERED (flpConfigurationId)
    );
END
GO
