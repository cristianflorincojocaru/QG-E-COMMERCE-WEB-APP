using ECommerceAPI.DTOs;
using ECommerceAPI.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _auth;

    public AuthController(IAuthService auth) => _auth = auth;

    /// <summary>Register a new user account. Returns a JWT on success.</summary>
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Email) || string.IsNullOrWhiteSpace(req.Password))
            return BadRequest(new { message = "Email and password are required." });

        if (req.Password.Length < 6)
            return BadRequest(new { message = "Password must be at least 6 characters." });

        var result = await _auth.RegisterAsync(req);

        // null = email already in use
        return result is null
            ? Conflict(new { message = "An account with this email already exists." })
            : Ok(result);
    }

    /// <summary>
    /// Login with email + password. Returns a JWT on success.
    /// Rate-limited: max 5 attempts per minute per IP address.
    /// </summary>
    [HttpPost("login")]
    [EnableRateLimiting("login")]   // brute-force protection
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        var result = await _auth.LoginAsync(req);

        // null = bad credentials — use 401 (not 404) to avoid leaking whether the email exists
        return result is null
            ? Unauthorized(new { message = "Invalid email or password." })
            : Ok(result);
    }
}
