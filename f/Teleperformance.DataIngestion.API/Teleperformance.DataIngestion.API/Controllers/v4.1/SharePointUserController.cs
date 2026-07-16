using Microsoft.AspNetCore.Mvc;
using Teleperformance.DataIngestion.Sharepoint.Constants;
using Teleperformance.DataIngestion.Sharepoint.Interfaces.V1_0;
using Teleperformance.DataIngestion.Sharepoint.Models.Request;
using Teleperformance.DataIngestion.Sharepoint.Models.Response;
using Teleperformance.DataIngestion.Sharepoint.Utilities;

namespace Teleperformance.DataIngestion.API.Controllers.v4._1;

[ApiController]
[Route("api/workspace/user")]
public sealed class SharePointUserController : ControllerBase
{
    private readonly ISharePointUserContextService _userContext;
    private readonly IAzureService _azureService;

    public SharePointUserController(ISharePointUserContextService userContext, IAzureService azureService)
    {
        _userContext = userContext;
        _azureService = azureService;
    }

    [HttpPost("connect-site")]
    public Task<IActionResult> ConnectSite()
        => SharePointUserControllerUtilities.RunConnectSiteAsync(HttpContext, (request, token) =>
            _userContext.ConnectSiteAsync(request, token, HttpContext.RequestAborted));

    [HttpPost("debug-me-drives")]
    public Task<IActionResult> DebugMeDrives()
        => SharePointUserControllerUtilities.RunConnectSiteAsync(HttpContext, (request, token) =>
            _userContext.GetMeDrivesDiscoveryReportAsync(request, token, HttpContext.RequestAborted));

    [HttpPost("browse")]
    public Task<IActionResult> Browse([FromBody] UserBrowseRequest? request)
        => SharePointUserControllerUtilities.RunAsync(HttpContext, request, (body, token) => _userContext.BrowseAsync(body, token, HttpContext.RequestAborted));

    [HttpPost("fetchfile")]
    public Task<IActionResult> FetchFile([FromBody] UserFileRequest? request)
        => SharePointUserControllerUtilities.StreamAsync(HttpContext, _userContext, request, inline: false);

    [HttpPost("file")]
    public Task<IActionResult> StreamFile([FromBody] UserFileRequest? request)
        => SharePointUserControllerUtilities.StreamAsync(HttpContext, _userContext, request, inline: true);

    /// <summary>
    /// Browser media preview (video/audio/img). HTML5 elements cannot send Authorization headers;
    /// pass the delegated Graph token as <c>?access_token=</c>. Supports HTTP Range (206).
    /// </summary>
    [HttpGet("file")]
    [ProducesResponseType(typeof(FileStreamResult), 200), ProducesResponseType(typeof(ApiResponse), 400), ProducesResponseType(typeof(ApiResponse), 401)]
    public Task<IActionResult> GetFileStream()
        => SharePointUserControllerUtilities.StreamFromQueryAsync(HttpContext, _userContext, inline: true);

    [HttpPost("search-users")]
    public async Task<IActionResult> SearchADUsers([FromBody] ADUserSearchRequest? request)
    {
        if (request is null || string.IsNullOrWhiteSpace(request.Term))
            return BadRequest(ApiResponse.Fail(UserContextConstants.SearchTermRequired));

        return await SharePointUserControllerUtilities.RunWithGraphExceptionMappingAsync(async () =>
        {
            var result = await _azureService.SearchADUsersAsync(request.Term, request.SearchType).ConfigureAwait(false);
            return Ok(ApiResponse.Ok(result));
        }).ConfigureAwait(false);
    }

}
