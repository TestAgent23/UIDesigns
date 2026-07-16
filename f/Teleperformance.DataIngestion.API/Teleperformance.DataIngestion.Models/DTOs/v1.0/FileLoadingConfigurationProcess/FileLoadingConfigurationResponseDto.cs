using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Teleperformance.DataIngestion.Models.Entities.v1._0;

namespace Teleperformance.DataIngestion.Models.DTOs.v1._0.FileLoadingConfigurationProcess
{
    public class FileLoadingConfigurationResponseDto : FlpBaseConfigurationResponseDto
    {
        public string SourceStorageAccount { get; set; }
        public string SourceContainerName { get; set; }
        public string SourceStorageAccountKey { get; set; }
        public string SourceServerName { get; set; }
        public int? FileProcessingServerTypeId { get; set; }
        public List<BlobClientDetails> BlobClients { get; set; }
        public List<OnPremFileLocation> OnPremFileLocations { get; set; }
        public bool FileExistInBlob { get; set; }
        public bool FileExistInRemoteLocation { get; set; }
        public bool FileExistInSFTPLocation { get; set; }
        public string LandingLayerUploadedFileId {  get; set; }
        #region Workspace Connect - SharePoint
        public List<SharePointFileLocation>? SharePointFiles { get; set; }
        #endregion
    }
}
