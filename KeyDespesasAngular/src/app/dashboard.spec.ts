import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import { Dashboard } from './dashboard';
import { Titulo } from './core/api';
import { environment } from '../environments/environment';
import axe from 'axe-core';
registerLocaleData(localePt);
describe('Dashboard', () => {
  let http: HttpTestingController;
  const title: Titulo = {
    id: 1,
    tipo: 'P',
    descricao: 'Conta de luz',
    idCategoria: 15,
    categoriaNome: 'CONSUMO',
    valor: 200,
    dataEmissao: '2026-09-01T00:00:00',
    dataVencimento: '2026-09-20T00:00:00',
    status: 'ABERTO',
  };
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [Dashboard],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  function respond(rows: Titulo[] = []) {
    http.expectOne(environment.apiUrl + '/categorias').flush([{ id: 15, nome: 'CONSUMO' }]);
    http.expectOne((r) => r.url === environment.apiUrl + '/titulos').flush(rows);
    http.expectOne((r) => r.url.endsWith('/resumo-mes')).flush({ totalAberto: 200, totalPago: 0 });
  }
  it('separates monthly cards by type and payment status independently of grid filters', () => {
    const app = TestBed.createComponent(Dashboard).componentInstance;
    respond([
      title,
      { ...title, id: 2, tipo: 'R', valor: 1000 },
      { ...title, id: 3, tipo: 'R', status: 'PAGO', valor: 500 },
      { ...title, id: 4, status: 'PAGO', valor: 80 },
      { ...title, id: 5, status: 'CANCELADO', valor: 9999 },
      { ...title, id: 6, tipo: 'R', status: 'VENCIDO', valor: 9999 },
    ]);
    app.type.set('R');
    app.status.set('PAGO');
    expect(app.summaryCards().map((card) => card.total)).toEqual([1000, 500, 200, 80]);
    app.titles.set([]);
    expect(app.summaryCards().map((card) => card.total)).toEqual([0, 0, 0, 0]);
  });
  it('creates a copy once and shows its destination month after success', () => {
    const app = TestBed.createComponent(Dashboard).componentInstance;
    respond([title]);
    const close = vi.spyOn(app, 'closeCopy').mockImplementation(() => {});
    const copy = {
      tipo: 'P' as const,
      descricao: title.descricao,
      idCategoria: title.idCategoria,
      valor: title.valor,
      dataEmissao: '2026-09-01',
      dataVencimento: '2026-10-20',
      status: 'ABERTO',
    };
    app.copyExpense(copy);
    app.copyExpense(copy);
    const request = http.expectOne(environment.apiUrl + '/Titulos');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(copy);
    request.flush({ id: 99 });
    expect(close).toHaveBeenCalledOnce();
    expect(app.period()).toBe('2026-10');
    http.expectOne(environment.apiUrl + '/titulos?ano=2026&mes=10').flush([]);
    http.expectOne(environment.apiUrl + '/titulos/resumo-mes?ano=2026&mes=10').flush({});
    expect(app.busy()).toBe(false);
  });
  it('keeps the copy dialog open when creation fails', () => {
    const app = TestBed.createComponent(Dashboard).componentInstance;
    respond([title]);
    const close = vi.spyOn(app, 'closeCopy').mockImplementation(() => {});
    const period = app.period();
    app.copyExpense({
      tipo: 'P',
      descricao: title.descricao,
      idCategoria: title.idCategoria,
      valor: title.valor,
      dataEmissao: '2026-09-01',
      dataVencimento: '2026-10-20',
      status: 'ABERTO',
    });
    http.expectOne(environment.apiUrl + '/Titulos').flush({}, { status: 500, statusText: 'Error' });
    expect(close).not.toHaveBeenCalled();
    expect(app.modalError()).toContain('copiar');
    expect(app.period()).toBe(period);
    expect(app.busy()).toBe(false);
  });
  it('separates revenue and expenses, excludes cancelled titles, and combines filters', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const app = fixture.componentInstance;
    respond([
      title,
      { ...title, id: 2, tipo: 'R', valor: 1000 },
      { ...title, id: 3, status: 'CANCELADO', valor: 9999 },
    ]);
    expect(app.expenses()).toBe(200);
    expect(app.income()).toBe(1000);
    expect(app.balance()).toBe(800);
    app.type.set('P');
    app.status.set('ABERTO');
    app.query.set('LUZ');
    expect(app.filtered()).toEqual([title]);
  });
  it('cancels stale monthly requests when the month changes', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const app = fixture.componentInstance;
    http.expectOne(environment.apiUrl + '/categorias').flush([]);
    const old = http.expectOne((r) => r.url === environment.apiUrl + '/titulos');
    const oldSummary = http.expectOne((r) => r.url.endsWith('/resumo-mes'));
    app.changePeriod('2027-01');
    expect(old.cancelled).toBe(true);
    expect(oldSummary.cancelled).toBe(true);
    http.expectOne(environment.apiUrl + '/titulos?ano=2027&mes=1').flush([title]);
    http.expectOne(environment.apiUrl + '/titulos/resumo-mes?ano=2027&mes=1').flush({});
    expect(app.titles()).toEqual([title]);
    expect(app.loading()).toBe(false);
  });
  it('preserves title data when only the summary fails and allows retry', () => {
    const fixture = TestBed.createComponent(Dashboard);
    const app = fixture.componentInstance;
    http.expectOne(environment.apiUrl + '/categorias').flush([]);
    http.expectOne((r) => r.url === environment.apiUrl + '/titulos').flush([title]);
    http
      .expectOne((r) => r.url.endsWith('/resumo-mes'))
      .flush({}, { status: 500, statusText: 'Error' });
    expect(app.titles()).toEqual([title]);
    expect(app.summaryError()).toBeTruthy();
    app.refresh();
    http.expectOne((r) => r.url === environment.apiUrl + '/titulos').flush([]);
    http.expectOne((r) => r.url.endsWith('/resumo-mes')).flush({});
    expect(app.summaryError()).toBe('');
    expect(app.titles()).toEqual([]);
  });
  it('renders the dashboard without axe violations detectable in jsdom', async () => {
    const fixture = TestBed.createComponent(Dashboard);
    respond([title]);
    await fixture.whenStable();
    const results = await axe.run(fixture.nativeElement as HTMLElement, {
      rules: { 'color-contrast': { enabled: false } },
    });
    expect(
      results.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.html) })),
    ).toEqual([]);
  }, 30000);
});
