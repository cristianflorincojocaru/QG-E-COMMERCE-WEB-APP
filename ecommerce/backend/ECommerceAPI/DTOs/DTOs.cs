namespace ECommerceAPI.DTOs;

// ── Request DTOs ─────────────────────────────────────────────────────────────

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

public record AddToCartRequest(
    int ProductId,
    int Quantity
);

public record UpdateCartRequest(
    int Quantity        // new quantity; 0 means remove
);

public record CheckoutRequest(
    string ShippingAddress
    // NOTE: No total price accepted from client — computed server-side only.
);

// ── Response DTOs ────────────────────────────────────────────────────────────

public record AuthResponse(
    string Token,
    string Email,
    string FirstName,
    string LastName
);

public record ProductDto(
    int     Id,
    string  Name,
    string  Description,
    decimal Price,
    string  Category,
    string  ImageUrl,
    int     Stock
);

public record CartItemDto(
    int     Id,
    int     ProductId,
    string  ProductName,
    string  ImageUrl,
    decimal UnitPrice,
    int     Quantity,
    decimal LineTotal       // UnitPrice × Quantity
);

public record CartDto(
    List<CartItemDto> Items,
    decimal           Total
);

public record OrderSummaryDto(
    int      Id,
    decimal  TotalPrice,
    string   ShippingAddress,
    string   Status,
    DateTime CreatedAt,
    List<OrderItemDto> Items
);

public record OrderItemDto(
    int     ProductId,
    string  ProductName,
    int     Quantity,
    decimal UnitPrice,
    decimal LineTotal
);

// ── Pagination wrapper ────────────────────────────────────────────────────────
/// <summary>Generic paged result returned by any paginated endpoint.</summary>
public record PagedResult<T>(
    List<T> Items,
    int     TotalItems,
    int     Page,
    int     PageSize
)
{
    public int  TotalPages  => (int)Math.Ceiling((double)TotalItems / PageSize);
    public bool HasNext     => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}
