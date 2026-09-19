package com.example.a2nsystems

import android.os.Bundle
import android.view.Gravity
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.a2nsystems.databinding.ActivityCategoriasBinding
import com.example.a2nsystems.databinding.ItemCategoriaBinding
import com.google.android.material.dialog.MaterialAlertDialogBuilder
import kotlinx.coroutines.launch
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class CategoriasActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCategoriasBinding
    private var editandoId: Int? = null

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
        binding = ActivityCategoriasBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupUI()
        fetchCategorias()
    }

    private fun setupUI() {
        binding.toolbar.setNavigationOnClickListener { finish() }
        binding.rvCategorias.layoutManager = LinearLayoutManager(this)

        binding.btnSaveCategoria.setOnClickListener {
            val nome = binding.etCategoriaNome.text.toString().trim()
            if (nome.isNotEmpty()) {
                if (editandoId == null) {
                    salvarCategoria(nome)
                } else {
                    atualizarCategoria(editandoId!!, nome)
                }
            }
        }
    }

    private fun fetchCategorias() {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val categorias = apiService.getCategorias()
                binding.rvCategorias.adapter = CategoriaAdapter(
                    categorias,
                    onEdit = { cat -> preencherParaEdicao(cat) },
                    onDelete = { cat -> confirmarExclusao(cat) }
                )
            } catch (e: Exception) {
                showCustomToast("Erro ao carregar: ${e.message}")
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun salvarCategoria(nome: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.createCategoria(CategoriaRequest(nome))
                if (response.isSuccessful) {
                    showCustomToast("Categoria salva!")
                    binding.etCategoriaNome.setText("")
                    fetchCategorias()
                }
            } catch (e: Exception) {
                showCustomToast("Erro: ${e.message}")
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun preencherParaEdicao(categoria: Categoria) {
        editandoId = categoria.id
        binding.etCategoriaNome.setText(categoria.nome)
        binding.tilCategoria.hint = "Editando Categoria"
        binding.btnSaveCategoria.setImageResource(android.R.drawable.ic_menu_save)
    }

    private fun atualizarCategoria(id: Int, nome: String) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.updateCategoria(id, CategoriaRequest(nome))
                if (response.isSuccessful) {
                    showCustomToast("Categoria atualizada!")
                    limparEdicao()
                    fetchCategorias()
                }
            } catch (e: Exception) {
                showCustomToast("Erro: ${e.message}")
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun limparEdicao() {
        editandoId = null
        binding.etCategoriaNome.setText("")
        binding.tilCategoria.hint = "Nova Categoria"
        binding.btnSaveCategoria.setImageResource(R.drawable.ic_add_custom)
    }

    private fun confirmarExclusao(categoria: Categoria) {
        val dialog = MaterialAlertDialogBuilder(this)
            .setTitle("Excluir Categoria")
            .setMessage("Deseja realmente excluir '${categoria.nome}'?")
            .setPositiveButton("Sim") { _, _ -> excluirCategoria(categoria.id) }
            .setNegativeButton("Não", null)
            .show()
        dialog.findViewById<TextView>(android.R.id.message)?.gravity = Gravity.CENTER
    }

    private fun excluirCategoria(id: Int) {
        binding.progressBar.visibility = View.VISIBLE
        lifecycleScope.launch {
            try {
                val response = apiService.deleteCategoria(id)
                if (response.isSuccessful) {
                    showCustomToast("Excluída com sucesso!")
                    fetchCategorias()
                }
            } catch (e: Exception) {
                showCustomToast("Erro: ${e.message}")
            } finally {
                binding.progressBar.visibility = View.GONE
            }
        }
    }

    private fun showCustomToast(message: String) {
        val layout = layoutInflater.inflate(R.layout.layout_custom_toast, null)
        val text: TextView = layout.findViewById(R.id.tvToast)
        text.text = message
        with(Toast(applicationContext)) {
            setGravity(Gravity.CENTER, 0, 0)
            duration = Toast.LENGTH_SHORT
            view = layout
            show()
        }
    }

    inner class CategoriaAdapter(
        private val list: List<Categoria>,
        private val onEdit: (Categoria) -> Unit,
        private val onDelete: (Categoria) -> Unit
    ) : RecyclerView.Adapter<CategoriaAdapter.ViewHolder>() {

        inner class ViewHolder(val binding: ItemCategoriaBinding) : RecyclerView.ViewHolder(binding.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
            val b = ItemCategoriaBinding.inflate(LayoutInflater.from(parent.context), parent, false)
            return ViewHolder(b)
        }

        override fun onBindViewHolder(holder: ViewHolder, position: Int) {
            val cat = list[position]
            holder.binding.tvNome.text = cat.nome
            holder.binding.btnEdit.setOnClickListener { onEdit(cat) }
            holder.binding.btnDelete.setOnClickListener { onDelete(cat) }
        }

        override fun getItemCount() = list.size
    }
}