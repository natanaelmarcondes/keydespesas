package com.example.a2nsystems

import android.graphics.Color
import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.a2nsystems.databinding.ItemTituloBinding
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

class TituloAdapter(
    private val onStatusClick: (Titulo) -> Unit,
    private val onLongClick: () -> Unit
) : ListAdapter<Titulo, TituloAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemTituloBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding, onStatusClick, onLongClick)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    class ViewHolder(
        private val binding: ItemTituloBinding,
        private val onStatusClick: (Titulo) -> Unit,
        private val onLongClick: () -> Unit
    ) : RecyclerView.ViewHolder(binding.root) {
        
        private var currentTitulo: Titulo? = null

        init {
            binding.root.setOnLongClickListener {
                onLongClick()
                true
            }
            binding.cardStatus.setOnClickListener {
                currentTitulo?.let { onStatusClick(it) }
            }
        }

        fun bind(titulo: Titulo) {
            currentTitulo = titulo
            val context = binding.root.context
            binding.tvDescricao.text = titulo.descricao
            binding.tvCategoria.text = titulo.categoriaNome
            
            val sdf = SimpleDateFormat("yyyy-MM-dd", Locale.US)
            val dataVencimentoStr = titulo.dataVencimento.split("T")[0]
            val dataVencimentoDate = try { sdf.parse(dataVencimentoStr) } catch (e: Exception) { null }
            
            val calendarHoje = Calendar.getInstance()
            calendarHoje.set(Calendar.HOUR_OF_DAY, 0)
            calendarHoje.set(Calendar.MINUTE, 0)
            calendarHoje.set(Calendar.SECOND, 0)
            calendarHoje.set(Calendar.MILLISECOND, 0)
            
            val isVencido = dataVencimentoDate != null && 
                            dataVencimentoDate.before(calendarHoje.time) && 
                            !titulo.status.equals("PAGO", true)

            val statusExibicao = if (isVencido) "VENCIDO" else titulo.status.uppercase()
            binding.tvStatus.text = statusExibicao
            
            // Lógica de Status com ícone e cores (Mini Card)
            val colorStatus = when {
                titulo.status.equals("PAGO", true) -> {
                    binding.ivStatusIcon.setImageResource(android.R.drawable.checkbox_on_background)
                    ContextCompat.getColor(context, R.color.bs_success)
                }
                isVencido || titulo.status.equals("VENCIDO", true) -> {
                    binding.ivStatusIcon.setImageResource(android.R.drawable.ic_dialog_alert)
                    ContextCompat.getColor(context, R.color.bs_danger)
                }
                else -> { // ABERTO ou outros
                    binding.ivStatusIcon.setImageResource(android.R.drawable.ic_menu_recent_history)
                    ContextCompat.getColor(context, R.color.orange_primary)
                }
            }
            
            binding.cardStatus.setStrokeColor(colorStatus)
            binding.tvStatus.setTextColor(colorStatus)
            binding.ivStatusIcon.setColorFilter(colorStatus)

            // Formatação do valor colorido por inteiro
            val ptBr = Locale("pt", "BR")
            val format = NumberFormat.getCurrencyInstance(ptBr)
            val valorFormatado = format.format(titulo.valor)
            
            val isReceita = titulo.tipo.equals("R", ignoreCase = true)
            val sinal = if (isReceita) "+" else "-"
            val fullText = "$sinal $valorFormatado"
            
            val colorValor = if (isReceita) ContextCompat.getColor(context, R.color.bs_success) else ContextCompat.getColor(context, R.color.white)
            
            binding.tvValor.text = fullText
            binding.tvValor.setTextColor(colorValor)
            
            // Formatação de data
            val dataVencParts = dataVencimentoStr.split("-")
            if (dataVencParts.size == 3) {
                binding.tvVencimento.text = "Vencimento: ${dataVencParts[2]}/${dataVencParts[1]}/${dataVencParts[0]}"
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
