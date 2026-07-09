using Microsoft.AspNetCore.Identity;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Teleperformance.DataIngestion.Common;

namespace Teleperformance.DataIngestion.API.Middleware
{
    public class TokenVersionMiddleware
    {
        private readonly RequestDelegate _next;

        // Local/dev bypass token issued by the frontend "Continue as Guest" flow.
        private const string GuestBypassToken = "guest-dev-bypass-token";

        public TokenVersionMiddleware(RequestDelegate next) => _next = next;

        public async Task InvokeAsync(HttpContext context)
        {
            var authorizationHeader = context.Request.Headers["Authorization"];

            // Only check when user is authenticated
            if (authorizationHeader.Count > 0 && authorizationHeader[0].StartsWith("Bearer "))
            {
                var token = authorizationHeader[0].Substring("Bearer ".Length);

                var isDevelopment = string.Equals(
                    Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT"),
                    "Development",
                    StringComparison.OrdinalIgnoreCase);
                var isGuestToken = string.Equals(token, GuestBypassToken, StringComparison.Ordinal);

                // Local/dev guest bypass: the guest token is not a real JWT, so the JWT
                // bearer handler leaves the request unauthenticated. Inject an authenticated
                // guest principal here (after UseAuthentication, before UseAuthorization) so
                // [Authorize] endpoints can be exercised during local guest testing.
                if (isDevelopment && isGuestToken)
                {
                    var claims = new[]
                    {
                        new Claim(ClaimTypes.NameIdentifier, "guest"),
                        new Claim(ClaimTypes.Name, "guest"),
                        new Claim("sub", "guest"),
                        new Claim("ver", "1"),
                        new Claim("preferred_username", "guest@local.dev"),
                    };
                    var identity = new ClaimsIdentity(claims, "GuestBypass");
                    context.User = new ClaimsPrincipal(identity);

                    await _next(context);
                    return;
                }

                // Skip the Key Vault lookup when it isn't configured (empty Key Vault URI,
                // i.e. local dev) to avoid the "Invalid URI: The URI is empty" crash. The
                // fetched encryption key is currently unused, so this is safe.
                var keyVaultUri = Environment.GetEnvironmentVariable("TPDataIngestionKeyVaultUri") ?? "";
                if (!string.IsNullOrWhiteSpace(keyVaultUri))
                {
                    try
                    {
                        string tokenEncryptionKey = KeyVault.GetKeyVaultValue("TPDataIngestionEncryptionKey").Result;
                    }
                    catch
                    {

                    }
                }
            }

            await _next(context);
        }
    }

}
