namespace KeyDespesas.Api.Models;

public class Anotacao
{
    public long Id { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAlteracao { get; set; }

    public string Arquivada { get; set; } = "N";
}