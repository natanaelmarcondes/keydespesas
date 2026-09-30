import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { Sidebar } from './sidebar';
import { Auth } from './core/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { form, FormField, required, maxLength, pattern, disabled } from '@angular/forms/signals';
import { Observable } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';
import { AllCommunityModule, ColDef, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { Anotacao, AnotacaoInput, NotesApi } from './core/notes-api';
import { NoteActions, NoteGridActions } from './note-grid-actions';
import { navigateActionButtons } from './grid-actions';

ModuleRegistry.registerModules([AllCommunityModule]);
const dateFormat = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
function displayDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : dateFormat.format(date);
}

@Component({
  selector: 'app-note-manager',
  imports: [Sidebar, FormField, AgGridAngular],
  templateUrl: './note-manager.html',
  styleUrl: './note-manager.scss',
})
export class NoteManager {
  private readonly auth = inject(Auth);
  private readonly router = inject(Router);
  private readonly api = inject(NotesApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly titleInput = viewChild.required<ElementRef<HTMLInputElement>>('titleInput');
  private readonly deleteDialog = viewChild.required<ElementRef<HTMLDialogElement>>('deleteDialog');
  private readonly editorDialog = viewChild.required<ElementRef<HTMLDialogElement>>('editorDialog');
  readonly notes = signal<Anotacao[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly locked = computed(() => this.loading() || this.busy());
  readonly includeArchived = signal(false);
  readonly search = signal('');
  readonly editing = signal<number | null>(null);
  readonly deleting = signal<Anotacao | null>(null);
  readonly error = signal('');
  readonly deleteError = signal('');
  readonly editorError = signal('');
  readonly notice = signal('');
  readonly invalid = signal(false);
  readonly model = signal<AnotacaoInput>({ titulo: '', descricao: '' });
  readonly fields = form(this.model, (p) => {
    required(p.titulo);
    maxLength(p.titulo, 200);
    pattern(p.titulo, /^[^\r\n\u2028\u2029]*$/);
    disabled(p, () => this.busy());
  });
  readonly theme = themeQuartz.withParams({
    accentColor: '#246b50',
    fontFamily: 'Inter, Segoe UI, sans-serif',
  });
  readonly defaultColDef: ColDef<Anotacao> = { sortable: true, resizable: true };
  readonly columns: ColDef<Anotacao>[] = [
    { field: 'titulo', headerName: 'Título', flex: 1, minWidth: 210 },
    {
      field: 'descricao',
      headerName: 'Descrição',
      flex: 2,
      minWidth: 240,
      wrapText: true,
      autoHeight: true,
      cellStyle: { whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
    },
    {
      field: 'arquivada',
      headerName: 'Situação',
      width: 130,
      valueFormatter: ({ value }) => (value ? 'Arquivada' : 'Ativa'),
    },
    {
      field: 'dataCriacao',
      headerName: 'Criação',
      width: 170,
      sort: 'desc',
      valueFormatter: ({ data }) => displayDate(data?.dataCriacao),
    },
    {
      field: 'dataAlteracao',
      headerName: 'Alteração',
      width: 170,
      valueFormatter: ({ data }) => displayDate(data?.dataAlteracao),
    },
    {
      headerName: 'Ações',
      width: 210,
      sortable: false,
      cellRenderer: NoteGridActions,
      suppressKeyboardEvent: ({ event }) => navigateActionButtons(event),
    },
  ];
  readonly actions: NoteActions = {
    edit: (note) => this.edit(note),
    toggle: (note) => this.toggle(note),
    remove: (note) => this.confirmDelete(note),
    busy: () => this.locked(),
  };
  readonly localeText = {
    noRowsToShow: 'Nenhuma anotação encontrada',
    loadingOoo: 'Carregando…',
    page: 'Página',
    of: 'de',
    to: 'a',
    more: 'mais',
    nextPage: 'Próxima página',
    previousPage: 'Página anterior',
    firstPage: 'Primeira página',
    lastPage: 'Última página',
    pageSizeSelectorLabel: 'Por página:',
  };

  constructor() {
    this.load();
  }

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/login');
  }

  load(): void {
    if (this.locked()) return;
    this.loading.set(true);
    this.error.set('');
    this.api
      .list(this.includeArchived())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.notes.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.error.set('Não foi possível carregar as anotações. Tente atualizar a lista.');
        },
      });
  }

  setIncludeArchived(value: boolean): void {
    if (this.locked()) return;
    this.includeArchived.set(value);
    this.load();
  }

  edit(note: Anotacao): void {
    if (this.locked()) return;
    this.busy.set(true);
    this.error.set('');
    this.notice.set('');
    this.api
      .get(note.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (item) => {
          this.busy.set(false);
          this.editing.set(item.id);
          this.fields().reset({ titulo: item.titulo, descricao: item.descricao ?? '' });
          this.invalid.set(false);
          this.editorError.set('');
          this.editorDialog().nativeElement.showModal();
          this.focusTitle();
        },
        error: () => {
          this.busy.set(false);
          this.error.set('Não foi possível abrir a anotação.');
        },
      });
  }

  openNew(): void {
    if (this.locked()) return;
    this.editing.set(null);
    this.fields().reset({ titulo: '', descricao: '' });
    this.invalid.set(false);
    this.editorError.set('');
    this.error.set('');
    this.notice.set('');
    this.editorDialog().nativeElement.showModal();
    this.focusTitle();
  }

  cancelEdit(): void {
    if (this.busy()) return;
    this.editorDialog().nativeElement.close();
    this.editing.set(null);
    this.fields().reset({ titulo: '', descricao: '' });
    this.invalid.set(false);
    this.editorError.set('');
  }

  save(event: Event): void {
    event.preventDefault();
    if (this.locked()) return;
    if (this.fields().invalid() || !this.model().titulo.trim()) {
      this.invalid.set(true);
      this.titleInput().nativeElement.focus();
      return;
    }
    const data = { ...this.model(), titulo: this.model().titulo.trim() };
    const id = this.editing();
    this.mutate(
      id === null ? this.api.create(data) : this.api.update(id, data),
      id === null ? 'Anotação criada.' : 'Anotação atualizada.',
      () => this.cancelEdit(),
    );
  }

  toggle(note: Anotacao): void {
    this.mutate(
      note.arquivada ? this.api.restore(note.id) : this.api.archive(note.id),
      note.arquivada ? 'Anotação restaurada.' : 'Anotação arquivada.',
    );
  }

  confirmDelete(note: Anotacao): void {
    if (this.locked()) return;
    this.deleting.set(note);
    this.deleteError.set('');
    this.deleteDialog().nativeElement.showModal();
  }

  closeDelete(): void {
    if (this.busy()) return;
    this.deleteDialog().nativeElement.close();
    this.deleting.set(null);
  }

  remove(): void {
    const note = this.deleting();
    if (!note) return;
    this.deleteError.set('');
    this.mutate(
      this.api.remove(note.id),
      'Anotação excluída.',
      () => {
        this.closeDelete();
        if (this.editing() === note.id) this.cancelEdit();
      },
      true,
    );
  }

  private focusTitle(): void {
    setTimeout(() => {
      if (!this.destroyRef.destroyed) this.titleInput().nativeElement.focus();
    });
  }

  private mutate(
    request: Observable<unknown>,
    message: string,
    done?: () => void,
    deleting = false,
  ): void {
    if (this.locked()) return;
    this.busy.set(true);
    this.error.set('');
    this.editorError.set('');
    this.notice.set('');
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.busy.set(false);
        done?.();
        this.notice.set(message);
        this.load();
      },
      error: () => {
        this.busy.set(false);
        (deleting
          ? this.deleteError
          : this.editorDialog().nativeElement.open
            ? this.editorError
            : this.error
        ).set('Não foi possível concluir a operação. Tente novamente.');
      },
    });
  }
}
