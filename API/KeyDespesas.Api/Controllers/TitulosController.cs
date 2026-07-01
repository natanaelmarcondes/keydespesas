using KeyDespesas.Api.Data;
using KeyDespesas.Api.Dtos;
using KeyDespesas.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Api.Controllers;

[ApiController]
[Route("[controller]")]
public class TitulosController : ControllerBase
{
    private readonly AppDbContext _db;

    public TitulosController(AppDbContext db)
    {
        _db = db;
    }

    // GET /titulos?ano=2026&mes=2&tipo=P
    [HttpGet]
    [Produces("application/json")]
    public async Task<ActionResult<List<TituloListItemDto>>> GetByMes(
        [FromQuery] int ano,
        [FromQuery] int mes,
        [FromQuery] string? tipo)
    {
        if (ano < 2000 || ano > 2100)
        {
            return BadRequest(new
            {
                mensagem = "Ano inválido."
            });
        }

        if (mes < 1 || mes > 12)
        {
            return BadRequest(new
            {
                mensagem = "Mês inválido."
            });
        }

        string? tipoNormalizado = null;

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            tipoNormalizado = tipo.Trim().ToUpperInvariant();

            if (tipoNormalizado != "P" && tipoNormalizado != "R")
            {
                return BadRequest(new
                {
                    mensagem = "O tipo deve ser P para despesa ou R para receita."
                });
            }
        }

        var inicio = new DateTime(ano, mes, 1);
        var fim = inicio.AddMonths(1);

        var query = _db.Titulos
            .AsNoTracking()
            .Where(t => t.DataVencimento >= inicio && t.DataVencimento < fim);

        if (!string.IsNullOrWhiteSpace(tipoNormalizado))
        {
            query = query.Where(t => t.Tipo == tipoNormalizado);
        }

        var lista = await query
            .OrderBy(t => t.DataVencimento)
            .ThenBy(t => t.Id)
            .Select(t => new TituloListItemDto
            {
                Id = t.Id,
                Tipo = t.Tipo,
                Descricao = t.Descricao,
                IdCategoria = t.IdCategoria,
                CategoriaNome = t.Categoria != null ? t.Categoria.Nome : "",
                DataEmissao = t.DataEmissao,
                DataVencimento = t.DataVencimento,
                Valor = t.Valor,
                Status = t.Status
            })
            .ToListAsync();

