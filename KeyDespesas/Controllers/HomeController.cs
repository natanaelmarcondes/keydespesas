using KeyDespesas.Data;
using KeyDespesas.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace KeyDespesas.Controllers
{
    public class HomeController : Controller
    {
        private readonly AppDbContext _db;

        public HomeController(AppDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> Index()
        {
            var hoje = DateTime.Today;

            var inicioMes = new DateTime(hoje.Year, hoje.Month, 1);
            var fimMes = inicioMes.AddMonths(1); // exclusivo

            // Mês atual (por vencimento)
            var titMes = await _db.Titulos
                .Where(x => x.DataVencimento >= inicioMes && x.DataVencimento < fimMes)
                .ToListAsync();

            // Totais do mês
            var receitaMes = titMes.Where(x => x.Tipo == "R").Sum(x => x.Valor);
            var despesaMes = titMes.Where(x => x.Tipo == "P").Sum(x => x.Valor);

            // Vencidos do mês (ABERTO e vencimento < hoje)
            var vencidosMes = titMes
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO" && x.DataVencimento < hoje)
                .Sum(x => x.Valor);

            // Vencendo hoje
            var vencendoHoje = await _db.Titulos
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO" && x.DataVencimento == hoje)
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            // Futuros (ABERTO e vencimento > hoje)
            var futuros = await _db.Titulos
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO" && x.DataVencimento > hoje)
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            // Saldo atual (simples): receitas - despesas do mês
            // (se quiser saldo geral, posso mudar para considerar tudo que não é cancelado)
            var saldoAtual = receitaMes - despesaMes;

            // Gráfico últimos 7 dias (por vencimento)
            var inicio7 = hoje.AddDays(-6); // 7 dias incluindo hoje
            var tit7d = await _db.Titulos
                .Where(x => x.DataVencimento >= inicio7 && x.DataVencimento <= hoje)
                .ToListAsync();

            var labels = new List<string>();
            var rec7 = new List<decimal>();
            var desp7 = new List<decimal>();

            for (var d = inicio7; d <= hoje; d = d.AddDays(1))
            {
                labels.Add(d.ToString("dd/MM"));
                rec7.Add(tit7d.Where(x => x.Tipo == "R" && x.DataVencimento == d).Sum(x => x.Valor));
                desp7.Add(tit7d.Where(x => x.Tipo == "P" && x.DataVencimento == d).Sum(x => x.Valor));
            }

            var vm = new DashboardVm
            {
                Ano = hoje.Year,
                Mes = hoje.Month,
                MesLabel = inicioMes.ToString("MM/yyyy"),

                SaldoAtual = saldoAtual,

                ReceitaMes = receitaMes,
                DespesaMes = despesaMes,

                VencidosMes = vencidosMes,
                VencendoHoje = vencendoHoje,
                VencimentosFuturos = futuros,

                Labels = labels,
                Receitas7d = rec7,
                Despesas7d = desp7
            };

            return View(vm);
        }
    }
}
