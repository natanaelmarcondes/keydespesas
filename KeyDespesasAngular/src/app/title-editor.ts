import { Component, input, output, signal } from '@angular/core';
import { form, FormField, required, min, maxLength } from '@angular/forms/signals';
import { Categoria, Titulo, TituloInput } from './core/api';
export function localDate(date = new Date()): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}
@Component({
  selector: 'app-title-editor',
  imports: [FormField],
  template: ` <form (submit)="save($event)">
    <div class="modal-heading">
      <div>
        <span class="eyebrow">MOVIMENTAÇÃO FINANCEIRA</span>
        <h2 id="editor-title">{{ editing() ? 'Editar lançamento' : 'Novo lançamento' }}</h2>
      </div>
      <button
        type="button"
        aria-label="Fechar formulário"
        (click)="cancel.emit()"
        [disabled]="busy()"
      >
        ×
      </button>
    </div>
    <div class="form-grid">
      <label class="full"
        >Descrição<input
          autofocus
          [formField]="fields.descricao"
          placeholder="Ex.: Conta de energia"
      /></label>
      <label
        >Tipo<select [formField]="fields.tipo">
          <option value="P">Despesa</option>
          <option value="R">Receita</option>
        </select></label
      >
      <label
        >Valor (R$)<input type="number" step="0.01" [formField]="fields.valor" placeholder="0,00"
      /></label>
      <label class="full"
        >Categoria<select [formField]="fields.idCategoria">
          <option value="">Selecione uma categoria</option>
          @for (c of categories(); track c.id) {
            <option [value]="c.id">{{ c.nome }}</option>
          }
        </select></label
      >
      <label>Emissão<input type="date" [formField]="fields.dataEmissao" /></label>
      <label>Vencimento<input type="date" [formField]="fields.dataVencimento" /></label>
      <label class="full"
        >Situação<select [formField]="fields.status">
          <option value="ABERTO">Em aberto</option>
          <option value="PAGO">Pago / recebido</option>
          @if (model().status !== 'ABERTO' && model().status !== 'PAGO') {
            <option [value]="model().status">{{ model().status }}</option>
          }
        </select></label
      >
    </div>
    @if (invalid()) {
      <p class="error" role="alert">
        Preencha todos os campos, selecione uma categoria e informe um valor maior que zero.
      </p>
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <div class="modal-footer">
      <button type="button" (click)="cancel.emit()" [disabled]="busy()">Cancelar</button
      ><button type="submit" class="primary" [disabled]="busy()">
        {{ busy() ? 'Salvando…' : 'Salvar lançamento' }}
      </button>
    </div>
  </form>`,
})
export class TitleEditor {
  readonly categories = input.required<Categoria[]>();
  readonly busy = input(false);
  readonly error = input('');
  readonly saved = output<TituloInput>();
  readonly cancel = output();
  readonly editing = signal<number | null>(null);
  readonly invalid = signal(false);
  readonly model = signal<Omit<TituloInput, 'idCategoria'> & { idCategoria: string }>({
    descricao: '',
    tipo: 'P',
    valor: 0,
    idCategoria: '',
    dataEmissao: localDate(),
    dataVencimento: localDate(),
    status: 'ABERTO',
  });
  readonly fields = form(this.model, (p) => {
    required(p.descricao);
    maxLength(p.descricao, 150);
    required(p.dataEmissao);
    required(p.dataVencimento);
    min(p.valor, 0.01);
    required(p.idCategoria);
  });
  reset(title?: Titulo): void {
    this.editing.set(title?.id ?? null);
    this.invalid.set(false);
    this.model.set(
      title
        ? {
            descricao: title.descricao,
            tipo: title.tipo,
            valor: title.valor,
            idCategoria: String(title.idCategoria),
            dataEmissao: title.dataEmissao.slice(0, 10),
            dataVencimento: title.dataVencimento.slice(0, 10),
            status: title.status,
          }
        : {
            descricao: '',
            tipo: 'P',
            valor: 0,
            idCategoria: '',
            dataEmissao: localDate(),
            dataVencimento: localDate(),
            status: 'ABERTO',
          },
    );
  }
  save(event: Event): void {
    event.preventDefault();
    if (this.busy()) return;
    if (this.fields().invalid() || !this.model().descricao.trim()) {
      this.invalid.set(true);
      return;
    }
    this.saved.emit({
      ...this.model(),
      descricao: this.model().descricao.trim(),
      idCategoria: Number(this.model().idCategoria),
    });
  }
}
