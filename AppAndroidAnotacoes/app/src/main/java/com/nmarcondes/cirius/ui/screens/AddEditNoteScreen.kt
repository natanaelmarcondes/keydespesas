package com.nmarcondes.cirius.ui.screens

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Scaffold
import androidx.compose.material3.SnackbarHost
import androidx.compose.material3.SnackbarHostState
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.material3.TopAppBarDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import com.nmarcondes.cirius.ui.viewmodel.AnotacoesViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditNoteScreen(
    noteId: Long?,
    viewModel: AnotacoesViewModel,
    onNavigateBack: () -> Unit
) {
    val editState by viewModel.editNoteUiState.collectAsState()
    val focusManager = LocalFocusManager.current
    val snackbarHostState = remember { SnackbarHostState() }

    var titulo by remember { mutableStateOf("") }
    var descricao by remember { mutableStateOf("") }
    var isInitialized by remember { mutableStateOf(false) }

    val isEditing = noteId != null && noteId > 0

    // Load note for editing if noteId is provided
    LaunchedEffect(noteId) {
        if (isEditing) {
            viewModel.loadNoteForEditing(noteId)
        } else {
            viewModel.clearEditState()
            titulo = ""
            descricao = ""
            isInitialized = true
        }
    }

    // Populate input fields once loaded
    LaunchedEffect(editState.note) {
        if (isEditing && editState.note != null && !isInitialized) {
            titulo = editState.note?.titulo ?: ""
            descricao = editState.note?.descricao ?: ""
            isInitialized = true
        }
    }

    // Show general errors in snackbar
    LaunchedEffect(editState.generalError) {
        editState.generalError?.let { err ->
            snackbarHostState.showSnackbar(err)
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        text = if (isEditing) "Editar Anotação" else "Nova Anotação",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                            contentDescription = "Voltar"
                        )
                    }
                },
                actions = {
                    if (editState.isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier
                                .size(24.dp)
                                .padding(end = 8.dp),
                            strokeWidth = 2.dp
                        )
                    } else {
                        IconButton(
                            onClick = {
                                viewModel.saveNote(
                                    id = if (isEditing) noteId else null,
                                    titulo = titulo,
                                    descricao = descricao,
                                    onSuccess = onNavigateBack
                                )
                            }
                        ) {
                            Icon(
                                imageVector = Icons.Default.Check,
                                contentDescription = "Salvar Anotação"
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surfaceContainer
                )
            )
        }
    ) { paddingValues ->
        if (editState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
                    .padding(16.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Title field
                OutlinedTextField(
                    value = titulo,
                    onValueChange = { input ->
                        // Prevent line breaks in title
                        val filtered = input.replace("\n", "").replace("\r", "")
                        if (filtered.length <= 200) {
                            titulo = filtered
                        }
                    },
                    label = { Text("Título *") },
                    placeholder = { Text("Digite o título da anotação") },
                    isError = editState.titleError != null,
                    supportingText = {
                        Column {
                            if (editState.titleError != null) {
                                Text(
                                    text = editState.titleError!!,
                                    color = MaterialTheme.colorScheme.error
                                )
                            } else {
                                Text(
                                    text = "Obrigatório • Não permite quebra de linha",
                                    color = MaterialTheme.colorScheme.outline
                                )
                            }
                            Text(
                                text = "${titulo.length}/200",
                                modifier = Modifier.align(Alignment.End),
                                color = if (titulo.length >= 200) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.outline
                            )
                        }
                    },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Next),
                    keyboardActions = KeyboardActions(
                        onNext = { focusManager.moveFocus(FocusDirection.Down) }
                    ),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(16.dp))

                // Description field
                OutlinedTextField(
                    value = descricao,
                    onValueChange = { input -> descricao = input },
                    label = { Text("Descrição (opcional)") },
                    placeholder = { Text("Escreva aqui o conteúdo da sua anotação...") },
                    minLines = 6,
                    maxLines = 15,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Default),
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(24.dp))

                // Save Button
                Button(
                    onClick = {
                        viewModel.saveNote(
                            id = if (isEditing) noteId else null,
                            titulo = titulo,
                            descricao = descricao,
                            onSuccess = onNavigateBack
                        )
                    },
                    enabled = !editState.isSaving,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(50.dp)
                ) {
                    if (editState.isSaving) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary,
                            strokeWidth = 2.dp
                        )
                    } else {
                        Text(
                            text = if (isEditing) "Atualizar Anotação" else "Salvar Anotação",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                }
            }
        }
    }
}
