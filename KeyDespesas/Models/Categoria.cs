using System.ComponentModel.DataAnnotations;

namespace KeyDespesas.Models
{
    public class Categoria
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "Informe o nome.")]
        [StringLength(80, ErrorMessage = "Máximo de 80 caracteres.")]
        public string Nome { get; set; } = "";
    }
}
