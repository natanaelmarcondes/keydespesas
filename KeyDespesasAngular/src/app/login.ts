import { Component, inject, signal } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Router } from '@angular/router';
import { Auth } from './core/auth';
@Component({
  selector: 'app-login',
  imports: [FormField],
  template: ` <main class="login-page">
    <section class="login-story">
      <a class="brand" href="/login"
        ><span class="brand-symbol" aria-hidden="true">K</span> Key<span>Despesas</span></a
      >
      <div>
        <span class="eyebrow">SEU DINHEIRO, COM CLAREZA</span>
        <h1>Mais controle.<br />Mais tranquilidade.</h1>
        <p>Organize suas despesas e receitas e acompanhe cada detalhe da sua vida financeira.</p>
        <div class="story-card">
          <span>Uma visão completa do seu mês</span>
          <div class="illustration-bars" aria-hidden="true">
            <i></i><i></i><i></i><i></i><i></i><i></i><i></i>
          </div>
          <small>Planeje hoje. Conquiste amanhã.</small>
        </div>
      </div>
      <small>KeyDespesas · Seu controle financeiro pessoal</small>
    </section>
    <section class="login-form-panel">
      <form (submit)="login($event)">
        <span class="eyebrow">BEM-VINDO DE VOLTA</span>
        <h2>Acesse sua conta</h2>
        <p>Seu próximo passo para uma vida financeira organizada.</p>
        <label for="email">E-mail</label
        ><input id="email" type="email" autocomplete="username" [formField]="fields.email" />
        <label for="password">Senha</label>
        <div class="password-field">
          <input
            id="password"
            [type]="showPassword() ? 'text' : 'password'"
            autocomplete="current-password"
            [formField]="fields.password"
          /><button
            type="button"
            (click)="showPassword.set(!showPassword())"
            [attr.aria-pressed]="showPassword()"
          >
            {{ showPassword() ? 'Ocultar' : 'Mostrar' }}
          </button>
        </div>
        @if (error()) {
          <p class="error" role="alert">{{ error() }}</p>
        }
        <button class="primary login-submit" type="submit">
          Entrar na minha conta <span aria-hidden="true">&#8594;</span>
        </button>
        <small class="login-note">Ambiente seguro · Versão 0.0.0</small>
      </form>
    </section>
  </main>`,
})
export class Login {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  readonly model = signal({ email: 'natanaelmarcondes@gmail.com', password: '' });
  readonly fields = form(this.model, (p) => {
    required(p.email);
    required(p.password);
  });
  readonly showPassword = signal(false);
  readonly error = signal('');
  login(event: Event): void {
    event.preventDefault();
    const { email, password } = this.model();
    if (this.auth.login(email, password)) void this.router.navigateByUrl('/');
    else this.error.set('E-mail ou senha incorretos. Confira os dados e tente novamente.');
  }
}
