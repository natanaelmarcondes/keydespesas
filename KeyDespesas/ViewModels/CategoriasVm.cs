using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using KeyDespesas.Models;

namespace KeyDespesas.ViewModels
{
    public class CategoriasVm
    {
        public List<Categoria> Lista { get; set; } = new();

        public int IdEdicao { get; set; }

        [Required(ErrorMessage = "Informe o nome.")]
        [StringLength(80)]
        public string Nome { get; set; } = "";
    }
}
