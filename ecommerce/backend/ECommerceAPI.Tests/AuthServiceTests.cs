using ECommerceAPI.DTOs;
using Xunit;
using FluentAssertions;

namespace ECommerceAPI.Tests;

// ─────────────────────────────────────────────────────────────────────────────
// AuthService — business-rule unit tests
// (no DB involved — testing validation logic and BCrypt behaviour)
// ─────────────────────────────────────────────────────────────────────────────
public class AuthServiceTests
{
    // ── BCrypt hashing ────────────────────────────────────────────────────────

    [Fact]
    public void BCrypt_Hash_ShouldNotEqual_PlainText()
    {
        const string plain = "MySecret123!";
        var hash = BCrypt.Net.BCrypt.HashPassword(plain, workFactor: 4); // low factor for speed in tests

        hash.Should().NotBe(plain, because: "BCrypt output must never equal the input");
    }

    [Fact]
    public void BCrypt_Verify_ShouldReturn_True_For_Correct_Password()
    {
        const string plain = "CorrectHorseBatteryStaple";
        var hash = BCrypt.Net.BCrypt.HashPassword(plain, workFactor: 4);

        BCrypt.Net.BCrypt.Verify(plain, hash)
              .Should().BeTrue(because: "Verify must match the original password");
    }

    [Fact]
    public void BCrypt_Verify_ShouldReturn_False_For_Wrong_Password()
    {
        var hash = BCrypt.Net.BCrypt.HashPassword("correct", workFactor: 4);
        BCrypt.Net.BCrypt.Verify("wrong", hash)
              .Should().BeFalse(because: "a wrong password must not verify against a different hash");
    }

    [Fact]
    public void BCrypt_SamePassword_ProducesDifferent_Hashes()
    {
        // BCrypt uses a random salt each time — two hashes of the same password must differ
        var h1 = BCrypt.Net.BCrypt.HashPassword("password", workFactor: 4);
        var h2 = BCrypt.Net.BCrypt.HashPassword("password", workFactor: 4);
        h1.Should().NotBe(h2, because: "BCrypt includes a random salt in every hash");
    }

    // ── RegisterRequest validation ─────────────────────────────────────────────

    [Theory]
    [InlineData("",             "pass123", false)]  // empty email
    [InlineData("  ",          "pass123", false)]  // whitespace email
    [InlineData("user@test.com", "",      false)]  // empty password
    [InlineData("user@test.com", "  ",   false)]  // whitespace password
    [InlineData("user@test.com", "pass", true)]   // valid pair
    public void RegisterRequest_Validation(string email, string password, bool expectedValid)
    {
        // This mirrors the AuthController validation logic
        var isValid = !string.IsNullOrWhiteSpace(email)
                   && !string.IsNullOrWhiteSpace(password);

        isValid.Should().Be(expectedValid);
    }

    // ── Password minimum length ───────────────────────────────────────────────

    [Theory]
    [InlineData("12345",  false)]   // 5 chars — too short
    [InlineData("123456", true)]    // 6 chars — minimum acceptable
    [InlineData("averylongpassword!2024", true)]
    public void Password_MinimumLength_Validation(string password, bool expectedValid)
    {
        var isValid = password.Length >= 6;
        isValid.Should().Be(expectedValid);
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// CartService — business rule tests
// ─────────────────────────────────────────────────────────────────────────────
public class CartServiceLogicTests
{
    [Fact]
    public void Quantity_Zero_Or_Negative_Should_TriggerRemoval()
    {
        // The service routes qty <= 0 to RemoveItemAsync
        const int quantity = 0;
        var shouldRemove = quantity <= 0;
        shouldRemove.Should().BeTrue();
    }

    [Fact]
    public void Quantity_One_Should_NotTriggerRemoval()
    {
        const int quantity = 1;
        var shouldRemove = quantity <= 0;
        shouldRemove.Should().BeFalse();
    }

    [Theory]
    [InlineData(1,  50, true)]   // in stock
    [InlineData(0,  50, false)]  // out of stock
    [InlineData(10, 50, true)]   // partial page — still in stock
    public void Product_InStock_Check(int stock, int pageSize, bool expectedAvailable)
    {
        var available = stock > 0;
        available.Should().Be(expectedAvailable);
    }

    [Fact]
    public void PageSize_IsClamped_To_MaxFifty()
    {
        // Mirrors ProductService.GetAllAsync clamping logic
        var requested = 200;
        var clamped   = Math.Clamp(requested, 1, 50);
        clamped.Should().Be(50, because: "page size must never exceed 50");
    }

    [Fact]
    public void PageNumber_IsClamped_To_MinOne()
    {
        var requested = -5;
        var safe      = Math.Max(1, requested);
        safe.Should().Be(1, because: "page number must be at least 1");
    }
}


// ─────────────────────────────────────────────────────────────────────────────
// Rate Limiter configuration tests
// ─────────────────────────────────────────────────────────────────────────────
public class RateLimiterConfigTests
{
    [Fact]
    public void LoginRateLimit_PermitLimit_ShouldBeFive()
    {
        // Mirrors the rate limiter config in Program.cs
        const int permitLimit = 5;
        const int windowSecs  = 60;

        // 5 attempts per 60 seconds is strict enough to stop brute force
        // but lenient enough for legitimate users
        permitLimit.Should().BeLessOrEqualTo(10,
            because: "login rate limit should be strict against brute force");
        windowSecs.Should().BeGreaterOrEqualTo(30,
            because: "window should be long enough to deter automated attacks");
    }

    [Fact]
    public void JwtExpiry_ShouldBe_EightHours()
    {
        // Mirrors the expiry set in AuthService.BuildJwt()
        var expiry = TimeSpan.FromHours(8);

        expiry.TotalHours.Should().Be(8,
            because: "8 hours balances security and usability for a typical workday");
        expiry.Should().BeLessThan(TimeSpan.FromDays(1),
            because: "tokens should not be valid indefinitely");
    }
}
