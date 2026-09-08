import { TestBed } from '@angular/core/testing';
import { TitleEditor } from './title-editor';
describe('Title editor', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [TitleEditor] }));
  it('blocks empty fields and non-positive amounts', async () => {
    const fixture = TestBed.createComponent(TitleEditor);
    fixture.componentRef.setInput('categories', [{ id: 15, nome: 'Consumo' }]);
    const save = vi.fn();
    fixture.componentInstance.saved.subscribe(save);
    await fixture.whenStable();
    fixture.componentInstance.save(new Event('submit'));
    expect(save).not.toHaveBeenCalled();
    expect(fixture.componentInstance.invalid()).toBe(true);
  });
  it('serializes category IDs as numbers and trims descriptions', async () => {
    const fixture = TestBed.createComponent(TitleEditor);
    fixture.componentRef.setInput('categories', [{ id: 15, nome: 'Consumo' }]);
    const editor = fixture.componentInstance;
    const save = vi.fn();
    editor.saved.subscribe(save);
    editor.model.set({
      descricao: ' Energia ',
      tipo: 'P',
      valor: 100.5,
      idCategoria: '15',
      dataEmissao: '2026-09-01',
      dataVencimento: '2026-09-20',
      status: 'ABERTO',
    });
    await fixture.whenStable();
    editor.save(new Event('submit'));
    expect(save).toHaveBeenCalledWith({
      descricao: 'Energia',
      tipo: 'P',
      valor: 100.5,
      idCategoria: 15,
      dataEmissao: '2026-09-01',
      dataVencimento: '2026-09-20',
      status: 'ABERTO',
    });
  });
  it('resets editing state and enforces the 150-character API limit', async () => {
    const fixture = TestBed.createComponent(TitleEditor);
    fixture.componentRef.setInput('categories', []);
    const editor = fixture.componentInstance;
    editor.reset({
      id: 2,
      tipo: 'P',
      descricao: 'x'.repeat(151),
      idCategoria: 15,
      categoriaNome: 'Consumo',
      valor: 10,
      dataEmissao: '2026-09-01T00:00:00',
      dataVencimento: '2026-09-02T00:00:00',
      status: 'PAGO',
    });
    await fixture.whenStable();
    expect(editor.fields().invalid()).toBe(true);
    expect(editor.model().dataVencimento).toBe('2026-09-02');
    editor.reset();
    expect(editor.editing()).toBeNull();
    expect(editor.model().status).toBe('ABERTO');
  });
});
