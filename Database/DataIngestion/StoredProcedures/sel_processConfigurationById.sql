SET ANSI_NULLS ON;
GO

SET QUOTED_IDENTIFIER ON;
GO

CREATE OR ALTER PROC dbo.sel_processConfigurationById
    @flpConfigurationId NVARCHAR(100),
    @tabName NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    SELECT
        flp.id AS [Id],
        flp.flpConfigurationId,
        flp.locationTypeId,
        fServer.serverName 'SharedServerName',
        flp.process_name,
        flp.sender_communication_email,
        flp.userName,
        flp.loginid,
        flp.processTypeId,
        pt.processTypeName,
        flp.regionId,
        flp.[region] AS [RegionName],
        flp.subRegionId AS [SubRegionId],
        flp.[subRegion] AS [SubRegionName],
        flp.created_date AS [CreatedDate],
        flp.clientId 'ClientId',
        flp.[clientName] AS [ClientName],
        flp.[Description] 'Description',
        flp.search_string_in_file_name,
        dbc.databaseName,
        ctm.tableName,
        flp.sourcePath AS [sourcePath],
        flp.destinationPath,
        ctm.datalakeStorageAccountPath 'deltaSource',
        stAc.storageAccountId,
        stAc.storageContainerName,
        locServer.fileServerId,
        locServer.folderName,
        locServer.sharedLocationServerInfoId,
        blbStAc.storageAccountName 'blobStorageAccountName',
        blbAc.storageAccountId 'blobStorageAccountId',
        blbAc.storageContainerName 'blobStorageContainerName',
        scheduler.scheduleTypeId 'scheduleTypeId',
        scheduler.scheduleValue 'scheduleValue',
        CONVERT(VARCHAR(10), scheduler.scheduleStartDate, 23) 'scheduleStartDate',
        CONVERT(VARCHAR(10), scheduler.scheduleEndDate, 23) 'scheduleEndDate',
        CONVERT(VARCHAR(5), scheduler.scheduleStartTime, 108) 'scheduleStartTime',
        CONVERT(VARCHAR(5), scheduler.scheduleEndTime, 108) 'scheduleEndTime',
        sType.schedulerType 'schedulerType',
        ddad.storageContainerName 'deltaContainerName',
        ddad.storageAccountId 'deltaStorageAccountId',
        dbStAc.displayName 'deltaStorageAccountName',
        flp.fileProcessingServerTypeId 'dataSource',
        campConfig.campaignId 'campaignId',
        ccm.internalCampaignId 'internalCampaignId',
        sp_src.sharePointApplicationId 'sharePointApplicationId',
        sp_src.sharePointApplicationSiteId 'sharePointApplicationSiteId',
        sp_src.sharePointLibraryName 'sharePointLibraryName',
        sp_src.sharePointFolderPath 'sharePointFolderPath',
        spApp.displayname 'sharePointApplicationName',
        spSite.sitename 'sharePointSiteName'
    FROM di_flpConfiguration flp
    LEFT JOIN di_configurationTableMapping ctm
        ON flp.flpConfigurationId = ctm.flpConfigurationId
       AND (@tabName IS NULL OR ctm.tabName = @tabName)
    LEFT JOIN di_databaseConfiguration dbc
        ON dbc.id = ctm.databaseConfigurationId
    LEFT JOIN di_info_processType pt
        ON pt.processTypeId = flp.processTypeId
    LEFT JOIN di_flpSchedulerConfiguration scheduler
        ON scheduler.flpConfigurationId = flp.flpConfigurationId
    LEFT JOIN di_info_schedulerType sType
        ON sType.schedulerTypeId = scheduler.scheduleTypeId
    LEFT JOIN di_flpDestinationStorageAccountInfo stAc
        ON stAc.flpConfigurationId = flp.flpConfigurationId
    LEFT JOIN di_sharedLocationSourceServer locServer
        ON locServer.flpConfigurationId = flp.flpConfigurationId
    LEFT JOIN di_info_fileServerDetails fServer
        ON fServer.fileServerId = locServer.fileServerId
    LEFT JOIN di_flpSourceStorageAccountInfo blbAc
        ON blbAc.flpConfigurationId = flp.flpConfigurationId
    LEFT JOIN di_info_storageAccountDetails blbStAc
        ON blbStAc.storageAccountId = blbAc.storageAccountId
    LEFT JOIN di_databricksDestinationStorageAccountInfo ddad
        ON ddad.flpConfigurationId = flp.flpConfigurationId
       AND (@tabName IS NULL OR ddad.tabName = @tabName)
    LEFT JOIN di_info_storageAccountDetails dbStAc
        ON dbStAc.storageAccountId = ddad.storageAccountId
    LEFT JOIN di_flpConfigurationCampaignMapping ccm
        ON ccm.flpConfigurationId = flp.flpConfigurationId
    LEFT JOIN di_campaignConfiguration campConfig
        ON campConfig.internalCampaignId = ccm.internalCampaignId
    LEFT JOIN di_flpSharePointSource sp_src
        ON sp_src.flpConfigurationId = flp.flpConfigurationId AND sp_src.active = 1
    LEFT JOIN di_application spApp
        ON spApp.applicationid = sp_src.sharePointApplicationId
    LEFT JOIN di_applicationsite spSite
        ON spSite.applicationsiteid = sp_src.sharePointApplicationSiteId
    WHERE flp.is_active = 1
      AND flp.flpConfigurationId = @flpConfigurationId;

    SELECT
        fileConf.flpConfigurationId 'flpConfigurationId',
        fileConf.fileNameString 'fileNameString',
        fileConf.tabName 'tabName',
        fileConf.delimiter 'Delimiter',
        fileConf.quote_character 'QuoteCharacter',
        fileConf.is_header_provided 'IsHeaderProvided',
        fileConf.skip_rows 'SkipRows',
        fileConf.skip_footer_rows 'SkipFooterRows',
        fileConf.key_column_list 'KeyColumnList',
        fileConf.ignore_duplicate_rows 'IgnoreDuplicateRows',
        fileConf.do_not_archive_file 'DoNotArchiveFile',
        fileConf.keep_first_row 'KeepFirstRow',
        fileConf.column_name_list 'ColumnNameList',
        fileConf.order_by_column_list_for_dedup 'dedup',
        fileConf.convert_datatypes_column_list 'ConvertDatatypesColumnList',
        fileConf.spanishToEnglish 'SpanishToEnglish',
        fileConf.romanNumeralsOnly 'RomanNumeralsOnly',
        fileConf.skipEmptyLines 'SkipEmptyLines',
        fileConf.prefix 'LandingLayerPrefix',
        fileConf.dateFormatId,
        fileConf.timeFormatId,
        STUFF((
            SELECT ',' + CAST(extensionId AS NVARCHAR(MAX))
            FROM di_flpFileConfigExtension
            WHERE active = 1
              AND flpConfigurationId = fileConf.flpConfigurationId
            FOR XML PATH(''), TYPE
        ).value('.', 'NVARCHAR(MAX)'), 1, 1, '') AS landingLayerFileExtension,
        (
            SELECT regex, description, mode
            FROM di_flpFileConfigRegex
            WHERE active = 1
              AND flpConfigurationId = fileConf.flpConfigurationId
            FOR JSON PATH
        ) AS landingLayerRegex
    FROM di_flpFileConfiguration fileConf
    WHERE fileConf.flpConfigurationId = @flpConfigurationId
      AND fileConf.active = 1
      AND (@tabName IS NULL OR fileConf.tabName = @tabName);

    SELECT
        map.flpConfigurationId,
        map.tabName 'TabName',
        map.tableName 'TableName',
        map.databaseConfigurationId 'DatabaseConfigurationId',
        dbConfig.databaseName 'DatabaseName',
        map.drop_main_table 'DropMainTable',
        map.drop_history_table 'DropHistoryTable',
        validate_fileschema 'ValidateFileSchema',
        map.mergeData 'MergeData',
        map.createHistoryTable 'CreateHistoryTable',
        map.jobid 'DeltaJobId',
        map.landingLayerPath 'LandingLayerAcceptedPath',
        map.rejectedLayerPath 'LandingLayerRejectedPath'
    FROM di_configurationTableMapping map
    LEFT JOIN dbo.di_databaseConfiguration dbConfig
        ON dbConfig.id = map.databaseConfigurationId
    WHERE map.flpConfigurationId = @flpConfigurationId
      AND map.active = 1
      AND dbConfig.active = 1
      AND (@tabName IS NULL OR map.tabName = @tabName);

    SELECT frequencyHoursId, weekDaysId
    FROM di_customSchedulerDetails
    WHERE flpConfigurationId = @flpConfigurationId
      AND active = 1;

    SELECT
        flpMap.parquetColMappingId,
        flpMap.fileColumn,
        flpMap.dbColumn,
        flpMap.formatId,
        flpMap.dataType,
        flpMap.active
    FROM di_flpFileColumnMapping flpMap
    WHERE flpMap.Active = 1
      AND flpMap.flpConfigurationId = @flpConfigurationId
      AND (@tabName IS NULL OR flpMap.tabName = @tabName)
    ORDER BY flpMap.id;

    SELECT gm.securityGroupId, sg.securityGroupName
    FROM di_flpConfigurationSecurityGroupMapping gm
    JOIN di_info_securityGroup sg
        ON sg.securityGroupId = gm.securityGroupId AND sg.active = 1
    WHERE gm.active = 1
      AND gm.flpConfigurationId = @flpConfigurationId
      AND sg.active = 1;

    EXEC sel_flpRuleSetsByConfigId @flpConfigurationId, @tabName;
END;
GO
