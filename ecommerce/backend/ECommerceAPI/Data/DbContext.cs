using Microsoft.Data.SqlClient;

namespace ECommerceAPI.Data;

/// <summary>
/// Lightweight wrapper that provides raw SqlConnection objects.
/// We deliberately avoid any ORM — all SQL is written by hand.
/// </summary>
public interface IDbContext
{
    /// <summary>Opens and returns an open SqlConnection from the pool.</summary>
    Task<SqlConnection> OpenAsync();
}

public class DbContext : IDbContext
{
    private readonly string _connectionString;

    public DbContext(IConfiguration config)
    {
        // Connection string is stored in appsettings.json / env vars
        _connectionString = config.GetConnectionString("DefaultConnection")
            ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");
    }

    public async Task<SqlConnection> OpenAsync()
    {
        var conn = new SqlConnection(_connectionString);
        await conn.OpenAsync();
        return conn;
    }
}
