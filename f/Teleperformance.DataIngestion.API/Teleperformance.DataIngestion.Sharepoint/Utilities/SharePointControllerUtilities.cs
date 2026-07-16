using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;
using Teleperformance.DataIngestion.Sharepoint.Constants;
using Teleperformance.DataIngestion.Sharepoint.Interfaces.V1_0;
using Teleperformance.DataIngestion.Sharepoint.Models.Request;
using Teleperformance.DataIngestion.Sharepoint.Models.Response;
using static Teleperformance.DataIngestion.Sharepoint.Constants.Constants;

namespace Teleperformance.DataIngestion.Sharepoint.Utilities;

public static class SharePointControllerUtilities
{
    public static IActionResult? ValidateApiVersion(HttpRequest request)
    {
        var apiVersion = CommonUtilities.GetHeader(request.Headers, "x-tpdi-api-version") ?? request.Query["apiVersion"].FirstOrDefault();
        return string.IsNullOrWhiteSpace(apiVersion) ? new BadRequestObjectResult(ApiResponse.Fail(MissingApiVersionHeader)) : null;
    }

    public static async Task<(Application? App, IActionResult? Error)> ResolveApplicationForFileRequestAsync(HttpContext httpContext, ISharePointPluginService sharePointService, bool requireAuthorizationHeader)
    {
        var apiVersionError = ValidateApiVersion(httpContext.Request);
        if (apiVersionError != null) return (null, apiVersionError);

        var token = CommonUtilities.ResolveBearerToken(httpContext.Request.Headers, httpContext.Request.Query, allowQueryToken: !requireAuthorizationHeader);
        if (string.IsNullOrWhiteSpace(token))
        {
            var message = requireAuthorizationHeader ? MissingAuthorizationHeader : MissingToken;
            return (null, new UnauthorizedObjectResult(ApiResponse.Fail(message)));
        }

        var resolvedApp = await sharePointService.ResolveTokenAsync(token).ConfigureAwait(false);
        return resolvedApp == null ? (null, new UnauthorizedObjectResult(ApiResponse.Fail(InvalidOrExpiredToken))) : (resolvedApp, null);
    }

    public static async Task<IActionResult> StreamFileAsync(HttpContext httpContext, ISharePointPluginService sharePointService, WorkspaceCredentials credentials, string? filePath, bool inline)
    {
        if (string.IsNullOrWhiteSpace(filePath)) return new BadRequestObjectResult(ApiResponse.Fail(FilePathRequired));

        var content = await sharePointService.FetchFileAsync(credentials, filePath, httpContext.Request.Headers["Range"].FirstOrDefault()).ConfigureAwait(false);
        await CommonUtilities.WriteFileStreamAsync(httpContext.Response, content, inline, httpContext.RequestAborted).ConfigureAwait(false);
        return new EmptyResult();
    }
}

public static class SharePointUserControllerUtilities
{
    private static readonly JsonSerializerSettings SerializerSettings = new() { ContractResolver = new CamelCasePropertyNamesContractResolver(), NullValueHandling = NullValueHandling.Ignore };

    public static async Task<IActionResult> RunConnectSiteAsync<TResult>(HttpContext httpContext, Func<UserConnectSiteRequest, string, Task<TResult>> action)
    {
        var request = await ReadConnectSiteBodyAsync(httpContext.Request, httpContext.RequestAborted).ConfigureAwait(false);
        if (request is not null && string.IsNullOrWhiteSpace(request.SiteUrl) && string.IsNullOrWhiteSpace(request.SiteName)) request = null;
        return await RunAsync(httpContext, request, action).ConfigureAwait(false);
    }

    public static async Task<IActionResult> RunAsync<TRequest, TResult>(HttpContext httpContext, TRequest? body, Func<TRequest, string, Task<TResult>> action)
        where TRequest : class
    {
        if (body is null) return new BadRequestObjectResult(ApiResponse.Fail(UserContextConstants.SiteTargetRequired));

        return await RunWithGraphExceptionMappingAsync(async () =>
        {
            var token = CommonUtilities.ResolveBearerToken(httpContext.Request.Headers, allowQueryToken: false);
            if (token is null) return new UnauthorizedObjectResult(ApiResponse.Fail(UserContextConstants.MissingAuthorization));
            return new OkObjectResult(ApiResponse.Ok(await action(body, token).ConfigureAwait(false)));
        }).ConfigureAwait(false);
    }

    public static async Task<IActionResult> StreamAsync(HttpContext httpContext, ISharePointUserContextService userContext, UserFileRequest? request, bool inline)
    {
        if (request is null) return new BadRequestObjectResult(ApiResponse.Fail(UserContextConstants.FileTargetRequired));

        return await RunWithGraphExceptionMappingAsync(async () =>
        {
            var token = CommonUtilities.ResolveBearerToken(httpContext.Request.Headers, allowQueryToken: false);
            if (token is null) return new UnauthorizedObjectResult(ApiResponse.Fail(UserContextConstants.MissingAuthorization));
            return await StreamAsync(httpContext, userContext, request, token, inline).ConfigureAwait(false);
        }).ConfigureAwait(false);
    }

