import { inject, Service } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Anotacao {
  id: number;
  titulo: string;
  descricao: string | null;
  dataCriacao: string;
  dataAlteracao: string | null;
  arquivada: boolean;
}

export interface AnotacaoInput {
  titulo: string;
  descricao: string;
}

@Service()
export class NotesApi {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apiUrl + '/anotacoes';

  list(incluirArquivadas = false) {
    return this.http.get<Anotacao[]>(this.url, {
      params: incluirArquivadas ? { incluirArquivadas: true } : {},
    });
  }
  get(id: number) {
    return this.http.get<Anotacao>(`${this.url}/${id}`);
  }
  create(data: AnotacaoInput) {
    return this.http.post<Anotacao>(this.url, data);
  }
  update(id: number, data: AnotacaoInput) {
    return this.http.put<void>(`${this.url}/${id}`, data);
  }
  remove(id: number) {
    return this.http.delete<void>(`${this.url}/${id}`);
  }
  archive(id: number) {
    return this.http.patch<void>(`${this.url}/${id}/arquivar`, {});
  }
  restore(id: number) {
    return this.http.patch<void>(`${this.url}/${id}/restaurar`, {});
  }
}
