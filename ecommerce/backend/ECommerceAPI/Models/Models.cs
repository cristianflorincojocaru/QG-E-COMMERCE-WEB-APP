namespace ECommerceAPI.Models;

// ── Domain models ────────────────────────────────────────────────────────────
// Plain POCOs — no ORM attributes, just raw data containers.

public class User
{
    public int    Id           { get; set; }
    public string FirstName    { get; set; } = "";
    public string LastName     { get; set; } = "";
    public string Email        { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public DateTime CreatedAt  { get; set; }
}

public class Product
{
    public int     Id          { get; set; }
    public string  Name        { get; set; } = "";
    public string  Description { get; set; } = "";
    public decimal Price       { get; set; }
    public string  Category    { get; set; } = "";
    public string  ImageUrl    { get; set; } = "";
    public int     Stock       { get; set; }
}

public class CartItem
{
    public int     Id        { get; set; }
    public int     UserId    { get; set; }
    public int     ProductId { get; set; }
    public int     Quantity  { get; set; }

    // Populated via JOIN in the cart queries
    public Product? Product  { get; set; }
}

public class Order
{
    public int      Id              { get; set; }
    public int      UserId          { get; set; }
    public decimal  TotalPrice      { get; set; }
    public string   ShippingAddress { get; set; } = "";
    public string   Status          { get; set; } = "Pending";
    public DateTime CreatedAt       { get; set; }
    public List<OrderItem> Items    { get; set; } = [];
}

public class OrderItem
{
    public int     Id        { get; set; }
    public int     OrderId   { get; set; }
    public int     ProductId { get; set; }
    public int     Quantity  { get; set; }
    public decimal UnitPrice { get; set; }

    // Populated via JOIN
    public string ProductName { get; set; } = "";
}
