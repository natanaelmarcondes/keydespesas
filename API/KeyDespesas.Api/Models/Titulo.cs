namespace KeyDespesas.Api.Models;

public class Titulo
{
    public long Id { get; set; }

    // 'P' = Pagar (Despesa) | 'R' = Receber (Receita)
    public string Tipo { get; set; } = "P";

    public string Descricao { get; set; } = "";

    public int IdCategoria { get; set; }
    public Categoria? Categoria { get; set; }

    public DateTime DataEmissao { get; set; }
    public DateTime DataVencimento { get; set; }

    public decimal Valor { get; set; }

    // 'ABERTO','PAGO','CANCELADO','VENCIDO'
    public string Status { get; set; } = "ABERTO";

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
