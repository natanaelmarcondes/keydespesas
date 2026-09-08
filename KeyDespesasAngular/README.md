# KeyDespesas

Controle financeiro pessoal em Angular 22 com AG Grid Community e formulários baseados em signals.

## Executar

Requer Node.js compatível com Angular 22 e npm.

```sh
npm install
npm start
```

Abra http://localhost:4200. No PowerShell com execução de scripts bloqueada, use `npm.cmd` no lugar de `npm`.

Login: **natanaelmarcondes@gmail.com**, senha **050660**. O e-mail vem preenchido. A validação é local e a sessão dura até sair ou fechar a aba. As credenciais fazem parte do frontend por solicitação; não representam autenticação no servidor. Nenhuma chamada envia Authorization.

## Funcionalidades

- Consulta mensal de despesas e receitas, resumo, saldo previsto e distribuição por categoria.
- AG Grid com ordenação, redimensionamento, paginação, busca, filtros e exportação CSV.
- Cadastro e edição com campos e validações alinhados ao TituloSalvarDto da API.
- Alternância Aberto/Pago e exclusão com confirmação.
- Consulta de categorias e detalhes.
- Interface responsiva, diálogos nativos, foco visível e mensagens de erro.

O período corresponde ao **vencimento** dos títulos. O saldo previsto é receitas menos despesas, desconsiderando cancelados. O total em aberto vem do resumo da API e inclui tanto receitas quanto despesas. As ações de pagamento só estão disponíveis para os estados ABERTO e PAGO, conforme o backend.

## API e publicação

Base de produção: https://api.keysolution.com.br, configurada em `src/environments/environment.ts`.

Em desenvolvimento, `/api` é encaminhado pelo Angular à API usando `proxy.conf.json`, evitando bloqueios de CORS. A validação TLS permanece habilitada. Navegadores não permitem reproduzir um UnsafeOkHttpClient: certificados inválidos devem ser corrigidos no servidor.

Para publicar:

1. Execute `npm run build`.
2. Hospede o conteúdo de `dist/KeyDespesasAngular/browser`.
3. Configure o servidor para retornar `index.html` nas rotas da aplicação.
4. Permita a origem do site no CORS da API, incluindo GET, POST, PUT, PATCH, DELETE e Content-Type; alternativamente, configure um proxy reverso `/api` no servidor e ajuste `environment.ts` para essa URL.

O Program.cs da API presente no repositório não configura CORS. O proxy do Angular é apenas de desenvolvimento e não acompanha os arquivos estáticos publicados.

## Verificação

```sh
npm run build
npm test -- --watch=false
```

Os testes verificam login, contratos HTTP sem autenticação, formulários, totais, filtros, cancelamento de consultas antigas e recuperação de falhas. Requisições de escrita são simuladas nos testes: não criam ou alteram dados financeiros reais.

O axe-core verifica a estrutura acessível do login e do painel no jsdom. Contraste e layout dependem de um navegador real e não são cobertos pelo jsdom.

Referência de implementação do grid: https://www.ag-grid.com/angular-data-grid/themes/
