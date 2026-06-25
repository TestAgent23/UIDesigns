/*
    READ-ONLY export for production.
    Uses SELECT (sys catalog views) and PRINT (procedure text) only.
    No INSERT, UPDATE, DELETE, CREATE, ALTER, DROP, or MERGE on database objects.

    Part 1 — Stored procedures: OBJECT_DEFINITION (metadata read)
    Part 2 — Tables: column name + data type from sys.columns (metadata read)

    Run check-prerequisites.ps1 on LOCAL first to see which tables are missing.
    Find that table's section in the output and use the column list to build CREATE locally.

    Usage:
        sqlcmd -S <server> -d <database> -E -i export-missing-objects.sql -o missing-ddl.txt
*/

SET NOCOUNT ON;
GO

-- ============================================================================
-- PART 1: STORED PROCEDURE DEFINITIONS (read metadata, print text)
-- ============================================================================

PRINT '-- ============================================================';
PRINT '-- STORED PROCEDURES — definition export (not executed here)';
PRINT '-- ============================================================';
PRINT '';

DECLARE @procName NVARCHAR(256);
DECLARE @definition NVARCHAR(MAX);

DECLARE proc_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT p.name
    FROM sys.procedures p
    WHERE p.is_ms_shipped = 0
      AND p.name IN (
          'sel_flpConfigurationByFlpProcessConfigId',
          'sel_DestinationStorageAccountInfo',
          'sel_configurationTableMapping',
          'sel_mappingColumnList',
          'sel_checkUploadedFileStatus',
          'commit_fileUpload',
          'commit_backUpFile',
          'commit_updateUploadFile',
          'commit_FlpConfigProcessStatus',
          'commit_processScheduler'
      )
    ORDER BY p.name;

OPEN proc_cursor;
FETCH NEXT FROM proc_cursor INTO @procName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @definition = OBJECT_DEFINITION(OBJECT_ID('dbo.' + @procName));

    PRINT '-- ============================================================';
    PRINT '-- PROCEDURE: dbo.' + @procName;
    PRINT '-- ============================================================';
    PRINT '';

    IF @definition IS NOT NULL
        PRINT @definition;
    ELSE
        PRINT '-- NOT FOUND on this database';

    PRINT '';
    PRINT 'GO';
    PRINT '';

    FETCH NEXT FROM proc_cursor INTO @procName;
END

CLOSE proc_cursor;
DEALLOCATE proc_cursor;

GO

-- ============================================================================
-- PART 2: TABLE COLUMN METADATA (SELECT only — no DDL/DML)
-- Same table list as check-prerequisites.ps1. Match missing ones locally.
-- ============================================================================

PRINT '';
PRINT '-- ============================================================';
PRINT '-- TABLE COLUMN METADATA — SELECT from sys catalog (not executed here)';
PRINT '-- Use column_name + data_type to build tables on your local DB.';
PRINT '-- ============================================================';
PRINT '';

DECLARE @tableName SYSNAME;
DECLARE @objectId INT;

DECLARE table_cursor CURSOR LOCAL FAST_FORWARD FOR
    SELECT v.name
    FROM (VALUES
        ('di_application'),
        ('di_applicationsite'),
        ('di_applicationtype'),
        ('di_application_usage'),
        ('di_sharepointlogs'),
        ('di_flpSharePointSource'),
        ('di_flpConfiguration'),
        ('di_flpSchedulerConfiguration'),
        ('di_processScheduler'),
        ('di_configurationTableMapping'),
        ('di_databaseConfiguration'),
        ('di_flpFileConfiguration'),
        ('di_flpFileColumnMapping'),
        ('di_flpFileConfigExtension'),
        ('di_flpFileConfigRegex'),
        ('di_flpConfigurationSecurityGroupMapping'),
        ('di_flpSourceStorageAccountInfo'),
        ('di_flpDestinationStorageAccountInfo'),
        ('di_info_storageAccountDetails'),
        ('di_info_StorageContainerName'),
        ('di_sharedLocationSourceServer'),
        ('di_info_fileServerDetails'),
        ('di_info_processType'),
        ('di_info_region'),
        ('di_info_sub_region'),
        ('di_info_clientnames'),
        ('di_info_schedulerType'),
        ('di_info_securityGroup'),
        ('di_securityGroupesMapping'),
        ('di_userSelectedSecurityGroup'),
        ('di_weekDays'),
        ('di_frequencyHours'),
        ('di_FileExtensionNames'),
        ('di_datatypeNames'),
        ('di_datetimeFormat'),
        ('di_DateTimeFormats'),
        ('di_EnglishCharEquivalents'),
        ('di_databricksDestinationStorageAccountInfo'),
        ('di_flpConfigurationCampaignMapping'),
        ('di_customSchedulerDetails'),
        ('NLog')
    ) v(name)
    ORDER BY v.name;

OPEN table_cursor;
FETCH NEXT FROM table_cursor INTO @tableName;

WHILE @@FETCH_STATUS = 0
BEGIN
    SET @objectId = OBJECT_ID(QUOTENAME('dbo') + '.' + QUOTENAME(@tableName), 'U');

    PRINT '-- ============================================================';
    PRINT '-- TABLE: dbo.' + @tableName;
    PRINT '-- ============================================================';

    IF @objectId IS NULL
    BEGIN
        PRINT '-- NOT FOUND on this database';
        PRINT '';
    END
    ELSE
    BEGIN
        SELECT
            c.column_id,
            c.name AS column_name,
            CASE
                WHEN ty.name IN ('varchar', 'char', 'varbinary', 'binary') THEN
                    ty.name + '(' + CASE WHEN c.max_length = -1 THEN 'max' ELSE CAST(c.max_length AS varchar(10)) END + ')'
                WHEN ty.name IN ('nvarchar', 'nchar') THEN
                    ty.name + '(' + CASE WHEN c.max_length = -1 THEN 'max' ELSE CAST(c.max_length / 2 AS varchar(10)) END + ')'
                WHEN ty.name IN ('decimal', 'numeric') THEN
                    ty.name + '(' + CAST(c.precision AS varchar(10)) + ',' + CAST(c.scale AS varchar(10)) + ')'
                WHEN ty.name IN ('datetime2', 'datetimeoffset', 'time') THEN
                    ty.name + '(' + CAST(c.scale AS varchar(10)) + ')'
                ELSE ty.name
            END AS data_type,
            c.is_nullable,
            c.is_identity
        FROM sys.columns c
        INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
        WHERE c.object_id = @objectId
        ORDER BY c.column_id;

        PRINT '';
    END

    FETCH NEXT FROM table_cursor INTO @tableName;
END

CLOSE table_cursor;
DEALLOCATE table_cursor;

PRINT '-- ============================================================';
PRINT '-- END OF EXPORT';
PRINT '-- ============================================================';
