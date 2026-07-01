namespace KeyDespesas.Api.Dtos;

public class TituloDetalheDto
{
    public long Id { get; set; }

    public string Tipo { get; set; } = "";

    public string Descricao { get; set; } = "";

    public int IdCategoria { get; set; }

    public string Categoria { get; set; } = "";

    public DateTime DataEmissao { get; set; }

    public DateTime DataVencimento { get; set; }

    public decimal Valor { get; set; }

    public string Status { get; set; } = "";

    public DateTime CreatedAt { get; set; }

    public DateTime UpdatedAt { get; set; }
}