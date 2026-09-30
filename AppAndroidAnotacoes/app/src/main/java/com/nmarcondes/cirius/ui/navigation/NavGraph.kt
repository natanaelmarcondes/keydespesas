package com.nmarcondes.cirius.ui.navigation

import androidx.compose.runtime.Composable
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.nmarcondes.cirius.ui.screens.AddEditNoteScreen
import com.nmarcondes.cirius.ui.screens.HomeScreen
import com.nmarcondes.cirius.ui.viewmodel.AnotacoesViewModel

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object AddEditNote : Screen("add_edit?noteId={noteId}") {
        fun createRoute(noteId: Long? = null): String {
            return if (noteId != null && noteId > 0) {
                "add_edit?noteId=$noteId"
            } else {
                "add_edit?noteId=-1"
            }
        }
    }
}

@Composable
fun CiriusNavGraph(
    navController: NavHostController = rememberNavController(),
    viewModel: AnotacoesViewModel = viewModel()
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route
    ) {
        composable(route = Screen.Home.route) {
            HomeScreen(
                viewModel = viewModel,
                onAddNoteClick = {
                    navController.navigate(Screen.AddEditNote.createRoute(null))
                },
                onEditNoteClick = { id ->
                    navController.navigate(Screen.AddEditNote.createRoute(id))
                }
            )
        }

        composable(
            route = Screen.AddEditNote.route,
            arguments = listOf(
                navArgument("noteId") {
                    type = NavType.LongType
                    defaultValue = -1L
                }
            )
        ) { backStackEntry ->
            val noteId = backStackEntry.arguments?.getLong("noteId")
            val validNoteId = if (noteId != null && noteId > 0) noteId else null

            AddEditNoteScreen(
                noteId = validNoteId,
                viewModel = viewModel,
                onNavigateBack = {
                    navController.popBackStack()
                }
            )
        }
    }
}
