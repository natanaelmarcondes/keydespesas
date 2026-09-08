import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api, Titulo, TituloInput } from './core/api';
import { nextMonthDueDate } from './copy-expense';

export function monthCopyPayload(title: Titulo): TituloInput {
  return {
    tipo: title.tipo,
    descricao: title.descricao,
    idCategoria: title.idCategoria,
    valor: title.valor,
    dataEmissao: title.dataEmissao.slice(0, 10),
    dataVencimento: nextMonthDueDate(title.dataVencimento),
    status: 'ABERTO',
  };
}

@Component({
  selector: 'app-copy-month',
  imports: [DatePipe],
  template: `
    <div class="modal-heading">
      <h2 id="copy-month-title">Copiar mês inteiro</h2>
      <button
        type="button"
        aria-label="Fechar cópia do mês"
        [disabled]="running()"
        (click)="cancel.emit()"
      >
        ×
      </button>
    </div>
    <p>
      Copiar <strong>{{ entries().length }} lançamentos</strong> de
      <strong>{{ sourcePeriod() + '-01' | date: 'MMMM/yyyy' : '' : 'pt-BR' }}</strong> para
      <strong>{{ destination() + '-01' | date: 'MMMM/yyyy' : '' : 'pt-BR' }}</strong
      >.
    </p>
    <p>
      Inclui todas as despesas e receitas do mês, independentemente dos filtros e da situação atual.
      As cópias ficarão em aberto. O dia do vencimento será mantido, limitado ao último dia do
      próximo mês. Descrição, categoria, valor e emissão serão preservados.
    </p>
    <div
      class="month-copy-preview"
      tabindex="0"
      role="region"
      aria-label="Prévia dos novos vencimentos"
    >
      <table>
        <caption class="sr-only">
          Lançamentos e vencimentos após a cópia
        </caption>
        <thead>
          <tr>
            <th scope="col">Lançamento</th>
            <th scope="col">Novo vencimento</th>
          </tr>
        </thead>
        <tbody>
          @for (entry of entries(); track entry.id) {
            <tr>
              <td>{{ entry.descricao }}</td>
              <td>{{ entry.payload.dataVencimento | date: 'dd/MM/yyyy' }}</td>
            </tr>
          }
        </tbody>
      </table>
    </div>
    @if (attempted()) {
      <p role="status">
        {{ copied() }} de {{ entries().length }} lançamentos copiados{{ running() ? '…' : '.' }}
      </p>
    }
    @if (error()) {
      <p class="error" role="alert">{{ error() }}</p>
    }
    <div class="modal-footer">
      <button autofocus type="button" [disabled]="running()" (click)="cancel.emit()">
        {{ attempted() ? 'Fechar' : 'Cancelar' }}
      </button>
      @if (!attempted()) {
        <button
          type="button"
          class="primary"
          [disabled]="!entries().length || !validDestination()"
          (click)="copy()"
        >
          Copiar {{ entries().length }} lançamentos
        </button>
      } @else {
        <button
          type="button"
          class="primary"
          [disabled]="running()"
          (click)="finished.emit({ period: destination(), copied: copied() })"
        >
          Ver mês seguinte
        </button>
      }
    </div>
  `,
})
export class CopyMonth {
  private readonly api = inject(Api);
  private readonly destroyRef = inject(DestroyRef);
  readonly cancel = output();
  readonly busyChange = output<boolean>();
  readonly finished = output<{ period: string; copied: number }>();
  readonly sourcePeriod = signal('2000-01');
  readonly destination = computed(() => nextMonthDueDate(this.sourcePeriod() + '-01').slice(0, 7));
  readonly validDestination = computed(() => Number(this.destination().slice(0, 4)) <= 2100);
  readonly entries = signal<{ id: number; descricao: string; payload: TituloInput }[]>([]);
  readonly running = signal(false);
  readonly attempted = signal(false);
  readonly copied = signal(0);
  readonly error = signal('');

  reset(titles: Titulo[], period: string): void {
    this.sourcePeriod.set(period);
    this.entries.set(
      titles.map((title) => ({
        id: title.id,
        descricao: title.descricao,
        payload: monthCopyPayload(title),
      })),
    );
    this.attempted.set(false);
    this.copied.set(0);
    this.error.set('');
  }

  async copy(): Promise<void> {
    if (this.running() || this.attempted() || !this.entries().length || !this.validDestination())
      return;
    this.attempted.set(true);
    this.running.set(true);
    this.busyChange.emit(true);
    try {
      for (const entry of this.entries()) {
        if (this.destroyRef.destroyed) return;
        await firstValueFrom(
          this.api.criar(entry.payload).pipe(takeUntilDestroyed(this.destroyRef)),
        );
        this.copied.update((value) => value + 1);
      }
    } catch {
      if (!this.destroyRef.destroyed) {
        this.error.set(
          'A cópia foi interrompida. Os lançamentos já confirmados foram mantidos. Confira o mês seguinte antes de copiar novamente: a última solicitação pode ter sido salva mesmo sem confirmação.',
        );
      }
    } finally {
      if (!this.destroyRef.destroyed) {
        this.running.set(false);
        this.busyChange.emit(false);
      }
    }
  }
}
