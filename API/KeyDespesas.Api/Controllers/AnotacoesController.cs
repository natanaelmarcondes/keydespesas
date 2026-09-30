using KeyDespesas.Api.Data;
using KeyDespesas.Api.Dtos;
using KeyDespesas.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class AnotacoesController : ControllerBase
{
    private readonly AppDbContext _db;

    public AnotacoesController(AppDbContext db)
    {
        _db = db;
    }

    // GET /anotacoes
    [HttpGet]
    [Produces("application/json")]
    public async Task<ActionResult<List<AnotacaoDto>>> Get(
        [FromQuery] bool incluirArquivadas = false)
    {
        var query = _db.Anotacoes
            .AsNoTracking()
            .AsQueryable();

        if (!incluirArquivadas)
        {
            query = query.Where(a => a.Arquivada == "N");
        }

        var anotacoes = await query
            .OrderByDescending(a => a.DataCriacao)
            .Select(a => new AnotacaoDto
            {
                Id = a.Id,
                Titulo = a.Titulo,
                Descricao = a.Descricao,
                DataCriacao = a.DataCriacao,
                DataAlteracao = a.DataAlteracao,
                Arquivada = a.Arquivada == "S"
            })
            .ToListAsync();

        return Ok(anotacoes);
    }

    // GET /anotacoes/1
    [HttpGet("{id:long}")]
    [Produces("application/json")]
    public async Task<ActionResult<AnotacaoDto>> GetById(
        [FromRoute] long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da anotação é inválido."
            });
        }

        var anotacao = await ObterAnotacaoPorId(id);

        if (anotacao is null)
        {
            return NotFound(new
            {
                mensagem = "Anotação não encontrada."
            });
        }

        return Ok(anotacao);
    }

    // POST /anotacoes
    [HttpPost]
    [Consumes("application/json")]
    [Produces("application/json")]
    public async Task<ActionResult<AnotacaoDto>> Create(
        [FromBody] AnotacaoSalvarDto dto)
    {
        string titulo = dto.Titulo?.Trim() ?? string.Empty;
        string? descricao = dto.Descricao?.Trim();

        var erroValidacao = ValidarAnotacao(titulo);

        if (erroValidacao is not null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        if (string.IsNullOrWhiteSpace(descricao))
        {
            descricao = null;
        }

        var anotacao = new Anotacao
        {
            Titulo = titulo,
            Descricao = descricao,
            DataCriacao = DateTime.Now,
            DataAlteracao = null,
            Arquivada = "N"
        };

        _db.Anotacoes.Add(anotacao);

        await _db.SaveChangesAsync();

        var anotacaoCriada = await ObterAnotacaoPorId(anotacao.Id);

        if (anotacaoCriada is null)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    mensagem = "A anotação foi cadastrada, mas não foi possível retornar seus dados."
                });
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = anotacao.Id
            },
            anotacaoCriada);
    }

    // PUT /anotacoes/1
    [HttpPut("{id:long}")]
    [Consumes("application/json")]
    [Produces("application/json")]
    public async Task<ActionResult<AnotacaoDto>> Update(
        [FromRoute] long id,
        [FromBody] AnotacaoSalvarDto dto)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da anotação é inválido."
            });
        }

        string titulo = dto.Titulo?.Trim() ?? string.Empty;
        string? descricao = dto.Descricao?.Trim();

        var erroValidacao = ValidarAnotacao(titulo);

        if (erroValidacao is not null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        var anotacao = await _db.Anotacoes
            .FirstOrDefaultAsync(a => a.Id == id);

        if (anotacao is null)
        {
            return NotFound(new
            {
                mensagem = "Anotação não encontrada."
            });
        }

        if (string.IsNullOrWhiteSpace(descricao))
        {
            descricao = null;
        }

        anotacao.Titulo = titulo;
        anotacao.Descricao = descricao;
        anotacao.DataAlteracao = DateTime.Now;

        await _db.SaveChangesAsync();

        var anotacaoAtualizada = await ObterAnotacaoPorId(anotacao.Id);

        if (anotacaoAtualizada is null)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    mensagem = "A anotação foi atualizada, mas não foi possível retornar seus dados."
                });
        }

        return Ok(anotacaoAtualizada);
    }

    // DELETE /anotacoes/1
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(
        [FromRoute] long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da anotação é inválido."
            });
        }

        var anotacao = await _db.Anotacoes
            .FirstOrDefaultAsync(a => a.Id == id);

        if (anotacao is null)
        {
            return NotFound(new
            {
                mensagem = "Anotação não encontrada."
            });
        }

        _db.Anotacoes.Remove(anotacao);

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // PATCH /anotacoes/1/arquivar
    [HttpPatch("{id:long}/arquivar")]
    [Produces("application/json")]
    public async Task<ActionResult<AnotacaoDto>> Arquivar(
        [FromRoute] long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da anotação é inválido."
            });
        }

        var anotacao = await _db.Anotacoes
            .FirstOrDefaultAsync(a => a.Id == id);

        if (anotacao is null)
        {
            return NotFound(new
            {
                mensagem = "Anotação não encontrada."
            });
        }

        anotacao.Arquivada = "S";
        anotacao.DataAlteracao = DateTime.Now;

        await _db.SaveChangesAsync();

        var anotacaoAtualizada = await ObterAnotacaoPorId(anotacao.Id);

        if (anotacaoAtualizada is null)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    mensagem = "A anotação foi arquivada, mas não foi possível retornar seus dados."
                });
        }

        return Ok(anotacaoAtualizada);
    }

    // PATCH /anotacoes/1/restaurar
    [HttpPatch("{id:long}/restaurar")]
    [Produces("application/json")]
    public async Task<ActionResult<AnotacaoDto>> Restaurar(
        [FromRoute] long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código da anotação é inválido."
            });
        }

        var anotacao = await _db.Anotacoes
            .FirstOrDefaultAsync(a => a.Id == id);

        if (anotacao is null)
        {
            return NotFound(new
            {
                mensagem = "Anotação não encontrada."
            });
        }

        anotacao.Arquivada = "N";
        anotacao.DataAlteracao = DateTime.Now;

        await _db.SaveChangesAsync();

        var anotacaoAtualizada = await ObterAnotacaoPorId(anotacao.Id);

        if (anotacaoAtualizada is null)
        {
            return StatusCode(
                StatusCodes.Status500InternalServerError,
                new
                {
                    mensagem = "A anotação foi restaurada, mas não foi possível retornar seus dados."
                });
        }

        return Ok(anotacaoAtualizada);
    }

    private async Task<AnotacaoDto?> ObterAnotacaoPorId(long id)
    {
        return await _db.Anotacoes
            .AsNoTracking()
            .Where(a => a.Id == id)
            .Select(a => new AnotacaoDto
            {
                Id = a.Id,
                Titulo = a.Titulo,
                Descricao = a.Descricao,
                DataCriacao = a.DataCriacao,
                DataAlteracao = a.DataAlteracao,
                Arquivada = a.Arquivada == "S"
            })
            .FirstOrDefaultAsync();
    }

    private static string? ValidarAnotacao(string titulo)
    {
        if (string.IsNullOrWhiteSpace(titulo))
        {
            return "O título da anotação é obrigatório.";
        }

        if (titulo.Length > 200)
        {
            return "O título da anotação deve possuir no máximo 200 caracteres.";
        }

        if (titulo.Contains('\r') ||
            titulo.Contains('\n'))
        {
            return "O título da anotação não pode possuir quebra de linha.";
        }

        return null;
    }
}