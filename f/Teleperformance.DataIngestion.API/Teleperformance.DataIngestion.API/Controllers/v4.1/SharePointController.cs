using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using NLog;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Teleperformance.DataIngestion.Sharepoint.Constants;
using Teleperformance.DataIngestion.Sharepoint.Configuration;
using static Teleperformance.DataIngestion.Sharepoint.Constants.Constants;
using Teleperformance.DataIngestion.Sharepoint.Interfaces.V1_0;
using Teleperformance.DataIngestion.Sharepoint.Models.Request;
using Teleperformance.DataIngestion.Sharepoint.Models.Response;
using Teleperformance.DataIngestion.Sharepoint.Utilities;

namespace Teleperformance.DataIngestion.API.Controllers.v4._1;

[ApiController]
[Route("api")]
public sealed class SharePointController : ControllerBase
{
    private readonly ISharePointPluginService _sharePointService;

    public SharePointController(ISharePointPluginService sharePointService)
    {
        _sharePointService = sharePointService ?? throw new ArgumentNullException(nameof(sharePointService));
    }

    #region Auth

    [HttpPost("auth/requesttoken")]
    public IActionResult RequestToken()
    {
        var apiVersion = CommonUtilities.GetHeader(Request.Headers, "x-tpdi-api-version");
        if (string.IsNullOrWhiteSpace(apiVersion))
            return BadRequest(ApiResponse.Fail(MissingApiVersionHeader));

        var clientId = CommonUtilities.GetHeader(Request.Headers, "x-client-id");
        var clientSecret = CommonUtilities.GetHeader(Request.Headers, "x-client-secret");

        if (string.IsNullOrWhiteSpace(clientId) || string.IsNullOrWhiteSpace(clientSecret))
            return BadRequest(ApiResponse.Fail(ClientIdAndSecretRequired));

        var validClientId = WorkspaceConnectSharePointConfiguration.GetOptional(WorkspaceConnectSharePointConfiguration.AuthClientIdEnvironmentVariable);
        var validClientSecret = WorkspaceConnectSharePointConfiguration.GetOptional(WorkspaceConnectSharePointConfiguration.AuthClientSecretEnvironmentVariable);

        if (string.IsNullOrWhiteSpace(validClientId) || string.IsNullOrWhiteSpace(validClientSecret))
            return StatusCode(500, ApiResponse.Fail(AuthNotConfigured));

        if (!string.Equals(clientId, validClientId, StringComparison.Ordinal) ||
            !string.Equals(clientSecret, validClientSecret, StringComparison.Ordinal))
        {
            return Unauthorized(ApiResponse.Fail(InvalidClientCredentials));
        }

        var (token, expires) = AuthConfiguration.CreateJwt([new Claim("client_id", validClientId)]);

        return Ok(ApiResponse.Ok(new
        {
            AccessToken = AuthConfiguration.WriteToken(token),
            TokenType = "Bearer",
            ExpiresInSeconds = AuthConfiguration.ExpiresInSeconds(expires)
        }));
    }

