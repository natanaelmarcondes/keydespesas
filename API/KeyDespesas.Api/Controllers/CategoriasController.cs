using KeyDespesas.Api.Data;
using KeyDespesas.Api.Dtos;
using KeyDespesas.Api.Models;
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
    public async Task<ActionResult<List<CategoriaDto>>> Get()
    {
        var categorias = await _db.Categorias
            .AsNoTracking()
            .OrderBy(c => c.Nome)
            .Select(c => new CategoriaDto
            {
                Id = c.Id,
                Nome = c.Nome
            })
            .ToListAsync();

        return Ok(categorias);
    }

    // GET /categorias/1
    [HttpGet("{id:int}")]
    [Produces("application/json")]
    public async Task<ActionResult<CategoriaDto>> GetById(
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
            .Select(c => new CategoriaDto
            {
                Id = c.Id,
                Nome = c.Nome
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

    // POST /categorias
    [HttpPost]
    [Consumes("application/json")]
    [Produces("application/json")]
    public async Task<ActionResult<CategoriaDto>> Create(
        [FromBody] CategoriaSalvarDto dto)
    {
        string nome = dto.Nome.Trim();

        var erroValidacao = ValidarCategoria(nome);

        if (erroValidacao is not null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        var categoria = new Categoria
        {
            Nome = nome
        };

        _db.Categorias.Add(categoria);
        await _db.SaveChangesAsync();

        var categoriaCriada = await ObterCategoriaPorId(categoria.Id);

        if (categoriaCriada is null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                mensagem = "A categoria foi cadastrada, mas não foi possível retornar seus dados."
            });
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = categoria.Id
            },
            categoriaCriada);
    }

    // PUT /categorias/1
    [HttpPut("{id:int}")]
    [Consumes("application/json")]
    [Produces("application/json")]
    public async Task<ActionResult<CategoriaDto>> Update(
        [FromRoute] int id,
        [FromBody] CategoriaSalvarDto dto)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da categoria é inválido."
            });
        }

        string nome = dto.Nome.Trim();

        var erroValidacao = ValidarCategoria(nome);

        if (erroValidacao is not null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        var categoria = await _db.Categorias
            .FirstOrDefaultAsync(c => c.Id == id);

        if (categoria is null)
        {
            return NotFound(new
            {
                mensagem = "Categoria não encontrada."
            });
        }

        categoria.Nome = nome;

        await _db.SaveChangesAsync();

        var categoriaAtualizada = await ObterCategoriaPorId(categoria.Id);

        if (categoriaAtualizada is null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                mensagem = "A categoria foi atualizada, mas não foi possível retornar seus dados."
            });
        }

        return Ok(categoriaAtualizada);
    }

    // DELETE /categorias/1
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(
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
            .FirstOrDefaultAsync(c => c.Id == id);

        if (categoria is null)
        {
            return NotFound(new
            {
                mensagem = "Categoria não encontrada."
            });
        }

        bool possuiTitulosVinculados = await _db.Titulos
            .AsNoTracking()
            .AnyAsync(t => t.IdCategoria == id);

        if (possuiTitulosVinculados)
        {
            return BadRequest(new
            {
                mensagem = "A categoria não pode ser excluída, pois possui títulos vinculados."
            });
        }

        _db.Categorias.Remove(categoria);
        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<CategoriaDto?> ObterCategoriaPorId(int id)
    {
        return await _db.Categorias
            .AsNoTracking()
            .Where(c => c.Id == id)
            .Select(c => new CategoriaDto
            {
                Id = c.Id,
                Nome = c.Nome
            })
            .FirstOrDefaultAsync();
    }

    private static string? ValidarCategoria(string nome)
    {
        if (string.IsNullOrWhiteSpace(nome))
        {
            return "O nome da categoria é obrigatório.";
        }

        if (nome.Length > 80)
        {
            return "O nome da categoria deve possuir no máximo 80 caracteres.";
        }

        return null;
    }
}