-- ============================================================
-- Master Data Feed Script
-- Database: SharepointPlugin
-- Date: 18 June 2026
-- Description: Seeds all reference/master/lookup tables with
--              initial data. Safe to re-run (MERGE / IF NOT EXISTS).
-- ============================================================

SET NOCOUNT ON;
GO

-- ============================================================
-- di_info_processType
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_processType]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_processType_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_processType_backup18June2026];
    SELECT * INTO [dbo].[di_info_processType_backup18June2026] FROM [dbo].[di_info_processType];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_processType] WHERE [processTypeId] = 1)
    INSERT INTO [dbo].[di_info_processType] ([processTypeId], [processTypeName], [active], [processConfigurationDisplay])
    VALUES (1, N'Online', 1, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_processType] WHERE [processTypeId] = 2)
    INSERT INTO [dbo].[di_info_processType] ([processTypeId], [processTypeName], [active], [processConfigurationDisplay])
    VALUES (2, N'Offline - Shared Location', 1, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_processType] WHERE [processTypeId] = 3)
    INSERT INTO [dbo].[di_info_processType] ([processTypeId], [processTypeName], [active], [processConfigurationDisplay])
    VALUES (3, N'Offline - Blob Storage', 1, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_processType] WHERE [processTypeId] = 6)
    INSERT INTO [dbo].[di_info_processType] ([processTypeId], [processTypeName], [active], [processConfigurationDisplay])
    VALUES (6, N'SharePoint Workspace', 1, 1);

GO

-- ============================================================
-- di_applicationtype
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_applicationtype]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_applicationtype_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_applicationtype_backup18June2026];
    SELECT * INTO [dbo].[di_applicationtype_backup18June2026] FROM [dbo].[di_applicationtype];
END
GO

SET IDENTITY_INSERT [dbo].[di_applicationtype] ON;

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_applicationtype] WHERE [applicationtypeid] = 2)
    INSERT INTO [dbo].[di_applicationtype] ([applicationtypeid], [code], [displayname], [description], [isactive], [createdon])
    VALUES (2, N'tp_external', N'External', N'External application.', 1, '2026-05-20T09:09:47');

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_applicationtype] WHERE [applicationtypeid] = 3)
    INSERT INTO [dbo].[di_applicationtype] ([applicationtypeid], [code], [displayname], [description], [isactive], [createdon])
    VALUES (3, N'tp_internal', N'Internal', N'Internal site registration.', 1, '2026-05-20T09:09:47');

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_applicationtype] WHERE [applicationtypeid] = 4)
    INSERT INTO [dbo].[di_applicationtype] ([applicationtypeid], [code], [displayname], [description], [isactive], [createdon])
    VALUES (4, N'tp_user_delegated', N'Logged In User', N'Logged in user site registration.', 1, '2026-05-20T09:09:47');

SET IDENTITY_INSERT [dbo].[di_applicationtype] OFF;
GO

-- ============================================================
-- di_info_region
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_region]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_region_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_region_backup18June2026];
    SELECT * INTO [dbo].[di_info_region_backup18June2026] FROM [dbo].[di_info_region];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_region] WHERE [Id] = 1)
    INSERT INTO [dbo].[di_info_region] ([Id], [Name], [StartDTTM], [EndDTTM], [active])
    VALUES (1, N'North America', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_region] WHERE [Id] = 2)
    INSERT INTO [dbo].[di_info_region] ([Id], [Name], [StartDTTM], [EndDTTM], [active])
    VALUES (2, N'Europe', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_region] WHERE [Id] = 3)
    INSERT INTO [dbo].[di_info_region] ([Id], [Name], [StartDTTM], [EndDTTM], [active])
    VALUES (3, N'APAC', '1900-01-01', '9999-12-31', 1);

GO

