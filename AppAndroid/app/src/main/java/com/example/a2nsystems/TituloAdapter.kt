package com.example.a2nsystems

import android.graphics.Color
import android.text.Spannable
import android.text.SpannableString
import android.text.style.ForegroundColorSpan
import android.view.LayoutInflater
import android.view.ViewGroup
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
            binding.tvDescricao.text = titulo.descricao
            binding.tvCategoria.text = titulo.categoriaNome
            binding.tvStatus.text = titulo.status
            
            // Status: Verde se PAGO, Vermelho caso contrário
            if (titulo.status.equals("PAGO", ignoreCase = true)) {
                binding.tvStatus.setTextColor(Color.parseColor("#388E3C"))
            } else {
                binding.tvStatus.setTextColor(Color.RED)
            }

            // Formatação do valor com sinal colorido
            val ptBr = Locale("pt", "BR")
            val format = NumberFormat.getCurrencyInstance(ptBr)
            val valorFormatado = format.format(titulo.valor)
            
            val isReceita = titulo.tipo.equals("R", ignoreCase = true)
            val sinal = if (isReceita) "+" else "-"
            val fullText = "$sinal $valorFormatado"
            
            val spannable = SpannableString(fullText)
            val colorSinal = if (isReceita) Color.parseColor("#388E3C") else Color.RED
            
            // Define a cor apenas para o sinal (primeiro caractere)
            spannable.setSpan(
                ForegroundColorSpan(colorSinal),
                0, 1,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            
            // Define a cor BRANCA para o restante do valor conforme solicitado
            spannable.setSpan(
                ForegroundColorSpan(Color.WHITE),
                1, fullText.length,
                Spannable.SPAN_EXCLUSIVE_EXCLUSIVE
            )
            
            binding.tvValor.text = spannable
            
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
