// API REST de tarefas — Node.js + Express + SQLite (módulo nativo node:sqlite)
import express from "express";
import { DatabaseSync } from "node:sqlite";

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || "./tarefas.db";

const db = new DatabaseSync(DB_PATH);
db.exec(`
  CREATE TABLE IF NOT EXISTS tarefas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    concluida INTEGER NOT NULL DEFAULT 0,
    criada_em TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const toJson = (r) => r && { ...r, concluida: Boolean(r.concluida) };
const app = express();
app.use(express.json());

// CORS: permite que o front-end hospedado em outro domínio chame a API
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
  const t = db.prepare("SELECT * FROM tarefas WHERE id = ?").get(Number(req.params.id));
  t ? res.json(toJson(t)) : res.status(404).json({ erro: "Tarefa não encontrada" });
});

app.post("/tarefas", (req, res) => {
  const titulo = String(req.body?.titulo ?? "").trim();
  if (!titulo) return res.status(400).json({ erro: "O campo 'titulo' é obrigatório" });
  const r = db.prepare("INSERT INTO tarefas (titulo) VALUES (?)").run(titulo);
  res.status(201).json(toJson(db.prepare("SELECT * FROM tarefas WHERE id = ?").get(r.lastInsertRowid)));
});

app.put("/tarefas/:id", (req, res) => {
  const id = Number(req.params.id);
  const atual = db.prepare("SELECT * FROM tarefas WHERE id = ?").get(id);
  if (!atual) return res.status(404).json({ erro: "Tarefa não encontrada" });
  const titulo = req.body?.titulo !== undefined ? String(req.body.titulo).trim() : atual.titulo;
  if (!titulo) return res.status(400).json({ erro: "O campo 'titulo' não pode ser vazio" });
  const concluida = req.body?.concluida !== undefined ? (req.body.concluida ? 1 : 0) : atual.concluida;
  db.prepare("UPDATE tarefas SET titulo = ?, concluida = ? WHERE id = ?").run(titulo, concluida, id);
  res.json(toJson(db.prepare("SELECT * FROM tarefas WHERE id = ?").get(id)));
});

app.delete("/tarefas/:id", (req, res) => {
  const r = db.prepare("DELETE FROM tarefas WHERE id = ?").run(Number(req.params.id));
  r.changes ? res.sendStatus(204) : res.status(404).json({ erro: "Tarefa não encontrada" });
});

app.listen(PORT, () => console.log(`API rodando na porta ${PORT}`));
