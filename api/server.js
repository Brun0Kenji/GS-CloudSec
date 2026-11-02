// API REST de tarefas — Node.js + Express + SQLite (módulo nativo node:sqlite)
import express from "express";
import { DatabaseSync } from "node:sqlite";

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || "./tarefas.db";

const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    concluida INTEGER NOT NULL DEFAULT 0,
    criada_em TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS subtarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tarefa_id INTEGER NOT NULL REFERENCES tarefas(id) ON DELETE CASCADE,
    titulo TEXT NOT NULL,
    concluida INTEGER NOT NULL DEFAULT 0
  );
`);
// Migração: adiciona novas colunas em bancos já existentes
const colunas = db.prepare("PRAGMA table_info(tarefas)").all().map((c) => c.name);
for (const c of ["responsavel", "prazo", "descricao"]) {
  if (!colunas.includes(c)) db.exec(`ALTER TABLE tarefas ADD COLUMN ${c} TEXT`);
}

const sub = (r) => ({ ...r, concluida: Boolean(r.concluida) });
const toJson = (r) =>
  r && {
    ...r,
    concluida: Boolean(r.concluida),
    subtarefas: db.prepare("SELECT * FROM subtarefas WHERE tarefa_id = ? ORDER BY id").all(r.id).map(sub),
  };
const buscar = (id) => toJson(db.prepare("SELECT * FROM tarefas WHERE id = ?").get(id));
const texto = (v) => (v === undefined || v === null ? null : String(v).trim() || null);

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.set("Access-Control-Allow-Origin", process.env.CORS_ORIGIN || "*");
  res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.get("/", (_req, res) => res.json({ status: "ok", servico: "API de Tarefas" }));

app.get("/tarefas", (_req, res) => {
  res.json(db.prepare("SELECT * FROM tarefas ORDER BY id DESC").all().map(toJson));
});

app.get("/tarefas/:id", (req, res) => {
  const t = buscar(Number(req.params.id));
  t ? res.json(t) : res.status(404).json({ erro: "Tarefa não encontrada" });
});

app.post("/tarefas", (req, res) => {
  const b = req.body ?? {};
  const titulo = String(b.titulo ?? "").trim();
  if (!titulo) return res.status(400).json({ erro: "O campo 'titulo' é obrigatório" });
  const r = db
    .prepare("INSERT INTO tarefas (titulo, responsavel, prazo, descricao) VALUES (?, ?, ?, ?)")
    .run(titulo, texto(b.responsavel), texto(b.prazo), texto(b.descricao));
  res.status(201).json(buscar(r.lastInsertRowid));
});

app.put("/tarefas/:id", (req, res) => {
  const id = Number(req.params.id);
  const atual = db.prepare("SELECT * FROM tarefas WHERE id = ?").get(id);
  if (!atual) return res.status(404).json({ erro: "Tarefa não encontrada" });
  const b = req.body ?? {};
  const titulo = b.titulo !== undefined ? String(b.titulo).trim() : atual.titulo;
  if (!titulo) return res.status(400).json({ erro: "O campo 'titulo' não pode ser vazio" });
  const concluida = b.concluida !== undefined ? (b.concluida ? 1 : 0) : atual.concluida;
  const val = (k) => (b[k] !== undefined ? texto(b[k]) : atual[k]);
  db.prepare("UPDATE tarefas SET titulo = ?, concluida = ?, responsavel = ?, prazo = ?, descricao = ? WHERE id = ?").run(
    titulo, concluida, val("responsavel"), val("prazo"), val("descricao"), id,
  );
  res.json(buscar(id));
});

app.delete("/tarefas/:id", (req, res) => {
  const r = db.prepare("DELETE FROM tarefas WHERE id = ?").run(Number(req.params.id));
  r.changes ? res.sendStatus(204) : res.status(404).json({ erro: "Tarefa não encontrada" });
});

// Subtarefas
app.post("/tarefas/:id/subtarefas", (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare("SELECT id FROM tarefas WHERE id = ?").get(id)) return res.status(404).json({ erro: "Tarefa não encontrada" });
  const titulo = String(req.body?.titulo ?? "").trim();
  if (!titulo) return res.status(400).json({ erro: "O campo 'titulo' é obrigatório" });
  const r = db.prepare("INSERT INTO subtarefas (tarefa_id, titulo) VALUES (?, ?)").run(id, titulo);
  res.status(201).json(sub(db.prepare("SELECT * FROM subtarefas WHERE id = ?").get(r.lastInsertRowid)));
});

app.put("/subtarefas/:id", (req, res) => {
  const id = Number(req.params.id);
  const atual = db.prepare("SELECT * FROM subtarefas WHERE id = ?").get(id);
  if (!atual) return res.status(404).json({ erro: "Subtarefa não encontrada" });
  const titulo = req.body?.titulo !== undefined ? String(req.body.titulo).trim() : atual.titulo;
  if (!titulo) return res.status(400).json({ erro: "O campo 'titulo' não pode ser vazio" });
  const concluida = req.body?.concluida !== undefined ? (req.body.concluida ? 1 : 0) : atual.concluida;
  db.prepare("UPDATE subtarefas SET titulo = ?, concluida = ? WHERE id = ?").run(titulo, concluida, id);
  res.json(sub(db.prepare("SELECT * FROM subtarefas WHERE id = ?").get(id)));
});

app.delete("/subtarefas/:id", (req, res) => {
  const r = db.prepare("DELETE FROM subtarefas WHERE id = ?").run(Number(req.params.id));
  r.changes ? res.sendStatus(204) : res.status(404).json({ erro: "Subtarefa não encontrada" });
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
