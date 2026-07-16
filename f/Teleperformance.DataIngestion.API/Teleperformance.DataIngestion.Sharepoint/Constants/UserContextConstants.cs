namespace Teleperformance.DataIngestion.Sharepoint.Constants;

public static class UserContextConstants
{
    public const string SiteTargetRequired = "Provide a SharePoint site URL or site name.";
    public const string SiteUrlInvalid = "Site URL is not valid.";
    public const string SitePathRequired = "URL must include /sites/{site-name}.";
    public const string HostNameRequired = "Host name is required when only a site name is provided.";
    public const string BrowseTargetRequired = "A library must be selected before browsing.";
    public const string FileTargetRequired = "Library and file path are required.";
    public const string SearchTermRequired = "Search term is required.";
    public const string MissingAuthorization = "Missing Authorization: Bearer {token}";
    public const string DriveIdRequired = "driveId query parameter is required.";
    public const string QueryFilePathRequired = "File path is required. Use ?path= or ?path64= (base64url).";
    public const string GraphAccessDenied = "Microsoft Graph denied access for the signed-in user. Confirm Files.Read and User.Read are granted and consented on the app registration, then sign out and sign in again.";
    public const string GraphResourceNotFound = "Resource not found or not accessible.";
    public const string SiteLibraryNotFound = "No document libraries were found for that site. Sign out, sign in again (Sites.Read.All consent required), and retry.";
    public const string SitesReadRequired = "Sites.Read.All is required to resolve a team site by URL (GET /sites/{host}:/sites/{slug}). Add Microsoft Graph delegated Sites.Read.All on the app registration, grant admin consent, add the scope to environment.ts userGraphScopes, then sign in again.";
    public const string GraphCallFailed = "Microsoft Graph {0} for {1}: {2}";
}
