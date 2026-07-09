SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.sel_applicationsites
    @Applicationid UNIQUEIDENTIFIER = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  s.applicationsiteid   AS ApplicationSiteId,
            s.applicationid       AS ApplicationId,
            s.hostname            AS HostName,
            s.sitename            AS SiteName,
            s.libraryname         AS LibraryName,
            s.folderpath          AS FolderPath,
            s.sortorder           AS SortOrder
    FROM    dbo.di_applicationsite AS s
    WHERE   s.isactive = 1
      AND   (@Applicationid IS NULL OR s.applicationid = @Applicationid)
    ORDER BY s.applicationid, s.sortorder, s.createdon;
END;
GO
