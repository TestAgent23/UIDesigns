namespace Teleperformance.DataIngestion.Sharepoint.Models.Request;

public sealed class ApplicationQueryRequest
{
    public string? OwnerKey { get; set; }
    public string? TypeCode { get; set; }
    public int? RegionIdent { get; set; }
    public string? SubRegionCode { get; set; }
    public int? ClientIdent { get; set; }
    public Guid? SecurityGroupId { get; set; }

    /// <summary>
    /// 1 = active only, 0 = inactive only, null = all.
    /// </summary>
    public int? ActiveStatus { get; set; }
}

