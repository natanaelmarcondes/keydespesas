import { Component, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Api, Categoria } from './core/api';
import { AgGridAngular, ICellRendererAngularComp } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, ICellRendererParams, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { navigateActionButtons } from './grid-actions';

interface ManageCategoryActions {
  edit: (category: Categoria) => void;
  remove: (category: Categoria) => void;
  busy: () => boolean;
}

@Component({
  selector: 'app-manage-category-actions',
  template: `@if (category(); as item) {
    <div class="grid-actions">
      <button type="button" (click)="actions?.edit(item)" [disabled]="actions?.busy()"
        [attr.aria-label]="'Editar ' + item.nome">Editar</button>
      <button type="button" class="danger-text" (click)="actions?.remove(item)"
        [disabled]="actions?.busy()" [attr.aria-label]="'Excluir ' + item.nome">Excluir</button>
    </div>
  }`,
})
class ManageCategoryGridActions implements ICellRendererAngularComp {
  readonly category = signal<Categoria | undefined>(undefined);
  actions?: ManageCategoryActions;
  agInit(params: ICellRendererParams<Categoria, unknown, ManageCategoryActions>): void {
    this.category.set(params.data);
    this.actions = params.context;
  }
  refresh(params: ICellRendererParams<Categoria, unknown, ManageCategoryActions>): boolean {
    this.agInit(params);
    return true;
  }
}

ModuleRegistry.registerModules([AllCommunityModule]);

