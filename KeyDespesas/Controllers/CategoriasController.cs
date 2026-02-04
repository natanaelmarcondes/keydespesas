using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using KeyDespesas.Data;
using KeyDespesas.Models;
using KeyDespesas.ViewModels;
using System.Text;

namespace KeyDespesas.Controllers
{
    public class CategoriasController : Controller
    {
        private readonly AppDbContext _db;

        public CategoriasController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Index(int? editar)
        {
            var vm = new CategoriasVm();
            vm.Lista = await _db.Categorias
                               .OrderBy(x => x.Nome)
                               .ToListAsync();

            if (editar.HasValue)
            {
                var cat = await _db.Categorias.FirstOrDefaultAsync(x => x.Id == editar.Value);
                if (cat != null)
                {
                    vm.IdEdicao = cat.Id;
                    vm.Nome = cat.Nome;
                }
            }

            return View(vm);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Salvar(CategoriasVm vm)
        {
            // Recarrega lista para manter tela única mesmo com erro
            vm.Lista = await _db.Categorias.OrderBy(x => x.Nome).ToListAsync();

            // Normaliza (MAIÚSCULO + só letras/espaço)
            vm.Nome = NormalizarNome(vm.Nome);

            // Validação extra no servidor
            if (string.IsNullOrWhiteSpace(vm.Nome))
                ModelState.AddModelError(nameof(vm.Nome), "Informe o nome (somente letras).");

            if (!ModelState.IsValid)
                return View("Index", vm);

            if (vm.IdEdicao == 0)
            {
                _db.Categorias.Add(new Categoria { Nome = vm.Nome });
            }
            else
            {
                var cat = await _db.Categorias.FirstOrDefaultAsync(x => x.Id == vm.IdEdicao);
                if (cat == null)
                {
                    ModelState.AddModelError("", "Categoria não encontrada.");
                    return View("Index", vm);
                }

                cat.Nome = vm.Nome;
            }

            await _db.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Excluir(int id)
        {
            var cat = await _db.Categorias.FirstOrDefaultAsync(x => x.Id == id);
            if (cat != null)
            {
                _db.Categorias.Remove(cat);
                await _db.SaveChangesAsync();
            }

            return RedirectToAction(nameof(Index));
        }

        [HttpGet]
        public IActionResult Cancelar()
        {
            return RedirectToAction(nameof(Index));
        }

        // ✅ Mantém apenas letras (inclui acentos) e espaço, e converte para MAIÚSCULO
        private static string NormalizarNome(string? texto)
        {
            if (string.IsNullOrWhiteSpace(texto))
                return "";

            texto = texto.Trim().ToUpperInvariant();

            var sb = new StringBuilder(texto.Length);

            foreach (var ch in texto)
            {
                if (char.IsLetter(ch) || ch == ' ')
                    sb.Append(ch);
            }

            // Remove espaços duplicados
            return string.Join(" ", sb.ToString()
                                      .Split(' ', StringSplitOptions.RemoveEmptyEntries));
        }
    }
}
