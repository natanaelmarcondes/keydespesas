import {
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
  DestroyRef,
} from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, switchMap, forkJoin, catchError, of } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import {
  AllCommunityModule,
  ColDef,
  ModuleRegistry,
  RowClassRules,
  themeQuartz,
} from 'ag-grid-community';
import { Api, Categoria, Resumo, Titulo, TituloInput } from './core/api';
import { Auth } from './core/auth';
import { GridActions, TitleActions, navigateActionButtons } from './grid-actions';
import { localDate, TitleEditor } from './title-editor';
import { CopyExpense } from './copy-expense';
import { CopyMonth } from './copy-month';
import { CategoryActions, CategoryGridActions } from './category-grid-actions';
ModuleRegistry.registerModules([AllCommunityModule]);
const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
@Component({
  selector: 'app-dashboard',
  imports: [AgGridAngular, CurrencyPipe, DatePipe, TitleEditor, CopyExpense, CopyMonth],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  private readonly api = inject(Api);
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly reload = new Subject<void>();
  readonly period = signal(localDate().slice(0, 7));
  readonly titles = signal<Titulo[]>([]);
  readonly categories = signal<Categoria[]>([]);
  readonly categoriesLoading = signal(false);
  readonly categoryQuery = signal('');
  readonly summary = signal<Resumo | null>(null);
  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly summaryError = signal('');
  readonly categoryError = signal('');
  readonly modalError = signal('');
  readonly notice = signal('');
  readonly query = signal('');
  readonly type = signal('');
  readonly status = signal('');
  readonly page = signal<'titles' | 'categories'>('titles');
  readonly selectedCategory = signal<Categoria | null>(null);
  readonly categoryLoading = signal(false);
  readonly newCategoryName = signal('');
  readonly editingCategory = signal<Categoria | null>(null);
  readonly pendingCategoryDelete = signal<Categoria | null>(null);
  readonly categorySaveError = signal('');
  readonly pendingDelete = signal<Titulo | null>(null);
  readonly editor = viewChild.required(TitleEditor);
  readonly copyEditor = viewChild.required(CopyExpense);
  readonly monthCopier = viewChild.required(CopyMonth);
  readonly monthCopyDialog = viewChild.required<ElementRef<HTMLDialogElement>>('monthCopyDialog');
  readonly copyDialog = viewChild.required<ElementRef<HTMLDialogElement>>('copyDialog');
  readonly editorDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editorDialog');
  readonly deleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deleteDialog');
  readonly categoryDialog = viewChild.required<ElementRef<HTMLDialogElement>>('categoryDialog');
  readonly newCategoryDialog = viewChild.required<ElementRef<HTMLDialogElement>>('newCategoryDialog');
  readonly categoryDeleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('categoryDeleteDialog');
  readonly newCategoryInput = viewChild.required<ElementRef<HTMLInputElement>>('newCategoryInput');
  readonly grid = viewChild<AgGridAngular<Titulo>>('titlesGrid');
  readonly monthLabel = computed(() =>
    new Date(this.period() + '-01T12:00:00').toLocaleDateString('pt-BR', {
      month: 'long',
      year: 'numeric',
    }),
  );
  readonly income = computed(() =>
    this.titles()
      .filter((t) => t.tipo === 'R' && t.status !== 'CANCELADO')
      .reduce((a, t) => a + t.valor, 0),
  );
  readonly expenses = computed(() =>
    this.titles()
      .filter((t) => t.tipo === 'P' && t.status !== 'CANCELADO')
      .reduce((a, t) => a + t.valor, 0),
  );
  readonly balance = computed(() => this.income() - this.expenses());
  readonly summaryCards = computed(() => {
    const cards = [
      {
        label: 'Receitas em aberto',
        description: 'Valores a receber',
        tipo: 'R',
        status: 'ABERTO',
        icon: '↗',
        tone: 'green',
      },
      {
        label: 'Receitas pagas',
        description: 'Valores recebidos',
        tipo: 'R',
        status: 'PAGO',
        icon: '✓',
        tone: 'green',
      },
      {
        label: 'Despesas em aberto',
        description: 'Valores a pagar',
        tipo: 'P',
        status: 'ABERTO',
        icon: '↙',
        tone: 'amber',
      },
      {
        label: 'Despesas pagas',
        description: 'Pagamentos realizados',
        tipo: 'P',
        status: 'PAGO',
        icon: '✓',
        tone: 'rose',
      },
    ];
    return cards.map((card) => ({
      ...card,
      total: this.titles()
        .filter((title) => title.tipo === card.tipo && title.status === card.status)
        .reduce((total, title) => total + title.valor, 0),
    }));
  });
  readonly filtered = computed(() =>
    this.titles().filter(
      (t) =>
        (!this.type() || t.tipo === this.type()) &&
        (!this.status() || t.status === this.status()) &&
        (!this.query() ||
          (t.descricao + ' ' + t.categoriaNome)
            .toLocaleLowerCase('pt-BR')
            .includes(this.query().toLocaleLowerCase('pt-BR'))),
    ),
  );
  readonly distribution = computed(() => {
    const totals = new Map<string, number>();
    this.titles()
      .filter((t) => t.tipo === 'P' && t.status !== 'CANCELADO')
      .forEach((t) => totals.set(t.categoriaNome, (totals.get(t.categoriaNome) ?? 0) + t.valor));
    return [...totals]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, value]) => ({
        name,
        value,
        percent: this.expenses() ? (value / this.expenses()) * 100 : 0,
      }));
  });
  readonly upcoming = computed(() =>
    this.titles()
      .filter((t) => t.status === 'ABERTO' && t.tipo === 'P')
      .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
      .slice(0, 4),
  );
  readonly theme = themeQuartz.withParams({
    accentColor: '#246b50',
    backgroundColor: '#ffffff',
    foregroundColor: '#253b32',
    headerBackgroundColor: '#f7f9f8',
    headerTextColor: '#5c6b63',
    borderColor: '#e6ebe7',
    rowHoverColor: '#f4f8f5',
    fontFamily: 'Inter, Segoe UI, sans-serif',
    fontSize: 13,
    headerHeight: 44,
    rowHeight: 58,
    wrapperBorder: false,
  });
  readonly localeText = {
    noRowsToShow: 'Nenhum lançamento encontrado',
    loadingOoo: 'Carregando…',
    page: 'Página',
    of: 'de',
    to: 'a',
    more: 'mais',
    nextPage: 'Próxima página',
    lastPage: 'Última página',
    firstPage: 'Primeira página',
    previousPage: 'Página anterior',
    pageSizeSelectorLabel: 'Por página:',
    equals: 'Igual a',
    notEqual: 'Diferente de',
    contains: 'Contém',
    notContains: 'Não contém',
    startsWith: 'Começa com',
    endsWith: 'Termina com',
    blank: 'Em branco',
    notBlank: 'Preenchido',
    filterOoo: 'Filtrar…',
    applyFilter: 'Aplicar',
    resetFilter: 'Limpar',
    andCondition: 'E',
    orCondition: 'OU',
  };
  readonly defaultColDef: ColDef<Titulo> = { sortable: true, resizable: true, minWidth: 120 };
  readonly titleRowClassRules: RowClassRules<Titulo> = {
    'paid-row': ({ data }) => data?.status === 'PAGO',
  };
  readonly categoryLocaleText = {
    ...this.localeText,
    noRowsToShow: 'Nenhuma categoria encontrada',
  };
  readonly categoryDefaultColDef: ColDef<Categoria> = { sortable: true, resizable: true };
  readonly categoryColumns: ColDef<Categoria>[] = [
    { field: 'id', headerName: 'Código', width: 120 },
    {
      field: 'nome',
      headerName: 'Nome',
      flex: 1,
      minWidth: 200,
      sort: 'asc',
      cellClass: 'description-cell',
    },
    {
      headerName: 'Ações',
      width: 250,
      sortable: false,
      cellRenderer: CategoryGridActions,
      suppressKeyboardEvent: ({ event }) => navigateActionButtons(event),
    },
  ];
  readonly categoryActions: CategoryActions = {
    details: (category) => this.details(category),
    edit: (category) => this.openEditCategory(category),
    remove: (category) => this.askCategoryDelete(category),
    busy: () => this.busy(),
  };
  readonly columns: ColDef<Titulo>[] = [
    {
      field: 'descricao',
      headerName: 'Descrição',
      flex: 2,
      minWidth: 190,
      cellClass: 'description-cell',
    },
    {
      field: 'tipo',
      headerName: 'Tipo',
      width: 112,
      valueFormatter: (p) => (p.value === 'R' ? 'Receita' : 'Despesa'),
      cellClassRules: { 'income-text': (p) => p.value === 'R' },
    },
    { field: 'categoriaNome', headerName: 'Categoria', flex: 1, minWidth: 155 },
    {
      field: 'dataVencimento',
      headerName: 'Vencimento',
      width: 140,
      valueFormatter: (p) =>
        p.value ? String(p.value).slice(0, 10).split('-').reverse().join('/') : '',
    },
    {
      field: 'valor',
      headerName: 'Valor',
      width: 140,
      type: 'rightAligned',
      valueFormatter: (p) => money.format(p.value ?? 0),
      cellClass: 'amount-cell',
    },
    {
      field: 'status',
      headerName: 'Situação',
      width: 125,
      valueFormatter: (p) =>
        p.value === 'PAGO' ? 'Pago' : p.value === 'ABERTO' ? 'Em aberto' : String(p.value),
      cellClassRules: {
        'paid-cell': (p) => p.value === 'PAGO',
        'open-cell': (p) => p.value === 'ABERTO',
      },
    },
    {
      headerName: 'Ações',
      colId: 'actions',
      width: 270,
      sortable: false,
      cellRenderer: GridActions,
      suppressKeyboardEvent: ({ event }) => navigateActionButtons(event),
    },
  ];
  readonly actions: TitleActions = {
    copy: (t) => this.openCopy(t),
    edit: (t) => this.openEditor(t),
    toggle: (t) => this.toggle(t),
    remove: (t) => this.askDelete(t),
  };
  constructor() {
    this.reload
      .pipe(
        switchMap(() => {
          this.loading.set(true);
          this.error.set('');
          this.summaryError.set('');
          this.titles.set([]);
          this.summary.set(null);
          const [ano, mes] = this.period().split('-').map(Number);
          return forkJoin({
            titles: this.api.titulos(ano, mes),
            summary: this.api.resumo(ano, mes).pipe(
              catchError(() => {
                this.summaryError.set('Resumo indisponível. Tente atualizar.');
                return of(null);
              }),
            ),
          }).pipe(
            catchError(() => {
              this.error.set(
                'Não foi possível carregar os lançamentos. Verifique a conexão e tente novamente.',
              );
              return of(null);
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((data) => {
        if (data) {
          this.titles.set(data.titles);
          this.summary.set(data.summary);
        }
        this.loading.set(false);
      });
    this.loadCategories();
    this.refresh();
  }
  refresh(): void {
    this.reload.next();
  }
  loadCategories(): void {
    if (this.categoriesLoading()) return;
    this.categoriesLoading.set(true);
    this.categoryError.set('');
    this.api
      .categorias()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.categories.set(data);
          this.categoriesLoading.set(false);
        },
        error: () => {
          this.categoryError.set('Não foi possível carregar as categorias.');
          this.categoriesLoading.set(false);
        },
      });
  }
  changePeriod(value: string): void {
    if (
      /^\d{4}-(0[1-9]|1[0-2])$/.test(value) &&
      Number(value.slice(0, 4)) >= 2000 &&
      Number(value.slice(0, 4)) <= 2100
    ) {
      this.period.set(value);
      this.refresh();
    }
  }
  stepMonth(step: number): void {
    const d = new Date(this.period() + '-01T12:00:00');
    d.setMonth(d.getMonth() + step);
    this.changePeriod(localDate(d).slice(0, 7));
  }
  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }
  openEditor(title?: Titulo): void {
    if (this.busy()) return;
    this.modalError.set('');
    this.editor().reset(title);
    this.editorDialog().nativeElement.showModal();
  }
  closeEditor(): void {
    if (!this.busy()) this.editorDialog().nativeElement.close();
  }
  save(data: TituloInput): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.modalError.set('');
    const id = this.editor().editing();
    (id === null ? this.api.criar(data) : this.api.editar(id, data))
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.closeEditor();
          this.notice.set('Lançamento salvo com sucesso.');
          this.period.set(data.dataVencimento.slice(0, 7));
          this.refresh();
        },
        error: () => {
          this.busy.set(false);
          this.modalError.set('Não foi possível salvar. Confira os dados e tente novamente.');
        },
      });
  }
  openMonthCopy(): void {
    if (this.busy() || this.loading() || !this.titles().length || this.period() === '2100-12')
      return;
    this.monthCopier().reset(this.titles(), this.period());
    this.monthCopyDialog().nativeElement.showModal();
  }
  closeMonthCopy(): void {
    if (!this.busy()) this.monthCopyDialog().nativeElement.close();
  }
  showCopiedMonth(result: { period: string; copied: number }): void {
    this.closeMonthCopy();
    this.notice.set(`${result.copied} lançamentos copiados com confirmação.`);
    this.query.set('');
    this.type.set('');
    this.status.set('');
    this.changePeriod(result.period);
  }
  openCopy(title: Titulo): void {
    if (this.busy()) return;
    this.modalError.set('');
    this.copyEditor().reset(title);
    this.copyDialog().nativeElement.showModal();
  }
  closeCopy(): void {
    if (!this.busy()) this.copyDialog().nativeElement.close();
  }
  copyExpense(data: TituloInput): void {
    if (this.busy()) return;
    this.busy.set(true);
    this.modalError.set('');
    this.api
      .criar(data)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.closeCopy();
          this.notice.set(
            data.tipo === 'R' ? 'Receita copiada com sucesso.' : 'Despesa copiada com sucesso.',
          );
          this.period.set(data.dataVencimento.slice(0, 7));
          this.query.set('');
          this.type.set('');
          this.status.set('');
          this.refresh();
        },
        error: () => {
          this.busy.set(false);
          this.modalError.set('Não foi possível copiar o lançamento. Tente novamente.');
        },
      });
  }
  toggle(title: Titulo): void {
    if (this.busy() || !['ABERTO', 'PAGO'].includes(title.status)) return;
    this.busy.set(true);
    this.error.set('');
    this.api
      .toggle(title.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.notice.set('Situação atualizada com sucesso.');
          this.refresh();
        },
        error: () => {
          this.busy.set(false);
          this.error.set('Não foi possível alterar a situação. Tente novamente.');
        },
      });
  }
  askDelete(title: Titulo): void {
    if (!this.busy()) {
      this.pendingDelete.set(title);
      this.modalError.set('');
      this.deleteDialog().nativeElement.showModal();
    }
  }
  closeDelete(): void {
    if (!this.busy()) this.deleteDialog().nativeElement.close();
  }
  remove(): void {
    const title = this.pendingDelete();
    if (!title || this.busy()) return;
    this.busy.set(true);
    this.api
      .excluir(title.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.busy.set(false);
          this.closeDelete();
          this.notice.set('Lançamento excluído.');
          this.refresh();
        },
        error: () => {
          this.busy.set(false);
          this.modalError.set('Não foi possível excluir. Tente novamente.');
        },
      });
  }
  details(category: Categoria): void {
    this.selectedCategory.set(null);
    this.modalError.set('');
    this.categoryLoading.set(true);
    this.categoryDialog().nativeElement.showModal();
    this.api
      .categoria(category.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (c) => {
          this.selectedCategory.set(c);
          this.categoryLoading.set(false);
        },
        error: () => {
          this.modalError.set('Não foi possível carregar os detalhes.');
          this.categoryLoading.set(false);
        },
      });
  }
  openNewCategory(): void {
    this.editingCategory.set(null);
    this.newCategoryName.set('');
    this.categorySaveError.set('');
    this.newCategoryDialog().nativeElement.showModal();
    this.newCategoryInput().nativeElement.focus();
  }
  openEditCategory(category: Categoria): void {
    this.editingCategory.set(category);
    this.newCategoryName.set(category.nome.toLocaleUpperCase('pt-BR').replace(/[^\p{L}\s]/gu, ''));
    this.categorySaveError.set('');
    this.newCategoryDialog().nativeElement.showModal();
    this.newCategoryInput().nativeElement.focus();
  }
  closeNewCategory(): void {
    if (!this.busy()) this.newCategoryDialog().nativeElement.close();
  }
  updateNewCategoryName(input: HTMLInputElement): void {
    const value = input.value.toLocaleUpperCase('pt-BR').replace(/[^\p{L}\s]/gu, '');
    input.value = value;
    this.newCategoryName.set(value);
  }
  saveCategory(event: Event): void {
    event.preventDefault();
    const nome = this.newCategoryName().trim();
    if (this.busy() || !nome || nome.length > 80) return;
    this.busy.set(true);
    this.categorySaveError.set('');
    const editing = this.editingCategory();
    const request = editing ? this.api.editarCategoria(editing.id, nome) : this.api.criarCategoria(nome);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.closeNewCategory();
        this.notice.set(editing ? 'Categoria atualizada com sucesso.' : 'Categoria cadastrada com sucesso.');
        this.loadCategories();
        if (editing) this.refresh();
      },
      error: (response: HttpErrorResponse) => {
        this.busy.set(false);
        this.categorySaveError.set(this.categoryApiError(response, 'Não foi possível salvar a categoria. Confira o nome e tente novamente.'));
      },
    });
  }
  askCategoryDelete(category: Categoria): void {
    this.pendingCategoryDelete.set(category);
    this.categorySaveError.set('');
    this.categoryDeleteDialog().nativeElement.showModal();
  }
  closeCategoryDelete(): void {
    if (this.busy()) return;
    this.categoryDeleteDialog().nativeElement.close();
    this.pendingCategoryDelete.set(null);
  }
  deleteCategory(): void {
    const category = this.pendingCategoryDelete();
    if (!category || this.busy()) return;
    this.busy.set(true);
    this.categorySaveError.set('');
    this.api.excluirCategoria(category.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        this.closeCategoryDelete();
        this.notice.set('Categoria excluída com sucesso.');
        this.loadCategories();
      },
      error: (response: HttpErrorResponse) => {
        this.busy.set(false);
        this.categorySaveError.set(this.categoryApiError(response, 'Não foi possível excluir a categoria.'));
      },
    });
  }
  private categoryApiError(response: HttpErrorResponse, fallback: string): string {
    const body: unknown = response.error;
    return body && typeof body === 'object' && 'mensagem' in body && typeof body.mensagem === 'string'
      ? body.mensagem : fallback;
  }
  exportCsv(): void {
    this.grid()?.api.exportDataAsCsv({
      fileName: 'lancamentos-' + this.period() + '.csv',
      columnKeys: ['descricao', 'tipo', 'categoriaNome', 'dataVencimento', 'valor', 'status'],
      processCellCallback: (p) => {
        const value = String(p.value ?? '');
        return /^[=+@\-\t\r]/.test(value) ? "'" + value : value;
      },
    });
  }
}
