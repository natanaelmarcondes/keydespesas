package com.nmarcondes.cirius.repository

import com.nmarcondes.cirius.data.model.Anotacao
import com.nmarcondes.cirius.data.model.AnotacaoRequest
import com.nmarcondes.cirius.data.remote.AnotacoesApiService
import com.nmarcondes.cirius.data.remote.RetrofitClient

class AnotacoesRepository(
    private val apiService: AnotacoesApiService = RetrofitClient.apiService
) {
    suspend fun getAnotacoes(incluirArquivadas: Boolean = false): Result<List<Anotacao>> {
        return runCatching {
            val param = if (incluirArquivadas) true else null
            apiService.getAnotacoes(param)
        }
    }

    suspend fun getAnotacaoById(id: Long): Result<Anotacao> {
        return runCatching {
            apiService.getAnotacaoById(id)
        }
    }

    suspend fun criarAnotacao(titulo: String, descricao: String?): Result<Anotacao> {
        return runCatching {
            val request = AnotacaoRequest(
                titulo = titulo.trim(),
                descricao = descricao?.trim()?.ifEmpty { null }
            )
            apiService.criarAnotacao(request)
        }
    }

    suspend fun atualizarAnotacao(id: Long, titulo: String, descricao: String?): Result<Anotacao> {
        return runCatching {
            val request = AnotacaoRequest(
                titulo = titulo.trim(),
                descricao = descricao?.trim()?.ifEmpty { null }
            )
            apiService.atualizarAnotacao(id, request)
        }
    }

    suspend fun deletarAnotacao(id: Long): Result<Unit> {
        return runCatching {
            val response = apiService.deletarAnotacao(id)
            if (!response.isSuccessful) {
                throw Exception("Erro ao excluir anotação: ${response.code()}")
            }
        }
    }

    suspend fun arquivarAnotacao(id: Long): Result<Anotacao> {
        return runCatching {
            apiService.arquivarAnotacao(id)
        }
    }

    suspend fun restaurarAnotacao(id: Long): Result<Anotacao> {
        return runCatching {
            apiService.restaurarAnotacao(id)
        }
    }
}
