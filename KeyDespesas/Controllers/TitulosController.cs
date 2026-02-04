using KeyDespesas.Data;
using KeyDespesas.Models;
using KeyDespesas.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Rendering;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace KeyDespesas.Controllers
{
    public class TitulosController : Controller
    {
        private readonly AppDbContext _db;

        public TitulosController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Index(long? editar, int? ano, int? mes, string? returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;

            var hoje = DateTime.Today;
            var anoSel = ano ?? hoje.Year;
            var mesSel = mes ?? hoje.Month;

            var inicio = new DateTime(anoSel, mesSel, 1);
            var fim = inicio.AddMonths(1); // exclusivo

            var vm = new TitulosVm
            {
                Ano = anoSel,
                Mes = mesSel
            };

            vm.Categorias = await _db.Categorias
                .OrderBy(x => x.Nome)
                .Select(x => new SelectListItem { Value = x.Id.ToString(), Text = x.Nome })
                .ToListAsync();

            vm.Lista = await _db.Titulos
                .Where(x => x.DataVencimento >= inicio && x.DataVencimento < fim)
                .OrderByDescending(x => x.DataVencimento)
                .ThenByDescending(x => x.Id)
                .ToListAsync();

            if (editar.HasValue)
            {
                var t = await _db.Titulos.FirstOrDefaultAsync(x => x.Id == editar.Value);
                if (t != null)
                {
                    vm.IdEdicao = t.Id;
                    vm.Tipo = t.Tipo;
                    vm.Descricao = t.Descricao;
                    vm.IdCategoria = t.IdCategoria;
                    vm.DataEmissao = t.DataEmissao.Date;
                    vm.DataVencimento = t.DataVencimento.Date;

                    // ✅ como Valor agora é string no VM
                    vm.Valor = t.Valor.ToString("N2", new CultureInfo("pt-BR"));

                    vm.Status = t.Status;
                }
            }

            return View(vm);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Copiar(long id, DateTime novoVencimento, int ano, int mes, string? returnUrl)
        {
            var original = await _db.Titulos.FirstOrDefaultAsync(x => x.Id == id);
            if (original == null)
                return RedirectToAction(nameof(Index), new { ano, mes, returnUrl });

            var novo = new Titulo
            {
                Tipo = original.Tipo,
                Descricao = original.Descricao,
                IdCategoria = original.IdCategoria,
                DataEmissao = DateTime.Today,
                DataVencimento = novoVencimento.Date,
                Valor = original.Valor,
                Status = "ABERTO"
            };

            _db.Titulos.Add(novo);
            await _db.SaveChangesAsync();

            return RedirectToAction(nameof(Index), new { ano, mes, returnUrl });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Salvar(TitulosVm vm, string? returnUrl)
        {
            ViewBag.ReturnUrl = returnUrl;

            var inicio = new DateTime(vm.Ano, vm.Mes, 1);
            var fim = inicio.AddMonths(1);

            // Recarrega combos/lista (tela única)
            vm.Categorias = await _db.Categorias
                .OrderBy(x => x.Nome)
                .Select(x => new SelectListItem { Value = x.Id.ToString(), Text = x.Nome })
                .ToListAsync();

            vm.Lista = await _db.Titulos
                .Where(x => x.DataVencimento >= inicio && x.DataVencimento < fim)
                .OrderByDescending(x => x.DataVencimento)
                .ThenByDescending(x => x.Id)
                .ToListAsync();

            // Normalizações
            vm.Descricao = (vm.Descricao ?? "").Trim().ToUpperInvariant();

            // ✅ Converte Valor (string) para decimal pt-BR
            var raw = (vm.Valor ?? "").Trim();
            raw = raw.Replace(".", ""); // "2.000,00" -> "2000,00"

            if (!decimal.TryParse(raw, new CultureInfo("pt-BR"), out var valorOk) || valorOk <= 0)
                ModelState.AddModelError(nameof(vm.Valor), "Informe um valor válido. Ex: 2000,00");

            if (!ModelState.IsValid)
                return View("Index", vm);

            if (vm.IdEdicao == 0)
            {
                _db.Titulos.Add(new Titulo
                {
                    Tipo = vm.Tipo,
                    Descricao = vm.Descricao,
                    IdCategoria = vm.IdCategoria!.Value,
                    DataEmissao = vm.DataEmissao.Date,
                    DataVencimento = vm.DataVencimento.Date,
                    Valor = valorOk,                 // ✅ usa o decimal convertido
                    Status = vm.Status
                });
            }
            else
            {
                var t = await _db.Titulos.FirstOrDefaultAsync(x => x.Id == vm.IdEdicao);
                if (t == null)
                {
                    ModelState.AddModelError("", "Título não encontrado.");
                    return View("Index", vm);
                }

                t.Tipo = vm.Tipo;
                t.Descricao = vm.Descricao;
                t.IdCategoria = vm.IdCategoria!.Value;
                t.DataEmissao = vm.DataEmissao.Date;
                t.DataVencimento = vm.DataVencimento.Date;
                t.Valor = valorOk;                // ✅ usa o decimal convertido
                t.Status = vm.Status;
            }

            await _db.SaveChangesAsync();
            return RedirectToAction(nameof(Index), new { ano = vm.Ano, mes = vm.Mes, returnUrl });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Excluir(long id, int ano, int mes, string? returnUrl)
        {
            var t = await _db.Titulos.FirstOrDefaultAsync(x => x.Id == id);
            if (t != null)
            {
                _db.Titulos.Remove(t);
                await _db.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index), new { ano, mes, returnUrl });
        }

        [HttpGet]
        public IActionResult Cancelar(int ano, int mes, string? returnUrl)
        {
            return RedirectToAction(nameof(Index), new { ano, mes, returnUrl });
        }
    }
}
