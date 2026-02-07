package com.example.a2nsystems

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.a2nsystems.databinding.ActivityMainBinding
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.NumberFormat
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val adapter = TituloAdapter { 
        Toast.makeText(this, "Atualizando dados...", Toast.LENGTH_SHORT).show()
        fetchTitulos() 
    }
    
    private var currentYear = 2026
    private var currentMonth = 2
    private var todosTitulos: List<Titulo> = emptyList()

    private val apiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://api.keysolution.com.br/")
            .client(UnsafeOkHttpClient.getUnsafeOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        currentYear = intent.getIntExtra("EXTRA_ANO", 2026)
        currentMonth = intent.getIntExtra("EXTRA_MES", 2)

        setupRecyclerView()
        setupListeners()
        updatePeriodoText()
        fetchTitulos()
    }

    private fun setupRecyclerView() {
        binding.rvTitulos.layoutManager = LinearLayoutManager(this)
        binding.rvTitulos.adapter = adapter
    }

    private fun setupListeners() {
        binding.btnVoltar.setOnClickListener { finish() }
        binding.btnRecarregar.setOnClickListener { fetchTitulos() }

        binding.btnAnterior.setOnClickListener {
            if (currentMonth == 1) { currentMonth = 12; currentYear-- } else { currentMonth-- }
            updatePeriodoText()
            fetchTitulos()
        }

        binding.btnProximo.setOnClickListener {
            if (currentMonth == 12) { currentMonth = 1; currentYear++ } else { currentMonth++ }
            updatePeriodoText()
            fetchTitulos()
        }

        binding.swMostrarReceitas.setOnCheckedChangeListener { _, _ ->
            aplicarFiltro()
        }
    }

    private fun updatePeriodoText() {
        val meses = arrayOf("Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro")
        binding.tvPeriodo.text = "${meses[currentMonth - 1]} / $currentYear"
    }

    private fun fetchTitulos() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                todosTitulos = apiService.getTitulos(currentYear, currentMonth)
                atualizarResumoTotais()
                aplicarFiltro()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun aplicarFiltro() {
        val mostrarReceitas = binding.swMostrarReceitas.isChecked
        val listaFiltrada = if (mostrarReceitas) {
            todosTitulos
        } else {
            todosTitulos.filter { it.tipo.equals("P", ignoreCase = true) }
        }
        adapter.submitList(listaFiltrada)
        
        if (listaFiltrada.isEmpty()) {
            Toast.makeText(this, "Nenhum registro para exibir", Toast.LENGTH_SHORT).show()
        }
    }

    private fun atualizarResumoTotais() {
        val totalReceitas = todosTitulos.filter { it.tipo == "R" }.sumOf { it.valor }
        val totalDespesas = todosTitulos.filter { it.tipo == "P" }.sumOf { it.valor }
        val totalReceitasPago = todosTitulos.filter { it.tipo == "R" && it.status.equals("PAGO", true) }.sumOf { it.valor }
        val totalDespesasPago = todosTitulos.filter { it.tipo == "P" && it.status.equals("PAGO", true) }.sumOf { it.valor }
        
        val ptBr = Locale("pt", "BR")
        val format = NumberFormat.getCurrencyInstance(ptBr)

        binding.tvTotalReceitas.text = format.format(totalReceitas)
        binding.tvTotalDespesas.text = format.format(totalDespesas)
        binding.tvTotalReceitasPago.text = format.format(totalReceitasPago)
        binding.tvTotalDespesasPago.text = format.format(totalDespesasPago)
    }
}
