using KeyDespesas.Data;
using KeyDespesas.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

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
            var fimMes = inicioMes.AddMonths(1);

            // Base do mês
            var qMes = _db.Titulos
                .AsNoTracking()
                .Where(x => x.DataVencimento >= inicioMes && x.DataVencimento < fimMes);

            // ✅ Receita (R) separado por status
            var receitaPagaMes = await qMes
                .Where(x => x.Tipo == "R" && x.Status == "PAGO")
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            var receitaAbertaMes = await qMes
                .Where(x => x.Tipo == "R" && x.Status == "ABERTO")
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            // ✅ Despesa (P) separado por status
            var despesaPagaMes = await qMes
                .Where(x => x.Tipo == "P" && x.Status == "PAGO")
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            var despesaAbertaMes = await qMes
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO")
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            // Totais do mês (independente do status)
            var receitaMes = receitaPagaMes + receitaAbertaMes;
            var despesaMes = despesaPagaMes + despesaAbertaMes;

            // ✅ Cards de vencimento: sempre "Pagar" + "ABERTO"
            var vencidosMes = await qMes
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO" && x.DataVencimento < hoje)
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            var vencendoHoje = await qMes
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO" && x.DataVencimento.Date == hoje)
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            var futuros = await qMes
                .Where(x => x.Tipo == "P" && x.Status == "ABERTO" && x.DataVencimento > hoje)
                .SumAsync(x => (decimal?)x.Valor) ?? 0m;

            // ✅ Saldo (você escolhe a regra)
            // Regra atual (previsto do mês: tudo, pago+aberto):
            var saldoAtual = receitaMes - despesaMes;

            // Se preferir saldo "realizado" (somente pagos), troque por:
            // var saldoAtual = receitaPagaMes - despesaPagaMes;

            // Gráfico (mantive seu padrão atual)
            var titMesGraf = await qMes.ToListAsync();

            var labels = new List<string>();
            var rec7 = new List<decimal>();
            var desp7 = new List<decimal>();

            for (var d = inicioMes; d < fimMes; d = d.AddDays(1))
            {
                labels.Add(d.ToString("dd/MM"));
                rec7.Add(titMesGraf.Where(x => x.Tipo == "R" && x.DataVencimento.Date == d.Date).Sum(x => x.Valor));
                desp7.Add(titMesGraf.Where(x => x.Tipo == "P" && x.DataVencimento.Date == d.Date).Sum(x => x.Valor));
            }

            var cultura = new CultureInfo("pt-BR");

            var vm = new DashboardVm
            {
                Ano = hoje.Year,
                Mes = hoje.Month,
                MesLabel = cultura.TextInfo.ToTitleCase(inicioMes.ToString("MMMM/yyyy", cultura)),

                SaldoAtual = saldoAtual,

                ReceitaMes = receitaMes,
                DespesaMes = despesaMes,

                ReceitaPagaMes = receitaPagaMes,
                ReceitaAbertaMes = receitaAbertaMes,
                DespesaPagaMes = despesaPagaMes,
                DespesaAbertaMes = despesaAbertaMes,

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
