SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.commit_applicationsites
    @Applicationid UNIQUEIDENTIFIER,
    @SitesJson     NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.di_applicationsite
    SET isactive   = 0,
        modifiedon = GETUTCDATE()
    WHERE applicationid = @Applicationid;

    IF @SitesJson IS NOT NULL AND LTRIM(RTRIM(@SitesJson)) <> N'' AND ISJSON(@SitesJson) = 1
    BEGIN
        INSERT INTO dbo.di_applicationsite (
            applicationid, hostname, sitename, libraryname, folderpath, sortorder
        )
        SELECT  @Applicationid,
                j.hostname,
                j.sitename,
                NULLIF(LTRIM(RTRIM(j.libraryname)), N''),
                NULLIF(LTRIM(RTRIM(j.folderpath)), N''),
                ISNULL(j.sortorder, 0)
        FROM OPENJSON(@SitesJson)
        WITH (
            hostname    NVARCHAR(256) '$.hostName',
            sitename    NVARCHAR(256) '$.siteName',
            libraryname NVARCHAR(256) '$.libraryName',
            folderpath  NVARCHAR(512) '$.folderPath',
            sortorder   INT           '$.sortOrder'
        ) AS j
        WHERE j.sitename IS NOT NULL AND LTRIM(RTRIM(j.sitename)) <> N'';
    END

    EXEC dbo.sel_applicationsites @Applicationid;
END;
GO
