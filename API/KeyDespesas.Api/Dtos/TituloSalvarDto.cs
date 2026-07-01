using System.ComponentModel.DataAnnotations;

namespace KeyDespesas.Api.Dtos;

public class TituloSalvarDto
{
    [Required(ErrorMessage = "O tipo é obrigatório.")]
    [RegularExpression("^[PR]$", ErrorMessage = "O tipo deve ser P para despesa ou R para receita.")]
    public string Tipo { get; set; } = "P";

    [Required(ErrorMessage = "A descrição é obrigatória.")]
    [StringLength(150, MinimumLength = 1, ErrorMessage = "A descrição deve possuir entre 1 e 150 caracteres.")]
    public string Descricao { get; set; } = "";

    [Range(1, int.MaxValue, ErrorMessage = "Informe uma categoria válida.")]
    public int IdCategoria { get; set; }

    [Required(ErrorMessage = "A data de emissão é obrigatória.")]
    public DateTime DataEmissao { get; set; }

    [Required(ErrorMessage = "A data de vencimento é obrigatória.")]
    public DateTime DataVencimento { get; set; }

    public decimal Valor { get; set; }

    [Required(ErrorMessage = "O status é obrigatório.")]
    [RegularExpression(
        "^(ABERTO|PAGO|CANCELADO|VENCIDO)$",
        ErrorMessage = "O status deve ser ABERTO, PAGO, CANCELADO ou VENCIDO.")]
    public string Status { get; set; } = "ABERTO";
}