SET NOCOUNT ON;
GO

IF OBJECT_ID(N'dbo.di_sharepointlogs', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.di_sharepointlogs (
        sharepointlogid     BIGINT IDENTITY(1,1) NOT NULL,
        loglevel            NVARCHAR(16)         NOT NULL,
        logger              NVARCHAR(256)        NOT NULL,
        message             NVARCHAR(MAX)        NOT NULL,
        exception           NVARCHAR(MAX)        NULL,
        applicationid       UNIQUEIDENTIFIER     NULL,
        applicationname     NVARCHAR(128)        NULL,
        usedbyupn           NVARCHAR(256)        NULL,
        usedbydisplayname   NVARCHAR(256)        NULL,
        requestmethod       NVARCHAR(16)         NULL,
        requestpath         NVARCHAR(512)        NULL,
        createdon           DATETIME2(3)         NOT NULL CONSTRAINT DF_di_sharepointlogs_createdon DEFAULT (SYSUTCDATETIME()),
        CONSTRAINT PK_di_sharepointlogs PRIMARY KEY CLUSTERED (sharepointlogid)
    );
    CREATE NONCLUSTERED INDEX ix_di_sharepointlogs_applicationid ON dbo.di_sharepointlogs (applicationid);
    CREATE NONCLUSTERED INDEX ix_di_sharepointlogs_createdon ON dbo.di_sharepointlogs (createdon);
END
GO
