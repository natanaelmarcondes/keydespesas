import { Component, inject, input, output } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'aside[app-sidebar]',
  imports: [RouterLink],
  host: { class: 'sidebar' },
  template: `
    <a class="brand" routerLink="/">
      <span class="brand-symbol" aria-hidden="true">K</span> Key<span>Despesas</span>
    </a>
    <nav aria-label="Menu principal">
      <button
        type="button"
        (click)="select('titles')"
        [class.active]="active() === 'titles'"
        [attr.aria-current]="active() === 'titles' ? 'page' : null"
      >
        <span aria-hidden="true">&#9638;</span> Visão geral
      </button>
      <button
        type="button"
        (click)="select('categories')"
        [class.active]="active() === 'categories'"
        [attr.aria-current]="active() === 'categories' ? 'page' : null"
      >
        <span aria-hidden="true">&#9636;</span> Categorias
      </button>
      <button
        type="button"
        routerLink="/anotacoes"
        [class.active]="active() === 'notes'"
        [attr.aria-current]="active() === 'notes' ? 'page' : null"
      >
        <span aria-hidden="true">&#9998;</span> Anotações
      </button>
    </nav>
    <div class="sidebar-user">
      <span class="avatar">NM</span>
      <div><strong>Natanael</strong><small>Conta pessoal</small></div>
    </div>
  `,
})
export class Sidebar {
  private readonly router = inject(Router);
  readonly active = input.required<'titles' | 'categories' | 'notes'>();
  readonly pageSelected = output<'titles' | 'categories'>();

  select(page: 'titles' | 'categories'): void {
    if (this.active() === 'notes') {
      void this.router.navigate(['/'], { queryParams: page === 'categories' ? { page } : {} });
    } else {
      this.pageSelected.emit(page);
    }
  }
}
