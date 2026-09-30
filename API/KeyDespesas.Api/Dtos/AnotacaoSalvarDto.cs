using System.ComponentModel.DataAnnotations;

namespace KeyDespesas.Api.Dtos;

public class AnotacaoSalvarDto
{
    [Required(ErrorMessage = "O título é obrigatório.")]
    [MaxLength(200, ErrorMessage = "O título deve possuir no máximo 200 caracteres.")]
    public string Titulo { get; set; } = string.Empty;

    public string? Descricao { get; set; }
}