using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using Microsoft.Data.SqlClient;

namespace ECommerceAPI.Services;

public interface IOrderService
{
    /// <summary>
    /// Places an order. The total is ALWAYS recomputed from the DB — never
    /// trusted from the client — to prevent price-tampering attacks.
    /// </summary>
    Task<OrderSummaryDto?> PlaceOrderAsync(int userId, string shippingAddress);

    Task<List<OrderSummaryDto>> GetOrdersForUserAsync(int userId);
    Task<OrderSummaryDto?> GetOrderByIdAsync(int orderId, int userId);
}

public class OrderService : IOrderService
{
    private readonly IDbContext _db;
    private readonly ICartService _cart;

    public OrderService(IDbContext db, ICartService cart)
    {
        _db = db;
        _cart = cart;
    }

    // ── Place order ───────────────────────────────────────────────────────────
    public async Task<OrderSummaryDto?> PlaceOrderAsync(int userId, string shippingAddress)
    {
        // 1. Fetch the cart (prices come straight from the Products table)
        var cart = await _cart.GetCartAsync(userId);
        if (cart.Items.Count == 0) return null;   // nothing to order

        // 2. Compute total server-side — client total is completely ignored
        var serverTotal = cart.Items.Sum(i => i.LineTotal);

        await using var conn = await _db.OpenAsync();

        // 3. Use a transaction so order + items are written atomically
        await using var tx = conn.BeginTransaction();
        try
        {
            // Insert the order header
            const string insertOrder = @"
                INSERT INTO Orders (UserId, TotalPrice, ShippingAddress, Status)
                OUTPUT INSERTED.Id
                VALUES (@UserId, @Total, @Address, 'Pending')";

            int orderId;
            await using (var cmd = new SqlCommand(insertOrder, conn, tx))
            {
                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@Total", serverTotal);
                cmd.Parameters.AddWithValue("@Address", shippingAddress);
                // FIX: Convert.ToInt32 instead of direct (int) cast —
                // ExecuteScalarAsync returns object? and unboxing it directly
                // triggers "unboxing a possibly null value" warning-as-error.
                orderId = Convert.ToInt32(await cmd.ExecuteScalarAsync());
            }

            // Insert one row per cart item (snapshot current price)
            const string insertItem = @"
                INSERT INTO OrderItems (OrderId, ProductId, Quantity, UnitPrice)
                VALUES (@OrderId, @ProductId, @Qty, @UnitPrice)";

            foreach (var item in cart.Items)
            {
                await using var cmd = new SqlCommand(insertItem, conn, tx);
                cmd.Parameters.AddWithValue("@OrderId", orderId);
                cmd.Parameters.AddWithValue("@ProductId", item.ProductId);
                cmd.Parameters.AddWithValue("@Qty", item.Quantity);
                cmd.Parameters.AddWithValue("@UnitPrice", item.UnitPrice);
                await cmd.ExecuteNonQueryAsync();
            }

            await tx.CommitAsync();

            // 4. Clear the cart after a successful checkout
            await _cart.ClearCartAsync(userId);

            return await GetOrderByIdAsync(orderId, userId);
        }
        catch
        {
            // Roll back everything if anything fails
            await tx.RollbackAsync();
            throw;
        }
    }

    // ── Order history for a user ──────────────────────────────────────────────
    public async Task<List<OrderSummaryDto>> GetOrdersForUserAsync(int userId)
    {
        await using var conn = await _db.OpenAsync();

        const string sql = @"
            SELECT o.Id, o.TotalPrice, o.ShippingAddress, o.Status, o.CreatedAt,
                   oi.ProductId, p.Name, oi.Quantity, oi.UnitPrice
            FROM   Orders o
            INNER JOIN OrderItems oi ON oi.OrderId = o.Id
            INNER JOIN Products   p  ON p.Id = oi.ProductId
            WHERE  o.UserId = @UserId
            ORDER  BY o.CreatedAt DESC, oi.Id";

        return await ReadOrders(conn, sql, "@UserId", userId);
    }

    public async Task<OrderSummaryDto?> GetOrderByIdAsync(int orderId, int userId)
    {
        await using var conn = await _db.OpenAsync();

        const string sql = @"
            SELECT o.Id, o.TotalPrice, o.ShippingAddress, o.Status, o.CreatedAt,
                   oi.ProductId, p.Name, oi.Quantity, oi.UnitPrice
            FROM   Orders o
            INNER JOIN OrderItems oi ON oi.OrderId = o.Id
            INNER JOIN Products   p  ON p.Id = oi.ProductId
            WHERE  o.Id = @OrderId AND o.UserId = @UserId";

        var orders = await ReadOrders(conn, sql, "@OrderId", orderId, "@UserId", userId);
        return orders.FirstOrDefault();
    }

    // ── Helper: build OrderSummaryDto list from a reader ─────────────────────
    private static async Task<List<OrderSummaryDto>> ReadOrders(
        SqlConnection conn, string sql, params object[] paramPairs)
    {
        await using var cmd = new SqlCommand(sql, conn);

        // paramPairs: name0, val0, name1, val1, ...
        for (int i = 0; i < paramPairs.Length; i += 2)
            cmd.Parameters.AddWithValue((string)paramPairs[i], paramPairs[i + 1]);

        var dict = new Dictionary<int, (OrderSummaryDto dto, List<OrderItemDto> items)>();

        await using var reader = await cmd.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            var orderId = reader.GetInt32(0);

            if (!dict.ContainsKey(orderId))
            {
                var items = new List<OrderItemDto>();
                dict[orderId] = (new OrderSummaryDto(
                    Id: orderId,
                    TotalPrice: reader.GetDecimal(1),
                    ShippingAddress: reader.GetString(2),
                    Status: reader.GetString(3),
                    CreatedAt: reader.GetDateTime(4),
                    Items: items
                ), items);
            }

            var unitPrice = reader.GetDecimal(8);
            var qty = reader.GetInt32(7);

            dict[orderId].items.Add(new OrderItemDto(
                ProductId: reader.GetInt32(5),
                ProductName: reader.GetString(6),
                Quantity: qty,
                UnitPrice: unitPrice,
                LineTotal: unitPrice * qty
            ));
        }

        return dict.Values.Select(v => v.dto).ToList();
    }
}