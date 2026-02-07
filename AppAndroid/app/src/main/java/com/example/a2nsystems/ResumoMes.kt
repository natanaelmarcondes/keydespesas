package com.example.a2nsystems

data class ResumoMes(
    val ano: Int,
    val mes: Int,
    val total: Double,
    val totalAberto: Double,
    val totalPago: Double,
    val totalVencido: Double,
    val totalCancelado: Double,
    val qtde: Int,
    val qtdeAberto: Int,
    val qtdePago: Int,
    val qtdeVencido: Int,
    val qtdeCancelado: Int
)
