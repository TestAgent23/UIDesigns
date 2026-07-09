SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.commit_sharepointlogs
    @Loglevel           NVARCHAR(16),
    @Logger             NVARCHAR(256),
    @Message            NVARCHAR(MAX),
    @Exception          NVARCHAR(MAX) = NULL,
    @Applicationid      UNIQUEIDENTIFIER = NULL,
    @Applicationname    NVARCHAR(128) = NULL,
    @Usedbyupn          NVARCHAR(256) = NULL,
    @Usedbydisplayname  NVARCHAR(256) = NULL,
    @Requestmethod      NVARCHAR(16) = NULL,
    @Requestpath        NVARCHAR(512) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO dbo.di_sharepointlogs (
        loglevel, logger, message, exception,
        applicationid, applicationname, usedbyupn, usedbydisplayname,
        requestmethod, requestpath
    )
    VALUES (
        @Loglevel, @Logger, @Message, @Exception,
        @Applicationid, @Applicationname, @Usedbyupn, @Usedbydisplayname,
        @Requestmethod, @Requestpath
    );
    SELECT  SCOPE_IDENTITY() AS SharePointLogId,
            @Loglevel         AS LogLevel,
            @Logger           AS Logger,
            @Message          AS Message,
            @Applicationid    AS ApplicationId,
            @Applicationname  AS ApplicationName,
            GETUTCDATE()  AS CreatedOn;
END;
GO