-- ============================================================
-- di_info_sub_region
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_sub_region]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_sub_region_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_sub_region_backup18June2026];
    SELECT * INTO [dbo].[di_info_sub_region_backup18June2026] FROM [dbo].[di_info_sub_region];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_sub_region] WHERE [Id] = 101)
    INSERT INTO [dbo].[di_info_sub_region] ([Id], [Name], [regionId], [StartDTTM], [EndDTTM], [active])
    VALUES (101, N'USA East', 1, '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_sub_region] WHERE [Id] = 102)
    INSERT INTO [dbo].[di_info_sub_region] ([Id], [Name], [regionId], [StartDTTM], [EndDTTM], [active])
    VALUES (102, N'USA West', 1, '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_sub_region] WHERE [Id] = 201)
    INSERT INTO [dbo].[di_info_sub_region] ([Id], [Name], [regionId], [StartDTTM], [EndDTTM], [active])
    VALUES (201, N'Western Europe', 2, '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_sub_region] WHERE [Id] = 301)
    INSERT INTO [dbo].[di_info_sub_region] ([Id], [Name], [regionId], [StartDTTM], [EndDTTM], [active])
    VALUES (301, N'Southeast Asia', 3, '1900-01-01', '9999-12-31', 1);

GO

-- ============================================================
-- di_info_clientnames
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_clientnames]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_clientnames_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_clientnames_backup18June2026];
    SELECT * INTO [dbo].[di_info_clientnames_backup18June2026] FROM [dbo].[di_info_clientnames];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_clientnames] WHERE [Id] = 1001)
    INSERT INTO [dbo].[di_info_clientnames] ([Id], [Name], [StartDTTM], [EndDTTM], [active])
    VALUES (1001, N'Acme Corporation', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_clientnames] WHERE [Id] = 1002)
    INSERT INTO [dbo].[di_info_clientnames] ([Id], [Name], [StartDTTM], [EndDTTM], [active])
    VALUES (1002, N'Contoso Ltd', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_clientnames] WHERE [Id] = 1003)
    INSERT INTO [dbo].[di_info_clientnames] ([Id], [Name], [StartDTTM], [EndDTTM], [active])
    VALUES (1003, N'Fabrikam Inc', '1900-01-01', '9999-12-31', 1);

GO

-- ============================================================
-- di_info_schedulerType
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_schedulerType]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_schedulerType_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_schedulerType_backup18June2026];
    SELECT * INTO [dbo].[di_info_schedulerType_backup18June2026] FROM [dbo].[di_info_schedulerType];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_schedulerType] WHERE [schedulerTypeId] = 1)
    INSERT INTO [dbo].[di_info_schedulerType] ([schedulerTypeId], [schedulerType], [active])
    VALUES (1, N'One Time', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_schedulerType] WHERE [schedulerTypeId] = 2)
    INSERT INTO [dbo].[di_info_schedulerType] ([schedulerTypeId], [schedulerType], [active])
    VALUES (2, N'Daily', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_schedulerType] WHERE [schedulerTypeId] = 3)
    INSERT INTO [dbo].[di_info_schedulerType] ([schedulerTypeId], [schedulerType], [active])
    VALUES (3, N'Weekly', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_schedulerType] WHERE [schedulerTypeId] = 4)
    INSERT INTO [dbo].[di_info_schedulerType] ([schedulerTypeId], [schedulerType], [active])
    VALUES (4, N'Custom', 1);

GO

-- ============================================================
-- di_info_securityGroup
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_securityGroup]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_securityGroup_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_securityGroup_backup18June2026];
    SELECT * INTO [dbo].[di_info_securityGroup_backup18June2026] FROM [dbo].[di_info_securityGroup];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_securityGroup] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000001')
    INSERT INTO [dbo].[di_info_securityGroup] ([securityGroupId], [securityGroupName], [active])
    VALUES ('00000000-0000-0000-0000-000000000001', N'Product Development', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_securityGroup] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000002')
    INSERT INTO [dbo].[di_info_securityGroup] ([securityGroupId], [securityGroupName], [active])
    VALUES ('00000000-0000-0000-0000-000000000002', N'Product Development Staging', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_securityGroup] WHERE [securityGroupId] = '11111111-1111-1111-1111-111111111111')
    INSERT INTO [dbo].[di_info_securityGroup] ([securityGroupId], [securityGroupName], [active])
    VALUES ('11111111-1111-1111-1111-111111111111', N'Local Dev Group Alt', 1);
GO

