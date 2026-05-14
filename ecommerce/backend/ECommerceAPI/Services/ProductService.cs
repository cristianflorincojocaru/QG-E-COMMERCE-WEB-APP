using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using Microsoft.Data.SqlClient;

namespace ECommerceAPI.Services;

public interface IProductService
{
    Task<PagedResult<ProductDto>> GetAllAsync(string? category, string? search, int page, int pageSize);
    Task<ProductDto?> GetByIdAsync(int id);
    Task<List<string>> GetCategoriesAsync();
}

public class ProductService : IProductService
{
    private readonly IDbContext _db;

    public ProductService(IDbContext db) => _db = db;

    // ── Paged product list with optional category / search filter ─────────────
    public async Task<PagedResult<ProductDto>> GetAllAsync(
        string? category, string? search, int page = 1, int pageSize = 12)
    {
        // Clamp values to safe ranges
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        await using var conn = await _db.OpenAsync();

        var where = new List<string>();
        if (!string.IsNullOrWhiteSpace(category)) where.Add("Category = @Category");
        if (!string.IsNullOrWhiteSpace(search)) where.Add("(Name LIKE @Search OR Description LIKE @Search)");

        var whereClause = where.Count > 0 ? "WHERE " + string.Join(" AND ", where) : "";

        // Count total matching rows for pagination metadata
        var countSql = $"SELECT COUNT(1) FROM Products {whereClause}";
        int totalItems;

        await using (var cmd = new SqlCommand(countSql, conn))
        {
            AddFilterParams(cmd, category, search);
            // FIX: ExecuteScalarAsync returns object? — Convert.ToInt32 handles
            // null safely (returns 0) and avoids the "unboxing nullable" warning.
            totalItems = Convert.ToInt32(await cmd.ExecuteScalarAsync());
        }

        // Fetch the requested page using OFFSET / FETCH (SQL Server 2012+)
        var dataSql = $@"
            SELECT Id, Name, Description, Price, Category, ImageUrl, Stock
            FROM   Products
            {whereClause}
            ORDER  BY Name
            OFFSET @Skip ROWS FETCH NEXT @PageSize ROWS ONLY";

        var results = new List<ProductDto>();

        await using (var cmd = new SqlCommand(dataSql, conn))
        {
            AddFilterParams(cmd, category, search);
            cmd.Parameters.AddWithValue("@Skip", (page - 1) * pageSize);
            cmd.Parameters.AddWithValue("@PageSize", pageSize);

            await using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
                results.Add(MapProduct(reader));
        }

        return new PagedResult<ProductDto>(results, totalItems, page, pageSize);
    }

    public async Task<ProductDto?> GetByIdAsync(int id)
    {
        await using var conn = await _db.OpenAsync();
        const string sql =
            "SELECT Id, Name, Description, Price, Category, ImageUrl, Stock FROM Products WHERE Id = @Id";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Id", id);

        await using var reader = await cmd.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapProduct(reader) : null;
    }

    public async Task<List<string>> GetCategoriesAsync()
    {
        await using var conn = await _db.OpenAsync();
        const string sql = "SELECT DISTINCT Category FROM Products ORDER BY Category";

        var list = new List<string>();
        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync()) list.Add(reader.GetString(0));
        return list;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────
    private static void AddFilterParams(SqlCommand cmd, string? category, string? search)
    {
        if (!string.IsNullOrWhiteSpace(category))
            cmd.Parameters.AddWithValue("@Category", category);
        if (!string.IsNullOrWhiteSpace(search))
            cmd.Parameters.AddWithValue("@Search", $"%{search}%");
    }

    private static ProductDto MapProduct(SqlDataReader r) => new(
        r.GetInt32(0), r.GetString(1), r.GetString(2),
        r.GetDecimal(3), r.GetString(4), r.GetString(5), r.GetInt32(6)
    );
}