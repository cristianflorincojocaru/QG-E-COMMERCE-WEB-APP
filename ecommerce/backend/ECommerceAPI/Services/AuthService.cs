using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using ECommerceAPI.Models;
using Microsoft.Data.SqlClient;
using Microsoft.IdentityModel.Tokens;

// Do NOT add "using BCrypt.Net;" — it creates a namespace/class name collision.
// Use the fully-qualified BCrypt.Net.BCrypt.* calls throughout instead.

namespace ECommerceAPI.Services;

public interface IAuthService
{
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> LoginAsync(LoginRequest request);
}

public class AuthService : IAuthService
{
    private readonly IDbContext _db;
    private readonly IConfiguration _config;

    public AuthService(IDbContext db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    // ── Register ─────────────────────────────────────────────────────────────
    public async Task<AuthResponse?> RegisterAsync(RegisterRequest req)
    {
        await using var conn = await _db.OpenAsync();

        const string checkSql = "SELECT COUNT(1) FROM Users WHERE Email = @Email";
        await using (var cmd = new SqlCommand(checkSql, conn))
        {
            cmd.Parameters.AddWithValue("@Email", req.Email.Trim().ToLower());
            if (Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0) return null;
        }

        var hash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12);

        // Role defaults to 'Customer' — only the DB seeder / AdminController can set 'Admin'
        const string insertSql = @"
            INSERT INTO Users (FirstName, LastName, Email, PasswordHash, Role)
            OUTPUT INSERTED.Id
            VALUES (@FirstName, @LastName, @Email, @Hash, 'Customer')";

        int newId;
        await using (var cmd = new SqlCommand(insertSql, conn))
        {
            cmd.Parameters.AddWithValue("@FirstName", req.FirstName.Trim());
            cmd.Parameters.AddWithValue("@LastName", req.LastName.Trim());
            cmd.Parameters.AddWithValue("@Email", req.Email.Trim().ToLower());
            cmd.Parameters.AddWithValue("@Hash", hash);
            newId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        var user = new User
        {
            Id = newId,
            FirstName = req.FirstName.Trim(),
            LastName = req.LastName.Trim(),
            Email = req.Email.Trim().ToLower(),
            Role = "Customer"
        };

        return new AuthResponse(BuildJwt(user), user.Email, user.FirstName, user.LastName, user.Role);
    }

    // ── Login ─────────────────────────────────────────────────────────────────
    public async Task<AuthResponse?> LoginAsync(LoginRequest req)
    {
        await using var conn = await _db.OpenAsync();

        const string sql = @"
            SELECT Id, FirstName, LastName, Email, PasswordHash, Role
            FROM   Users
            WHERE  Email = @Email";

        User? user = null;

        await using (var cmd = new SqlCommand(sql, conn))
        {
            cmd.Parameters.AddWithValue("@Email", req.Email.Trim().ToLower());
            await using var reader = await cmd.ExecuteReaderAsync();

            if (await reader.ReadAsync())
            {
                user = new User
                {
                    Id = reader.GetInt32(0),
                    FirstName = reader.GetString(1),
                    LastName = reader.GetString(2),
                    Email = reader.GetString(3),
                    PasswordHash = reader.GetString(4),
                    Role = reader.GetString(5)
                };
            }
        }

        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash)) return null;

        return new AuthResponse(BuildJwt(user), user.Email, user.FirstName, user.LastName, user.Role);
    }

    // ── JWT builder ───────────────────────────────────────────────────────────
    private string BuildJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Secret"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("firstName",                   user.FirstName),
            new Claim("lastName",                    user.LastName),
            new Claim(ClaimTypes.Role,               user.Role),   // ← used by [Authorize(Roles="Admin")]
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddHours(8),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}