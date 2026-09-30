namespace KeyDespesas.Api.Dtos;

public class AnotacaoDto
{
    public long Id { get; set; }

    public string Titulo { get; set; } = string.Empty;

    public string? Descricao { get; set; }

    public DateTime DataCriacao { get; set; }

    public DateTime? DataAlteracao { get; set; }

    public bool Arquivada { get; set; }
}