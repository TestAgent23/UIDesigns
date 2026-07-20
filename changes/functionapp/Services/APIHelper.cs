using Microsoft.Extensions.Caching.Memory;
using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Teleperformance.DataIngestion.FunctionApp.Enum;
using Teleperformance.DataIngestion.FunctionApp.Helpers;
using Teleperformance.DataIngestion.FunctionApp.Models;
using Teleperformance.DataIngestion.FunctionApp.Repository;

namespace Teleperformance.DataIngestion.FunctionApp.Services
{
    public class APIHelper
    {
        private static readonly MemoryCache Cache = new MemoryCache(new MemoryCacheOptions());
        private const string TokenCacheKey = "AuthToken";
        private const int TokenExpiryMinutes = 28;
        public async static Task<bool> CallFlpProcess(int processTypeId)
        {

            //string apiUrl = "https://localhost:7146/";
            //string apiUrl = "https://appdev1.teleperformanceusa.com/TPDataIngestion/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");           
            string clientId = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {
                await new DataRepository().LogError($"Function App: Error in GenerateToken():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }

            var flpProcessList = await GetFlpProcessListAsync(apiUrl, apiVersion, token, processTypeId);
            if (flpProcessList?.ResponseCode == 200)
            {
                var flpConfigureList = flpProcessList.Result;
                var dbLogConfig = Convert.ToBoolean(KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig").Result);
                if (dbLogConfig)
                {
                    await new DataRepository().LogError($"Function App: Flp Process List Count {flpConfigureList.Count()} and process type {processTypeId} at {DateTime.UtcNow}", "Function App", "Info");
                }
                foreach (var flp in flpConfigureList)
                {

                    if (flp.ProcessTypeId != (int)ProcessTypeEnum.UIUpload)
                    {
                        List<Task<bool>> tasks = new List<Task<bool>>(); //List to store tasks
                        if (flp.LocationTypeId == (int)LocationTypeEnum.Azure)
                        {
                            // = flp.BlobClients;
                            if (flp.BlobClients != null && flp.BlobClients.Any())
                            {
                                foreach (var blobClient in flp.BlobClients)
                                {
                                    //Call the post api
                                    var flpConvertToParquetRequest = new FlpConvertToParquetRequest();
                                    flpConvertToParquetRequest.BlobClients = blobClient;
                                    flpConvertToParquetRequest.FlpConfigurationId = flp.FlpConfigurationId;
                                    flpConvertToParquetRequest.ProcessName = flp.ProcessName;
                                    var extension = Path.GetExtension(blobClient.Name).ToLower();
                                    string schedulerApiUrl = "";
                                    if (string.Compare(extension, ".csv", true) == 0)
                                    {
                                        schedulerApiUrl = $"api/Import/ProcessCsvFile";
                                    }
                                    else if (string.Compare(extension, ".txt", true) == 0)
                                    {
                                        schedulerApiUrl = $"api/Import/ProcessTxtFile";
                                    }
                                    else if ((string.Compare(extension, ".xlsx", true) == 0) || (string.Compare(extension, ".xls", true) == 0) || (string.Compare(extension, ".xlsb", true) == 0))
                                    {
                                        schedulerApiUrl = $"api/Import/ProcessExcelFile";
                                    }
                                    //await FlpConvertToParquet(apiUrl,apiVersion, token, schedulerApiUrl, flpConvertToParquetRequest);
                                    if(flp.FileProcessingServerTypeId == (int)ServerTypeEnum.DataLakeType)
                                    {
                                        tasks.Add(FlpConvertToParquet(apiUrl, "4.0", token, schedulerApiUrl, flpConvertToParquetRequest));
                                    }
                                    else
                                    {
                                        tasks.Add(FlpConvertToParquet(apiUrl, "3.0", token, schedulerApiUrl, flpConvertToParquetRequest));
                                    }

                                }
                            }
                            else
                            {
                                tasks.Add(UpdateProcessSchedulerLastDate(apiUrl, apiVersion, token, new FlpConvertToParquetRequest { FlpConfigurationId = flp.FlpConfigurationId }));
                            }

                        }


                        if (flp.LocationTypeId == (int)LocationTypeEnum.OnPrem)
                        {
                            // = flp.BlobClients;
                            if (flp.onPremFileLocations != null && flp.onPremFileLocations.Any())
                            {
                                foreach (var filePathLocation in flp.onPremFileLocations)
                                {
                                    //Call the post api
                                    var flpConvertToParquetRequest = new FlpConvertToParquetRequest();
                                    flpConvertToParquetRequest.OnPremFileLocation = filePathLocation;
                                    flpConvertToParquetRequest.FlpConfigurationId = flp.FlpConfigurationId;
                                    flpConvertToParquetRequest.ProcessName = flp.ProcessName;
                                    string schedulerApiUrl = "";
                                    var extension = Path.GetExtension(filePathLocation.FileUrl).ToLower();
                                    if (string.Compare(extension, ".csv", true) == 0)
                                    {
                                        schedulerApiUrl = $"api/Import/ProcessCsvFile";
                                    }
                                    else if (string.Compare(extension, ".txt", true) == 0)
                                    {
                                        schedulerApiUrl = $"api/Import/ProcessTxtFile";
                                    }
                                    else if ((string.Compare(extension, ".xlsx", true) == 0) || (string.Compare(extension, ".xls", true) == 0) || (string.Compare(extension, ".xlsb", true) == 0))  
                                    {
                                        schedulerApiUrl = $"api/Import/ProcessExcelFile";
                                    }
                                    //await FlpConvertToParquet(apiUrl,apiVersion, token, schedulerApiUrl, flpConvertToParquetRequest);
                                    // Add the API call task to the task list without awaiting it yet
                                    if (flp.FileProcessingServerTypeId == (int)ServerTypeEnum.DataLakeType)
                                    {
                                        tasks.Add(FlpConvertToParquet(apiUrl, "4.0", token, schedulerApiUrl, flpConvertToParquetRequest));
                                    }
                                    else
                                    {
                                        tasks.Add(FlpConvertToParquet(apiUrl, "3.0", token, schedulerApiUrl, flpConvertToParquetRequest));
                                    }
                                }
                            }
                            else
                            {

                                tasks.Add(UpdateProcessSchedulerLastDate(apiUrl, apiVersion, token, new FlpConvertToParquetRequest { FlpConfigurationId=flp.FlpConfigurationId}));
                            }

                        }

                        #region Workspace Connect - SharePoint
                        if (flp.LocationTypeId == (int)LocationTypeEnum.SharePoint)
                        {
                            if (flp.SharePointFiles != null && flp.SharePointFiles.Any())
                            {
                                foreach (var sharePointFile in flp.SharePointFiles)
                                {
                                    var schedulerApiUrl = GetImportSchedulerApiUrl(sharePointFile.FileName, sharePointFile.FileUrl);
                                    if (string.IsNullOrWhiteSpace(schedulerApiUrl))
                                    {
                                        await new DataRepository().LogError(
                                            $"Function App: Unsupported SharePoint file type for {sharePointFile.FileName ?? sharePointFile.FileUrl} at {DateTime.UtcNow}",
                                            "Function App",
                                            "Error");
                                        continue;
                                    }

                                    var request = new FlpConvertToParquetRequest
                                    {
                                        SharePointFileLocation = sharePointFile,
                                        FlpConfigurationId = flp.FlpConfigurationId,
                                        ProcessName = flp.ProcessName
                                    };
                                    var processingApiVersion = flp.FileProcessingServerTypeId == (int)ServerTypeEnum.DataLakeType
                                        ? "4.0"
                                        : "3.0";
                                    tasks.Add(FlpConvertToParquet(apiUrl, processingApiVersion, token, schedulerApiUrl, request));
                                }
                            }
                            else
                            {
                                tasks.Add(UpdateProcessSchedulerLastDate(
                                    apiUrl,
                                    apiVersion,
                                    token,
                                    new FlpConvertToParquetRequest { FlpConfigurationId = flp.FlpConfigurationId }));
                            }
                        }
                        #endregion

                        // Await all the tasks (calls) concurrently
                        await Task.WhenAll(tasks);
                    }
                    else
                    {
                        await new DataRepository().LogError($"GetFlpProcessListAsync():Not found Function app configuration, response code {flpProcessList?.ResponseCode} at {DateTime.UtcNow}", "Function App", "Info");
                    }

                }
            }
            else
            {
                await new DataRepository().LogError($"GetFlpProcessListAsync():Not found EquipmentList, response code {flpProcessList?.ResponseCode} at {DateTime.UtcNow}", "Function App", "Info");
            }
            return false;


        }



        public async static Task<bool> CallFlpProcessToLandingLayer(int processTypeId)
        {

           // string apiUrl = "https://localhost:7146/";
           // string apiUrl = "https://appdev1.teleperformanceusa.com/TPDataIngestion/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId =await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion =await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {
                await new DataRepository().LogError($"FunctionApp/CallFlpProcessToLandingLayer: Error in GenerateToken():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }

            var flpProcessList = await GetLandingLayerProcessListAsync(apiUrl, apiVersion, token, processTypeId);
            if (flpProcessList?.ResponseCode == 200)
            {
                var flpConfigureList = flpProcessList.Result;
                var dbLogConfig = Convert.ToBoolean(KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppLogConfig").Result);
                if (dbLogConfig)
                {
                    await new DataRepository().LogError($"FunctionApp/GetLandingLayerProcessListAsync: Flp Process List Count {flpConfigureList?.Count()??0} and process type {processTypeId} at {DateTime.UtcNow}", "Function App", "Info");
                }
                if(flpConfigureList != null)
                {
                    foreach (var flp in flpConfigureList)
                    {
                        string schedulerApiUrl = "";
                        var flpConvertToParquetRequest = new FlpConvertToParquetRequest();
                        List<Task<bool>> tasks = new List<Task<bool>>(); //List to store tasks
                        if (flp.FileExistInBlob)
                        {
                            flpConvertToParquetRequest.SourceLocationTypeId = (int)LocationTypeEnum.Azure;
                            flpConvertToParquetRequest.FlpConfigurationId = flp.FlpConfigurationId;
                            flpConvertToParquetRequest.ProcessName = flp.ProcessName;
                            flpConvertToParquetRequest.LandingLayerUploadedId = flp.LandingLayerUploadedFileId;

                        }
                        else if (flp.FileExistInRemoteLocation)
                        {
                            flpConvertToParquetRequest.SourceLocationTypeId = (int)LocationTypeEnum.OnPrem;
                            flpConvertToParquetRequest.FlpConfigurationId = flp.FlpConfigurationId;
                            flpConvertToParquetRequest.ProcessName = flp.ProcessName;
                            flpConvertToParquetRequest.LandingLayerUploadedId = flp.LandingLayerUploadedFileId;
                        }
                        else if (flp.FileExistInSFTPLocation)
                        {
                            flpConvertToParquetRequest.SourceLocationTypeId = (int)LocationTypeEnum.SFTP;
                            flpConvertToParquetRequest.FlpConfigurationId = flp.FlpConfigurationId;
                            flpConvertToParquetRequest.ProcessName = flp.ProcessName;
                            flpConvertToParquetRequest.LandingLayerUploadedId = flp.LandingLayerUploadedFileId;
                        }
                        #region Workspace Connect - SharePoint
                        else if (flp.FileExistInSharePointLocation)
                        {
                            flpConvertToParquetRequest.SourceLocationTypeId = (int)LocationTypeEnum.SharePoint;
                            flpConvertToParquetRequest.FlpConfigurationId = flp.FlpConfigurationId;
                            flpConvertToParquetRequest.ProcessName = flp.ProcessName;
                            flpConvertToParquetRequest.LandingLayerUploadedId = flp.LandingLayerUploadedFileId;
                        }
                        #endregion
                        else
                        {
                            await new DataRepository().LogError($"FunctionApp/GetLandingLayerProcessListAsync: Not found file for FLP Configuration Id {flp.FlpConfigurationId} at {DateTime.UtcNow}", "Function App", "Info");
                            continue;
                        }
                        flpConvertToParquetRequest.LandingLayerUploadedId = flp.LandingLayerUploadedFileId;
                        schedulerApiUrl = $"api/Import/FileMoveToLandingLayer";
                        tasks.Add(FileMoveToLandingLayer(apiUrl, "4.1", token, schedulerApiUrl, flpConvertToParquetRequest));
                        // Await all the tasks (calls) concurrently
                        await Task.WhenAll(tasks);

                    }
                }
               
            }
            else
            {
                await new DataRepository().LogError($"FunctionApp/GetLandingLayerProcessListAsync:Not found EquipmentList, response code {flpProcessList?.ResponseCode} at {DateTime.UtcNow}", "Function App", "Info");
            }
            return false;


        }

        #region Token Generation
        private async static Task<string> GenerateToken(string apiUrl, string clientId, string clientSecret, string apiVersion)
        {
            // Check if token exists in cache
            if (Cache.TryGetValue(TokenCacheKey, out string cachedToken))
            {
                await new DataRepository().LogError($"Function App:  GenerateToken() cached token: at {DateTime.UtcNow}, token {cachedToken}", "Function App", "Error");
                return cachedToken;
            }

            string token = string.Empty;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("ClientId", clientId);
                    client.DefaultRequestHeaders.Add("ClientSecret", clientSecret);
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("userId", "di_functionapp_U$312!");
                    var stringContent = new StringContent("", Encoding.UTF8, "application/json");
                    HttpContent contentPOST = stringContent;
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.GetAsync("api/Account/authenticate");//, contentPOST);
                    //var response = await client.PostAsync("api/Authenticate/authenticate", null);//, contentPOST);
                    // Check if the request was successful
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        var securityToken = JsonConvert.DeserializeObject<SecurityTokenResponse?>(res);
                      
                        if (securityToken != null)
                        {
                            token = securityToken.Result.Token;
                            await new DataRepository().LogError($"Function App:  GenerateToken() Generating New token: at {DateTime.UtcNow}, token {cachedToken}", "Function App", "Error");
                            // Store the token in cache with a -minute expiration
                            Cache.Set(TokenCacheKey, token, TimeSpan.FromMinutes(TokenExpiryMinutes));
                        }
                    }
                    else
                    {

                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code - {(int)response.StatusCode}, Reason Pharase  {response.ReasonPhrase} error: {msg}";
                        await new DataRepository().LogError($"Function App: Error in GenerateToken(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {
                await new DataRepository().LogError($"Function App: Error in GenerateToken(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return token;
        }

        #endregion
        #region Flp Process

        private async static Task<FlpProcessListResponse?> GetFlpProcessListAsync(string apiUrl, string apiVersion, string token, int processTypeId)
        {
            FlpProcessListResponse flpProcessList = null;
            try
            {

                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    // Set the base address of the API
                    var body = new
                    {
                        processTypeId = processTypeId

                    };
                    string jsonString = JsonConvert.SerializeObject(body);
                    var content = new StringContent(jsonString, Encoding.UTF8, "application/json");
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    var response = await client.PostAsync($"api/Import/GetProcessList", content);
                    // Check if the request was successful
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        flpProcessList = JsonConvert.DeserializeObject<FlpProcessListResponse?>(res);

                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code - {(int)response.StatusCode}, Reason Phrase  {response.ReasonPhrase} error: {msg}";
                        await new DataRepository().LogError($"Error in GetFlpProcessListAsync(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {
                await new DataRepository().LogError($"Error in GetFlpProcessListAsync(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return flpProcessList;
        }


        private async static Task<FlpProcessListResponse?> GetLandingLayerProcessListAsync(string apiUrl, string apiVersion, string token, int processTypeId)
        {
            FlpProcessListResponse flpProcessList = null;
            try
            {

                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    // Set the base address of the API
                    var body = new
                    {
                        processTypeId = processTypeId

                    };
                    string jsonString = JsonConvert.SerializeObject(body);
                    var content = new StringContent(jsonString, Encoding.UTF8, "application/json");
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    var response = await client.GetAsync($"api/Import/GetProcessListToLandingLayer?processTypeId={processTypeId}");
                    // Check if the request was successful
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        flpProcessList = JsonConvert.DeserializeObject<FlpProcessListResponse?>(res);

                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code - {(int)response.StatusCode}, Reason Phrase  {response.ReasonPhrase} error: {msg}";
                        await new DataRepository().LogError($"Error in GetLandingLayerProcessListAsync() for {processTypeId}: {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {
                await new DataRepository().LogError($"Error in GetLandingLayerProcessListAsync() for {processTypeId}: {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return flpProcessList;
        }



        private async static Task<bool> FlpConvertToParquet(string apiUrl, string apiVersion, string token, string schedulerApiUrl, FlpConvertToParquetRequest flpConvertToParquetRequest)
        {
            var ret = false;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(flpConvertToParquetRequest);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"{schedulerApiUrl}", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Phrase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error in FlpConvertToParquet(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in FlpConvertToParquet(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }

        private async static Task<bool> FileMoveToLandingLayer(string apiUrl, string apiVersion, string token, string schedulerApiUrl, FlpConvertToParquetRequest flpConvertToParquetRequest)
        {
            var ret = false;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(flpConvertToParquetRequest);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"{schedulerApiUrl}", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Phrase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error in FileMoveToLandingLayer(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in FileMoveToLandingLayer(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }


        private async static Task<bool> UpdateProcessSchedulerLastDate(string apiUrl, string apiVersion, string token, FlpConvertToParquetRequest flpConvertToParquetRequest)
        {
            var ret = false;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(flpConvertToParquetRequest);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"api/Import/UpdateProcessSchedulerLastDate", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error in UpdateProcessSchedulerLastDate(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in UpdateProcessSchedulerLastDate(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }


        #endregion
        #region Email Notification
        public async static Task<bool> GetEmailNotificationList()
        {

             // apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId =  await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret =  await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion =  await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string apiVersion2 = "2.0";// await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion2");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {

                await new DataRepository().LogError($"Function App: Error in GetEmailNotificationList():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }

            var emailNotificationList = await EmailNotificationListAsync(apiUrl, apiVersion2, token);
            if (emailNotificationList?.ResponseCode == 200)
            {
                List<Task<bool>> tasks = new List<Task<bool>>();
                var notificationList = emailNotificationList.Result;
                foreach (var notification in notificationList)
                {
                    var emailNotification = new EmailNotification();
                    emailNotification.FlpConfigurationId = notification.FlpConfigurationId;
                    emailNotification.UploadFileId = notification.UploadFileId;
                    // tasks.Add(SendEmailNotification(apiUrl, apiVersion2, token, emailNotification));
                    await SendEmailNotification(apiUrl, apiVersion2, token, emailNotification);
                }
                // Await all the tasks (calls) concurrently
               // await Task.WhenAll(tasks);
            }
            else
            {
                await new DataRepository().LogError($"Error occurred in GetEmailNotificationList():Not found NotificationList, response code {emailNotificationList?.ResponseCode} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return false;


        }
        private async static Task<EmailNotificationListResponse?> EmailNotificationListAsync(string apiUrl, string apiVersion, string token)
        {
            EmailNotificationListResponse emailNotificationList = null;
            try
            {

                using (HttpClient client = new HttpClient())
                {

                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    var response = await client.GetAsync($"api/EmailNotification/List");//, content);
                    // Check if the request was successful
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        emailNotificationList = JsonConvert.DeserializeObject<EmailNotificationListResponse?>(res);

                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code - {(int)response.StatusCode}, Reason Pharase  {response.ReasonPhrase} error: {msg}";
                        await new DataRepository().LogError($"Error in GetFlpProcessListAsync(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {
                await new DataRepository().LogError($"Error in GetFlpProcessListAsync(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return emailNotificationList;
        }

        private async static Task<bool> SendEmailNotification(string apiUrl, string apiVersion, string token, EmailNotification emailNotification)
        {
            var ret = false;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(emailNotification);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"api/EmailNotification/Send", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error in UpdateJobStatus(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in FlpConvertToParquet(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }

        #endregion
        #region Update Process Status
        public async static Task<bool> ChangeInProgressStatus()
        {

            //string apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId =  await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret =  await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion = "1.0";
            string apiVersion3 = "3.0";
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {

                await new DataRepository().LogError($"Function App: Error in ChangeInProgressStatus():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
                return false;
            }

            var apiResponse = await UpdateProcessStatus(apiUrl, apiVersion3, token);
            return apiResponse;
        }     

        private async static Task<bool> UpdateProcessStatus(string apiUrl, string apiVersion, string token)
        {
            var ret = false;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    //var data = JsonConvert.SerializeObject(emailNotification);
                    //var content = new StringContent(data, Encoding.UTF8, "application/json");
                    //HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                   // contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"api/Import/UpdateProcessStatus", null);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error occurred: UpdateProcessStatus(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in FlpConvertToParquet(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }

        #endregion
        #region Pushed data in cache from DataSlice API

        public async static Task<bool> CallApiToPushDataInMemoryCache()
        {
            bool ret = false;
            // apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string apiVersion3 = "3.0";// await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion2");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {

                await new DataRepository().LogError($"Function App: Error in CallApiToPushDataInMemoryCache():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }

            try
            {
                using (HttpClient client = new HttpClient())
                {

                    client.Timeout = TimeSpan.FromMinutes(60);
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion3);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    //Calling DataIngestion API not DataSlice API
                    var response = await client.GetAsync($"api/DataSliceAPI/FillCache");
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error in CallApiToPushDataInMemoryCache(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in CallApiToPushDataInMemoryCache(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;




        }
        #endregion
        #region Databricks API: update job status
        public async static Task<bool> GetRunIdListAndUpdateStatus()
        {

            //string apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string apiVersion2 = "4.0";// await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion2");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {

                await new DataRepository().LogError($"Function App: Error in GetRunIdList():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }
            
            await new DataRepository().LogError($"Function App:Line No - 795 Calling GetRunIdsAsync() : at {DateTime.UtcNow} token={token}", "Function App", "Info");
            var jobStatusResponse = await GetRunIdsAsync(apiUrl, apiVersion2, token);
            if (jobStatusResponse?.ResponseCode == 200)
            {
                List<Task<bool>> tasks = new List<Task<bool>>();
                var List = jobStatusResponse.Result;
                foreach (var jobRunIdDetails in List)
                {                  
                   //  tasks.Add(UpdateJobStatus(apiUrl, apiVersion2, token, jobRunIdDetails));
                    await UpdateJobStatus(apiUrl, apiVersion2, token, jobRunIdDetails);
                }
                // Await all the tasks (calls) concurrently
               // await Task.WhenAll(tasks);
            }
            else
            {
                await new DataRepository().LogError($"Error occurred in GetRunIdList():Not found NotificationList, response code {jobStatusResponse?.ResponseCode} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return false;


        }
        private async static Task<JobStatusResponse?> GetRunIdsAsync(string apiUrl, string apiVersion, string token)
        {
            JobStatusResponse jobStatusResponse = null;
            try
            {

                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    var response = await client.GetAsync($"api/JobRunStatus/GetJobRunId");//, content);
                    // Check if the request was successful
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        jobStatusResponse = JsonConvert.DeserializeObject<JobStatusResponse?>(res);
                        await new DataRepository().LogError($"Response in GetRunIdsAsync(): {res} at {DateTime.UtcNow}, token {token}", "Function App", "Info");

                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code - {(int)response.StatusCode}, Reason Pharase  {response.ReasonPhrase} error: {msg}";
                        await new DataRepository().LogError($"Error in GetRunIdsAsync(): {message} at {DateTime.UtcNow}, token {token}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {
                await new DataRepository().LogError($"Error in GetRunIdsAsync(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return jobStatusResponse;
        }

        private async static Task<bool> UpdateJobStatus(string apiUrl, string apiVersion, string token, JobRunIdDetailsDto jobRunId)
        {
            var ret = false;
            try
            {
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(jobRunId);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"api/JobRunStatus/UpdateJobStatus", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Error in UpdateJobStatus(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Error in UpdateJobStatus(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }

        #endregion


        #region Databricks API: update job status and delete temp file
        public async static Task<bool> DeleteTempFileAndUpdateStatus()
        {

            //string apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string apiVersion2 = "4.0";// await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion2");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {

                await new DataRepository().LogError($"Function App: Error in GetRunIdList():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }
            await new DataRepository().LogError($"Line No - 918 Calling GetRunIdsForDeletTempFileUpdateStatusAsync() : at {DateTime.UtcNow} token={token}", "Function App", "Info");
            var jobStatusResponse = await GetRunIdsForDeletTempFileUpdateStatusAsync(apiUrl, apiVersion2, token);
            if (jobStatusResponse?.ResponseCode == 200)
            {
                await new DataRepository().LogError($"Line No - 922 in DeleteTempFileAndUpdateStatus(): at {DateTime.UtcNow}", "Function App", "Info");
                List<Task<bool>> tasks = new List<Task<bool>>();
                var List = jobStatusResponse.Result;
                foreach (var jobRunIdDetails in List)
                {
                    await new DataRepository().LogError($"Line No - 927 in DeleteTempFileAndUpdateStatus(): at {DateTime.UtcNow}", "Function App", "Info");
                    //  tasks.Add(UpdateJobStatus(apiUrl, apiVersion2, token, jobRunIdDetails));
                    await DeleteTempFile(apiUrl, apiVersion2, token, jobRunIdDetails);
                    await UpdateProcessStatusAfterCompleteAllStage(apiUrl, apiVersion2, token, jobRunIdDetails);
                }
                // Await all the tasks (calls) concurrently
                // await Task.WhenAll(tasks);
            }
            else
            {
                await new DataRepository().LogError($"Error occurred in GetRunIdList():Not found NotificationList, response code {jobStatusResponse?.ResponseCode} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return false;


        }
        private async static Task<JobStatusResponseV2?> GetRunIdsForDeletTempFileUpdateStatusAsync(string apiUrl, string apiVersion, string token)
        {
            JobStatusResponseV2 jobStatusResponse = null;
            try
            {
                await new DataRepository().LogError($"Line NO - 946 in GetRunIdsForDeletTempFileUpdateStatusAsync(): at {DateTime.UtcNow}", "Function App", "Info");
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    var response = await client.GetAsync($"api/JobRunStatus/GetRunIdsForUpdateStatus");//, content);
                    // Check if the request was successful
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        jobStatusResponse = JsonConvert.DeserializeObject<JobStatusResponseV2?>(res);
                        await new DataRepository().LogError($"Response in GetRunIdsForDeletTempFileUpdateStatusAsync(): {res} at {DateTime.UtcNow}", "Function App", "Info");

                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code - {(int)response.StatusCode}, Reason Pharase  {response.ReasonPhrase} error: {msg}";
                        await new DataRepository().LogError($"Function App Error in GetRunIdsForDeletTempFileUpdateStatusAsync(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {
                await new DataRepository().LogError($"Function App Error: in GetRunIdsForDeletTempFileUpdateStatusAsync(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return jobStatusResponse;
        }

        private async static Task<bool> DeleteTempFile(string apiUrl, string apiVersion, string token, JobRunIdDetailsDtoV2 jobRunId)
        {
            var ret = false;
            try
            {
                await new DataRepository().LogError($"Line No - 989 in DeleteTempFile(): at {DateTime.UtcNow}", "Function App", "Info");
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(jobRunId);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"api/JobRunStatus/DeleteTempFile", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                        await new DataRepository().LogError($"Line No - 1006 in DeleteTempFile(): at {DateTime.UtcNow}", "Function App", "Info");
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Function App Error: in DeleteTempFile(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Function App Error: in DeleteTempFile(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }


        private async static Task<bool> UpdateProcessStatusAfterCompleteAllStage(string apiUrl, string apiVersion, string token, JobRunIdDetailsDtoV2 jobRunId)
        {
            var ret = false;
            try
            {
                await new DataRepository().LogError($"Line No - 1034 in UpdateProcessStatusAfterCompleteAllStage(): at {DateTime.UtcNow}", "Function App", "Info");
                using (HttpClient client = new HttpClient())
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    var data = JsonConvert.SerializeObject(jobRunId);
                    var content = new StringContent(data, Encoding.UTF8, "application/json");
                    HttpContent contentPOST = content;
                    client.BaseAddress = new Uri(apiUrl);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);
                    contentPOST.Headers.ContentType = new MediaTypeHeaderValue("application/json");
                    var response = await client.PostAsync($"api/JobRunStatus/UpdateProcessStatus", contentPOST);
                    if (response.IsSuccessStatusCode)
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        ret = true;
                        await new DataRepository().LogError($"Line No - 1052 in UpdateProcessStatusAfterCompleteAllStage(): at {DateTime.UtcNow}", "Function App", "Info");
                    }
                    else
                    {
                        var res = await response.Content.ReadAsStringAsync();
                        string msg = res.ToString();
                        string message = $"Response code:{(int)response.StatusCode}, Reason Pharase:{response.ReasonPhrase},error:{msg}";
                        await new DataRepository().LogError($"Function App Error: in UpdateProcessStatus(): {message} at {DateTime.UtcNow}", "Function App", "Error");

                    }

                }
            }
            catch (Exception ex)
            {

                await new DataRepository().LogError($"Function App Error: in UpdateProcessStatus(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error");
            }
            return ret;
        }

        #endregion


        #region Delete Databricks Json Column file 
        public async static Task<bool> DeleteJsonDatabricksColumnFiles()
        {

            //string apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId =  await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret =  await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion =  await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string apiVersion2 = "4.1";//await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion2");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {
                await new DataRepository().LogError($"Function App: Error in DeleteJsonDatabricksColumnFiles():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }
            else
            {
                DeleteJsonFile(apiUrl, apiVersion2, token);
            }

                           
            return false;


        }

        private static void DeleteJsonFile(string apiUrl, string apiVersion, string token)
        {
            try
            {
                Task.Run(async () =>
                {
                    using (HttpClient client = new HttpClient())
                    {
                        client.Timeout = TimeSpan.FromMinutes(60);
                        client.BaseAddress = new Uri(apiUrl);
                        client.DefaultRequestHeaders.Accept.Clear();
                        client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                        client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                        client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);

                        // Fire-and-forget DELETE request
                        await client.DeleteAsync("api/Blob/DeleteJsonDatabricksColumnFiles");
                    }
                });
            }
            catch (Exception ex)
            {
                // Log any exceptions that occur while starting the task
                new DataRepository().LogError($"Function App Error: in DeleteJsonFile(): {ex.Message} at {DateTime.UtcNow}", "Function App", "Error").Wait();
            }
        }
        #endregion


        #region Delete Temp File from Location
        public async static Task<bool> DeleteTempFileFromLocation()
        {

            //string apiUrl = "https://localhost:7146/";
            string apiUrl = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIUrl");
            string clientId = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientId");
            string clientSecret = await KeyVault.GetKeyVaultValue("TPDataIngestionFunctionAppClientSecret");
            string apiVersion = await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion");
            string apiVersion2 = "4.1";//await KeyVault.GetKeyVaultValue("TPDataIngestionAPIVersion2");
            string token = await GenerateToken(apiUrl, clientId, clientSecret, apiVersion);
            if (string.IsNullOrWhiteSpace(token))
            {
                await new DataRepository().LogError($"Function App: Error in DeleteTempFileFromLocation():API token not generated at {DateTime.UtcNow}", "Function App", "Error");
            }
            else
            {
                DeleteTempFile(apiUrl, apiVersion2, token);
            }
            return false;
        }
     

        

        private async static Task<string> DeleteTempFile(string apiUrl, string apiVersion, string token)
        {
            try
            {
                using (var client = new HttpClient { BaseAddress = new Uri(apiUrl) })
                {
                    client.Timeout = TimeSpan.FromMinutes(60);
                    client.DefaultRequestHeaders.Accept.Clear();
                    client.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                    client.DefaultRequestHeaders.Add("x-tpdi-api-version", apiVersion);
                    client.DefaultRequestHeaders.Add("Authorization", "Bearer " + token);

                    var response = await client.DeleteAsync("api/ProcessConfiguration/DeletedTempFileFromLocation");

                    if (response.IsSuccessStatusCode)
                    {
                        return "Successfully triggered the temp file deletion process.";
                    }
                    else
                    {
                        var errorContent = await response.Content.ReadAsStringAsync();
                        string errorMessage = $"Failed to trigger deletion. Status: {response.StatusCode}, Details: {errorContent}";
                        await new DataRepository().LogError($"Function App Error: in DeleteTempFile(): {errorMessage} at {DateTime.UtcNow}", "Function App", "Error");
                        return errorMessage;
                    }
                }
            }
            catch (Exception ex)
            {
                string errorMessage = $"An exception occurred during the delete call: {ex.Message}";
                await new DataRepository().LogError($"Function App Error: in DeleteTempFile(): {errorMessage} at {DateTime.UtcNow}", "Function App", "Error");
                return errorMessage;
            }
        }
        #endregion

        #region Workspace Connect - SharePoint
        private static string GetImportSchedulerApiUrl(string? fileName, string? fileUrl)
        {
            var name = !string.IsNullOrWhiteSpace(fileName) ? fileName : Path.GetFileName((fileUrl ?? string.Empty).Split('?')[0]);
            return Path.GetExtension(name).ToLowerInvariant() switch
            {
                ".csv" => "api/Import/ProcessCsvFile",
                ".txt" => "api/Import/ProcessTxtFile",
                ".xlsx" or ".xls" or ".xlsb" => "api/Import/ProcessExcelFile",
                _ => string.Empty
            };
        }
        #endregion

    }
}
