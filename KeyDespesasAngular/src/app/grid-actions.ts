import { Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Titulo } from './core/api';

export function navigateActionButtons(event: KeyboardEvent): boolean {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  if (event.key === 'Enter' || event.key === ' ') return target instanceof HTMLButtonElement;
  if (event.key !== 'Tab') return false;
  const buttons = Array.from(
    target.closest('.ag-cell')?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [],
  );
  const index = buttons.findIndex((button) => button === target);
  const next =
    index < 0 ? (event.shiftKey ? buttons.length - 1 : 0) : index + (event.shiftKey ? -1 : 1);
  if (!buttons[next]) return false;
  event.preventDefault();
  buttons[next].focus();
  return true;
}

export interface TitleActions {
  copy: (title: Titulo) => void;
  edit: (title: Titulo) => void;
  toggle: (title: Titulo) => void;
  remove: (title: Titulo) => void;
}
@Component({
  selector: 'app-grid-actions',
  template: `@if (row(); as title) {
    <div class="grid-actions">
      <button
        type="button"
        (click)="actions?.edit(title)"
        [attr.aria-label]="'Editar ' + title.descricao"
      >
        Editar
      </button>
      <button
        type="button"
        [disabled]="title.status !== 'ABERTO' && title.status !== 'PAGO'"
        (click)="actions?.toggle(title)"
        [attr.aria-label]="(title.status === 'PAGO' ? 'Reabrir ' : 'Quitar ') + title.descricao"
      >
        {{ title.status === 'PAGO' ? 'Reabrir' : 'Quitar' }}
      </button>
      <button
        type="button"
        (click)="actions?.copy(title)"
        [attr.aria-label]="
          (title.tipo === 'R' ? 'Copiar receita ' : 'Copiar despesa ') + title.descricao
        "
      >
        Copiar
      </button>
      <button
        type="button"
        class="danger-text"
        (click)="actions?.remove(title)"
        [attr.aria-label]="'Excluir ' + title.descricao"
      >
        Excluir
      </button>
    </div>
  }`,
})
export class GridActions implements ICellRendererAngularComp {
  readonly row = signal<Titulo | undefined>(undefined);
  actions?: TitleActions;
  agInit(params: ICellRendererParams<Titulo, unknown, TitleActions>): void {
    this.row.set(params.data);
    this.actions = params.context;
  }
  refresh(params: ICellRendererParams<Titulo, unknown, TitleActions>): boolean {
    this.agInit(params);
    return true;
  }
}
