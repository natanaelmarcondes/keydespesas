namespace KeyDespesas.Api.Dtos;

public class TitulosResumoMesDto
{
    public int Ano { get; set; }
    public int Mes { get; set; }
    public string? Tipo { get; set; } // "P" ou "R" (opcional)

    public decimal Total { get; set; }

    public decimal TotalAberto { get; set; }
    public decimal TotalPago { get; set; }
    public decimal TotalVencido { get; set; }
    public decimal TotalCancelado { get; set; }

    public int Qtde { get; set; }
    public int QtdeAberto { get; set; }
    public int QtdePago { get; set; }
    public int QtdeVencido { get; set; }
    public int QtdeCancelado { get; set; }
}
