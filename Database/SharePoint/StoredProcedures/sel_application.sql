SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.sel_application
    @Ownerkey           NVARCHAR(128) = NULL,
    @Applicationtypeid  INT           = NULL,
    @Regionident        INT           = NULL,
    @Subregioncode      NVARCHAR(32)  = NULL,
    @Clientident        INT           = NULL,
    @Securitygroupid    UNIQUEIDENTIFIER = NULL,
    @Includeinactive    BIT           = 0
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @AllSubRegion NVARCHAR(32) = N'ALL';
    DECLARE @AllClientIdent INT = 0;
    DECLARE @AllSecurityGroup UNIQUEIDENTIFIER = '00000000-0000-0000-0000-000000000000';

    SELECT  a.applicationid       AS ApplicationId,
            a.applicationtypeid   AS ApplicationTypeId,
            t.code                AS ApplicationTypeCode,
            t.displayname         AS ApplicationTypeName,
            a.ownerkey            AS OwnerKey,
            a.displayname         AS DisplayName,
            a.tenantid            AS TenantId,
            a.clientid            AS ClientId,
            a.clientsecret        AS ClientSecret,
            a.hostname            AS HostName,
            a.sitename            AS SiteName,
            a.libraryname         AS LibraryName,
            a.consumerclientid    AS ConsumerClientId,
            a.consumersecret      AS ConsumerSecret,
            a.owner               AS Owner,
            a.ownerupn            AS OwnerUpn,
            a.coowner             AS CoOwner,
            a.coownerupn          AS CoOwnerUpn,
            a.notes               AS Notes,
            a.regionident         AS RegionIdent,
            a.regionname          AS RegionName,
            a.subregioncode       AS SubRegionCode,
            a.subregionname       AS SubRegionName,
            a.clientident         AS ClientIdent,
            a.clientname          AS ClientName,
            a.securitygroupid     AS SecurityGroupId,
            a.securitygroupname   AS SecurityGroupName,
            a.isactive            AS IsActive,
            a.createdon           AS CreatedOn,
            a.modifiedon          AS ModifiedOn
    FROM    dbo.di_application AS a
            INNER JOIN dbo.di_applicationtype AS t
                ON t.applicationtypeid = a.applicationtypeid
    WHERE   (@Includeinactive = 1 OR a.isactive = 1)
      AND   (@Ownerkey IS NULL OR a.ownerkey = @Ownerkey)
      AND   (@Applicationtypeid IS NULL OR a.applicationtypeid = @Applicationtypeid)
      AND   (@Regionident IS NULL OR a.regionident IS NULL OR a.regionident = @Regionident)
      AND   (
                @Subregioncode IS NULL
                OR LTRIM(RTRIM(@Subregioncode)) = N''
                OR a.subregioncode IS NULL
                OR a.subregioncode = @AllSubRegion
                OR a.subregioncode = @Subregioncode
            )
      AND   (
                @Clientident IS NULL
                OR @Clientident = @AllClientIdent
                OR a.clientident IS NULL
                OR a.clientident = @AllClientIdent
                OR a.clientident = @Clientident
            )
      AND   (
                @Securitygroupid IS NULL
                OR a.securitygroupid IS NULL
                OR a.securitygroupid = @AllSecurityGroup
                OR a.securitygroupid = @Securitygroupid
            )
    ORDER BY a.displayname;
END;
GO
