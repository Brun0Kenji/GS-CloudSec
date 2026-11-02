# Tarefas — API REST com SQLite

Aplicação web de lista de tarefas (CRUD) com:

- **Front-end**: React (TanStack Start) — pasta `src/`
- **API**: Node.js + Express — pasta `api/`
- **Banco**: SQLite (módulo nativo `node:sqlite`) — arquivo `tarefas.db`

## Arquitetura

```mermaid
flowchart LR
  U[Usuário / Navegador] -->|HTTPS| F[Front-end React<br/>Lovable]
  F -->|fetch JSON| A[API Express<br/>Render]
  A -->|SQL| D[(SQLite<br/>tarefas.db em disco persistente)]
```

## Modelo de dados

```mermaid
erDiagram
  TAREFAS {
    INTEGER id PK "autoincremento"
    TEXT titulo "obrigatório"
    INTEGER concluida "0 ou 1"
    TEXT criada_em "datetime('now')"
  }
```

## Fluxo de criação de uma tarefa

```mermaid
sequenceDiagram
  participant N as Navegador
  participant A as API
  participant D as SQLite
  N->>A: POST /tarefas {"titulo":"Estudar"}
  A->>D: INSERT INTO tarefas (titulo) VALUES (?)
  D-->>A: lastInsertRowid
  A-->>N: 201 Created + tarefa em JSON
```

## Endpoints

| Método | Rota | Descrição | Respostas |
|---|---|---|---|
| GET | `/` | Status da API | 200 |
| GET | `/tarefas` | Lista todas | 200 |
| GET | `/tarefas/:id` | Busca uma | 200, 404 |
| POST | `/tarefas` | Cria (`{ "titulo": "..." }`) | 201, 400 |
| PUT | `/tarefas/:id` | Atualiza (`titulo` e/ou `concluida`) | 200, 400, 404 |
| DELETE | `/tarefas/:id` | Remove | 204, 404 |

## Rodar localmente

```bash
cd api && npm install && npm start        # API em http://localhost:3000
# em outro terminal, na raiz:
bun install && bun run dev                 # front-end em http://localhost:8080
```

## Hospedagem (ponta a ponta)

1. **GitHub**: conecte o projeto ao GitHub (Lovable → Configurações → Git).
2. **API no Render**: New → Blueprint → escolha o repositório. O `render.yaml` cria o serviço com disco persistente em `/var/data` para o SQLite.
3. **Front-end**: defina `VITE_API_URL` com a URL do Render (ex.: `https://api-tarefas.onrender.com`) e publique.

## Variáveis de ambiente (API)

| Variável | Padrão | Uso |
|---|---|---|
| `PORT` | 3000 | Porta HTTP |
| `DB_PATH` | `./tarefas.db` | Caminho do arquivo SQLite |
| `CORS_ORIGIN` | `*` | Domínio permitido do front-end |