    /// <summary>
    /// Streaming API token. Requires <c>x-tpdi-api-version</c>, <c>x-application-id</c> (registered app GUID from this system),
    /// and <c>x-client-secret</c> (API secret issued when the app was registered). Not Microsoft Entra.
    /// Returns a JWT whose <c>application_id</c> claim identifies the app; SharePoint/Graph details are resolved internally.
    /// </summary>
    [HttpPost("auth/token")]
    [ProducesResponseType(typeof(ApiResponse), 200), ProducesResponseType(typeof(ApiResponse), 400), ProducesResponseType(typeof(ApiResponse), 401), ProducesResponseType(typeof(ApiResponse), 500)]
    public async Task<IActionResult> GenerateToken()
    {
        var apiVersionError = SharePointControllerUtilities.ValidateApiVersion(Request);
        if (apiVersionError != null)
            return apiVersionError;

        var applicationId = CommonUtilities.GetHeader(Request.Headers, "x-application-id");
        var clientSecret = CommonUtilities.GetHeader(Request.Headers, "x-client-secret");

        if (string.IsNullOrWhiteSpace(applicationId) || string.IsNullOrWhiteSpace(clientSecret))
            return BadRequest(ApiResponse.Fail(ApplicationTokenHeadersRequired));

        var tokenRequest = new TokenRequest
        {
            ApplicationId = applicationId,
            ClientSecret = clientSecret
        };

        try
        {
            var result = await _sharePointService.GenerateTokenAsync(tokenRequest).ConfigureAwait(false);
            return Ok(ApiResponse.Ok(result));
        }
        catch (UnauthorizedAccessException)
        {
            return Unauthorized(ApiResponse.Fail(InvalidClientCredentials));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, ApiResponse.Fail(ex.Message));
        }
    }

    #endregion

    #region Applications

    [HttpGet("applications/types")]
    public async Task<IActionResult> GetApplicationTypes()
    {
        var types = await _sharePointService.GetApplicationTypesAsync().ConfigureAwait(false);
        return Ok(ApiResponse.Ok(types));
    }

    [HttpGet("applications")]
    public async Task<IActionResult> GetApplications([FromQuery] string? ownerKey, [FromQuery] string? typeCode, [FromQuery] int? regionIdent, [FromQuery] string? subRegionCode, [FromQuery] int? clientIdent, [FromQuery] Guid? securityGroupId, [FromQuery] bool includeInactive = false)
    {
        var apps = await _sharePointService.GetApplicationsAsync(ownerKey, typeCode, regionIdent, subRegionCode, clientIdent, securityGroupId, includeInactive).ConfigureAwait(false);
        return Ok(ApiResponse.Ok(apps));
    }

    [HttpPost("applications/query")]
    public async Task<IActionResult> QueryApplications([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] ApplicationQueryRequest? request)
    {
        request ??= new ApplicationQueryRequest();

        if (request.ActiveStatus is not null and not (0 or 1))
            return BadRequest(ApiResponse.Fail(InvalidActiveStatus));

        // includeInactive=true loads all statuses from DB; we then filter in-memory when caller requests specific status.
        var includeInactive = request.ActiveStatus is null or 0;

        var apps = await _sharePointService.GetApplicationsAsync(request.OwnerKey, request.TypeCode, request.RegionIdent, request.SubRegionCode, request.ClientIdent, request.SecurityGroupId, includeInactive).ConfigureAwait(false);

        if (request.ActiveStatus == 1)
            apps = apps.Where(a => a.IsActive != false).ToList();
        else if (request.ActiveStatus == 0)
            apps = apps.Where(a => a.IsActive == false).ToList();

        return Ok(ApiResponse.Ok(apps));
    }

    [HttpGet("applications/{id:guid}")]
    public async Task<IActionResult> GetApplicationById(Guid id)
    {
        var app = await _sharePointService.GetApplicationByIdAsync(id).ConfigureAwait(false);
        return app is null
            ? NotFound(ApiResponse.Fail(ApplicationNotFound))
            : Ok(ApiResponse.Ok(app));
    }

    [HttpPost("applications")]
    public async Task<IActionResult> SaveApplication(Application application)
    {
        var saved = await _sharePointService.SaveApplicationAsync(application).ConfigureAwait(false);
        return Ok(ApiResponse.Ok(saved));
    }

    [HttpPost("applications/{id:guid}/use")]
    public async Task<IActionResult> RecordApplicationUse(Guid id, [FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] RecordApplicationUsageRequest? request)
    {
        try
        {
            var entry = await _sharePointService.RecordApplicationUsageAsync(id, request ?? new RecordApplicationUsageRequest()).ConfigureAwait(false);

            var log = LogManager.GetCurrentClassLogger();
            var logEvent = new LogEventInfo(
                NLog.LogLevel.Info,
                log.Name,
                $"Application used: {entry.DisplayName}");
            logEvent.Properties["applicationId"] = entry.ApplicationId;
            logEvent.Properties["applicationName"] = entry.DisplayName;
            if (!string.IsNullOrEmpty(entry.UsedByUpn)) logEvent.Properties["usedByUpn"] = entry.UsedByUpn;
            if (!string.IsNullOrEmpty(entry.UsedByDisplayName)) logEvent.Properties["usedByDisplayName"] = entry.UsedByDisplayName;
            log.Log(logEvent);

            return Ok(ApiResponse.Ok(entry));
        }
        catch (KeyNotFoundException)
        {
            return NotFound(ApiResponse.Fail(ApplicationNotFound));
        }
    }

    [HttpDelete("applications/{id:guid}")]
    public async Task<IActionResult> DeleteApplication(Guid id)
    {
        var deleted = await _sharePointService.DeleteApplicationAsync(id).ConfigureAwait(false);
        return deleted
            ? Ok(ApiResponse.Ok(new { ApplicationId = id }))
            : NotFound(ApiResponse.Fail(ApplicationNotFound));
    }

    [HttpPost("applications/libraries")]
    public async Task<IActionResult> ListLibraries([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] WorkspaceCredentials? request)
    {
        var credentials = WorkspaceCredentials.Merge(request, CommonUtilities.ExtractCredentials(Request.Headers));
        var libraries = await _sharePointService.ListLibrariesAsync(credentials).ConfigureAwait(false);
        return Ok(ApiResponse.Ok(libraries));
    }

    [HttpPost("applications/validate-external-site")]
    public async Task<IActionResult> ValidateExternalSite([FromBody] ExternalSiteConnectivityRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.SiteName))
            return BadRequest(ApiResponse.Fail(ExternalSiteNameRequired));

        try
        {
            var result = await _sharePointService.ValidateExternalSiteConnectivityAsync(request).ConfigureAwait(false);
            return result.IsConnected
                ? Ok(ApiResponse.Ok(result))
                : Ok(ApiResponse.Fail(result.Message, result));
        }
        catch (ArgumentException ex)
        {
            return BadRequest(ApiResponse.Fail(ex.Message));
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, ApiResponse.Fail(ex.Message));
        }
    }

    #endregion

    #region Workspace

    [HttpPost("workspace/browse")]
    public async Task<IActionResult> BrowseFolder([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] WorkspaceBrowseRequest? request)
    {
        var credentials = WorkspaceCredentials.Merge(request?.Credentials, CommonUtilities.ExtractCredentials(Request.Headers));
        var folderPath = request?.FolderPath ?? CommonUtilities.GetHeader(Request.Headers, "X-Folder-Path");
        var items = await _sharePointService.BrowseFolderAsync(credentials, folderPath).ConfigureAwait(false);
        return Ok(ApiResponse.Ok(items));
    }

    [HttpPost("workspace/fetchfile")]
    public async Task<IActionResult> FetchFile([FromBody(EmptyBodyBehavior = EmptyBodyBehavior.Allow)] WorkspaceFetchFileRequest? request)
    {
        var credentials = WorkspaceCredentials.Merge(request?.Credentials, CommonUtilities.ExtractCredentials(Request.Headers));
        var filePath = request?.FilePath ?? CommonUtilities.GetHeader(Request.Headers, "X-File-Path");
        return await SharePointControllerUtilities.StreamFileAsync(HttpContext, _sharePointService, credentials, filePath, inline: false).ConfigureAwait(false);
    }

    /// <summary>
    /// GET streaming endpoint for HTML5 media elements (video/audio) and inline previews.
    /// Credentials and file path are passed as query parameters; supports Range requests.
    /// </summary>
    [HttpGet("workspace/fetchfile")]
    [ProducesResponseType(typeof(FileStreamResult), 200), ProducesResponseType(typeof(ApiResponse), 400)]
    public async Task<IActionResult> FetchFileGet()
    {
        var credentials = WorkspaceCredentials.Merge(
            CommonUtilities.ExtractCredentialsFromQuery(Request.Query),
            CommonUtilities.ExtractCredentials(Request.Headers));
        var filePath = CommonUtilities.GetDecodedFilePathFromQuery(Request.Query);
        return await SharePointControllerUtilities.StreamFileAsync(HttpContext, _sharePointService, credentials, filePath, inline: true).ConfigureAwait(false);
    }

    /// <summary>
    /// Stream or download a file (primary API). Bearer token in header; file path in JSON body.
    /// Supports HTTP Range for partial content (video/audio seeking).
    /// </summary>
    [HttpPost("workspace/file")]
    [ProducesResponseType(typeof(FileStreamResult), 200), ProducesResponseType(typeof(ApiResponse), 400), ProducesResponseType(typeof(ApiResponse), 401)]
    public async Task<IActionResult> PostFileByToken([FromBody] FileStreamRequest? request)
    {
        var (resolvedApp, error) = await SharePointControllerUtilities.ResolveApplicationForFileRequestAsync(HttpContext, _sharePointService, requireAuthorizationHeader: true).ConfigureAwait(false);
        if (error != null)
            return error;

        var filePath = request?.FilePath?.Trim();
        if (string.IsNullOrWhiteSpace(filePath))
            return BadRequest(ApiResponse.Fail(PostFilePathRequired));

        var credentials = WorkspaceCredentials.Merge(
            CommonUtilities.ExtractCredentials(Request.Headers),
            WorkspaceCredentials.FromApplication(resolvedApp!));

        return await SharePointControllerUtilities.StreamFileAsync(HttpContext, _sharePointService, credentials, filePath, inline: true).ConfigureAwait(false);
    }

    /// <summary>
    /// Browser-only fallback: HTML5 media cannot send Authorization headers or a JSON body.
    /// Use <c>?path=</c> and <c>?access_token=</c> (from step 1). API clients should use POST <c>/workspace/file</c>.
    /// </summary>
    [HttpGet("workspace/file")]
    [ProducesResponseType(typeof(FileStreamResult), 200), ProducesResponseType(typeof(ApiResponse), 400), ProducesResponseType(typeof(ApiResponse), 401), ProducesResponseType(typeof(ApiResponse), 404)]
    public async Task<IActionResult> GetFileByToken()
    {
        var (resolvedApp, error) = await SharePointControllerUtilities.ResolveApplicationForFileRequestAsync(HttpContext, _sharePointService, requireAuthorizationHeader: false).ConfigureAwait(false);
        if (error != null)
            return error;

        var filePath = CommonUtilities.GetDecodedFilePathFromQuery(Request.Query);
        if (string.IsNullOrWhiteSpace(filePath))
            return BadRequest(ApiResponse.Fail(QueryFilePathRequired));

        var credentials = WorkspaceCredentials.Merge(
            CommonUtilities.ExtractCredentialsFromQuery(Request.Query),
            WorkspaceCredentials.FromApplication(resolvedApp!));
        credentials = WorkspaceCredentials.Merge(CommonUtilities.ExtractCredentials(Request.Headers), credentials);

        return await SharePointControllerUtilities.StreamFileAsync(HttpContext, _sharePointService, credentials, filePath, inline: true).ConfigureAwait(false);
    }

    [HttpGet("workspace/browse")]
    [ProducesResponseType(typeof(ApiResponse), 200), ProducesResponseType(typeof(ApiResponse), 401)]
    public async Task<IActionResult> BrowseByToken()
    {
        var apiVersionError = SharePointControllerUtilities.ValidateApiVersion(Request);
        if (apiVersionError != null)
            return apiVersionError;

        var token = CommonUtilities.ResolveBearerToken(Request.Headers, Request.Query, allowQueryToken: false);
        if (string.IsNullOrWhiteSpace(token))
            return Unauthorized(ApiResponse.Fail(MissingOrInvalidAuthorizationHeader));

        var resolvedApp = await _sharePointService.ResolveTokenAsync(token).ConfigureAwait(false);
        if (resolvedApp == null)
            return Unauthorized(ApiResponse.Fail(InvalidOrExpiredToken));

        var folderPath = Request.Query["path"].FirstOrDefault() ?? string.Empty;
        var credentials = WorkspaceCredentials.FromApplication(resolvedApp);

        var items = await _sharePointService.BrowseFolderAsync(credentials, folderPath).ConfigureAwait(false);
        return Ok(ApiResponse.Ok(items));
    }

    #endregion

}
