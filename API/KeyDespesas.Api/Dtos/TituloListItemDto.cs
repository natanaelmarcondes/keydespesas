namespace KeyDespesas.Api.Dtos;

public class TituloListItemDto
{
    public long Id { get; set; }
    public string Tipo { get; set; } = "";
    public string Descricao { get; set; } = "";
    public int IdCategoria { get; set; }
    public string CategoriaNome { get; set; } = "";
    public DateTime DataEmissao { get; set; }
    public DateTime DataVencimento { get; set; }
    public decimal Valor { get; set; }
    public string Status { get; set; } = "";
}