    public static async Task<IActionResult> StreamFromQueryAsync(HttpContext httpContext, ISharePointUserContextService userContext, bool inline)
    {
        var driveId = httpContext.Request.Query["driveId"].FirstOrDefault()?.Trim();
        var filePath = CommonUtilities.GetDecodedFilePathFromQuery(httpContext.Request.Query);
        if (string.IsNullOrWhiteSpace(driveId)) return new BadRequestObjectResult(ApiResponse.Fail(UserContextConstants.DriveIdRequired));
        if (string.IsNullOrWhiteSpace(filePath)) return new BadRequestObjectResult(ApiResponse.Fail(UserContextConstants.QueryFilePathRequired));

        var request = new UserFileRequest { DriveId = driveId, FilePath = filePath };
        return await RunWithGraphExceptionMappingAsync(async () =>
        {
            var token = CommonUtilities.ResolveBearerToken(httpContext.Request.Headers, httpContext.Request.Query, allowQueryToken: true);
            if (token is null) return new UnauthorizedObjectResult(ApiResponse.Fail(MissingToken));
            return await StreamAsync(httpContext, userContext, request, token, inline).ConfigureAwait(false);
        }).ConfigureAwait(false);
    }

    public static async Task<IActionResult> RunWithGraphExceptionMappingAsync(Func<Task<IActionResult>> action)
    {
        try { return await action().ConfigureAwait(false); }
        catch (Exception ex) when (TryMapGraphException(ex, out var result)) { return result!; }
    }

    private static async Task<IActionResult> StreamAsync(HttpContext httpContext, ISharePointUserContextService userContext, UserFileRequest request, string token, bool inline)
    {
        var content = await userContext.GetFileContentAsync(request, httpContext.Request.Headers["Range"].FirstOrDefault(), token, httpContext.RequestAborted).ConfigureAwait(false);
        await CommonUtilities.WriteFileStreamAsync(httpContext.Response, content, inline, httpContext.RequestAborted).ConfigureAwait(false);
        return new EmptyResult();
    }

    private static bool TryMapGraphException(Exception ex, out IActionResult? result)
    {
        switch (ex)
        {
            case UnauthorizedAccessException:
                result = new ObjectResult(ApiResponse.Fail(UserContextConstants.GraphAccessDenied)) { StatusCode = 403 };
                return true;
            case UserConnectSiteFailedException siteFailed:
                result = new ObjectResult(ApiResponse.Fail(siteFailed.Message, siteFailed.DiscoveryReport)) { StatusCode = 404 };
                return true;
            case KeyNotFoundException notFound:
                result = new ObjectResult(ApiResponse.Fail(string.IsNullOrWhiteSpace(notFound.Message) ? UserContextConstants.GraphResourceNotFound : notFound.Message)) { StatusCode = 404 };
                return true;
            case ArgumentException arg:
                result = new BadRequestObjectResult(ApiResponse.Fail(arg.Message));
                return true;
            case HttpRequestException http:
                result = new BadRequestObjectResult(ApiResponse.Fail(http.Message));
                return true;
            case GraphCallFailedException graphFailed:
                result = new ObjectResult(ApiResponse.Fail(graphFailed.Message, graphFailed.ToDiagnostics())) { StatusCode = graphFailed.StatusCode is 401 or 403 ? 403 : graphFailed.StatusCode == 404 ? 404 : 502 };
                return true;
            default:
                result = null;
                return false;
        }
    }

    private static async Task<UserConnectSiteRequest?> ReadConnectSiteBodyAsync(HttpRequest request, CancellationToken cancellationToken)
    {
        request.EnableBuffering();
        string json;
        using (var reader = new StreamReader(request.Body, Encoding.UTF8, detectEncodingFromByteOrderMarks: false, bufferSize: 1024, leaveOpen: true)) { json = await reader.ReadToEndAsync(cancellationToken).ConfigureAwait(false); request.Body.Position = 0; }

        if (string.IsNullOrWhiteSpace(json)) return null;

        try
        {
            var fromDeserializer = JsonConvert.DeserializeObject<UserConnectSiteRequest>(json, SerializerSettings);
            if (fromDeserializer is not null && (!string.IsNullOrWhiteSpace(fromDeserializer.SiteUrl) || !string.IsNullOrWhiteSpace(fromDeserializer.SiteName))) return fromDeserializer;

            var root = JObject.Parse(json);
            return new UserConnectSiteRequest { SiteUrl = ReadString(root, "siteUrl", "SiteUrl"), SiteName = ReadString(root, "siteName", "SiteName"), HostName = ReadString(root, "hostName", "HostName") };
        }
        catch (JsonException) { return null; }
    }

    private static string? ReadString(JObject root, params string[] propertyNames)
    {
        foreach (var name in propertyNames)
        {
            if (!root.TryGetValue(name, out var token)) continue;
            var value = token.Type == JTokenType.String ? token.Value<string>() : token.ToString();
            if (!string.IsNullOrWhiteSpace(value)) return value;
        }
        return null;
    }
}
