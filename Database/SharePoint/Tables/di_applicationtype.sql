SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_applicationtype', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.di_applicationtype (
        applicationtypeid INT IDENTITY(1,1) NOT NULL,
        code              VARCHAR(32)       NOT NULL,
        displayname       NVARCHAR(64)      NOT NULL,
        description       NVARCHAR(256)     NULL,
        isactive          BIT               NOT NULL CONSTRAINT DF_di_applicationtype_isactive DEFAULT (1),
        createdon         DATETIME2(3)      NOT NULL CONSTRAINT DF_di_applicationtype_createdon DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_di_applicationtype PRIMARY KEY CLUSTERED (applicationtypeid)
    );
    CREATE UNIQUE NONCLUSTERED INDEX ix_uq_di_applicationtype_code ON dbo.di_applicationtype (code);
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.di_applicationtype WHERE applicationtypeid = 2)
BEGIN
    SET IDENTITY_INSERT dbo.di_applicationtype ON;
    INSERT INTO dbo.di_applicationtype (applicationtypeid, code, displayname, description, isactive)
    VALUES (2, N'tp_external', N'External', N'External application.', 1);
    SET IDENTITY_INSERT dbo.di_applicationtype OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.di_applicationtype WHERE applicationtypeid = 3)
BEGIN
    SET IDENTITY_INSERT dbo.di_applicationtype ON;
    INSERT INTO dbo.di_applicationtype (applicationtypeid, code, displayname, description, isactive)
    VALUES (3, N'tp_internal', N'Internal', N'Internal site registration.', 1);
    SET IDENTITY_INSERT dbo.di_applicationtype OFF;
END
GO

IF NOT EXISTS (SELECT 1 FROM dbo.di_applicationtype WHERE applicationtypeid = 4)
BEGIN
    SET IDENTITY_INSERT dbo.di_applicationtype ON;
    INSERT INTO dbo.di_applicationtype (applicationtypeid, code, displayname, description, isactive)
    VALUES (4, N'tp_user_delegated', N'Logged In User', N'Logged in user site registration.', 1);
    SET IDENTITY_INSERT dbo.di_applicationtype OFF;
END
GO
