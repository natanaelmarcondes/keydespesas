package com.example.a2nsystems

data class Categoria(
    val id: Int,
    val nome: String
) {
    override fun toString(): String {
        return nome
    }
}
