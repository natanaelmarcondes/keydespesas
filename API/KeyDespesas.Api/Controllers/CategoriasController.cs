using KeyDespesas.Api.Data;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class CategoriasController : ControllerBase
{
    private readonly AppDbContext _db;

    public CategoriasController(AppDbContext db)
    {
        _db = db;
    }

    // GET /categorias
    [HttpGet]
    [Produces("application/json")]
    public async Task<IActionResult> Get()
    {
        var categorias = await _db.Categorias
            .AsNoTracking()
            .OrderBy(c => c.Nome)
            .Select(c => new
            {
                c.Id,
                c.Nome
            })
            .ToListAsync();

        return Ok(categorias);
    }

    // GET /categorias/1
    [HttpGet("{id:int}")]
    [Produces("application/json")]
    public async Task<IActionResult> GetById(
        [FromRoute] int id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da categoria é inválido."
            });
        }

        var categoria = await _db.Categorias
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new
            {
                c.Id,
                c.Nome
            })
            .FirstOrDefaultAsync();

        if (categoria is null)
        {
            return NotFound(new
            {
                mensagem = "Categoria não encontrada."
            });
        }

        return Ok(categoria);
    }
}