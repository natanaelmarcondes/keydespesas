package com.example.a2nsystems

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.PATCH
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
}
