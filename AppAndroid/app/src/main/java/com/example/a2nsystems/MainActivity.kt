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

class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val adapter = TituloAdapter { 
        Toast.makeText(this, "Atualizando dados...", Toast.LENGTH_SHORT).show()
        fetchTitulos() 
    }
    
    private var currentYear = 2026
    private var currentMonth = 2

    private val apiService by lazy {
        Retrofit.Builder()
            .baseUrl("https://keysolution.com.br/")
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // Recebe o período do Dashboard se disponível
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
        binding.btnAnterior.setOnClickListener {
            if (currentMonth == 1) {
                currentMonth = 12
                currentYear--
            } else {
                currentMonth--
            }
            updatePeriodoText()
            fetchTitulos()
        }

        binding.btnProximo.setOnClickListener {
            if (currentMonth == 12) {
                currentMonth = 1
                currentYear++
            } else {
                currentMonth++
            }
            updatePeriodoText()
            fetchTitulos()
        }
    }

    private fun updatePeriodoText() {
        val meses = arrayOf(
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        )
        binding.tvPeriodo.text = "${meses[currentMonth - 1]} / $currentYear"
    }

    private fun fetchTitulos() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val titulos = apiService.getTitulos(currentYear, currentMonth)
                adapter.submitList(titulos)
                if (titulos.isEmpty()) {
                    Toast.makeText(this@MainActivity, "Nenhum título encontrado para este período", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                Toast.makeText(this@MainActivity, "Erro ao carregar dados: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }
}
