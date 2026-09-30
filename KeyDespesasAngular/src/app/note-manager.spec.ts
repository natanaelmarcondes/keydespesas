import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import axe from 'axe-core';
import { NoteManager } from './note-manager';
import { Anotacao } from './core/notes-api';
import { environment } from '../environments/environment';

describe('Anotações', () => {
  const url = environment.apiUrl + '/anotacoes';
  const note: Anotacao = {
    id: 7,
    titulo: 'Nota',
    descricao: 'Linha 1\nLinha 2',
    dataCriacao: '2026-09-30T12:00:00',
    dataAlteracao: null,
    arquivada: false,
  };
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoteManager],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  function setup() {
    const fixture = TestBed.createComponent(NoteManager);
    http.expectOne(url).flush([note]);
    fixture.detectChanges();
    const editor = (fixture.nativeElement as HTMLElement).querySelector<HTMLDialogElement>(
      '.note-editor',
    )!;
    editor.showModal = vi.fn(() => editor.setAttribute('open', ''));
    editor.close = vi.fn(() => editor.removeAttribute('open'));
    return fixture;
  }

  it('starts with the list and opens a clean modal for inclusion', () => {
    const fixture = setup();
    const element = fixture.nativeElement as HTMLElement;
    const editor = element.querySelector<HTMLDialogElement>('.note-editor')!;
    expect(editor.open).toBe(false);
    expect(element.querySelector('main form')).toBeNull();
    element.querySelector<HTMLButtonElement>('main header button')!.click();
    expect(editor.open).toBe(true);
    fixture.componentInstance.model.set({ titulo: 'Rascunho', descricao: 'Texto' });
    fixture.componentInstance.cancelEdit();
    expect(editor.open).toBe(false);
    fixture.componentInstance.openNew();
    expect(fixture.componentInstance.model()).toEqual({ titulo: '', descricao: '' });
    http.expectNone(url);
  });

  it('rejects blank, oversized and multiline titles without sending requests', () => {
    const fixture = setup();
    for (const titulo of ['', '   ', 'x'.repeat(201), 'Linha\nLinha', 'Linha\rLinha']) {
      fixture.componentInstance.model.set({ titulo, descricao: '' });
      fixture.componentInstance.save(new Event('submit'));
      expect(fixture.componentInstance.invalid()).toBe(true);
      http.expectNone(url);
    }
  });

  it('creates a note preserving multiline description and reloads the list', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    component.openNew();
    component.model.set({ titulo: ' Nova nota ', descricao: 'Linha 1\nLinha 2' });
    component.save(new Event('submit'));
    const request = http.expectOne(url);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ titulo: 'Nova nota', descricao: 'Linha 1\nLinha 2' });
    request.flush(note);
    http.expectOne(url).flush([note]);
    expect(component.model().titulo).toBe('');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector<HTMLDialogElement>('.note-editor')!.open,
    ).toBe(false);
    expect(component.notice()).toBe('Anotação criada.');
  });

  it('fetches details, edits and preserves the draft on failure', () => {
    const component = setup().componentInstance;
    component.edit(note);
    http.expectOne(url + '/7').flush(note);
    expect(component.model().descricao).toBe(note.descricao);
    component.model.update((value) => ({ ...value, titulo: 'Alterada' }));
    component.save(new Event('submit'));
    const request = http.expectOne(url + '/7');
    expect(request.request.method).toBe('PUT');
    request.flush({}, { status: 500, statusText: 'Error' });
    expect(component.model().titulo).toBe('Alterada');
    expect(component.busy()).toBe(false);
    expect(component.editorError()).toBeTruthy();
  });

  it('archives and restores notes, including archived notes when requested', () => {
    const component = setup().componentInstance;
    component.toggle(note);
    const archive = http.expectOne(url + '/7/arquivar');
    expect(archive.request.method).toBe('PATCH');
    archive.flush(null);
    http.expectOne(url).flush([]);
    component.setIncludeArchived(true);
    http.expectOne(url + '?incluirArquivadas=true').flush([{ ...note, arquivada: true }]);
    component.toggle({ ...note, arquivada: true });
    const restore = http.expectOne(url + '/7/restaurar');
    expect(restore.request.method).toBe('PATCH');
    restore.flush(null);
    http.expectOne(url + '?incluirArquivadas=true').flush([note]);
  });

  it('requires confirmation and keeps deletion errors in the dialog', () => {
    const fixture = setup();
    const component = fixture.componentInstance;
    const dialog = (fixture.nativeElement as HTMLElement).querySelector<HTMLDialogElement>(
      'dialog[aria-labelledby="delete-note-title"]',
    )!;
    dialog.showModal = vi.fn();
    dialog.close = vi.fn();
    component.confirmDelete(note);
    http.expectNone(url + '/7');
    component.remove();
    const failed = http.expectOne(url + '/7');
    expect(failed.request.method).toBe('DELETE');
    failed.flush({}, { status: 500, statusText: 'Error' });
    expect(component.deleteError()).toBeTruthy();
    expect(dialog.close).not.toHaveBeenCalled();
    component.remove();
    http.expectOne(url + '/7').flush(null);
    http.expectOne(url).flush([]);
    expect(dialog.close).toHaveBeenCalled();
  });

  it('has no axe violations detectable in jsdom', async () => {
    const fixture = setup();
    await fixture.whenStable();
    const result = await axe.run(fixture.nativeElement as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(result.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) }))).toEqual(
      [],
    );
  });
});
