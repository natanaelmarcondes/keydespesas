package com.example.a2nsystems

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.a2nsystems.databinding.ActivityDashboardBinding
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.text.NumberFormat
import java.util.Locale

class DashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityDashboardBinding
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
        binding = ActivityDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        updatePeriodoText()
        fetchResumo()
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
            fetchResumo()
        }

        binding.btnProximo.setOnClickListener {
            if (currentMonth == 12) {
                currentMonth = 1
                currentYear++
            } else {
                currentMonth++
            }
            updatePeriodoText()
            fetchResumo()
        }

        binding.btnVerDetalhes.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java).apply {
                putExtra("EXTRA_ANO", currentYear)
                putExtra("EXTRA_MES", currentMonth)
            }
            startActivity(intent)
        }
    }

    private fun updatePeriodoText() {
        val meses = arrayOf(
            "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
            "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
        )
        binding.tvPeriodo.text = "${meses[currentMonth - 1]} / $currentYear"
    }

    private fun fetchResumo() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val resumo = apiService.getResumoMes(currentYear, currentMonth)
                displayResumo(resumo)
            } catch (e: Exception) {
                Toast.makeText(this@DashboardActivity, "Erro ao carregar resumo: ${e.message}", Toast.LENGTH_LONG).show()
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun displayResumo(resumo: ResumoMes) {
        val ptBr = Locale("pt", "BR")
        val format = NumberFormat.getCurrencyInstance(ptBr)
        
        binding.tvTotal.text = format.format(resumo.total)
        binding.tvTotalPago.text = format.format(resumo.totalPago)
        binding.tvTotalAberto.text = format.format(resumo.totalAberto)
    }
}
