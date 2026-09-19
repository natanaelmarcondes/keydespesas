import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { Api, TituloInput } from './api';
import { environment } from '../../environments/environment';
describe('API contract', () => {
  let api: Api;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(Api);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('loads the requested month and summary without authentication headers', () => {
    api.titulos(2026, 9).subscribe();
    api.resumo(2026, 9).subscribe();
    for (const endpoint of ['/titulos', '/titulos/resumo-mes']) {
      const req = http.expectOne(environment.apiUrl + endpoint + '?ano=2026&mes=9');
      expect(req.request.method).toBe('GET');
      expect(req.request.headers.has('Authorization')).toBe(false);
      req.flush(endpoint === '/titulos' ? [] : {});
    }
  });
  it('uses the server DTO for creation and editing', () => {
    const dto: TituloInput = {
      tipo: 'P',
      descricao: 'Energia',
      idCategoria: 15,
      dataEmissao: '2026-09-01',
      dataVencimento: '2026-09-10',
      valor: 123.45,
      status: 'ABERTO',
    };
    api.criar(dto).subscribe();
    const create = http.expectOne(environment.apiUrl + '/Titulos');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(dto);
    create.flush({});
    api.editar(23, dto).subscribe();
    const edit = http.expectOne(environment.apiUrl + '/Titulos/23');
    expect(edit.request.method).toBe('PUT');
    expect(edit.request.body.idCategoria).toBe(15);
    edit.flush({});
  });
  it('handles no-content responses for payment and deletion', () => {
    api.toggle(23).subscribe();
    const toggle = http.expectOne(environment.apiUrl + '/titulos/23/toggle-pago');
    expect(toggle.request.method).toBe('PATCH');
    toggle.flush(null, { status: 204, statusText: 'No Content' });
    api.excluir(23).subscribe();
    const remove = http.expectOne(environment.apiUrl + '/Titulos/23');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
  it('loads categories and category details', () => {
    api.categorias().subscribe();
    http.expectOne(environment.apiUrl + '/categorias').flush([]);
    api.categoria(15).subscribe();
    http.expectOne(environment.apiUrl + '/categorias/15').flush({ id: 15, nome: 'Energia' });
  });
  it('uses the category endpoints with the name DTO', () => {
    api.criarCategoria('Mercado').subscribe();
    const create = http.expectOne(environment.apiUrl + '/categorias');
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual({ nome: 'Mercado' });
    create.flush({ id: 16, nome: 'Mercado' });

    api.editarCategoria(16, 'Supermercado').subscribe();
    const edit = http.expectOne(environment.apiUrl + '/categorias/16');
    expect(edit.request.method).toBe('PUT');
    expect(edit.request.body).toEqual({ nome: 'Supermercado' });
    edit.flush({ id: 16, nome: 'Supermercado' });

    api.excluirCategoria(16).subscribe();
    const remove = http.expectOne(environment.apiUrl + '/categorias/16');
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null, { status: 204, statusText: 'No Content' });
  });
});
