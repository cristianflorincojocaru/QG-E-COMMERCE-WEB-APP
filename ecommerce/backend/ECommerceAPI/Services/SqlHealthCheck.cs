using ECommerceAPI.Data;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace ECommerceAPI.Services;

/// <summary>
/// Verifies that the SQL Server connection is alive.
/// Registered as a named health check "database" in Program.cs.
/// Called by GET /health — used by Docker, load balancers, and monitoring tools.
/// </summary>
public class SqlHealthCheck : IHealthCheck
{
    private readonly IDbContext _db;

    public SqlHealthCheck(IDbContext db) => _db = db;

    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken  cancellationToken = default)
    {
        try
        {
            await using var conn = await _db.OpenAsync();

            // Lightweight query — just checks the connection and DB server version
            await using var cmd  = conn.CreateCommand();
            cmd.CommandText      = "SELECT @@VERSION";
            var version          = (await cmd.ExecuteScalarAsync(cancellationToken))?.ToString() ?? "";

            return HealthCheckResult.Healthy(
                description: "SQL Server is reachable.",
                data: new Dictionary<string, object> { ["serverVersion"] = version[..Math.Min(60, version.Length)] }
            );
        }
        catch (Exception ex)
        {
            // Return Unhealthy — does NOT throw, so the /health endpoint keeps responding
            return HealthCheckResult.Unhealthy(
                description: "Cannot reach SQL Server.",
                exception:   ex
            );
        }
    }
}
