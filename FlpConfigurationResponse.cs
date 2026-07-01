using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Teleperformance.DataIngestion.FunctionApp.Models
{
    public class FlpConfigurationResponse
    {
        public string FlpConfigurationId { get; set; }
        public int LocationTypeId { get; set; }
        public string ProcessName { get; set; }
        public string Delimiter { get; set; }
        public string QuoteCharacter { get; set; }
        public bool IsHeaderProvided { get; set; }
        public int SkipRows { get; set; }
        public int SkipFooterRows { get; set; }
        public string FlpKeyColumnList { get; set; }
        public string ColumnNameList { get; set; }
        public string ConvertDataTypeColumnNameList { get; set; }
        public string DatabaseName { get; set; }
        public string TableName { get; set; }
        public bool IsCreatedHistoryTable { get; set; }
        public string SenderCommunicationEmail { get; set; }
        public string LoginId { get; set; }
        public string SourcePath { get; set; }
        public string DestinationPath { get; set; }
        public string SupportCommunicationEmail { get; set; }
        public string? RootDatabaseFolderPath { get; set; }
        public string? ParquetCompression { get; set; }
        public bool DropMainTable { get; set; }
        public bool DropHistoryTable { get; set; }
        public string OrderByColumnListForDedup { get; set; }
        public bool IsValidateFileSchemaWithTargetTable { get; set; }
        public bool IgnoreDuplicateRows { get; set; }
        public bool DoNotArchiveFile { get; set; }
        public string SearchStringInFileName { get; set; }
        public string ProcessGroupName { get; set; }
        public string BillingClientName { get; set; }
        public string Description { get; set; }
        public bool KeepFirstRow { get; set; }
        public int ProcessTypeId { get; set; }
        public int FlpProcessStatusId { get; set; }
        public int FlpProcessAttempt { get; set; }

        public string SourceStorageAccount { get; set; }
        public string SourceContainerName { get; set; }
        public string SourceStorageAccountKey { get; set; }
        public string SourceServerName { get; set; }
        public int? FileProcessingServerTypeId { get; set; }
        public List<BlobClientDetails> BlobClients { get; set; }

        public List<OnPremFileLocation> onPremFileLocations { get; set; }
        #region SharePoint Workspace - AY
        [JsonProperty("sharePointFiles")]
        public List<SharePointFileLocation> SharePointFiles { get; set; }
        #endregion
        public bool FileExistInBlob { get; set; }
        public bool FileExistInRemoteLocation { get; set; }
        public bool FileExistInSFTPLocation { get; set; }
        public string LandingLayerUploadedFileId { get; set; }
    }



    public class OnPremFileLocation
    {
        public string UploadedId { get; set; }
        public string FileUrl { get; set; }
    }

    #region SharePoint Workspace - AY
    public class SharePointFileLocation
    {
        public string UploadedId { get; set; }
        public string FileUrl { get; set; }
        public long FileSize { get; set; }
    }
    #endregion
}