        return Ok(lista);
    }

    // GET /titulos/123
    [HttpGet("{id:long}")]
    [Produces("application/json")]
    public async Task<ActionResult<TituloDetalheDto>> GetById(
        [FromRoute] long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código do título é inválido."
            });
        }

        var titulo = await _db.Titulos
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new TituloDetalheDto
            {
                Id = t.Id,
                Tipo = t.Tipo,
                Descricao = t.Descricao,
                IdCategoria = t.IdCategoria,
                Categoria = t.Categoria != null ? t.Categoria.Nome : "",
                DataEmissao = t.DataEmissao,
                DataVencimento = t.DataVencimento,
                Valor = t.Valor,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();

        if (titulo is null)
        {
            return NotFound(new
            {
                mensagem = "Título não encontrado."
            });
        }

        return Ok(titulo);
    }

    // POST /titulos
    [HttpPost]
    [Consumes("application/json")]
    [Produces("application/json")]
    public async Task<ActionResult<TituloDetalheDto>> Create(
        [FromBody] TituloSalvarDto dto)
    {
        string tipo = dto.Tipo.Trim().ToUpperInvariant();
        string descricao = dto.Descricao.Trim();
        string status = dto.Status.Trim().ToUpperInvariant();

        var erroValidacao = ValidarTitulo(
            tipo,
            descricao,
            dto.IdCategoria,
            dto.DataEmissao,
            dto.DataVencimento,
            dto.Valor,
            status);

        if (erroValidacao is not null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        bool categoriaExiste = await _db.Categorias
            .AsNoTracking()
            .AnyAsync(c => c.Id == dto.IdCategoria);

        if (!categoriaExiste)
        {
            return BadRequest(new
            {
                mensagem = "A categoria informada não existe."
            });
        }

        var agora = DateTime.Now;

        var titulo = new Titulo
        {
            Tipo = tipo,
            Descricao = descricao,
            IdCategoria = dto.IdCategoria,
            DataEmissao = dto.DataEmissao.Date,
            DataVencimento = dto.DataVencimento.Date,
            Valor = decimal.Round(dto.Valor, 2),
            Status = status,
            CreatedAt = agora,
            UpdatedAt = agora
        };

        _db.Titulos.Add(titulo);
        await _db.SaveChangesAsync();

        var tituloCriado = await ObterTituloDetalhe(titulo.Id);

        if (tituloCriado is null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                mensagem = "O título foi cadastrado, mas não foi possível retornar seus dados."
            });
        }

        return CreatedAtAction(
            nameof(GetById),
            new
            {
                id = titulo.Id
            },
            tituloCriado);
    }

    // PUT /titulos/123
    [HttpPut("{id:long}")]
    [Consumes("application/json")]
    [Produces("application/json")]
    public async Task<ActionResult<TituloDetalheDto>> Update(
        [FromRoute] long id,
        [FromBody] TituloSalvarDto dto)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código do título é inválido."
            });
        }

        string tipo = dto.Tipo.Trim().ToUpperInvariant();
        string descricao = dto.Descricao.Trim();
        string status = dto.Status.Trim().ToUpperInvariant();

        var erroValidacao = ValidarTitulo(
            tipo,
            descricao,
            dto.IdCategoria,
            dto.DataEmissao,
            dto.DataVencimento,
            dto.Valor,
            status);

        if (erroValidacao is not null)
        {
            return BadRequest(new
            {
                mensagem = erroValidacao
            });
        }

        var titulo = await _db.Titulos
            .FirstOrDefaultAsync(t => t.Id == id);

        if (titulo is null)
        {
            return NotFound(new
            {
                mensagem = "Título não encontrado."
            });
        }

        bool categoriaExiste = await _db.Categorias
            .AsNoTracking()
            .AnyAsync(c => c.Id == dto.IdCategoria);

        if (!categoriaExiste)
        {
            return BadRequest(new
            {
                mensagem = "A categoria informada não existe."
            });
        }

        titulo.Tipo = tipo;
        titulo.Descricao = descricao;
        titulo.IdCategoria = dto.IdCategoria;
        titulo.DataEmissao = dto.DataEmissao.Date;
        titulo.DataVencimento = dto.DataVencimento.Date;
        titulo.Valor = decimal.Round(dto.Valor, 2);
        titulo.Status = status;
        titulo.UpdatedAt = DateTime.Now;

        await _db.SaveChangesAsync();

        var tituloAtualizado = await ObterTituloDetalhe(titulo.Id);

        if (tituloAtualizado is null)
        {
            return StatusCode(StatusCodes.Status500InternalServerError, new
            {
                mensagem = "O título foi atualizado, mas não foi possível retornar seus dados."
            });
        }

        return Ok(tituloAtualizado);
    }

    // GET /titulos/resumo-mes?ano=2026&mes=2&tipo=P
    [HttpGet("resumo-mes")]
    [Produces("application/json")]
    public async Task<ActionResult<TitulosResumoMesDto>> GetResumoMes(
        [FromQuery] int ano,
        [FromQuery] int mes,
        [FromQuery] string? tipo)
    {
        if (ano < 2000 || ano > 2100)
        {
            return BadRequest(new
            {
                mensagem = "Ano inválido."
            });
        }

        if (mes < 1 || mes > 12)
        {
            return BadRequest(new
            {
                mensagem = "Mês inválido."
            });
        }

        string? tipoNormalizado = null;

        if (!string.IsNullOrWhiteSpace(tipo))
        {
            tipoNormalizado = tipo.Trim().ToUpperInvariant();

            if (tipoNormalizado != "P" && tipoNormalizado != "R")
            {
                return BadRequest(new
                {
                    mensagem = "O tipo deve ser P para despesa ou R para receita."
                });
            }
        }

        var inicio = new DateTime(ano, mes, 1);
        var fim = inicio.AddMonths(1);

        var query = _db.Titulos
            .AsNoTracking()
            .Where(t => t.DataVencimento >= inicio && t.DataVencimento < fim);

        if (!string.IsNullOrWhiteSpace(tipoNormalizado))
        {
            query = query.Where(t => t.Tipo == tipoNormalizado);
        }

        var dados = await query
            .GroupBy(_ => 1)
            .Select(g => new
            {
                Total = g.Sum(x => x.Valor),
                Qtde = g.Count(),

                TotalAberto = g.Where(x => x.Status == "ABERTO").Sum(x => x.Valor),
                TotalPago = g.Where(x => x.Status == "PAGO").Sum(x => x.Valor),
                TotalVencido = g.Where(x => x.Status == "VENCIDO").Sum(x => x.Valor),
                TotalCancelado = g.Where(x => x.Status == "CANCELADO").Sum(x => x.Valor),

                QtdeAberto = g.Count(x => x.Status == "ABERTO"),
                QtdePago = g.Count(x => x.Status == "PAGO"),
                QtdeVencido = g.Count(x => x.Status == "VENCIDO"),
                QtdeCancelado = g.Count(x => x.Status == "CANCELADO")
            })
            .FirstOrDefaultAsync();

        if (dados is null)
        {
            return Ok(new TitulosResumoMesDto
            {
                Ano = ano,
                Mes = mes,
                Tipo = tipoNormalizado,
                Total = 0,
                TotalAberto = 0,
                TotalPago = 0,
                TotalVencido = 0,
                TotalCancelado = 0,
                Qtde = 0,
                QtdeAberto = 0,
                QtdePago = 0,
                QtdeVencido = 0,
                QtdeCancelado = 0
            });
        }

        return Ok(new TitulosResumoMesDto
        {
            Ano = ano,
            Mes = mes,
            Tipo = tipoNormalizado,
            Total = dados.Total,
            TotalAberto = dados.TotalAberto,
            TotalPago = dados.TotalPago,
            TotalVencido = dados.TotalVencido,
            TotalCancelado = dados.TotalCancelado,
            Qtde = dados.Qtde,
            QtdeAberto = dados.QtdeAberto,
            QtdePago = dados.QtdePago,
            QtdeVencido = dados.QtdeVencido,
            QtdeCancelado = dados.QtdeCancelado
        });
    }

    // DELETE /titulos/123
    [HttpDelete("{id:long}")]
    public async Task<IActionResult> Delete(
        [FromRoute] long id)
    {
        if (id <= 0)
        {
            return BadRequest(new
            {
                mensagem = "O código do título é inválido."
            });
        }

        var titulo = await _db.Titulos
            .FirstOrDefaultAsync(t => t.Id == id);

        if (titulo is null)
        {
            return NotFound(new
            {
                mensagem = "Título não encontrado."
            });
        }

        _db.Titulos.Remove(titulo);

        await _db.SaveChangesAsync();

        return NoContent();
    }

    // PATCH /titulos/123/toggle-pago
    // Se ABERTO => PAGO | Se PAGO => ABERTO | outros => não altera
    [HttpPatch("{id:long}/toggle-pago")]
    public async Task<IActionResult> TogglePago(
        [FromRoute] long id)
    {
        var titulo = await _db.Titulos
            .FirstOrDefaultAsync(x => x.Id == id);

        if (titulo is null)
        {
            return NoContent();
        }

        if (titulo.Status == "ABERTO")
        {
            titulo.Status = "PAGO";
            titulo.UpdatedAt = DateTime.Now;
        }
        else if (titulo.Status == "PAGO")
        {
            titulo.Status = "ABERTO";
            titulo.UpdatedAt = DateTime.Now;
        }

        await _db.SaveChangesAsync();

        return NoContent();
    }

    private async Task<TituloDetalheDto?> ObterTituloDetalhe(long id)
    {
        return await _db.Titulos
            .AsNoTracking()
            .Where(t => t.Id == id)
            .Select(t => new TituloDetalheDto
            {
                Id = t.Id,
                Tipo = t.Tipo,
                Descricao = t.Descricao,
                IdCategoria = t.IdCategoria,
                Categoria = t.Categoria != null ? t.Categoria.Nome : "",
                DataEmissao = t.DataEmissao,
                DataVencimento = t.DataVencimento,
                Valor = t.Valor,
                Status = t.Status,
                CreatedAt = t.CreatedAt,
                UpdatedAt = t.UpdatedAt
            })
            .FirstOrDefaultAsync();
    }

    private static string? ValidarTitulo(
        string tipo,
        string descricao,
        int idCategoria,
        DateTime dataEmissao,
        DateTime dataVencimento,
        decimal valor,
        string status)
    {
        if (tipo != "P" && tipo != "R")
        {
            return "O tipo deve ser P para despesa ou R para receita.";
        }

        if (string.IsNullOrWhiteSpace(descricao))
        {
            return "A descrição é obrigatória.";
        }

        if (descricao.Length > 150)
        {
            return "A descrição deve possuir no máximo 150 caracteres.";
        }

        if (idCategoria <= 0)
        {
            return "Informe uma categoria válida.";
        }

        if (dataEmissao == default)
        {
            return "A data de emissão é obrigatória.";
        }

        if (dataVencimento == default)
        {
            return "A data de vencimento é obrigatória.";
        }

        if (valor <= 0)
        {
            return "O valor deve ser maior que zero.";
        }

        if (status != "ABERTO" &&
            status != "PAGO" &&
            status != "CANCELADO" &&
            status != "VENCIDO")
        {
            return "O status deve ser ABERTO, PAGO, CANCELADO ou VENCIDO.";
        }

        return null;
    }
}