using System.ComponentModel.DataAnnotations;

namespace KeyDespesas.Models
{
    public class Titulo
    {
        public long Id { get; set; }

        [Required]
        public string Tipo { get; set; } = "P"; // P=Despesa, R=Receita

        [Required, StringLength(150)]
        public string Descricao { get; set; } = "";

        [Required]
        public int IdCategoria { get; set; }

        [Required]
        public DateTime DataEmissao { get; set; }

        [Required]
        public DateTime DataVencimento { get; set; }

        [Required]
        public decimal Valor { get; set; }

        [Required]
        public string Status { get; set; } = "ABERTO"; // ABERTO, PAGO, CANCELADO, VENCIDO
    }
}
