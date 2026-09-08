import { environment } from '../../environments/environment';
import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
export interface Categoria {
  id: number;
  nome: string;
}
export interface Titulo {
  id: number;
  tipo: 'P' | 'R';
  descricao: string;
  idCategoria: number;
  categoriaNome: string;
  dataEmissao: string;
  dataVencimento: string;
  valor: number;
  status: string;
}
export type TituloInput = Omit<Titulo, 'id' | 'categoriaNome'>;
export interface Resumo {
  ano: number;
  mes: number;
  total: number;
  totalAberto: number;
  totalPago: number;
  totalVencido: number;
  totalCancelado: number;
  qtde: number;
}
@Service()
export class Api {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;
  titulos(ano: number, mes: number) {
    return this.http.get<Titulo[]>(this.base + '/titulos', { params: { ano, mes } });
  }
  resumo(ano: number, mes: number) {
    return this.http.get<Resumo>(this.base + '/titulos/resumo-mes', { params: { ano, mes } });
  }
  categorias() {
    return this.http.get<Categoria[]>(this.base + '/categorias');
  }
  categoria(id: number) {
    return this.http.get<Categoria>(this.base + '/categorias/' + id);
  }
  criar(data: TituloInput) {
    return this.http.post(this.base + '/Titulos', data);
  }
  editar(id: number, data: TituloInput) {
    return this.http.put(this.base + '/Titulos/' + id, data);
  }
  excluir(id: number) {
    return this.http.delete(this.base + '/Titulos/' + id);
  }
  toggle(id: number) {
    return this.http.patch(this.base + '/titulos/' + id + '/toggle-pago', {});
  }
}