-- ============================================================
-- di_securityGroupesMapping
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_securityGroupesMapping]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_securityGroupesMapping_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_securityGroupesMapping_backup18June2026];
    SELECT * INTO [dbo].[di_securityGroupesMapping_backup18June2026] FROM [dbo].[di_securityGroupesMapping];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_securityGroupesMapping] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000001')
    INSERT INTO [dbo].[di_securityGroupesMapping] ([securityGroupId], [regionId], [subRegionId], [clientId], [active])
    VALUES ('00000000-0000-0000-0000-000000000001', NULL, NULL, NULL, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_securityGroupesMapping] WHERE [securityGroupId] = '00000000-0000-0000-0000-000000000002')
    INSERT INTO [dbo].[di_securityGroupesMapping] ([securityGroupId], [regionId], [subRegionId], [clientId], [active])
    VALUES ('00000000-0000-0000-0000-000000000002', NULL, NULL, NULL, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_securityGroupesMapping] WHERE [securityGroupId] = '11111111-1111-1111-1111-111111111111')
    INSERT INTO [dbo].[di_securityGroupesMapping] ([securityGroupId], [regionId], [subRegionId], [clientId], [active])
    VALUES ('11111111-1111-1111-1111-111111111111', NULL, NULL, NULL, 1);
GO

-- ============================================================
-- di_userSelectedSecurityGroup
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_userSelectedSecurityGroup]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_userSelectedSecurityGroup_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_userSelectedSecurityGroup_backup18June2026];
    SELECT * INTO [dbo].[di_userSelectedSecurityGroup_backup18June2026] FROM [dbo].[di_userSelectedSecurityGroup];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_userSelectedSecurityGroup] WHERE [loginId] = N'guest')
    INSERT INTO [dbo].[di_userSelectedSecurityGroup] ([loginId], [securityGroupId], [userName], [userSelectedGroup], [active])
    VALUES (N'guest', N'00000000-0000-0000-0000-000000000001', N'Guest User', 1, 1);
GO

-- ============================================================
-- di_weekDays
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_weekDays]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_weekDays_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_weekDays_backup18June2026];
    SELECT * INTO [dbo].[di_weekDays_backup18June2026] FROM [dbo].[di_weekDays];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 1)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (1, N'Sunday', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 2)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (2, N'Monday', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 3)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (3, N'Tuesday', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 4)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (4, N'Wednesday', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 5)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (5, N'Thursday', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 6)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (6, N'Friday', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_weekDays] WHERE [id] = 7)
    INSERT INTO [dbo].[di_weekDays] ([id], [weekDayName], [active]) VALUES (7, N'Saturday', 1);

GO

-- ============================================================
-- di_frequencyHours
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_frequencyHours]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_frequencyHours_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_frequencyHours_backup18June2026];
    SELECT * INTO [dbo].[di_frequencyHours_backup18June2026] FROM [dbo].[di_frequencyHours];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 1)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (1, N'1', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 2)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (2, N'2', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 3)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (3, N'4', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 4)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (4, N'6', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 5)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (5, N'8', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 6)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (6, N'12', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_frequencyHours] WHERE [id] = 7)
    INSERT INTO [dbo].[di_frequencyHours] ([id], [frequencyHour], [active]) VALUES (7, N'24', 1);

GO

-- ============================================================
-- di_FileExtensionNames
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_FileExtensionNames]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_FileExtensionNames_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_FileExtensionNames_backup18June2026];
    SELECT * INTO [dbo].[di_FileExtensionNames_backup18June2026] FROM [dbo].[di_FileExtensionNames];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_FileExtensionNames] WHERE [id] = 1)
    INSERT INTO [dbo].[di_FileExtensionNames] ([id], [fileExtension], [active]) VALUES (1, N'.csv', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_FileExtensionNames] WHERE [id] = 2)
    INSERT INTO [dbo].[di_FileExtensionNames] ([id], [fileExtension], [active]) VALUES (2, N'.txt', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_FileExtensionNames] WHERE [id] = 3)
    INSERT INTO [dbo].[di_FileExtensionNames] ([id], [fileExtension], [active]) VALUES (3, N'.xlsx', 1);
IF NOT EXISTS (SELECT 1 FROM [dbo].[di_FileExtensionNames] WHERE [id] = 4)
    INSERT INTO [dbo].[di_FileExtensionNames] ([id], [fileExtension], [active]) VALUES (4, N'.json', 1);

GO

