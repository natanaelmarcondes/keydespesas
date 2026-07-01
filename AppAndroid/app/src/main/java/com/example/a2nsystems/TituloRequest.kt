package com.example.a2nsystems

data class TituloRequest(
    val tipo: String,
    val descricao: String,
    val idCategoria: Int,
    val dataEmissao: String,
    val dataVencimento: String,
    val valor: Double,
    val status: String
)
