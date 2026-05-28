using ECommerceAPI.Data;
using ECommerceAPI.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Microsoft.OpenApi.Models;
using Serilog;
using System.Text;
using System.Threading.RateLimiting;

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((ctx, cfg) =>
        cfg.ReadFrom.Configuration(ctx.Configuration)
           .Enrich.FromLogContext()
           .WriteTo.Console(outputTemplate:
               "[{Timestamp:HH:mm:ss} {Level:u3}] {SourceContext}: {Message:lj}{NewLine}{Exception}")
           .WriteTo.File("logs/api-.log",
               rollingInterval: RollingInterval.Day,
               retainedFileCountLimit: 7));

    builder.Services.AddControllers();

    builder.Services.AddScoped<IDbContext, DbContext>();
    builder.Services.AddScoped<IAuthService, AuthService>();
    builder.Services.AddScoped<IProductService, ProductService>();
    builder.Services.AddScoped<ICartService, CartService>();
    builder.Services.AddScoped<IOrderService, OrderService>();

    builder.Services.AddHealthChecks()
        .AddCheck("self", () => HealthCheckResult.Healthy("API is running."))
        .AddCheck<SqlHealthCheck>("database");

    builder.Services.AddRateLimiter(opts =>
    {
        opts.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
        opts.AddPolicy("login", ctx =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));
        opts.AddPolicy("api", ctx =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 120,
                    Window = TimeSpan.FromMinutes(1),
                    QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                    QueueLimit = 0
                }));
    });

    builder.Services.AddEndpointsApiExplorer();
    builder.Services.AddSwaggerGen(opts =>
    {
        opts.SwaggerDoc("v1", new OpenApiInfo
        {
            Title = "LuxeCart API",
            Version = "v1",
            Description = "E-Commerce REST API — ASP.NET Core · raw ADO.NET · JWT Auth · Roles"
        });
        opts.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
        {
            Type = SecuritySchemeType.Http,
            Scheme = "bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description = "Paste your JWT token here."
        });
        opts.AddSecurityRequirement(new OpenApiSecurityRequirement
        {{
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
            },
            Array.Empty<string>()
        }});
    });

    var jwtSecret = builder.Configuration["Jwt:Secret"]
        ?? throw new InvalidOperationException("Jwt:Secret is not configured.");

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(opts =>
        {
            opts.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
                ValidateIssuer = true,
                ValidIssuer = builder.Configuration["Jwt:Issuer"],
                ValidateAudience = true,
                ValidAudience = builder.Configuration["Jwt:Audience"],
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

    builder.Services.AddCors(opts =>
        opts.AddPolicy("AllowAngular", policy =>
            policy.WithOrigins("http://localhost:4200", "https://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod()));

    // ─────────────────────────────────────────────────────────────────────────
    var app = builder.Build();
    // ─────────────────────────────────────────────────────────────────────────

    await SeedAdminAsync(app);

    // ── Serilog PRIMUL — prinde toate request-urile înainte de orice middleware
    app.UseSerilogRequestLogging(opts =>
    {
        opts.MessageTemplate =
            "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0}ms";
        opts.GetLevel = (httpContext, _, ex) =>
        {
            // Health check endpoints short-circuit pipeline → apar ca "Ignored"
            // Suprimăm la Verbose (sub MinimumLevel=Information → nu se scriu)
            if (ex is null && httpContext.Request.Path.StartsWithSegments("/health"))
                return Serilog.Events.LogEventLevel.Verbose;
            return ex is not null
                ? Serilog.Events.LogEventLevel.Error
                : Serilog.Events.LogEventLevel.Information;
        };
    });

    app.UseSwagger();
    app.UseSwaggerUI(opts =>
    {
        opts.SwaggerEndpoint("/swagger/v1/swagger.json", "LuxeCart API v1");
        opts.RoutePrefix = "swagger";
        opts.DocumentTitle = "LuxeCart API";
        opts.DisplayRequestDuration();
    });

    app.UseCors("AllowAngular");
    app.UseRateLimiter();

    app.UseExceptionHandler(errApp =>
        errApp.Run(async ctx =>
        {
            ctx.Response.StatusCode = 500;
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsJsonAsync(new { message = "An internal server error occurred." });
        }));

    app.UseAuthentication();
    app.UseAuthorization();

    app.MapHealthChecks("/health", new HealthCheckOptions
    {
        ResponseWriter = async (ctx, report) =>
        {
            ctx.Response.ContentType = "application/json";
            await ctx.Response.WriteAsJsonAsync(new
            {
                status = report.Status.ToString(),
                checks = report.Entries.Select(e => new
                {
                    name = e.Key,
                    status = e.Value.Status.ToString(),
                    description = e.Value.Description
                }),
                totalDuration = report.TotalDuration.TotalMilliseconds + "ms"
            });
        }
    });

    app.MapHealthChecks("/health/live", new HealthCheckOptions
    {
        Predicate = check => check.Name == "self"
    });

    app.MapControllers();
    app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription();

    Log.Information("LuxeCart API starting...");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application failed to start");
}
finally
{
    Log.CloseAndFlush();
}

static async Task SeedAdminAsync(WebApplication app)
{
    using var scope = app.Services.CreateScope();
    var db = scope.ServiceProvider.GetRequiredService<IDbContext>();

    await using var conn = await db.OpenAsync();

    const string check = "SELECT COUNT(1) FROM Users WHERE Email = @Email";
    await using (var cmd = new SqlCommand(check, conn))
    {
        cmd.Parameters.AddWithValue("@Email", "admin@luxecart.com");
        if (Convert.ToInt32(await cmd.ExecuteScalarAsync()) > 0) return;
    }

    var hash = BCrypt.Net.BCrypt.HashPassword("Admin@123", workFactor: 12);

    const string insert = @"
        INSERT INTO Users (FirstName, LastName, Email, PasswordHash, Role)
        VALUES ('Admin', 'LuxeCart', 'admin@luxecart.com', @Hash, 'Admin')";

    await using (var cmd = new SqlCommand(insert, conn))
    {
        cmd.Parameters.AddWithValue("@Hash", hash);
        await cmd.ExecuteNonQueryAsync();
    }

    app.Logger.LogInformation(
        "Admin user seeded → admin@luxecart.com / Admin@123 (change this password!)");
}

public partial class Program { }