-- ============================================================
-- di_datatypeNames
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_datatypeNames]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_datatypeNames_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_datatypeNames_backup18June2026];
    SELECT * INTO [dbo].[di_datatypeNames_backup18June2026] FROM [dbo].[di_datatypeNames];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datatypeNames] WHERE [Id] = 1)
    INSERT INTO [dbo].[di_datatypeNames] ([Id], [dataTypeName], [startDTTM], [endDTTM], [active])
    VALUES (1, N'string', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datatypeNames] WHERE [Id] = 2)
    INSERT INTO [dbo].[di_datatypeNames] ([Id], [dataTypeName], [startDTTM], [endDTTM], [active])
    VALUES (2, N'int', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datatypeNames] WHERE [Id] = 3)
    INSERT INTO [dbo].[di_datatypeNames] ([Id], [dataTypeName], [startDTTM], [endDTTM], [active])
    VALUES (3, N'decimal', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datatypeNames] WHERE [Id] = 4)
    INSERT INTO [dbo].[di_datatypeNames] ([Id], [dataTypeName], [startDTTM], [endDTTM], [active])
    VALUES (4, N'date', '1900-01-01', '9999-12-31', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datatypeNames] WHERE [Id] = 5)
    INSERT INTO [dbo].[di_datatypeNames] ([Id], [dataTypeName], [startDTTM], [endDTTM], [active])
    VALUES (5, N'datetime', '1900-01-01', '9999-12-31', 1);

GO

-- ============================================================
-- di_datetimeFormat
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_datetimeFormat]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_datetimeFormat_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_datetimeFormat_backup18June2026];
    SELECT * INTO [dbo].[di_datetimeFormat_backup18June2026] FROM [dbo].[di_datetimeFormat];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datetimeFormat] WHERE [formatId] = 1)
    INSERT INTO [dbo].[di_datetimeFormat] ([formatId], [format], [apiFormat], [formatDataTypeId], [active])
    VALUES (1, N'yyyy-MM-dd', N'yyyy-MM-dd', 1, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datetimeFormat] WHERE [formatId] = 2)
    INSERT INTO [dbo].[di_datetimeFormat] ([formatId], [format], [apiFormat], [formatDataTypeId], [active])
    VALUES (2, N'MM/dd/yyyy', N'MM/dd/yyyy', 1, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_datetimeFormat] WHERE [formatId] = 3)
    INSERT INTO [dbo].[di_datetimeFormat] ([formatId], [format], [apiFormat], [formatDataTypeId], [active])
    VALUES (3, N'HH:mm:ss', N'HH:mm:ss', 2, 1);

GO

-- ============================================================
-- di_DateTimeFormats
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_DateTimeFormats]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_DateTimeFormats_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_DateTimeFormats_backup18June2026];
    SELECT * INTO [dbo].[di_DateTimeFormats_backup18June2026] FROM [dbo].[di_DateTimeFormats];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_DateTimeFormats] WHERE [FormatId] = 1)
    INSERT INTO [dbo].[di_DateTimeFormats] ([FormatId], [Format], [DataTypeName], [displayOnLandingLayer], [active])
    VALUES (1, N'yyyy-MM-dd', N'Date', 0, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_DateTimeFormats] WHERE [FormatId] = 2)
    INSERT INTO [dbo].[di_DateTimeFormats] ([FormatId], [Format], [DataTypeName], [displayOnLandingLayer], [active])
    VALUES (2, N'MM/dd/yyyy', N'Date', 1, 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_DateTimeFormats] WHERE [FormatId] = 3)
    INSERT INTO [dbo].[di_DateTimeFormats] ([FormatId], [Format], [DataTypeName], [displayOnLandingLayer], [active])
    VALUES (3, N'HH:mm:ss', N'Time', 0, 1);

GO

