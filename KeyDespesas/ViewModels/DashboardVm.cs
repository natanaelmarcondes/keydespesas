namespace KeyDespesas.ViewModels
{
    public class DashboardVm
    {
        public int Ano { get; set; }
        public int Mes { get; set; }
        public string MesLabel { get; set; } = "";

        public decimal SaldoAtual { get; set; }

        public decimal ReceitaMes { get; set; }
        public decimal DespesaMes { get; set; }

        // ✅ novos (separado por status)
        public decimal ReceitaPagaMes { get; set; }
        public decimal ReceitaAbertaMes { get; set; }
        public decimal DespesaPagaMes { get; set; }
        public decimal DespesaAbertaMes { get; set; }

        public decimal VencidosMes { get; set; }
        public decimal VencendoHoje { get; set; }
        public decimal VencimentosFuturos { get; set; }

        public List<string> Labels { get; set; } = new();
        public List<decimal> Receitas7d { get; set; } = new();
        public List<decimal> Despesas7d { get; set; } = new();
    }
}
