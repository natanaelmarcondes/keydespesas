package com.nmarcondes.cirius.data.remote

import com.nmarcondes.cirius.data.model.Anotacao
import com.nmarcondes.cirius.data.model.AnotacaoRequest
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface AnotacoesApiService {

    @GET("anotacoes")
    suspend fun getAnotacoes(
        @Query("incluirArquivadas") incluirArquivadas: Boolean? = null
    ): List<Anotacao>

    @GET("anotacoes/{id}")
    suspend fun getAnotacaoById(
        @Path("id") id: Long
    ): Anotacao

    @POST("anotacoes")
    suspend fun criarAnotacao(
        @Body request: AnotacaoRequest
    ): Anotacao

    @PUT("anotacoes/{id}")
    suspend fun atualizarAnotacao(
        @Path("id") id: Long,
        @Body request: AnotacaoRequest
    ): Anotacao

    @DELETE("anotacoes/{id}")
    suspend fun deletarAnotacao(
        @Path("id") id: Long
    ): Response<ResponseBody>

    @PATCH("anotacoes/{id}/arquivar")
    suspend fun arquivarAnotacao(
        @Path("id") id: Long
    ): Anotacao

    @PATCH("anotacoes/{id}/restaurar")
    suspend fun restaurarAnotacao(
        @Path("id") id: Long
    ): Anotacao
}
