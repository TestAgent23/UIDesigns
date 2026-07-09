using Teleperformance.DataIngestion.Models.Entities.v1._0;

namespace Teleperformance.DataIngestion.Models.DTOs.v1._0.FileLoadingConfigurationProcess
{
    public class FlpRequestDto
    {
        public string FlpConfigurationId { get; set; }
        public string ProcessName { get; set; }
        public BlobClientDetails? BlobClients { get; set; }
        public OnPremFileLocation? OnPremFileLocation { get; set; }
        public SharePointFileLocation? SharePointFileLocation { get; set; }
    }
}
