namespace ECommerceAPI.DTOs;

// ── Auth ─────────────────────────────────────────────────────────────────────

public record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password
);

public record LoginRequest(
    string Email,
    string Password
);

// Role is now included so the frontend knows immediately after login/register
public record AuthResponse(
    string Token,
    string Email,
    string FirstName,
    string LastName,
    string Role          // "Customer" | "Admin"
);

// ── Cart ─────────────────────────────────────────────────────────────────────

public record AddToCartRequest(int ProductId, int Quantity);
public record UpdateCartRequest(int Quantity);

public record CartItemDto(
    int Id,
    int ProductId,
    string ProductName,
    string ImageUrl,
    decimal UnitPrice,
    int Quantity,
    decimal LineTotal
);

public record CartDto(List<CartItemDto> Items, decimal Total);

// ── Orders ────────────────────────────────────────────────────────────────────

public record CheckoutRequest(string ShippingAddress);

public record OrderSummaryDto(
    int Id,
    decimal TotalPrice,
    string ShippingAddress,
    string Status,
    DateTime CreatedAt,
    List<OrderItemDto> Items
);

public record OrderItemDto(
    int ProductId,
    string ProductName,
    int Quantity,
    decimal UnitPrice,
    decimal LineTotal
);

// ── Products ──────────────────────────────────────────────────────────────────

public record ProductDto(
    int Id,
    string Name,
    string Description,
    decimal Price,
    string Category,
    string ImageUrl,
    int Stock
);

// Used for both Create and Update (Admin only)
public record SaveProductRequest(
    string Name,
    string Description,
    decimal Price,
    string Category,
    string ImageUrl,
    int Stock
);

// ── Admin ─────────────────────────────────────────────────────────────────────

public record UserAdminDto(
    int Id,
    string FirstName,
    string LastName,
    string Email,
    string Role,
    DateTime CreatedAt
);

public record ChangeRoleRequest(string Role);   // "Customer" | "Admin"
public record UpdateOrderStatusRequest(string Status); // "Pending" | "Shipped" | "Delivered" | "Cancelled"

// Admin order list includes the user email for context
public record AdminOrderDto(
    int Id,
    int UserId,
    string UserEmail,
    decimal TotalPrice,
    string ShippingAddress,
    string Status,
    DateTime CreatedAt,
    List<OrderItemDto> Items
);

// ── Pagination ────────────────────────────────────────────────────────────────

public record PagedResult<T>(List<T> Items, int TotalItems, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling((double)TotalItems / PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}