package com.example.a2nsystems

data class Titulo(
    val id: Int,
    val tipo: String,
    val descricao: String,
    val idCategoria: Int,
    val categoriaNome: String,
    val dataEmissao: String,
    val dataVencimento: String,
    val valor: Double,
    val status: String
)
