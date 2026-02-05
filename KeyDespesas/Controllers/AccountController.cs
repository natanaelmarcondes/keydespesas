using Microsoft.AspNetCore.Mvc;

namespace KeyDespesas.Controllers
{
    public class AccountController : Controller
    {
        [HttpGet]
        public IActionResult Login()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Login(string email, string senha)
        {
            // Email fixo (por enquanto)
            var emailFixo = "natanaelmarcondes@gmail.com";

            // Senha fixa (por enquanto)
            if (string.Equals(email?.Trim(), emailFixo, StringComparison.OrdinalIgnoreCase) &&
                (senha?.Trim() == "102030"))
            {
                // Por enquanto sem autenticação real, só redireciona
                return RedirectToAction("Index", "Home");
            }

            TempData["LoginErro"] = "Senha inválida.";
            return RedirectToAction("Login");
        }
    }
}
