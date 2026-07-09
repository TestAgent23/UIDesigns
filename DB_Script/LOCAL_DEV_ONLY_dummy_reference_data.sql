-- ============================================================
-- LOCAL DEV ONLY — reference / dummy data
-- ============================================================
-- DO NOT run in production.
-- DO NOT create or alter stored procedures.
-- DO NOT alter existing table schemas.
--
-- Safe pattern: IF NOT EXISTS inserts only into tables that
-- already exist in the Data Ingestion database.
--
-- What this seeds (DB side):
--   di_info_securityGroup          — security group names
--   di_securityGroupesMapping      — which regions/clients a group can see
--   di_userSelectedSecurityGroup     — default group for guest/local login
--   di_info_region / sub_region / clientnames — legacy reference (not used
--     by Process Settings dropdowns in the current UI path)
--
-- What Process Settings Region / Sub-Region / Client dropdowns use:
--   Production: external DataSlice API (FillCache + GetRegionsBySecurityGroup)
--   Local dev without Azure/DataSlice: use Guest login — the Angular guest
--   interceptor (guest-mock.data.ts) returns dummy region/sub-region/client data.
--
-- If you already ran master_data_feed.sql, this file is mostly redundant.
-- Run only on a fresh local DB missing reference rows.
-- ============================================================

SET NOCOUNT ON;
GO

-- Security groups (no Azure required for display name in saved configs)
IF OBJECT_ID(N'[dbo].[di_info_securityGroup]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_securityGroup] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000001')
        INSERT INTO [dbo].[di_info_securityGroup] ([securityGroupId], [securityGroupName], [active])
        VALUES ('00000000-0000-0000-0000-000000000001', N'Product Development', 1);

    IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_securityGroup] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000002')
        INSERT INTO [dbo].[di_info_securityGroup] ([securityGroupId], [securityGroupName], [active])
        VALUES ('00000000-0000-0000-0000-000000000002', N'Product Development Staging', 1);
END
GO

-- Full access mapping (NULL region/sub/client = all DataSlice regions for that group)
IF OBJECT_ID(N'[dbo].[di_securityGroupesMapping]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[di_securityGroupesMapping] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000001')
        INSERT INTO [dbo].[di_securityGroupesMapping] ([securityGroupId], [regionId], [subRegionId], [clientId], [active])
        VALUES ('00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, 1);
END
GO

IF OBJECT_ID(N'[dbo].[di_userSelectedSecurityGroup]', N'U') IS NOT NULL
BEGIN
    IF NOT EXISTS (SELECT 1 FROM [dbo].[di_userSelectedSecurityGroup] WHERE [loginId] = N'guest')
        INSERT INTO [dbo].[di_userSelectedSecurityGroup] ([loginId], [securityGroupId], [userName], [userSelectedGroup], [active])
        VALUES (N'guest', N'00000000-0000-0000-0000-000000000001', N'Guest User', 1, 1);
END
GO

PRINT 'LOCAL_DEV_ONLY dummy reference data applied (inserts only, no schema/SP changes).';
GO
