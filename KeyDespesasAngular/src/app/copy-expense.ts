import { Component, input, output, signal } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { form, FormField, required } from '@angular/forms/signals';
import { Titulo, TituloInput } from './core/api';
import { localDate } from './title-editor';

export function nextMonthDueDate(value: string): string {
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  const lastDay = new Date(year, month + 1, 0).getDate();
  return localDate(new Date(year, month, Math.min(day, lastDay)));
}

@Component({
  selector: 'app-copy-expense',
  imports: [FormField, CurrencyPipe],
  template: `
    <form (submit)="save($event)">
      <div class="modal-heading">
        <h2 id="copy-title">Copiar {{ source()?.tipo === 'R' ? 'receita' : 'despesa' }}</h2>
        <button type="button" aria-label="Fechar cópia" (click)="cancel.emit()" [disabled]="busy()">
          ×
        </button>
      </div>
      @if (source(); as expense) {
        <p>
          <strong>{{ expense.descricao }}</strong
          ><br />{{ expense.valor | currency: 'BRL' : 'symbol' : '1.2-2' : 'pt-BR' }}
        </p>
      }
      <p>
        A cópia manterá a descrição, categoria, valor e emissão do lançamento original, com situação
        em aberto.
      </p>
      <div class="form-grid">
        <label class="full"
          >Novo vencimento
          <input autofocus type="date" [formField]="fields.dueDate" />
        </label>
      </div>
      @if (invalid()) {
        <p class="error" role="alert">Informe uma data válida entre 2000 e 2100.</p>
      }
      @if (error()) {
        <p class="error" role="alert">{{ error() }}</p>
      }
      <div class="modal-footer">
        <button type="button" (click)="cancel.emit()" [disabled]="busy()">Cancelar</button>
        <button type="submit" class="primary" [disabled]="busy()">
          {{ busy() ? 'Copiando…' : source()?.tipo === 'R' ? 'Copiar receita' : 'Copiar despesa' }}
        </button>
      </div>
    </form>
  `,
})
export class CopyExpense {
  readonly busy = input(false);
  readonly error = input('');
  readonly saved = output<TituloInput>();
  readonly cancel = output();
  readonly source = signal<Titulo | null>(null);
  readonly model = signal({ dueDate: '' });
  readonly fields = form(this.model, (path) => required(path.dueDate));
  readonly invalid = signal(false);

  reset(expense: Titulo): void {
    this.source.set(expense);
    this.model.set({ dueDate: nextMonthDueDate(expense.dataVencimento) });
    this.invalid.set(false);
  }

  save(event: Event): void {
    event.preventDefault();
    const source = this.source();
    if (this.busy() || !source) return;
    const date = this.model().dueDate;
    const parsed = new Date(date + 'T12:00:00');
    if (
      this.fields().invalid() ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      !Number.isFinite(parsed.getTime()) ||
      localDate(parsed) !== date ||
      parsed.getFullYear() < 2000 ||
      parsed.getFullYear() > 2100
    ) {
      this.invalid.set(true);
      return;
    }
    this.saved.emit({
      tipo: source.tipo,
      descricao: source.descricao,
      idCategoria: source.idCategoria,
      valor: source.valor,
      dataEmissao: source.dataEmissao.slice(0, 10),
      dataVencimento: date,
      status: 'ABERTO',
    });
  }
}
