package com.example.a2nsystems

import android.app.DatePickerDialog
import android.os.Bundle
import android.view.View
import android.widget.ArrayAdapter
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.a2nsystems.databinding.ActivityCadastroTituloBinding
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.SimpleDateFormat
import java.util.*

class CadastroTituloActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCadastroTituloBinding
    private val calendar = Calendar.getInstance()
    private val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
        timeZone = TimeZone.getTimeZone("UTC")
    }
    private val displayFormat = SimpleDateFormat("dd/MM/yyyy", Locale.getDefault())

    private var dataEmissao: Calendar = Calendar.getInstance()
    private var dataVencimento: Calendar = Calendar.getInstance()

    private val apiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://api.keysolution.com.br/")
            .client(UnsafeOkHttpClient.getUnsafeOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    private var categorias: List<Categoria> = emptyList()
    private var tituloParaEdicao: Titulo? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCadastroTituloBinding.inflate(layoutInflater)
        setContentView(binding.root)

        tituloParaEdicao = intent.getSerializableExtra("TITULO") as? Titulo

        setupToolbar()
        setupDatePickers()
        loadCategorias()
        
        if (tituloParaEdicao != null) {
            preencherCampos(tituloParaEdicao!!)
        }

        binding.btnSalvar.setOnClickListener {
            salvarTitulo()
        }
    }

    private fun setupToolbar() {
        setSupportActionBar(binding.toolbar)
        supportActionBar?.setDisplayHomeAsUpEnabled(true)
        binding.toolbar.setNavigationOnClickListener { finish() }
        
        if (tituloParaEdicao != null) {
            supportActionBar?.title = "Editar Título"
        }
    }

    private fun preencherCampos(titulo: Titulo) {
        binding.etDescricao.setText(titulo.descricao)
        binding.etValor.setText(titulo.valor.toString())
        
        if (titulo.tipo.equals("R", ignoreCase = true)) {
            binding.rbReceita.isChecked = true
        } else {
            binding.rbDespesa.isChecked = true
        }
        
        binding.switchStatus.isChecked = titulo.status.equals("PAGO", ignoreCase = true)
        
        val formatsToTry = arrayOf(
            isoFormat,
            SimpleDateFormat("yyyy-MM-dd", Locale.US),
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss", Locale.US)
        )

        try {
            titulo.dataEmissao.let { dateStr ->
                var parsedDate: Date? = null
                for (format in formatsToTry) {
                    try {
                        parsedDate = format.parse(dateStr)
                        if (parsedDate != null) break
                    } catch (e: Exception) {}
                }
                parsedDate?.let {
                    dataEmissao.time = it
                    updateDateDisplay(binding.etDataEmissao, dataEmissao)
                }
            }
            
            titulo.dataVencimento.let { dateStr ->
                var parsedDate: Date? = null
                for (format in formatsToTry) {
                    try {
                        parsedDate = format.parse(dateStr)
                        if (parsedDate != null) break
                    } catch (e: Exception) {}
                }
                parsedDate?.let {
                    dataVencimento.time = it
                    updateDateDisplay(binding.etDataVencimento, dataVencimento)
                }
            }
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun setupDatePickers() {
        updateDateDisplay(binding.etDataEmissao, dataEmissao)
        updateDateDisplay(binding.etDataVencimento, dataVencimento)

        binding.etDataEmissao.setOnClickListener {
            showDatePicker(dataEmissao) {
                updateDateDisplay(binding.etDataEmissao, dataEmissao)
            }
        }

        binding.etDataVencimento.setOnClickListener {
            showDatePicker(dataVencimento) {
                updateDateDisplay(binding.etDataVencimento, dataVencimento)
            }
        }
    }

    private fun showDatePicker(calendar: Calendar, onDateSet: () -> Unit) {
        DatePickerDialog(
            this,
            { _, year, month, dayOfMonth ->
                calendar.set(Calendar.YEAR, year)
                calendar.set(Calendar.MONTH, month)
                calendar.set(Calendar.DAY_OF_MONTH, dayOfMonth)
                onDateSet()
            },
            calendar.get(Calendar.YEAR),
            calendar.get(Calendar.MONTH),
            calendar.get(Calendar.DAY_OF_MONTH)
        ).show()
    }

    private fun updateDateDisplay(editText: android.widget.EditText, calendar: Calendar) {
        editText.setText(displayFormat.format(calendar.time))
    }

    private fun loadCategorias() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                categorias = apiService.getCategorias()
                val adapter = ArrayAdapter(
                    this@CadastroTituloActivity,
                    android.R.layout.simple_spinner_item,
                    categorias
                )
                adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item)
                binding.spinnerCategoria.adapter = adapter
                
                // Selecionar categoria se for edição
                tituloParaEdicao?.let { titulo ->
                    val index = categorias.indexOfFirst { it.id == titulo.idCategoria }
                    if (index != -1) {
                        binding.spinnerCategoria.setSelection(index)
                    }
                }
            } catch (e: Exception) {
                Toast.makeText(this@CadastroTituloActivity, "Erro ao carregar categorias", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun salvarTitulo() {
        val descricao = binding.etDescricao.text.toString()
        val valorStr = binding.etValor.text.toString()
        
        if (descricao.isEmpty() || valorStr.isEmpty()) {
            Toast.makeText(this, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
            return
        }

        val valor = valorStr.replace(",", ".").toDoubleOrNull() ?: 0.0
        val tipo = if (binding.rbReceita.isChecked) "R" else "P"
        val status = if (binding.switchStatus.isChecked) "PAGO" else "ABERTO"
        
        val selectedCategoria = binding.spinnerCategoria.selectedItem as? Categoria
        if (selectedCategoria == null) {
            Toast.makeText(this, "Selecione uma categoria", Toast.LENGTH_SHORT).show()
            return
        }

        val request = TituloRequest(
            tipo = tipo,
            descricao = descricao,
            idCategoria = selectedCategoria.id,
            dataEmissao = isoFormat.format(dataEmissao.time),
            dataVencimento = isoFormat.format(dataVencimento.time),
            valor = valor,
            status = status
        )

        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = if (tituloParaEdicao == null) {
                    apiService.createTitulo(request)
                } else {
                    apiService.updateTitulo(tituloParaEdicao!!.id, request)
                }

                if (response.isSuccessful) {
                    val msg = if (tituloParaEdicao == null) "Título salvo!" else "Título atualizado!"
                    Toast.makeText(this@CadastroTituloActivity, msg, Toast.LENGTH_SHORT).show()
                    setResult(RESULT_OK)
                    finish()
                } else {
                    Toast.makeText(this@CadastroTituloActivity, "Erro: ${response.code()}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@CadastroTituloActivity, "Erro de conexão: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
