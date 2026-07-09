SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.commit_applicationdelete
    @Applicationid UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE dbo.di_application
    SET isactive   = 0,
        modifiedon = GETUTCDATE()
    WHERE applicationid = @Applicationid;
    SELECT @@ROWCOUNT AS AffectedRows;
END;
GO
