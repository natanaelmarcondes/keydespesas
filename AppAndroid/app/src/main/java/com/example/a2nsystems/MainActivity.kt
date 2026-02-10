package com.example.a2nsystems

import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.a2nsystems.databinding.ActivityMainBinding
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.NumberFormat
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    
    private val adapter = TituloAdapter(
        onStatusClick = { titulo ->
            confirmarAlteracaoStatus(titulo)
        },
        onLongClick = {
            Toast.makeText(this, "Atualizando dados...", Toast.LENGTH_SHORT).show()
            fetchTitulos()
        }
    )
    
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

        // Definindo data padrão (pode ser a atual, mantendo 02/2026 conforme solicitado anteriormente)
        currentYear = 2026
        currentMonth = 2

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

        binding.tabLayout.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                aplicarFiltro()
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
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
                Toast.makeText(this@MainActivity, "Erro ao carregar: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun confirmarAlteracaoStatus(titulo: Titulo) {
        val novoStatus = if (titulo.status.equals("PAGO", true)) "ABERTO" else "PAGO"
        
        AlertDialog.Builder(this)
            .setTitle("Confirmar Alteração")
            .setMessage("Deseja alterar o status de '${titulo.descricao}' para $novoStatus?")
            .setPositiveButton("Sim") { _, _ ->
                toggleStatus(titulo)
            }
            .setNegativeButton("Não", null)
            .show()
    }

    private fun toggleStatus(titulo: Titulo) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.togglePago(titulo.id)
                if (response.isSuccessful) {
                    Toast.makeText(this@MainActivity, "Status atualizado!", Toast.LENGTH_SHORT).show()
                    fetchTitulos()
                } else {
                    Toast.makeText(this@MainActivity, "Erro ao atualizar status", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun aplicarFiltro() {
        val selectedTabPosition = binding.tabLayout.selectedTabPosition
        val listaFiltrada = when (selectedTabPosition) {
            1 -> todosTitulos.filter { it.tipo.equals("R", ignoreCase = true) } // Receitas
            2 -> todosTitulos.filter { it.tipo.equals("P", ignoreCase = true) } // Despesas
            else -> todosTitulos // Todas
        }
        adapter.submitList(listaFiltrada)
        
        if (listaFiltrada.isEmpty() && todosTitulos.isNotEmpty()) {
            Toast.makeText(this, "Nenhum registro nesta categoria", Toast.LENGTH_SHORT).show()
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
