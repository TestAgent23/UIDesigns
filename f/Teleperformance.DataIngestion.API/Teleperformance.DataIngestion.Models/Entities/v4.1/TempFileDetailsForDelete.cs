using System;
using System.Collections.Generic;
using System.Diagnostics.CodeAnalysis;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Teleperformance.DataIngestion.Models.Entities.v4._1
{

  
    public class TempFileDetailsForDelete
    {
        public string blobName { get; set; }
        public string process_name { get; set; }
        public string flpConfigurationId { get; set; }
        public string uploadFileId { get; set; }
        public string storageAccountName { get; set; }
        public string storageContainerName { get; set; }
        public string storageAccountKey { get; set; }
        public string sasKey { get; set; }
        public string sasKeyToken { get; set; }
    }
}
