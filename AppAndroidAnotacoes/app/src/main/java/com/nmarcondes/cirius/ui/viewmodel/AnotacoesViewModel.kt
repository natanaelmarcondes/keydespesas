package com.nmarcondes.cirius.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.nmarcondes.cirius.data.model.Anotacao
import com.nmarcondes.cirius.repository.AnotacoesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

sealed interface HomeUiState {
    object Loading : HomeUiState
    data class Success(val notes: List<Anotacao>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

data class EditNoteUiState(
    val isLoading: Boolean = false,
    val note: Anotacao? = null,
    val isSaving: Boolean = false,
    val titleError: String? = null,
    val generalError: String? = null
)

class AnotacoesViewModel(
    private val repository: AnotacoesRepository = AnotacoesRepository()
) : ViewModel() {

    private val _homeUiState = MutableStateFlow<HomeUiState>(HomeUiState.Loading)
    val homeUiState: StateFlow<HomeUiState> = _homeUiState.asStateFlow()

    private val _incluirArquivadas = MutableStateFlow(false)
    val incluirArquivadas: StateFlow<Boolean> = _incluirArquivadas.asStateFlow()

    private val _searchQuery = MutableStateFlow("")
    val searchQuery: StateFlow<String> = _searchQuery.asStateFlow()

    private val _editNoteUiState = MutableStateFlow(EditNoteUiState())
    val editNoteUiState: StateFlow<EditNoteUiState> = _editNoteUiState.asStateFlow()

    init {
        loadNotes()
    }

    fun loadNotes() {
        viewModelScope.launch {
            _homeUiState.value = HomeUiState.Loading
            repository.getAnotacoes(incluirArquivadas = _incluirArquivadas.value)
                .onSuccess { notes ->
                    _homeUiState.value = HomeUiState.Success(notes)
                }
                .onFailure { throwable ->
                    _homeUiState.value = HomeUiState.Error(
                        throwable.localizedMessage ?: "Erro ao carregar anotações."
                    )
                }
        }
    }

    fun toggleIncluirArquivadas(incluir: Boolean) {
        _incluirArquivadas.value = incluir
        loadNotes()
    }

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun validateTitle(titulo: String): String? {
        val trimmed = titulo.trim()
        return when {
            trimmed.isEmpty() -> "O título é obrigatório."
            titulo.contains("\n") || titulo.contains("\r") -> "O título não pode conter quebra de linha."
            titulo.length > 200 -> "O título possui no máximo 200 caracteres."
            else -> null
        }
    }

    fun loadNoteForEditing(id: Long) {
        viewModelScope.launch {
            _editNoteUiState.update { it.copy(isLoading = true, generalError = null) }
            repository.getAnotacaoById(id)
                .onSuccess { note ->
                    _editNoteUiState.update { it.copy(isLoading = false, note = note) }
                }
                .onFailure { throwable ->
                    _editNoteUiState.update {
                        it.copy(
                            isLoading = false,
                            generalError = throwable.localizedMessage ?: "Erro ao carregar a anotação."
                        )
                    }
                }
        }
    }

    fun clearEditState() {
        _editNoteUiState.value = EditNoteUiState()
    }

    fun saveNote(
        id: Long?,
        titulo: String,
        descricao: String?,
        onSuccess: () -> Unit
    ) {
        val titleErr = validateTitle(titulo)
        if (titleErr != null) {
            _editNoteUiState.update { it.copy(titleError = titleErr) }
            return
        }

        viewModelScope.launch {
            _editNoteUiState.update { it.copy(isSaving = true, titleError = null, generalError = null) }
            val result = if (id == null || id == 0L) {
                repository.criarAnotacao(titulo, descricao)
            } else {
                repository.atualizarAnotacao(id, titulo, descricao)
            }

            result.onSuccess {
                _editNoteUiState.update { it.copy(isSaving = false) }
                loadNotes()
                onSuccess()
            }.onFailure { throwable ->
                _editNoteUiState.update {
                    it.copy(
                        isSaving = false,
                        generalError = throwable.localizedMessage ?: "Erro ao salvar anotação."
                    )
                }
            }
        }
    }

    fun deleteNote(id: Long, onDone: (() -> Unit)? = null) {
        viewModelScope.launch {
            repository.deletarAnotacao(id)
                .onSuccess {
                    loadNotes()
                    onDone?.invoke()
                }
                .onFailure { throwable ->
                    _homeUiState.value = HomeUiState.Error(
                        throwable.localizedMessage ?: "Erro ao excluir anotação."
                    )
                }
        }
    }

    fun archiveNote(id: Long) {
        viewModelScope.launch {
            repository.arquivarAnotacao(id)
                .onSuccess {
                    loadNotes()
                }
                .onFailure { throwable ->
                    _homeUiState.value = HomeUiState.Error(
                        throwable.localizedMessage ?: "Erro ao arquivar anotação."
                    )
                }
        }
    }

    fun restoreNote(id: Long) {
        viewModelScope.launch {
            repository.restaurarAnotacao(id)
                .onSuccess {
                    loadNotes()
                }
                .onFailure { throwable ->
                    _homeUiState.value = HomeUiState.Error(
                        throwable.localizedMessage ?: "Erro ao restaurar anotação."
                    )
                }
        }
    }
}
