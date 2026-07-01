using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Teleperformance.DataIngestion.FunctionApp.Enum
{
    public enum ProcessTypeEnum
    {
        UIUpload = 1,
        SharedLocationUpload = 2,
        BlobStarageUpload = 3,
        SFTPLocation=4,
        #region SharePoint Workspace - AY
        SharePointWorkspace = 6
        #endregion
    }
}