@Component({
  selector: 'app-category-manager',
  imports: [RouterLink, AgGridAngular],
  template: `
    <a class="skip-link" href="#main">Ir para o conteúdo</a>
    <main id="main" class="category-manager" tabindex="-1">
      <a routerLink="/" class="back-link">← Voltar ao painel</a>
      <header>
        <span class="eyebrow">CONTROLE FINANCEIRO</span>
        <h1>Gerenciar categorias</h1>
        <p>Cadastre, edite ou exclua categorias da sua conta.</p>
      </header>

      @if (notice()) { <p class="success-banner" role="status">{{ notice() }}</p> }
      @if (error()) { <p class="error" role="alert">{{ error() }}</p> }

      <section class="panel" aria-labelledby="form-title">
        <h2 id="form-title">{{ editing() ? 'Editar categoria' : 'Adicionar categoria' }}</h2>
        <form (submit)="save($event)">
          <label for="category-name">Nome da categoria</label>
          <div class="form-row">
            <input #nameInput id="category-name" name="nome" required maxlength="80"
              [value]="name()" (input)="name.set(nameInput.value)" [disabled]="busy()" />
            <button class="primary" type="submit" [disabled]="busy() || !name().trim()">
              {{ busy() ? 'Salvando…' : editing() ? 'Salvar alterações' : 'Adicionar categoria' }}
            </button>
            @if (editing()) {
              <button type="button" (click)="cancelEdit()" [disabled]="busy()">Cancelar</button>
            }
          </div>
        </form>
      </section>

      <section class="panel" aria-labelledby="list-title" [attr.aria-busy]="loading()">
        <div class="list-heading">
          <h2 id="list-title">Categorias cadastradas</h2>
          <button type="button" (click)="load()" [disabled]="loading() || busy()">Atualizar</button>
        </div>
        <ag-grid-angular aria-label="Categorias cadastradas" [theme]="theme"
          [rowData]="categories()" [columnDefs]="columns" [defaultColDef]="defaultColDef"
          [context]="actions" [loading]="loading()" [localeText]="localeText"
          [pagination]="true" [paginationPageSize]="20"
          [paginationPageSizeSelector]="[10, 20, 50]" [ensureDomOrder]="true" />
      </section>
    </main>
    <dialog #deleteDialog aria-labelledby="delete-category-title" (cancel)="busy() ? $event.preventDefault() : null">
      <h2 id="delete-category-title">Excluir categoria?</h2>
      <p>A categoria <strong>{{ deleting()?.nome }}</strong> será excluída permanentemente.</p>
      <div class="row-actions">
        <button type="button" autofocus (click)="closeDelete()" [disabled]="busy()">Cancelar</button>
        <button type="button" class="danger" (click)="remove()" [disabled]="busy()">
          {{ busy() ? 'Excluindo…' : 'Excluir categoria' }}
        </button>
      </div>
    </dialog>
  `,
  styles: [`
    .category-manager { max-width: 920px; margin: 0 auto; padding: 36px 20px 72px; }
    .back-link { display: inline-block; margin-bottom: 30px; color: #256c50; font-weight: 600; }
    header { margin-bottom: 28px; }
    .panel { margin-bottom: 20px; padding: 24px; }
    form label { display: block; margin: 20px 0 8px; font-weight: 600; }
    .form-row, .row-actions, .list-heading { display: flex; align-items: center; gap: 10px; }
    .form-row { flex-wrap: wrap; }
    .form-row input { flex: 1 1 240px; }
    .list-heading { justify-content: space-between; }
    ag-grid-angular { display: block; height: 560px; width: 100%; margin-top: 16px; }
    .row-actions { flex-shrink: 0; }
    dialog { border: 1px solid #dce3de; border-radius: 12px; padding: 24px; max-width: min(440px, calc(100vw - 32px)); }
    dialog::backdrop { background: #17251db3; }
    dialog .row-actions { justify-content: flex-end; }
  `],
})
export class CategoryManager {
  private readonly api = inject(Api);
  private readonly destroyRef = inject(DestroyRef);
  private readonly nameInput = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');
  private readonly deleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deleteDialog');
  readonly categories = signal<Categoria[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly name = signal('');
  readonly editing = signal<Categoria | null>(null);
  readonly deleting = signal<Categoria | null>(null);
  readonly error = signal('');
  readonly notice = signal('');
  readonly theme = themeQuartz.withParams({ accentColor: '#246b50', fontFamily: 'Inter, Segoe UI, sans-serif' });
  readonly defaultColDef: ColDef<Categoria> = { sortable: true, resizable: true };
  readonly columns: ColDef<Categoria>[] = [
    { field: 'id', headerName: 'Código', width: 120 },
    { field: 'nome', headerName: 'Nome', flex: 1, minWidth: 180, sort: 'asc' },
    { headerName: 'Ações', width: 150, sortable: false, cellRenderer: ManageCategoryGridActions,
      suppressKeyboardEvent: ({ event }) => navigateActionButtons(event) },
  ];
  readonly actions: ManageCategoryActions = {
    edit: (category) => this.edit(category),
    remove: (category) => this.confirmDelete(category),
    busy: () => this.busy(),
  };
  readonly localeText = {
    noRowsToShow: 'Nenhuma categoria cadastrada',
    loadingOoo: 'Carregando…',
    page: 'Página', of: 'de', to: 'a', more: 'mais',
    nextPage: 'Próxima página', previousPage: 'Página anterior',
    firstPage: 'Primeira página', lastPage: 'Última página',
    pageSizeSelectorLabel: 'Por página:',
  };

  constructor() { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.api.categorias().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (items) => { this.categories.set(items); this.loading.set(false); },
      error: () => { this.error.set('Não foi possível carregar as categorias.'); this.loading.set(false); },
    });
  }

  edit(category: Categoria): void {
    this.editing.set(category);
    this.name.set(category.nome);
    this.error.set('');
    this.notice.set('');
    this.nameInput().nativeElement.focus();
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.name.set('');
  }

  save(event: Event): void {
    event.preventDefault();
    const nome = this.name().trim();
    if (this.busy() || !nome || nome.length > 80) return;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    const editing = this.editing();
    const request = editing ? this.api.editarCategoria(editing.id, nome) : this.api.criarCategoria(nome);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.cancelEdit();
        this.notice.set(editing ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.');
        this.load();
        this.nameInput().nativeElement.focus();
      },
      error: (response: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(this.errorMessage(response, 'Não foi possível salvar a categoria.'));
      },
    });
  }

  confirmDelete(category: Categoria): void {
    this.deleting.set(category);
    this.error.set('');
    this.notice.set('');
    this.deleteDialog().nativeElement.showModal();
  }

  closeDelete(): void {
    if (this.busy()) return;
    this.deleteDialog().nativeElement.close();
    this.deleting.set(null);
  }

  remove(): void {
    const category = this.deleting();
    if (!category || this.busy()) return;
    this.busy.set(true);
    this.api.excluirCategoria(category.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.closeDelete();
        if (this.editing()?.id === category.id) this.cancelEdit();
        this.notice.set('Categoria excluída com sucesso.');
        this.load();
      },
      error: (response: HttpErrorResponse) => {
        this.busy.set(false);
        this.closeDelete();
        this.error.set(this.errorMessage(response, 'Não foi possível excluir a categoria.'));
      },
    });
  }

  private errorMessage(response: HttpErrorResponse, fallback: string): string {
    const body: unknown = response.error;
    if (body && typeof body === 'object' && 'mensagem' in body && typeof body.mensagem === 'string') {
      return body.mensagem;
    }
    return fallback;
  }
}
