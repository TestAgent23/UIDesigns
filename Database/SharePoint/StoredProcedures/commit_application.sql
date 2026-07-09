SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.commit_application
    @Applicationid      UNIQUEIDENTIFIER = NULL OUTPUT,
    @Applicationtypeid  INT,
    @Ownerkey           NVARCHAR(128),
    @Displayname        NVARCHAR(128),
    @Tenantid           NVARCHAR(64),
    @Clientid           NVARCHAR(64),
    @Clientsecret       NVARCHAR(512),
    @Hostname           NVARCHAR(256),
    @Sitename           NVARCHAR(256) = NULL,
    @Libraryname        NVARCHAR(256) = NULL,
    @Consumerclientid   NVARCHAR(64) = NULL,
    @Consumersecret     NVARCHAR(512) = NULL,
    @Owner              NVARCHAR(256),
    @Ownerupn           NVARCHAR(256) = NULL,
    @Coowner            NVARCHAR(256) = NULL,
    @Coownerupn         NVARCHAR(256) = NULL,
    @Notes              NVARCHAR(1024) = NULL,
    @Regionident        INT = NULL,
    @Regionname         NVARCHAR(256) = NULL,
    @Subregioncode      NVARCHAR(32) = NULL,
    @Subregionname      NVARCHAR(256) = NULL,
    @Clientident        INT = NULL,
    @Clientname         NVARCHAR(256) = NULL,
    @Securitygroupid    UNIQUEIDENTIFIER = NULL,
    @Securitygroupname  NVARCHAR(256) = NULL,
    @Isactive           BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @NormalizedSubRegionCode NVARCHAR(32) =
        CASE WHEN @Subregioncode IS NULL OR LTRIM(RTRIM(@Subregioncode)) = N'' THEN N'ALL' ELSE @Subregioncode END;
    DECLARE @NormalizedSubRegionName NVARCHAR(256) =
        CASE WHEN @Subregionname IS NULL OR LTRIM(RTRIM(@Subregionname)) = N'' THEN N'All' ELSE @Subregionname END;
    DECLARE @NormalizedClientIdent INT =
        CASE WHEN @Clientident IS NULL OR @Clientident <= 0 THEN 0 ELSE @Clientident END;
    DECLARE @NormalizedClientName NVARCHAR(256) =
        CASE WHEN @Clientname IS NULL OR LTRIM(RTRIM(@Clientname)) = N'' OR @NormalizedClientIdent = 0 THEN N'All' ELSE @Clientname END;
    DECLARE @AllSecurityGroup UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000000';
    DECLARE @NormalizedSecurityGroupId UNIQUEIDENTIFIER =
        CASE WHEN @Securitygroupid IS NULL OR @Securitygroupid = @AllSecurityGroup THEN @AllSecurityGroup ELSE @Securitygroupid END;
    DECLARE @NormalizedSecurityGroupName NVARCHAR(256) =
        CASE
            WHEN @Securitygroupname IS NULL OR LTRIM(RTRIM(@Securitygroupname)) = N'' OR @Securitygroupname = N'All' THEN N'All'
            ELSE @Securitygroupname
        END;

    IF @Applicationid IS NULL OR NOT EXISTS (SELECT 1 FROM dbo.di_application WHERE applicationid = @Applicationid)
    BEGIN
        IF @Applicationid IS NULL SET @Applicationid = NEWID();
        IF @Consumerclientid IS NULL OR LTRIM(RTRIM(@Consumerclientid)) = N''
            SET @Consumerclientid = CONVERT(NVARCHAR(36), NEWID());
        IF @Consumersecret IS NULL OR LTRIM(RTRIM(@Consumersecret)) = N''
            SET @Consumersecret = LOWER(CONVERT(NVARCHAR(64), CRYPT_GEN_RANDOM(32), 2));
        INSERT INTO dbo.di_application (
            applicationid, applicationtypeid, ownerkey, displayname,
            tenantid, clientid, clientsecret, hostname, sitename, libraryname,
            consumerclientid, consumersecret, owner, ownerupn, coowner, coownerupn, notes,
            regionident, regionname, subregioncode, subregionname, clientident, clientname,
            securitygroupid, securitygroupname, isactive
        )
        VALUES (
            @Applicationid, @Applicationtypeid, @Ownerkey, @Displayname,
            @Tenantid, @Clientid, @Clientsecret, @Hostname, @Sitename, @Libraryname,
            @Consumerclientid, @Consumersecret, @Owner, @Ownerupn, @Coowner, @Coownerupn, @Notes,
            @Regionident, @Regionname, @NormalizedSubRegionCode, @NormalizedSubRegionName,
            @NormalizedClientIdent, @NormalizedClientName,
            @NormalizedSecurityGroupId, @NormalizedSecurityGroupName,
            CASE WHEN @Isactive IS NULL THEN 1 ELSE @Isactive END
        );
    END
    ELSE
    BEGIN
        UPDATE dbo.di_application
        SET applicationtypeid = @Applicationtypeid,
            ownerkey          = @Ownerkey,
            displayname       = @Displayname,
            tenantid          = @Tenantid,
            clientid          = @Clientid,
            clientsecret      = @Clientsecret,
            hostname          = @Hostname,
            sitename          = @Sitename,
            libraryname       = @Libraryname,
            consumerclientid  = CASE
                WHEN @Consumerclientid IS NOT NULL AND LTRIM(RTRIM(@Consumerclientid)) <> N'' THEN @Consumerclientid
                ELSE consumerclientid END,
            consumersecret    = CASE
                WHEN @Consumersecret IS NOT NULL AND LTRIM(RTRIM(@Consumersecret)) <> N'' THEN @Consumersecret
                ELSE consumersecret END,
            owner             = @Owner,
            ownerupn          = @Ownerupn,
            coowner           = @Coowner,
            coownerupn        = @Coownerupn,
            notes             = @Notes,
            regionident       = @Regionident,
            regionname        = @Regionname,
            subregioncode     = @NormalizedSubRegionCode,
            subregionname     = @NormalizedSubRegionName,
            clientident       = @NormalizedClientIdent,
            clientname        = @NormalizedClientName,
            securitygroupid   = @NormalizedSecurityGroupId,
            securitygroupname = @NormalizedSecurityGroupName,
            isactive          = CASE WHEN @Isactive IS NULL THEN isactive ELSE @Isactive END,
            modifiedon        = GETUTCDATE()
        WHERE applicationid = @Applicationid;
    END
    EXEC dbo.sel_applicationbyid @Applicationid;
END;
GO
