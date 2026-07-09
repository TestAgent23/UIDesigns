SET NOCOUNT ON;
GO

CREATE OR ALTER PROCEDURE dbo.sel_applicationbyid
    @Applicationid UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
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
    WHERE   a.applicationid = @Applicationid;
END;
GO
