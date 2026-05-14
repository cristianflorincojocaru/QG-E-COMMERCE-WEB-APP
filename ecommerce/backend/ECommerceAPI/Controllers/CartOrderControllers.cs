using System.Security.Claims;
using ECommerceAPI.DTOs;
using ECommerceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceAPI.Controllers;

// ── CartController ────────────────────────────────────────────────────────────
[ApiController]
[Route("api/cart")]
[Authorize]   // all cart endpoints require a valid JWT
public class CartController : ControllerBase
{
    private readonly ICartService _cart;

    public CartController(ICartService cart) => _cart = cart;

    // Helper: extract userId from the JWT "sub" claim
    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET api/cart
    [HttpGet]
    public async Task<IActionResult> Get() =>
        Ok(await _cart.GetCartAsync(UserId));

    // POST api/cart
    [HttpPost]
    public async Task<IActionResult> Add([FromBody] AddToCartRequest req)
    {
        if (req.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be at least 1." });

        await _cart.AddOrUpdateAsync(UserId, req.ProductId, req.Quantity);
        return Ok(await _cart.GetCartAsync(UserId));
    }

    // PUT api/cart/{productId}
    [HttpPut("{productId:int}")]
    public async Task<IActionResult> Update(int productId, [FromBody] UpdateCartRequest req)
    {
        await _cart.UpdateQuantityAsync(UserId, productId, req.Quantity);
        return Ok(await _cart.GetCartAsync(UserId));
    }

    // DELETE api/cart/{productId}
    [HttpDelete("{productId:int}")]
    public async Task<IActionResult> Remove(int productId)
    {
        await _cart.RemoveItemAsync(UserId, productId);
        return Ok(await _cart.GetCartAsync(UserId));
    }
}

// ── OrdersController ──────────────────────────────────────────────────────────
[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly IOrderService _orders;

    public OrdersController(IOrderService orders) => _orders = orders;

    private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // POST api/orders/checkout
    // IMPORTANT: We accept only the shipping address from the client.
    // The total price is calculated entirely on the server from database prices.
    [HttpPost("checkout")]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.ShippingAddress))
            return BadRequest(new { message = "Shipping address is required." });

        var order = await _orders.PlaceOrderAsync(UserId, req.ShippingAddress);

        if (order is null)
            return BadRequest(new { message = "Your cart is empty." });

        return Ok(order);
    }

    // GET api/orders
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _orders.GetOrdersForUserAsync(UserId));

    // GET api/orders/{id}
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var order = await _orders.GetOrderByIdAsync(id, UserId);
        return order is null ? NotFound() : Ok(order);
    }
}
