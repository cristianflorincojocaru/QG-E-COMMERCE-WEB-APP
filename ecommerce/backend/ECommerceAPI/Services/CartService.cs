using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using Microsoft.Data.SqlClient;

namespace ECommerceAPI.Services;

public interface ICartService
{
    Task<CartDto>  GetCartAsync(int userId);
    Task           AddOrUpdateAsync(int userId, int productId, int quantity);
    Task           UpdateQuantityAsync(int userId, int productId, int quantity);
    Task           RemoveItemAsync(int userId, int productId);
    Task           ClearCartAsync(int userId);
}

public class CartService : ICartService
{
    private readonly IDbContext _db;

    public CartService(IDbContext db) => _db = db;

    // ── Fetch the full cart with product details ──────────────────────────────
    public async Task<CartDto> GetCartAsync(int userId)
    {
        await using var conn = await _db.OpenAsync();

        // JOIN cart with products to get price/name in one query
        const string sql = @"
            SELECT ci.Id, ci.ProductId, p.Name, p.ImageUrl, p.Price, ci.Quantity
            FROM   CartItems ci
            INNER JOIN Products p ON p.Id = ci.ProductId
            WHERE  ci.UserId = @UserId
            ORDER  BY ci.Id";

        var items = new List<CartItemDto>();

        await using var cmd    = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var unitPrice = reader.GetDecimal(4);
            var quantity  = reader.GetInt32(5);

            items.Add(new CartItemDto(
                Id:          reader.GetInt32(0),
                ProductId:   reader.GetInt32(1),
                ProductName: reader.GetString(2),
                ImageUrl:    reader.GetString(3),
                UnitPrice:   unitPrice,
                Quantity:    quantity,
                LineTotal:   unitPrice * quantity
            ));
        }

        return new CartDto(items, items.Sum(i => i.LineTotal));
    }

    // ── Add item or increment quantity if it already exists ───────────────────
    public async Task AddOrUpdateAsync(int userId, int productId, int quantity)
    {
        await using var conn = await _db.OpenAsync();

        // MERGE handles "insert if not exists, else update"
        const string sql = @"
            MERGE CartItems AS target
            USING (SELECT @UserId AS UserId, @ProductId AS ProductId) AS source
            ON target.UserId = source.UserId AND target.ProductId = source.ProductId
            WHEN MATCHED THEN
                UPDATE SET Quantity = target.Quantity + @Quantity
            WHEN NOT MATCHED THEN
                INSERT (UserId, ProductId, Quantity) VALUES (@UserId, @ProductId, @Quantity);";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId",    userId);
        cmd.Parameters.AddWithValue("@ProductId", productId);
        cmd.Parameters.AddWithValue("@Quantity",  quantity);
        await cmd.ExecuteNonQueryAsync();
    }

    // ── Set an absolute quantity (0 = remove) ────────────────────────────────
    public async Task UpdateQuantityAsync(int userId, int productId, int quantity)
    {
        if (quantity <= 0)
        {
            await RemoveItemAsync(userId, productId);
            return;
        }

        await using var conn = await _db.OpenAsync();
        const string sql =
            "UPDATE CartItems SET Quantity = @Quantity WHERE UserId = @UserId AND ProductId = @ProductId";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Quantity",  quantity);
        cmd.Parameters.AddWithValue("@UserId",    userId);
        cmd.Parameters.AddWithValue("@ProductId", productId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task RemoveItemAsync(int userId, int productId)
    {
        await using var conn = await _db.OpenAsync();
        const string sql =
            "DELETE FROM CartItems WHERE UserId = @UserId AND ProductId = @ProductId";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId",    userId);
        cmd.Parameters.AddWithValue("@ProductId", productId);
        await cmd.ExecuteNonQueryAsync();
    }

    public async Task ClearCartAsync(int userId)
    {
        await using var conn = await _db.OpenAsync();
        const string sql = "DELETE FROM CartItems WHERE UserId = @UserId";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@UserId", userId);
        await cmd.ExecuteNonQueryAsync();
    }
}
