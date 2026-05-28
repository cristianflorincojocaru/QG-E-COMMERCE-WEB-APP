using ECommerceAPI.Data;
using ECommerceAPI.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Data.SqlClient;

namespace ECommerceAPI.Controllers;

/// <summary>
/// Admin-only endpoints. Every route requires Role = "Admin" in the JWT.
/// </summary>
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly IDbContext _db;

    public AdminController(IDbContext db) => _db = db;

    // ── Users ─────────────────────────────────────────────────────────────────

    /// <summary>Returns all registered users.</summary>
    [HttpGet("users")]
    public async Task<IActionResult> GetUsers()
    {
        await using var conn = await _db.OpenAsync();
        const string sql = @"
            SELECT Id, FirstName, LastName, Email, Role, CreatedAt
            FROM   Users
            ORDER  BY CreatedAt DESC";

        var list = new List<UserAdminDto>();
        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
            list.Add(new UserAdminDto(
                reader.GetInt32(0),
                reader.GetString(1),
                reader.GetString(2),
                reader.GetString(3),
                reader.GetString(4),
                reader.GetDateTime(5)
            ));

        return Ok(list);
    }

    /// <summary>Changes the role of a user ('Customer' or 'Admin').</summary>
    [HttpPut("users/{id:int}/role")]
    public async Task<IActionResult> ChangeRole(int id, [FromBody] ChangeRoleRequest req)
    {
        if (req.Role is not "Customer" and not "Admin")
            return BadRequest(new { message = "Role must be 'Customer' or 'Admin'." });

        await using var conn = await _db.OpenAsync();
        const string sql = "UPDATE Users SET Role = @Role WHERE Id = @Id";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Role", req.Role);
        cmd.Parameters.AddWithValue("@Id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        return rows == 0 ? NotFound() : NoContent();
    }

    /// <summary>Deletes a user and all their associated data (cascade).</summary>
    [HttpDelete("users/{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        await using var conn = await _db.OpenAsync();

        // Orders do NOT cascade from Users — delete them first.
        // OrderItems cascade from Orders automatically.
        await using (var cmd = new SqlCommand("DELETE FROM Orders WHERE UserId = @Id", conn))
        {
            cmd.Parameters.AddWithValue("@Id", id);
            await cmd.ExecuteNonQueryAsync();
        }

        await using (var cmd = new SqlCommand("DELETE FROM Users WHERE Id = @Id", conn))
        {
            cmd.Parameters.AddWithValue("@Id", id);
            var rows = await cmd.ExecuteNonQueryAsync();
            return rows == 0 ? NotFound() : NoContent();
        }
    }

    // ── Orders ────────────────────────────────────────────────────────────────

    /// <summary>Returns all orders across all users, newest first.</summary>
    [HttpGet("orders")]
    public async Task<IActionResult> GetAllOrders()
    {
        await using var conn = await _db.OpenAsync();

        const string sql = @"
            SELECT o.Id, o.UserId, u.Email, o.TotalPrice,
                   o.ShippingAddress, o.Status, o.CreatedAt,
                   oi.ProductId, p.Name, oi.Quantity, oi.UnitPrice
            FROM   Orders o
            JOIN   Users  u  ON u.Id = o.UserId
            LEFT JOIN OrderItems oi ON oi.OrderId = o.Id
            LEFT JOIN Products   p  ON p.Id = oi.ProductId
            ORDER  BY o.CreatedAt DESC, o.Id, oi.Id";

        var orders = new Dictionary<int, AdminOrderDto>();

        await using var cmd = new SqlCommand(sql, conn);
        await using var reader = await cmd.ExecuteReaderAsync();

        while (await reader.ReadAsync())
        {
            var orderId = reader.GetInt32(0);

            if (!orders.TryGetValue(orderId, out var order))
            {
                order = new AdminOrderDto(
                    orderId,
                    reader.GetInt32(1),
                    reader.GetString(2),
                    reader.GetDecimal(3),
                    reader.GetString(4),
                    reader.GetString(5),
                    reader.GetDateTime(6),
                    []
                );
                orders[orderId] = order;
            }

            if (!reader.IsDBNull(7))
            {
                var unitPrice = reader.GetDecimal(10);
                var qty = reader.GetInt32(9);
                order.Items.Add(new OrderItemDto(
                    reader.GetInt32(7),
                    reader.GetString(8),
                    qty,
                    unitPrice,
                    unitPrice * qty
                ));
            }
        }

        return Ok(orders.Values);
    }

    /// <summary>Updates the status of any order.</summary>
    [HttpPut("orders/{id:int}/status")]
    public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] UpdateOrderStatusRequest req)
    {
        var valid = new[] { "Pending", "Shipped", "Delivered", "Cancelled" };
        if (!valid.Contains(req.Status))
            return BadRequest(new { message = $"Status must be one of: {string.Join(", ", valid)}." });

        await using var conn = await _db.OpenAsync();
        const string sql = "UPDATE Orders SET Status = @Status WHERE Id = @Id";

        await using var cmd = new SqlCommand(sql, conn);
        cmd.Parameters.AddWithValue("@Status", req.Status);
        cmd.Parameters.AddWithValue("@Id", id);

        var rows = await cmd.ExecuteNonQueryAsync();
        return rows == 0 ? NotFound() : NoContent();
    }
}