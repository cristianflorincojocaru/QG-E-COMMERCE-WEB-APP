using ECommerceAPI.DTOs;
using ECommerceAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace ECommerceAPI.Controllers;

[ApiController]
[Route("api/products")]
public class ProductsController : ControllerBase
{
    private readonly IProductService _products;

    public ProductsController(IProductService products) => _products = products;

    // ── Public read endpoints ─────────────────────────────────────────────────

    /// <summary>Paginated product list with optional category / search filters.</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll(
        [FromQuery] string? category,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 12)
        => Ok(await _products.GetAllAsync(category, search, page, pageSize));

    /// <summary>Single product by ID.</summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var p = await _products.GetByIdAsync(id);
        return p is null ? NotFound() : Ok(p);
    }

    /// <summary>Distinct list of all product categories.</summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
        => Ok(await _products.GetCategoriesAsync());

    // ── Admin-only write endpoints ────────────────────────────────────────────

    /// <summary>Create a new product. Requires Admin role.</summary>
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] SaveProductRequest req)
    {
        if (string.IsNullOrWhiteSpace(req.Name))
            return BadRequest(new { message = "Name is required." });
        if (req.Price < 0)
            return BadRequest(new { message = "Price must be >= 0." });

        var created = await _products.CreateAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>Update an existing product. Requires Admin role.</summary>
    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(int id, [FromBody] SaveProductRequest req)
    {
        var ok = await _products.UpdateAsync(id, req);
        return ok ? NoContent() : NotFound();
    }

    /// <summary>Delete a product. Requires Admin role.</summary>
    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var ok = await _products.DeleteAsync(id);
        return ok ? NoContent() : NotFound();
    }
}