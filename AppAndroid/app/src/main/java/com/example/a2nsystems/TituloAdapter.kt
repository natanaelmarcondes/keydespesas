package com.example.a2nsystems

import android.graphics.Color
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.a2nsystems.databinding.ItemTituloBinding
import java.text.NumberFormat
import java.util.Locale

class TituloAdapter(
    private val onLongClick: () -> Unit
) : ListAdapter<Titulo, TituloAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTituloBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onLongClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemTituloBinding,
        private val onLongClick: () -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        
        init {
            binding.root.setOnLongClickListener {
                onLongClick()
                true
            }
        }

        fun bind(titulo: Titulo) {
            val context = binding.root.context
            binding.tvDescricao.text = titulo.descricao
            binding.tvCategoria.text = titulo.categoriaNome
            binding.tvStatus.text = titulo.status.uppercase()
            
            // Status: Badge style colors
            if (titulo.status.equals("PAGO", ignoreCase = true)) {
                binding.tvStatus.setBackgroundColor(ContextCompat.getColor(context, R.color.bs_success))
            } else {
                binding.tvStatus.setBackgroundColor(ContextCompat.getColor(context, R.color.orange_secondary))
            }

            // Formatação do valor colorido por inteiro
            val ptBr = Locale("pt", "BR")
            val format = NumberFormat.getCurrencyInstance(ptBr)
            val valorFormatado = format.format(titulo.valor)
            
            val isReceita = titulo.tipo.equals("R", ignoreCase = true)
            val sinal = if (isReceita) "+" else "-"
            val fullText = "$sinal $valorFormatado"
            
            val colorValor = if (isReceita) ContextCompat.getColor(context, R.color.bs_success) else ContextCompat.getColor(context, R.color.bs_danger)
            
            binding.tvValor.text = fullText
            binding.tvValor.setTextColor(colorValor)
            
            // Formatação de data
            val dataVenc = titulo.dataVencimento.split("T")[0].split("-")
            if (dataVenc.size == 3) {
                binding.tvVencimento.text = "Vencimento: ${dataVenc[2]}/${dataVenc[1]}/${dataVenc[0]}"
            } else {
                binding.tvVencimento.text = "Vencimento: ${titulo.dataVencimento}"
            }
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<Titulo>() {
        override fun areItemsTheSame(oldItem: Titulo, newItem: Titulo) = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: Titulo, newItem: Titulo) = oldItem == newItem
    }
}
