package com.example.a2nsystems

import retrofit2.http.GET
import retrofit2.http.Query

interface ApiService {
    @GET("api/titulos")
    suspend fun getTitulos(
        @Query("ano") ano: Int,
        @Query("mes") mes: Int
    ): List<Titulo>

    @GET("api/titulos/resumo-mes")
    suspend fun getResumoMes(
        @Query("ano") ano: Int,
        @Query("mes") mes: Int
    ): ResumoMes
}
