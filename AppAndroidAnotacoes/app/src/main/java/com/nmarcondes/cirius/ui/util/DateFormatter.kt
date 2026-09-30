package com.nmarcondes.cirius.ui.util

import java.time.LocalDateTime
import java.time.format.DateTimeFormatter
import java.util.Locale

object DateFormatter {
    fun formatIsoDate(dateString: String?): String {
        if (dateString.isNullOrEmpty()) return ""
        return try {
            if (dateString.contains("T")) {
                val cleanDate = dateString.split(".")[0]
                val ldt = LocalDateTime.parse(cleanDate)
                ldt.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm", Locale.getDefault()))
            } else {
                dateString
            }
        } catch (_: Exception) {
            dateString
        }
    }
}
