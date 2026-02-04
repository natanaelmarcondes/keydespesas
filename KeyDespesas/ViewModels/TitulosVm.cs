using System.ComponentModel.DataAnnotations;
using KeyDespesas.Models;
using Microsoft.AspNetCore.Mvc.Rendering;

namespace KeyDespesas.ViewModels
{
    public class TitulosVm
    {
        public List<Titulo> Lista { get; set; } = new();
        public List<SelectListItem> Categorias { get; set; } = new();
        public int Ano { get; set; }
        public int Mes { get; set; }
        public long IdEdicao { get; set; }

        [Required]
        public string Tipo { get; set; } = "P";

        [Required, StringLength(150)]
        public string Descricao { get; set; } = "";

        [Required(ErrorMessage = "Selecione a categoria.")]
        public int? IdCategoria { get; set; }

        [Required]
        [DataType(DataType.Date)]
        public DateTime DataEmissao { get; set; } = DateTime.Today;

        [Required]
        [DataType(DataType.Date)]
        public DateTime DataVencimento { get; set; } = DateTime.Today;

        [Required(ErrorMessage = "Informe um valor.")]
        public string Valor { get; set; } = "";


        [Required]
        public string Status { get; set; } = "ABERTO";
    }
}
