using System;
using System.Data;
using System.Globalization;
using System.Linq;
using Dapper;
using Teleperformance.DataIngestion.Models.DTOs.v1._0.FileConfiguration;
using Teleperformance.DataIngestion.Models.Entities.v2._0.ProcessConfiguration;

namespace Teleperformance.DataIngestion.DataAccess.Helpers
{
    internal static class FlpConfigurationInsertParameterBuilder
    {
        public static DynamicParameters Build(InsertFlpConfigurationRequest request)
        {
            var dynamicParameters = new DynamicParameters();
            dynamicParameters.Add("@flpConfigurationId", dbType: DbType.String, direction: ParameterDirection.Output, size: 100);
            dynamicParameters.Add("@process_name", request.ProcessName);
            dynamicParameters.Add("@locationTypeId", request.LocationTypeId);
            dynamicParameters.Add("@sender_communication_email", request.SenderCommunicationEmail);
            dynamicParameters.Add("@created_by", request.CreatedBy);
            dynamicParameters.Add("@userName", request.UserName);
            dynamicParameters.Add("@description", request.Description);
            dynamicParameters.Add("@processTypeId", request.ProcessTypeId);
            dynamicParameters.Add("@regionId", request.RegionId);
            dynamicParameters.Add("@subRegionId", request.SubRegionId);
            dynamicParameters.Add("@clientId", request.ClientId);
            dynamicParameters.Add("@search_string_in_file_name", request.SearchStringInFileName);
            dynamicParameters.Add("@serverLocationId", request.ServerLocationId);
            dynamicParameters.Add("@baseFolderName", request.BaseFolderName);
            dynamicParameters.Add("@sourceFolderLocation", request.SourceFolderLocation);
            dynamicParameters.Add("@scheduledId", request.ScheduledId);
            dynamicParameters.Add("@scheduleValue", request.scheduleValue);
            dynamicParameters.Add("@scheduledDate", ToSchedulerSqlDate(request.ScheduledDate));
            dynamicParameters.Add("@scheduledTime", ToSchedulerSqlTime(request.ScheduledTime));
            dynamicParameters.Add("@scheduledEndDate", ToSchedulerSqlDate(request.ScheduledEndDate));
            dynamicParameters.Add("@scheduledEndTime", ToSchedulerSqlTime(request.ScheduledEndTime));
            dynamicParameters.Add("@blobStorageAccount", request.BlobStorageAccount);
            dynamicParameters.Add("@blobContainerName", request.blobContainerName);
            dynamicParameters.Add("@configId", request.configurationId);
            dynamicParameters.Add("@blobSourcePath", request.blobSourcePath);
            dynamicParameters.Add("@updateSchedular", request.updateSchedular);
            dynamicParameters.Add("@securityGroupId", BuildSecurityGroupIds(request.securityGroups));
            dynamicParameters.Add("@weekDaysIds", BuildWeekDayIds(request.weekDays));
            dynamicParameters.Add("@frequencyHoursId", request.hourFrequency);
            dynamicParameters.Add("@region", request.region);
            dynamicParameters.Add("@subRegion", request.subRegion);
            dynamicParameters.Add("@clientName", request.clientName);
            dynamicParameters.Add("@deltaSource", request.deltaSource);
            dynamicParameters.Add("@deltaStorageAccountId", ParseDeltaStorageAccountId(request.deltaStorageAccountId));
            dynamicParameters.Add("@deltaContainerName", request.deltaContainerName);
            dynamicParameters.Add("@flpProcessingServerTypeId", request.dataSource);
            dynamicParameters.Add("@internalCampaignId", request.internalCampaignId);
            dynamicParameters.Add("@sharePointApplicationId", ParseGuid(request.SharePointApplicationId));
            dynamicParameters.Add("@sharePointApplicationSiteId", ParseGuid(request.SharePointApplicationSiteId));
            dynamicParameters.Add("@sharePointLibraryName", request.SharePointLibraryName);
            dynamicParameters.Add("@sharePointFolderPath", request.SharePointFolderPath);

            return dynamicParameters;
        }

        public static string? ReadConfigurationId(DynamicParameters dynamicParameters) =>
            dynamicParameters.Get<string>("@flpConfigurationId");

        private static string BuildSecurityGroupIds(SecurityGroup[]? securityGroups) =>
            securityGroups == null || securityGroups.Length == 0
                ? string.Empty
                : string.Join(",", securityGroups.Select(group => group.securityGroupId));

        private static string BuildWeekDayIds(int[]? weekDays) =>
            weekDays == null || weekDays.Length == 0
                ? string.Empty
                : string.Join(",", weekDays);

        private static int ParseDeltaStorageAccountId(string? value) =>
            int.TryParse(value, NumberStyles.Integer, CultureInfo.InvariantCulture, out var parsed)
                ? parsed
                : 0;

        private static object? ParseGuid(string? value) =>
            Guid.TryParse(value, out var parsed) ? parsed : null;

        private static object ToSchedulerSqlDate(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return DBNull.Value;
            }

            if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return parsed.Date;
            }

            return DBNull.Value;
        }

        private static object ToSchedulerSqlTime(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return DBNull.Value;
            }

            if (TimeSpan.TryParse(value, CultureInfo.InvariantCulture, out var timeSpan))
            {
                return DateTime.Today.Add(timeSpan);
            }

            if (DateTime.TryParse(value, CultureInfo.InvariantCulture, DateTimeStyles.None, out var parsed))
            {
                return DateTime.Today.Add(parsed.TimeOfDay);
            }

            return DBNull.Value;
        }
    }
}
