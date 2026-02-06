using KeyDespesas.Api.Data;
using KeyDespesas.Api.Dtos;
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

    // GET /api/titulos?ano=2026&mes=2&tipo=P
    [HttpGet]
    [Produces("application/json")]
    public async Task<ActionResult<List<TituloListItemDto>>> GetByMes(
        [FromQuery] int ano,
        [FromQuery] int mes,
        [FromQuery] string? tipo // "P" ou "R" (opcional)
    )
    {
        if (ano < 2000 || ano > 2100) return BadRequest("Ano inválido.");
        if (mes < 1 || mes > 12) return BadRequest("Mês inválido.");

        var inicio = new DateTime(ano, mes, 1);
        var fim = inicio.AddMonths(1); // exclusivo

        var query = _db.Titulos
            .AsNoTracking()
            .Include(t => t.Categoria)
            .Where(t => t.DataVencimento >= inicio && t.DataVencimento < fim);

        if (!string.IsNullOrWhiteSpace(tipo))
            query = query.Where(t => t.Tipo == tipo);

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

    // GET /api/titulos/resumo-mes?ano=2026&mes=2&tipo=P
    [HttpGet("resumo-mes")]
    [Produces("application/json")]
    public async Task<ActionResult<TitulosResumoMesDto>> GetResumoMes(
        [FromQuery] int ano,
        [FromQuery] int mes,
        [FromQuery] string? tipo
    )
    {
        if (ano < 2000 || ano > 2100) return BadRequest("Ano inválido.");
        if (mes < 1 || mes > 12) return BadRequest("Mês inválido.");

        var inicio = new DateTime(ano, mes, 1);
        var fim = inicio.AddMonths(1);

        var q = _db.Titulos.AsNoTracking()
            .Where(t => t.DataVencimento >= inicio && t.DataVencimento < fim);

        if (!string.IsNullOrWhiteSpace(tipo))
            q = q.Where(t => t.Tipo == tipo);

        var dados = await q
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
                QtdeCancelado = g.Count(x => x.Status == "CANCELADO"),
            })
            .FirstOrDefaultAsync();

        if (dados is null)
        {
            return Ok(new TitulosResumoMesDto
            {
                Ano = ano,
                Mes = mes,
                Tipo = tipo,
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
            Tipo = tipo,

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
}
