using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Teleperformance.DataIngestion.FunctionApp.Enum
{
    public enum LocationTypeEnum
    {
        Azure = 1,
        OnPrem = 2,
        SFTP = 3,
        #region SharePoint Workspace - AY
        SharePoint = 4
        #endregion
    }
}
