SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_application_usage', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.di_application_usage (
        applicationusageid  BIGINT IDENTITY(1,1) NOT NULL,
        applicationid       UNIQUEIDENTIFIER     NOT NULL,
        displayname         NVARCHAR(128)        NOT NULL,
        usedbyupn           NVARCHAR(256)        NULL,
        usedbydisplayname   NVARCHAR(256)        NULL,
        usedon              DATETIME2(3)         NOT NULL CONSTRAINT DF_di_application_usage_usedon DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_di_application_usage PRIMARY KEY CLUSTERED (applicationusageid)
    );
    CREATE NONCLUSTERED INDEX ix_di_application_usage_appid ON dbo.di_application_usage (applicationid);
    CREATE NONCLUSTERED INDEX ix_di_application_usage_usedon ON dbo.di_application_usage (usedon);
END
GO