-- ============================================================
-- di_EnglishCharEquivalents
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_EnglishCharEquivalents]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_EnglishCharEquivalents_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_EnglishCharEquivalents_backup18June2026];
    SELECT * INTO [dbo].[di_EnglishCharEquivalents_backup18June2026] FROM [dbo].[di_EnglishCharEquivalents];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_EnglishCharEquivalents] WHERE [language] = N'Spanish' AND [CharToConvert] = N'á')
    INSERT INTO [dbo].[di_EnglishCharEquivalents] ([language], [CharToConvert], [EnglishEquivalent], [active])
    VALUES (N'Spanish', N'á', N'a', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_EnglishCharEquivalents] WHERE [language] = N'Spanish' AND [CharToConvert] = N'é')
    INSERT INTO [dbo].[di_EnglishCharEquivalents] ([language], [CharToConvert], [EnglishEquivalent], [active])
    VALUES (N'Spanish', N'é', N'e', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_EnglishCharEquivalents] WHERE [language] = N'Spanish' AND [CharToConvert] = N'í')
    INSERT INTO [dbo].[di_EnglishCharEquivalents] ([language], [CharToConvert], [EnglishEquivalent], [active])
    VALUES (N'Spanish', N'í', N'i', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_EnglishCharEquivalents] WHERE [language] = N'Spanish' AND [CharToConvert] = N'ó')
    INSERT INTO [dbo].[di_EnglishCharEquivalents] ([language], [CharToConvert], [EnglishEquivalent], [active])
    VALUES (N'Spanish', N'ó', N'o', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_EnglishCharEquivalents] WHERE [language] = N'Spanish' AND [CharToConvert] = N'ú')
    INSERT INTO [dbo].[di_EnglishCharEquivalents] ([language], [CharToConvert], [EnglishEquivalent], [active])
    VALUES (N'Spanish', N'ú', N'u', 1);

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_EnglishCharEquivalents] WHERE [language] = N'Spanish' AND [CharToConvert] = N'ñ')
    INSERT INTO [dbo].[di_EnglishCharEquivalents] ([language], [CharToConvert], [EnglishEquivalent], [active])
    VALUES (N'Spanish', N'ñ', N'n', 1);
GO

-- ============================================================
-- di_info_storageAccountDetails
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_storageAccountDetails]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_storageAccountDetails_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_storageAccountDetails_backup18June2026];
    SELECT * INTO [dbo].[di_info_storageAccountDetails_backup18June2026] FROM [dbo].[di_info_storageAccountDetails];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_storageAccountDetails] WHERE [storageAccountId] = 1)
    INSERT INTO [dbo].[di_info_storageAccountDetails] ([storageAccountId], [displayName], [fileProcessingServerTypeId], [active])
    VALUES (1, N'local-dev-storage', 1, 1);

GO

-- ============================================================
-- di_info_StorageContainerName
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_StorageContainerName]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_StorageContainerName_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_StorageContainerName_backup18June2026];
    SELECT * INTO [dbo].[di_info_StorageContainerName_backup18June2026] FROM [dbo].[di_info_StorageContainerName];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_StorageContainerName] WHERE [storageAccountId] = 1 AND [containerName] = N'local-container')
    INSERT INTO [dbo].[di_info_StorageContainerName] ([storageAccountId], [containerName], [active])
    VALUES (1, N'local-container', 1);
GO

-- ============================================================
-- di_info_fileServerDetails
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_info_fileServerDetails]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_info_fileServerDetails_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_info_fileServerDetails_backup18June2026];
    SELECT * INTO [dbo].[di_info_fileServerDetails_backup18June2026] FROM [dbo].[di_info_fileServerDetails];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_info_fileServerDetails] WHERE [fileServerId] = 1)
    INSERT INTO [dbo].[di_info_fileServerDetails] ([fileServerId], [displayServerName], [active])
    VALUES (1, N'LOCAL-DEV-FS', 1);

GO

-- ============================================================
-- di_dataSliceAPIConfig
-- ============================================================
IF OBJECT_ID(N'[dbo].[di_dataSliceAPIConfig]', N'U') IS NOT NULL
BEGIN
    IF OBJECT_ID(N'[dbo].[di_dataSliceAPIConfig_backup18June2026]', N'U') IS NOT NULL
        DROP TABLE [dbo].[di_dataSliceAPIConfig_backup18June2026];
    SELECT * INTO [dbo].[di_dataSliceAPIConfig_backup18June2026] FROM [dbo].[di_dataSliceAPIConfig];
END
GO

IF NOT EXISTS (SELECT 1 FROM [dbo].[di_dataSliceAPIConfig] WHERE [id] = 1)
    INSERT INTO [dbo].[di_dataSliceAPIConfig] ([id], [consumerApplicationId], [sourceDataObjId], [active])
    VALUES (1, '3452F3BA-AF59-41C5-85A0-11DF12404ADC', '86176C0E-5791-4603-B6ED-412CCC14F165', 1);

GO

PRINT 'Master data feed complete. All reference tables seeded.';
GO