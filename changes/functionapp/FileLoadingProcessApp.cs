using System;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Teleperformance.DataIngestion.FunctionApp.Enum;
using Teleperformance.DataIngestion.FunctionApp.Helpers;
using Teleperformance.DataIngestion.FunctionApp.Repository;
using Teleperformance.DataIngestion.FunctionApp.Services;
using Teleperformance.DataIngestion.Sharepoint.Configuration;
using ILogger = Microsoft.Extensions.Logging.ILogger;

namespace Teleperformance.DataIngestion.FunctionApp
{
    public class FileLoadingProcessApp
    {
        private readonly ILogger _logger;

        public FileLoadingProcessApp(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<FileLoadingProcessApp>();

        }
        /// <summary>
        /// This function only Run  every 1 minutes:
        /// </summary>
        /// <param name="myTimer"></param>
        [Function("FunctionAppSharedLocation")]
        public async Task FunctionAppSharedLocation([TimerTrigger("0 */1 * * * *")] TimerInfo myTimer)
        {
            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");
            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"FunctionAppSharedLocation executed at: {DateTime.UtcNow}", "Function App", "Info");
            }


            var result = await APIHelper.CallFlpProcess((int)ProcessTypeEnum.SharedLocationUpload);
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now} and result {result}");

            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }


            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }

        #region Workspace Connect - SharePoint
        [Function("FunctionAppSharePointWorkspace")]
        public async Task FunctionAppSharePointWorkspace([TimerTrigger(WorkspaceConnectSharePointConfiguration.FunctionSchedule)] TimerInfo myTimer)
        {
            _logger.LogInformation($"FunctionAppSharePointWorkspace executed at: {DateTime.Now}");
            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            if (dbLogConfig) await new DataRepository().LogError($"FunctionAppSharePointWorkspace executed at: {DateTime.UtcNow}", "Function App", "Info");

            var result = await APIHelper.CallFlpProcess((int)ProcessTypeEnum.SharePointWorkspace);
            _logger.LogInformation($"FunctionAppSharePointWorkspace ended at: {DateTime.Now} and result {result}");
            if (dbLogConfig) await new DataRepository().LogError($"FunctionAppSharePointWorkspace ended at: {DateTime.UtcNow}", "Function App", "Info");

            if (myTimer.ScheduleStatus is not null) _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
        }

        [Function("FunctionAppToMoveSharePointToLandingLayer")]
        public async Task FunctionAppToMoveSharePointToLandingLayer([TimerTrigger(WorkspaceConnectSharePointConfiguration.FunctionSchedule)] TimerInfo myTimer)
        {
            _logger.LogInformation($"FunctionAppToMoveSharePointToLandingLayer executed at: {DateTime.Now}");
            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            if (dbLogConfig) await new DataRepository().LogError($"FunctionAppToMoveSharePointToLandingLayer executed at: {DateTime.UtcNow}", "Function App", "Info");

            var result = await APIHelper.CallFlpProcessToLandingLayer((int)ProcessTypeEnum.SharePointWorkspace);
            _logger.LogInformation($"FunctionAppToMoveSharePointToLandingLayer ended at: {DateTime.Now} and result {result}");
            if (dbLogConfig) await new DataRepository().LogError($"FunctionAppToMoveSharePointToLandingLayer ended at: {DateTime.UtcNow}", "Function App", "Info");

            if (myTimer.ScheduleStatus is not null) _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
        }
        #endregion


        /// <summary>
        /// This function only Run  every 1 minutes:
        /// </summary>
        /// <param name="myTimer"></param>
        [Function("FunctionAppBlobStorage")]
        public async Task FunctionAppBlobStorage([TimerTrigger("0 */1 * * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));

            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"FunctionAppBlobStorage executed at: {DateTime.UtcNow}", "Function App", "Info");
            }

            var result = await APIHelper.CallFlpProcess((int)ProcessTypeEnum.BlobStarageUpload);
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }


            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }
        /// <summary>
        /// This function only Run  every 15 minutes:
        /// </summary>
        /// <param name="myTimer"></param>

        [Function("FunctionAppEmailNotificationSend")]
        public async Task FunctionAppEmailNotificationSend([TimerTrigger("0 */15 * * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));

            _logger.LogInformation($"C# Timer trigger function - FunctionAppEmailNotificationSend executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"FunctionAppEmailNotificationSend executed at: {DateTime.UtcNow}", "Function App", "Info");
            }

            var result = await APIHelper.GetEmailNotificationList();
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now} and result {result}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"FunctionAppEmailNotificationSend ended at: {DateTime.UtcNow} and result {result}", "Function App", "Info");
            }


            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }

        /// <summary>
        /// This function only Run  every 3 hours with:
        /// </summary>
        /// <param name="myTimer"></param>

        [Function("UpdateProcessStatus")]
        public async Task UpdateProcessStatus([TimerTrigger("0 0 */3 * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            _logger.LogInformation($"C# Timer trigger function - UpdateProcessStatus executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"UpdateProcessStatus executed at: {DateTime.UtcNow}", "Function App", "Info");
            }
            var result = await APIHelper.ChangeInProgressStatus();
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now} and result {result}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"UpdateProcessStatus ended at: {DateTime.UtcNow} and result {result}", "Function App", "Info");
            }
            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }

        /// <summary>
        /// This function only Run at 6 AM UTC:
        /// </summary>
        /// <param name="myTimer"></param>

        [Function("FillCache")]
        public async Task FillCache([TimerTrigger("0 0 6 * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            _logger.LogInformation($"C# Timer trigger function - FillCache executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"FillCache executed at: {DateTime.UtcNow}", "Function App", "Info");
            }
            var result = await APIHelper.CallApiToPushDataInMemoryCache();
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now} and result {result}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"FillCache ended at: {DateTime.UtcNow} and result {result}", "Function App", "Info");
            }
            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }



        /// <summary>
        /// This function only Run  every 1 minutes:
        /// </summary>
        /// <param name="myTimer"></param>
        [Function("UpdateDatabricksJobRunStatus")]
        public async Task UpdateDatabricksJobRunStatus([TimerTrigger("0 */1 * * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));

            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"UpdateDatabricksJobRunStatus executed at: {DateTime.UtcNow}", "Function App", "Info");
            }

            var result = await APIHelper.GetRunIdListAndUpdateStatus();
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }


            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }


        /// <summary>
        /// This function only Run  every 1 minutes:
        /// </summary>
        /// <param name="myTimer"></param>
        [Function("DeleteTempFileAndUpdateJobStatus")]
        public async Task DeleteTempFileAndUpdateJobStatus([TimerTrigger("0 */1 * * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));

            _logger.LogInformation($"C# Timer trigger function executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"DeleteTempFileAndUpdateJobStatus executed at: {DateTime.UtcNow}", "Function App", "Info");
            }

            var result = await APIHelper.DeleteTempFileAndUpdateStatus();
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"DeleteTempFileAndUpdateJobStatus: C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }


            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }


        /// <summary>
        /// This function only Run  every 3 hours with:
        /// </summary>
        /// <param name="myTimer"></param>

        [Function("DeleteJsonDatabricksColumnFiles")]
        public async Task DeleteJsonDatabricksColumnFiles([TimerTrigger("0 0 */3 * * *")] TimerInfo myTimer)
        {

            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            _logger.LogInformation($"C# Timer trigger function - DeleteJsonDatabricksColumnFiles executed at: {DateTime.Now}");
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"DeleteJsonDatabricksColumnFiles executed at: {DateTime.UtcNow}", "Function App", "Info");
            }
            var result = await APIHelper.DeleteJsonDatabricksColumnFiles();
            _logger.LogInformation($"C# Timer trigger function ended at: {DateTime.Now} and result {result}");
            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"DeleteJsonDatabricksColumnFiles ended at: {DateTime.UtcNow} and result {result}", "Function App", "Info");
            }
            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }


        /// <summary>
        /// Executes on a timer trigger to move blobs to the landing layer and logs execution details.
        /// </summary>
        /// <param name="myTimer">Timer information for the function execution schedule.</param>
        [Function("FunctionAppToMoveBlobToLandingLayer")]
        public async Task FunctionAppToMoveBlobToLandingLayer([TimerTrigger("0 */1 * * * *")] TimerInfo myTimer)
        {
            _logger.LogInformation($"FunctionAppToMoveBlobToLandingLayer:C# Timer trigger function executed at: {DateTime.Now}");
            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"FunctionAppToMoveBlobToLandingLayer: executed at: {DateTime.UtcNow}", "Function App", "Info");
            }


            var result = await APIHelper.CallFlpProcessToLandingLayer((int)ProcessTypeEnum.BlobStarageUpload);
            _logger.LogInformation($"FunctionAppToMoveBlobToLandingLayer:C# Timer trigger function ended at: {DateTime.Now} and result {result}");

            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"FunctionAppToMoveBlobToLandingLayer:C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }

            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }



        [Function("FunctionAppToMoveRemoteToLandingLayer")]
        public async Task FunctionAppToMoveRemoteToLandingLayer([TimerTrigger("0 */1 * * * *")] TimerInfo myTimer)
        {
            _logger.LogInformation($"FunctionAppToMoveRemoteToLandingLayer:C# Timer trigger function executed at: {DateTime.Now}");
            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"FunctionAppToMoveRemoteToLandingLayer: executed at: {DateTime.UtcNow}", "Function App", "Info");
            }


            var result = await APIHelper.CallFlpProcessToLandingLayer((int)ProcessTypeEnum.SharedLocationUpload);
            _logger.LogInformation($"FunctionAppToMoveRemoteToLandingLayer:C# Timer trigger function ended at: {DateTime.Now} and result {result}");

            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"FunctionAppToMoveRemoteToLandingLayer:C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }

            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }

        [Function("DeletedTempFileFromLocation")]
        public async Task DeletedTempFileFromLocation([TimerTrigger("0 0 */3 * * *")] TimerInfo myTimer)
        {
            _logger.LogInformation($"DeletedTempFileFromLocation:C# Timer trigger function executed at: {DateTime.Now}");
            var dbLogConfig = Convert.ToBoolean(await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig"));
            if (dbLogConfig)
            {
                var ret = await new DataRepository().LogError($"DeletedTempFileFromLocation: executed at: {DateTime.UtcNow}", "Function App", "Info");
            }


            var result = await APIHelper.DeleteTempFileFromLocation();
            _logger.LogInformation($"DeletedTempFileFromLocation:C# Timer trigger function ended at: {DateTime.Now} and result {result}");

            if (dbLogConfig)
            {
                var ret1 = await new DataRepository().LogError($"DeletedTempFileFromLocation:C# Timer trigger function ended at: {DateTime.UtcNow}", "Function App", "Info");
            }

            if (myTimer.ScheduleStatus is not null)
            {
                _logger.LogInformation($"Next timer schedule at: {myTimer.ScheduleStatus.Next}");
            }
        }
    }
}
