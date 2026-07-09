SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_applicationsite', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.di_applicationsite (
        applicationsiteid UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_di_applicationsite_id DEFAULT (NEWID()),
        applicationid     UNIQUEIDENTIFIER NOT NULL,
        hostname          NVARCHAR(256)    NOT NULL,
        sitename          NVARCHAR(256)    NOT NULL,
        libraryname       NVARCHAR(256)    NULL,
        folderpath        NVARCHAR(512)    NULL,
        sortorder         INT              NOT NULL CONSTRAINT DF_di_applicationsite_sortorder DEFAULT (0),
        isactive          BIT              NOT NULL CONSTRAINT DF_di_applicationsite_isactive DEFAULT (1),
        createdon         DATETIME2(3)     NOT NULL CONSTRAINT DF_di_applicationsite_createdon DEFAULT (SYSUTCDATETIME()),
        modifiedon        DATETIME2(3)     NULL,
        CONSTRAINT PK_di_applicationsite PRIMARY KEY CLUSTERED (applicationsiteid)
    );
    CREATE NONCLUSTERED INDEX ix_di_applicationsite_applicationid ON dbo.di_applicationsite (applicationid);
END
GO
