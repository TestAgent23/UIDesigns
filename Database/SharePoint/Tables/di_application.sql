SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_application', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.di_application (
        applicationid     UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_di_application_applicationid DEFAULT (NEWID()),
        applicationtypeid INT              NOT NULL,
        ownerkey          NVARCHAR(128)    NOT NULL CONSTRAINT DF_di_application_ownerkey DEFAULT (N'system'),
        displayname       NVARCHAR(128)    NOT NULL,
        tenantid          NVARCHAR(64)     NOT NULL,
        clientid          NVARCHAR(64)     NOT NULL,
        clientsecret      NVARCHAR(512)    NOT NULL,
        hostname          NVARCHAR(256)    NOT NULL,
        sitename          NVARCHAR(256)    NULL,
        libraryname       NVARCHAR(256)    NULL,
        consumerclientid  NVARCHAR(64)     NULL,
        consumersecret    NVARCHAR(512)    NULL,
        notes             NVARCHAR(1024)   NULL,
        isactive          BIT              NOT NULL CONSTRAINT DF_di_application_isactive DEFAULT (1),
        createdon         DATETIME2(3)     NOT NULL CONSTRAINT DF_di_application_createdon DEFAULT (SYSUTCDATETIME()),
        modifiedon        DATETIME2(3)     NULL,
        owner             NVARCHAR(256)    NOT NULL CONSTRAINT DF_di_application_owner DEFAULT (N''),
        coowner           NVARCHAR(256)    NULL,
        ownerupn          NVARCHAR(256)    NULL,
        coownerupn        NVARCHAR(256)    NULL,
        regionident       INT              NULL,
        regionname        NVARCHAR(256)    NULL,
        subregioncode     NVARCHAR(32)     NULL,
        subregionname     NVARCHAR(256)    NULL,
        clientident       INT              NULL,
        clientname        NVARCHAR(256)    NULL,
        securitygroupid   UNIQUEIDENTIFIER NULL,
        securitygroupname NVARCHAR(256)    NULL,
        CONSTRAINT PK_di_application PRIMARY KEY CLUSTERED (applicationid)
    );
    CREATE NONCLUSTERED INDEX ix_di_application_ownerkey ON dbo.di_application (ownerkey);
    CREATE NONCLUSTERED INDEX ix_di_application_typeid ON dbo.di_application (applicationtypeid);
END
GO
