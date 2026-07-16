namespace Teleperformance.DataIngestion.Sharepoint.Configuration;

/// <summary>
/// Single source of truth for Workspace Connect SharePoint environment names and safe defaults.
/// Secrets remain external environment/Key Vault values and are never embedded in source.
/// </summary>
public static class WorkspaceConnectSharePointConfiguration
{
    public const string FunctionSchedule = "0 */1 * * * *";
    public const string KeyVaultClientIdEnvironmentVariable = "TPDataIngestionClientId";
    public const string KeyVaultClientSecretEnvironmentVariable = "TPDataIngestionClientSecret";
    public const string KeyVaultUriEnvironmentVariable = "TPDataIngestionKeyVaultUri";
    public const string KeyVaultTenantIdEnvironmentVariable = "TPDataIngestionTenantId";
    public const string ConnectionStringEnvironmentVariable = "connectionstring";
    public const string DatabaseCommandTimeoutEnvironmentVariable = "databasecommandtimeoutseconds";
    public const string GraphEndpointEnvironmentVariable = "sharepointgraphendpoint";
    public const string GraphApiVersionEnvironmentVariable = "sharepointgraphapiversion";
    public const string GraphTokenEndpointTemplateEnvironmentVariable = "sharepointgraphtokenendpointtemplate";
    public const string GraphScopeEnvironmentVariable = "sharepointgraphscope";
    public const string GraphGrantTypeEnvironmentVariable = "sharepointgraphgranttype";
    public const string GraphDefaultLibraryEnvironmentVariable = "sharepointgraphdefaultlibraryname";
    public const string InternalTenantIdEnvironmentVariable = "sharepointinternaltenantid";
    public const string InternalClientIdEnvironmentVariable = "sharepointinternalclientid";
    public const string InternalClientSecretEnvironmentVariable = "sharepointinternalclientsecret";
    public const string InternalHostNameEnvironmentVariable = "sharepointinternalhostname";
    public const string AuthClientIdEnvironmentVariable = "authclientid";
    public const string AuthClientSecretEnvironmentVariable = "authclientsecret";
    public const string AuthIssuerEnvironmentVariable = "authissuer";
    public const string AuthAudienceEnvironmentVariable = "authaudience";
    public const string AuthSigningKeyEnvironmentVariable = "authsigningkey";
    public const string AuthTokenLifetimeEnvironmentVariable = "authtokenlifetimeminutes";
    public const string LegacyGraphBaseUrlEnvironmentVariable = "tpgraphbaseurl";
    public const string LegacyGraphUserFieldsEnvironmentVariable = "tpgraphuserfields";
    public const string LegacyGraphClientIdEnvironmentVariable = "tpgraphclientid";
    public const string LegacyGraphClientSecretEnvironmentVariable = "tpgraphclientsecret";
    public const string LegacyGraphTenantIdEnvironmentVariable = "tpgraphtenantid";
    public const string LegacyGraphScopeEnvironmentVariable = "tpgraphoauthscope";
    public const string LegacyGraphTokenEndpointEnvironmentVariable = "tpgraphtokenendpoint";

    public const string DataIngestionConnectionStringSecret = "TPDataIngestionConnectionString";
    public const string DataIngestionV2ConnectionStringSecret = "TPDataIngestionV2ConnectionString";

    public const string DefaultGraphEndpoint = "https://graph.microsoft.com";
    public const string DefaultGraphApiVersion = "v1.0";
    public const string DefaultGraphTokenEndpointTemplate = "https://login.microsoftonline.com/{0}/oauth2/v2.0/token";
    public const string DefaultGraphScope = "https://graph.microsoft.com/.default";
    public const string DefaultGraphGrantType = "client_credentials";
    public const string DefaultLibraryName = "Documents";
    public const string DefaultAuthIssuer = "Teleperformance.DataIngestion.API";
    public const string DefaultAuthAudience = "Teleperformance.DataIngestion.API.Consumers";
    public const string DefaultGraphUserFields = "id,displayName,givenName,surname,userPrincipalName,mail,jobTitle,department,officeLocation,mobilePhone,companyName";
    public const int DefaultDatabaseCommandTimeoutSeconds = 30;
    public const int DefaultAuthTokenLifetimeMinutes = 60;

    public static string? GetOptional(string environmentVariable) =>
        Environment.GetEnvironmentVariable(environmentVariable)?.Trim();

    public static string Get(string environmentVariable, string defaultValue) =>
        GetOptional(environmentVariable) ?? defaultValue;

    public static int GetPositiveInt(string environmentVariable, int defaultValue) =>
        int.TryParse(GetOptional(environmentVariable), out var value) && value > 0 ? value : defaultValue;

    public static string GraphEndpoint => Get(GraphEndpointEnvironmentVariable, DefaultGraphEndpoint).TrimEnd('/');
    public static string GraphApiVersion => Get(GraphApiVersionEnvironmentVariable, DefaultGraphApiVersion).Trim('/');
    public static string GraphTokenEndpointTemplate => Get(GraphTokenEndpointTemplateEnvironmentVariable, DefaultGraphTokenEndpointTemplate);
    public static string GraphScope => Get(GraphScopeEnvironmentVariable, DefaultGraphScope);
    public static string GraphGrantType => Get(GraphGrantTypeEnvironmentVariable, DefaultGraphGrantType);
    public static string GraphDefaultLibraryName => Get(GraphDefaultLibraryEnvironmentVariable, DefaultLibraryName);
    public static string AuthIssuer => Get(AuthIssuerEnvironmentVariable, DefaultAuthIssuer);
    public static string AuthAudience => Get(AuthAudienceEnvironmentVariable, DefaultAuthAudience);
    public static string? AuthSigningKey => GetOptional(AuthSigningKeyEnvironmentVariable);
    public static int AuthTokenLifetimeMinutes => GetPositiveInt(AuthTokenLifetimeEnvironmentVariable, DefaultAuthTokenLifetimeMinutes);
    public static int DatabaseCommandTimeoutSeconds => GetPositiveInt(DatabaseCommandTimeoutEnvironmentVariable, DefaultDatabaseCommandTimeoutSeconds);
    public static string GraphBaseUrl => Get(LegacyGraphBaseUrlEnvironmentVariable, $"{GraphEndpoint}/{GraphApiVersion}").TrimEnd('/');
    public static string GraphUserFields => Get(LegacyGraphUserFieldsEnvironmentVariable, DefaultGraphUserFields);
    public static string GraphTokenBaseUrl => Get(LegacyGraphTokenEndpointEnvironmentVariable, "https://login.microsoftonline.com").TrimEnd('/');
}

