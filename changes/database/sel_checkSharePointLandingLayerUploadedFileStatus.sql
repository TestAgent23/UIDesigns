/*
================================================================================
  Workspace Connect - SharePoint (NEW stored procedure)
  Name   : dbo.sel_checkSharePointLandingLayerUploadedFileStatus
  Purpose: In-progress lock for SharePoint -> Landing Layer (processTypeId = 6)
  Notes  :
    - NEW procedure (does not exist in DB until this script is run)
    - Does NOT alter dbo.sel_checkLandingLayerUploadedFileStatus (Blob/Shared 2,3)
    - Mirrors that SP's Result/Message contract for SharePoint-only callers
    - App call site: LocalTestingOnly (then Integration_project) FileLoadingProcessConfigurationRepository.checkSharePointLandingFileStatus
================================================================================
*/
SET XACT_ABORT ON;
SET NOCOUNT ON;

BEGIN TRY
    BEGIN TRAN;

    DECLARE @ProcSql NVARCHAR(MAX) = N'
CREATE OR ALTER PROCEDURE [dbo].[sel_checkSharePointLandingLayerUploadedFileStatus]
    @flpConfigurationId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        IF EXISTS (
            SELECT 1
            FROM [dbo].[di_uploadedFile]
            WHERE [active] = 1
              AND [flpConfigurationId] = @flpConfigurationId
              AND [flpProcessStatusId] IN (1)   -- Processing
              AND [processTypeId] = 6           -- SharePointWorkspace
        )
        BEGIN
            SELECT N''Failure'' AS [Result], N''File is already in progress.'' AS [Message];
        END
        ELSE
        BEGIN
            SELECT N''Success'' AS [Result], N''File can be proceed.'' AS [Message];
        END
    END TRY
    BEGIN CATCH
        SELECT N''Error'' AS [Result], N''Oops! Something unexpected occurred.'' AS [Message];

        INSERT INTO [dbo].[NLog]
        VALUES (
            @@SERVERNAME,
            GETUTCDATE(),
            N''Error'',
            ERROR_MESSAGE(),
            N''[sel_checkSharePointLandingLayerUploadedFileStatus]'',
            N'''',
            N'''',
            CONCAT(
                N''Error Number: '', ERROR_NUMBER(),
                N''Error Severity: '', ERROR_SEVERITY(),
                N''Error State: '', ERROR_STATE(),
                N''Error Procedure: '', ERROR_PROCEDURE(),
                N''Error Line: '', ERROR_LINE(),
                N''Error Message: '', ERROR_MESSAGE()
            )
        );
    END CATCH
END;';

    EXEC sp_executesql @ProcSql;

    COMMIT TRAN;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRAN;

    DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
    DECLARE @ErrorNumber INT = ERROR_NUMBER();
    DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
    DECLARE @ErrorState INT = ERROR_STATE();
    DECLARE @ErrorProcedure NVARCHAR(200) = ISNULL(ERROR_PROCEDURE(), N'<ad-hoc>');
    DECLARE @ErrorLine INT = ERROR_LINE();

    DECLARE @ThrowMessage NVARCHAR(2048) =
        N'sel_checkSharePointLandingLayerUploadedFileStatus.sql failed. Error ' + CONVERT(NVARCHAR(20), @ErrorNumber) +
        N', Severity ' + CONVERT(NVARCHAR(20), @ErrorSeverity) +
        N', State ' + CONVERT(NVARCHAR(20), @ErrorState) +
        N', Procedure ' + @ErrorProcedure +
        N', Line ' + CONVERT(NVARCHAR(20), @ErrorLine) +
        N': ' + @ErrorMessage;

    THROW 51000, @ThrowMessage, 1;
END CATCH;
GO
