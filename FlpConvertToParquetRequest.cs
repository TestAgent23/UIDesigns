using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json;

namespace Teleperformance.DataIngestion.FunctionApp.Models
{
    public class FlpConvertToParquetRequest
    {
        public string FlpConfigurationId { get; set; }
        public string ProcessName { get; set; }
        public int? SourceLocationTypeId { get; set; }
        public string LandingLayerUploadedId { get; set; }

        public BlobClientDetails BlobClients { get; set; }
        public OnPremFileLocation OnPremFileLocation { get; set; }
        #region SharePoint Workspace - AY
        [JsonProperty("sharePointFileLocation")]
        public SharePointFileLocation SharePointFileLocation { get; set; }
        #endregion
    }
}
