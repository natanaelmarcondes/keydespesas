package com.example.a2nsystems

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.a2nsystems.databinding.ActivityMainBinding
import com.google.android.material.tabs.TabLayout
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.NumberFormat
import java.util.Calendar
import java.util.Locale

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    
    private val adapter = TituloAdapter(
        onStatusClick = { titulo ->
            confirmarAlteracaoStatus(titulo)
        },
        onItemClick = { titulo ->
            val intent = Intent(this, CadastroTituloActivity::class.java)
            intent.putExtra("TITULO", titulo)
            cadastroLauncher.launch(intent)
        },
        onDeleteClick = { titulo ->
            confirmarExclusao(titulo)
        },
        onLongClick = {
            // Removido o fetch manual no long click, agora usa SwipeRefresh
        }
    )
    
    private var currentYear = Calendar.getInstance().get(Calendar.YEAR)
    private var currentMonth = Calendar.getInstance().get(Calendar.MONTH) + 1
    private var todosTitulos: List<Titulo> = emptyList()

    private val cadastroLauncher = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        if (result.resultCode == RESULT_OK) {
            fetchTitulos()
        }
    }

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

        // Definindo data padrão como o mês atual
        val calendar = Calendar.getInstance()
        currentYear = calendar.get(Calendar.YEAR)
        currentMonth = calendar.get(Calendar.MONTH) + 1

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
        binding.swipeRefresh.setOnRefreshListener { fetchTitulos() }

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

        binding.tabLayoutStatus.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                aplicarFiltro()
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })

        binding.btnToggleFilters.setOnClickListener {
            if (binding.filtersContainer.visibility == View.VISIBLE) {
                binding.filtersContainer.visibility = View.GONE
                binding.btnToggleFilters.text = "Mostrar Filtros"
            } else {
                binding.filtersContainer.visibility = View.VISIBLE
                binding.btnToggleFilters.text = "Ocultar Filtros"
            }
        }

        binding.btnToggleTotals.setOnClickListener {
            if (binding.summaryCard.visibility == View.VISIBLE) {
                binding.summaryCard.visibility = View.GONE
                binding.btnToggleTotals.text = "Mostrar Totais"
            } else {
                binding.summaryCard.visibility = View.VISIBLE
                binding.btnToggleTotals.text = "Ocultar Totais"
            }
        }

        binding.fabAdd.setOnClickListener {
            val intent = Intent(this, CadastroTituloActivity::class.java)
            cadastroLauncher.launch(intent)
        }
    }

    private fun updatePeriodoText() {
        val meses = arrayOf("Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro")
        binding.tvPeriodo.text = "${meses[currentMonth - 1]} / $currentYear"
    }

    private fun fetchTitulos() {
        if (!binding.swipeRefresh.isRefreshing) {
            binding.progressBar.visibility = View.VISIBLE
        }
        lifecycleScope.launch {
            try {
                todosTitulos = apiService.getTitulos(currentYear, currentMonth)
                atualizarResumoTotais()
                aplicarFiltro()
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro ao carregar: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
                binding.swipeRefresh.isRefreshing = false
            }
        }
    }

    private fun confirmarAlteracaoStatus(titulo: Titulo) {
        val novoStatus = if (titulo.status.equals("PAGO", true)) "ABERTO" else "PAGO"
        
        MaterialAlertDialogBuilder(this)
            .setTitle("Confirmar Alteração")
            .setIcon(android.R.drawable.ic_menu_help)
            .setMessage("Deseja alterar o status para $novoStatus?\n\n${titulo.descricao}")
            .setPositiveButton("Sim") { _, _ ->
                toggleStatus(titulo)
            }
            .setNegativeButton("Não", null)
            .show()
    }

    private fun confirmarExclusao(titulo: Titulo) {
        MaterialAlertDialogBuilder(this)
            .setTitle("Excluir Título")
            .setIcon(android.R.drawable.ic_menu_help)
            .setMessage("Tem certeza que deseja excluir este registro?\n\n${titulo.descricao}")
            .setPositiveButton("Sim") { _, _ ->
                excluirTitulo(titulo)
            }
            .setNegativeButton("Não", null)
            .show()
    }

    private fun excluirTitulo(titulo: Titulo) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.deleteTitulo(titulo.id)
                if (response.isSuccessful) {
                    Toast.makeText(this@MainActivity, "Título excluído!", Toast.LENGTH_SHORT).show()
                    fetchTitulos()
                } else {
                    Toast.makeText(this@MainActivity, "Erro ao excluir", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro: ${e.message}", Toast.LENGTH_SHORT).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
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
        val tipoTabPosition = binding.tabLayout.selectedTabPosition
        val statusTabPosition = binding.tabLayoutStatus.selectedTabPosition

        var listaFiltrada = todosTitulos

        // Filtro por Tipo (Receitas/Despesas)
        listaFiltrada = when (tipoTabPosition) {
            1 -> listaFiltrada.filter { it.tipo.equals("R", ignoreCase = true) }
            2 -> listaFiltrada.filter { it.tipo.equals("P", ignoreCase = true) }
            else -> listaFiltrada
        }

        // Filtro por Status (Pagos/Abertos) - Invertido conforme solicitação
        listaFiltrada = when (statusTabPosition) {
            1 -> listaFiltrada.filter { it.status.equals("PAGO", ignoreCase = true) } // Pagos
            2 -> listaFiltrada.filter { !it.status.equals("PAGO", ignoreCase = true) } // Abertos
            else -> listaFiltrada
        }

        adapter.submitList(listaFiltrada)
        
        binding.emptyState.visibility = if (listaFiltrada.isEmpty()) View.VISIBLE else View.GONE
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
