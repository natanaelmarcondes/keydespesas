import { TestBed } from '@angular/core/testing';
import { CopyExpense, nextMonthDueDate } from './copy-expense';
import { Titulo } from './core/api';

describe('Copy expense', () => {
  const expense: Titulo = {
    id: 23,
    tipo: 'P',
    descricao: 'Internet',
    idCategoria: 15,
    categoriaNome: 'Consumo',
    valor: 150,
    dataEmissao: '2026-09-01T00:00:00',
    dataVencimento: '2026-09-20T00:00:00',
    status: 'PAGO',
  };
  it.each([
    ['2026-09-20T00:00:00', '2026-10-20'],
    ['2026-12-15', '2027-01-15'],
    ['2026-01-31', '2026-02-28'],
    ['2028-01-31', '2028-02-29'],
    ['2026-03-31', '2026-04-30'],
    ['2026-08-31', '2026-09-30'],
  ])('defaults %s to %s', (source, expected) => {
    expect(nextMonthDueDate(source)).toBe(expected);
  });

  it('copies the original fields as open, uses the selected date, and omits the ID', () => {
    const editor = TestBed.createComponent(CopyExpense).componentInstance;
    const saved = vi.fn();
    editor.saved.subscribe(saved);
    editor.reset(expense);
    expect(editor.model().dueDate).toBe('2026-10-20');
    editor.model.set({ dueDate: '2026-11-05' });
    editor.save(new Event('submit'));
    expect(saved).toHaveBeenCalledWith({
      tipo: 'P',
      descricao: 'Internet',
      idCategoria: 15,
      valor: 150,
      dataEmissao: '2026-09-01',
      dataVencimento: '2026-11-05',
      status: 'ABERTO',
    });
    expect(expense.status).toBe('PAGO');
    expect(expense.dataVencimento).toBe('2026-09-20T00:00:00');
  });

  it.each(['', '2026-02-31', '2101-01-01'])('rejects invalid date %s', (dueDate) => {
    const editor = TestBed.createComponent(CopyExpense).componentInstance;
    const saved = vi.fn();
    editor.saved.subscribe(saved);
    editor.reset(expense);
    editor.model.set({ dueDate });
    editor.save(new Event('submit'));
    expect(saved).not.toHaveBeenCalled();
    expect(editor.invalid()).toBe(true);
  });

  it('blocks copying while saving and preserves the revenue type when copying', () => {
    const fixture = TestBed.createComponent(CopyExpense);
    const editor = fixture.componentInstance;
    const saved = vi.fn();
    editor.saved.subscribe(saved);
    editor.reset(expense);
    fixture.componentRef.setInput('busy', true);
    editor.save(new Event('submit'));
    expect(saved).not.toHaveBeenCalled();
    fixture.componentRef.setInput('busy', false);
    editor.reset({ ...expense, tipo: 'R' });
    editor.save(new Event('submit'));
    expect(saved).toHaveBeenCalledWith(
      expect.objectContaining({
        tipo: 'R',
        status: 'ABERTO',
        dataVencimento: '2026-10-20',
        valor: expense.valor,
      }),
    );
  });
});
