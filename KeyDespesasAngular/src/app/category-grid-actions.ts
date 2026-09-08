import { Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Categoria } from './core/api';

export interface CategoryActions {
  details: (category: Categoria) => void;
}

@Component({
  selector: 'app-category-grid-actions',
  template: `@if (category(); as item) {
    <div class="grid-actions">
      <button
        type="button"
        (click)="actions?.details(item)"
        [attr.aria-label]="'Ver detalhes de ' + item.nome"
      >
        Ver detalhes
      </button>
    </div>
  }`,
})
export class CategoryGridActions implements ICellRendererAngularComp {
  readonly category = signal<Categoria | undefined>(undefined);
  actions?: CategoryActions;

  agInit(params: ICellRendererParams<Categoria, unknown, CategoryActions>): void {
    this.category.set(params.data);
    this.actions = params.context;
  }

  refresh(params: ICellRendererParams<Categoria, unknown, CategoryActions>): boolean {
    this.agInit(params);
    return true;
  }
}
