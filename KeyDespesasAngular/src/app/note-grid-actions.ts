import { Component, signal } from '@angular/core';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { Anotacao } from './core/notes-api';

export interface NoteActions {
  edit: (note: Anotacao) => void;
  toggle: (note: Anotacao) => void;
  remove: (note: Anotacao) => void;
  busy: () => boolean;
}

@Component({
  selector: 'app-note-grid-actions',
  template: `@if (note(); as item) {
    <div class="grid-actions">
      <button
        type="button"
        (click)="actions?.edit(item)"
        [disabled]="actions?.busy()"
        [attr.aria-label]="'Editar ' + item.titulo"
      >
        Editar
      </button>
      <button
        type="button"
        (click)="actions?.toggle(item)"
        [disabled]="actions?.busy()"
        [attr.aria-label]="(item.arquivada ? 'Restaurar ' : 'Arquivar ') + item.titulo"
      >
        {{ item.arquivada ? 'Restaurar' : 'Arquivar' }}
      </button>
      <button
        type="button"
        class="danger-text"
        (click)="actions?.remove(item)"
        [disabled]="actions?.busy()"
        [attr.aria-label]="'Excluir ' + item.titulo"
      >
        Excluir
      </button>
    </div>
  }`,
})
export class NoteGridActions implements ICellRendererAngularComp {
  readonly note = signal<Anotacao | undefined>(undefined);
  actions?: NoteActions;
  agInit(params: ICellRendererParams<Anotacao, unknown, NoteActions>): void {
    this.note.set(params.data);
    this.actions = params.context;
  }
  refresh(params: ICellRendererParams<Anotacao, unknown, NoteActions>): boolean {
    this.agInit(params);
    return true;
  }
}
