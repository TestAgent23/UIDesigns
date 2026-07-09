SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.sel_applicationtypes
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  applicationtypeid   AS ApplicationTypeId,
            code                AS Code,
            displayname         AS DisplayName,
            description         AS Description
    FROM    dbo.di_applicationtype
    WHERE   isactive = 1
    ORDER BY applicationtypeid;
END;
GO
