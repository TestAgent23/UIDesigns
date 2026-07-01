select flp.flpConfigurationId, flp.process_name, ctm.tabName, ctm.tableName, dc.databaseName
from dbo.di_flpConfiguration flp
inner join dbo.di_configurationTableMapping ctm on ctm.flpConfigurationId = flp.flpConfigurationId and ctm.active = 1
left join dbo.di_databaseConfiguration dc on dc.id = ctm.databaseConfigurationId and dc.active = 1
where flp.is_active = 1 and flp.process_name = @processNameLookup and flp.processTypeId = 6 and flp.locationTypeId = 4;
