import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CopyMonth, monthCopyPayload } from './copy-month';
import { Titulo } from './core/api';
import { environment } from '../environments/environment';

describe('Copy whole month', () => {
  const expense: Titulo = {
    id: 1,
    tipo: 'P',
    descricao: 'Internet',
    idCategoria: 15,
    categoriaNome: 'Consumo',
    dataEmissao: '2026-01-01T00:00:00',
    dataVencimento: '2026-01-31T00:00:00',
    valor: 150,
    status: 'PAGO',
  };
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('preserves original fields, resets status and clamps the next due date', () => {
    expect(monthCopyPayload(expense)).toEqual({
      tipo: 'P',
      descricao: 'Internet',
      idCategoria: 15,
      dataEmissao: '2026-01-01',
      dataVencimento: '2026-02-28',
      valor: 150,
      status: 'ABERTO',
    });
    expect(expense.status).toBe('PAGO');
  });

  it('copies expenses and revenues sequentially and prevents duplicate submissions', async () => {
    const component = TestBed.createComponent(CopyMonth).componentInstance;
    component.reset(
      [expense, { ...expense, id: 2, tipo: 'R', dataVencimento: '2026-01-15' }],
      '2026-01',
    );
    const task = component.copy();
    await component.copy();
    const first = http.expectOne(environment.apiUrl + '/Titulos');
    expect(first.request.body.tipo).toBe('P');
    first.flush({});
    await Promise.resolve();
    const second = http.expectOne(environment.apiUrl + '/Titulos');
    expect(second.request.body.tipo).toBe('R');
    expect(second.request.body.dataVencimento).toBe('2026-02-15');
    second.flush({});
    await task;
    expect(component.copied()).toBe(2);
    expect(component.running()).toBe(false);
    expect(component.destination()).toBe('2026-02');
    await component.copy();
    http.expectNone(environment.apiUrl + '/Titulos');
  });

  it('stops on failure, preserves confirmed progress and does not automatically retry', async () => {
    const component = TestBed.createComponent(CopyMonth).componentInstance;
    component.reset([expense, { ...expense, id: 2 }, { ...expense, id: 3 }], '2026-01');
    const task = component.copy();
    http.expectOne(environment.apiUrl + '/Titulos').flush({});
    await Promise.resolve();
    http.expectOne(environment.apiUrl + '/Titulos').flush({}, { status: 500, statusText: 'Error' });
    await task;
    expect(component.copied()).toBe(1);
    expect(component.error()).toBeTruthy();
    expect(component.running()).toBe(false);
    await component.copy();
    http.expectNone(environment.apiUrl + '/Titulos');
  });

  it('rejects empty months and dates beyond the API limit', async () => {
    const component = TestBed.createComponent(CopyMonth).componentInstance;
    component.reset([], '2026-01');
    await component.copy();
    component.reset([expense], '2100-12');
    await component.copy();
    http.expectNone(environment.apiUrl + '/Titulos');
    expect(component.attempted()).toBe(false);
  });
});
