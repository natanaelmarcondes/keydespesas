package com.example.a2nsystems

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface ApiService {
    @GET("titulos")
    suspend fun getTitulos(
        @Query("ano") ano: Int,
        @Query("mes") mes: Int
    ): List<Titulo>

    @GET("titulos/resumo-mes")
    suspend fun getResumoMes(
        @Query("ano") ano: Int,
        @Query("mes") mes: Int
    ): ResumoMes

    @PATCH("titulos/{id}/toggle-pago")
    suspend fun togglePago(
        @Path("id") id: Int
    ): Response<Unit>

    @POST("Titulos")
    suspend fun createTitulo(
        @Body titulo: TituloRequest
    ): Response<Titulo>

    @PUT("Titulos/{id}")
    suspend fun updateTitulo(
        @Path("id") id: Int,
        @Body titulo: TituloRequest
    ): Response<Titulo>

    @GET("categorias")
    suspend fun getCategorias(): List<Categoria>

    @GET("categorias/{id}")
    suspend fun getCategoria(
        @Path("id") id: Int
    ): Categoria

    @DELETE("Titulos/{id}")
    suspend fun deleteTitulo(
        @Path("id") id: Int
    ): Response<Unit>
}
