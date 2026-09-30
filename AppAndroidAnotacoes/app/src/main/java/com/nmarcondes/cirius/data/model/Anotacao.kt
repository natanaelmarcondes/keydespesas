package com.nmarcondes.cirius.data.model

import com.google.gson.annotations.SerializedName

data class Anotacao(
    @SerializedName("id")
    val id: Long? = null,
    
    @SerializedName("titulo")
    val titulo: String,
    
    @SerializedName("descricao")
    val descricao: String? = null,
    
    @SerializedName("dataCriacao")
    val dataCriacao: String? = null,
    
    @SerializedName("dataAlteracao")
    val dataAlteracao: String? = null,
    
    @SerializedName("arquivada")
    val arquivada: Boolean = false
)

data class AnotacaoRequest(
    @SerializedName("titulo")
    val titulo: String,
    
    @SerializedName("descricao")
    val descricao: String? = null
)
