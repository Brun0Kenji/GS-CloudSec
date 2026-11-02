import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

const API = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:3000";

type Tarefa = { id: number; titulo: string; concluida: boolean; criada_em: string };

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tarefas — CRUD com API e SQLite" },
      { name: "description", content: "Lista de tarefas consumindo uma API REST com banco SQLite." },
      { property: "og:title", content: "Tarefas — CRUD com API e SQLite" },
      { property: "og:description", content: "Lista de tarefas consumindo uma API REST com banco SQLite." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [titulo, setTitulo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [editando, setEditando] = useState<number | null>(null);
  const [textoEdicao, setTextoEdicao] = useState("");

  async function chamar(path: string, init?: RequestInit) {
    try {
      setErro(null);
      const r = await fetch(API + path, { headers: { "Content-Type": "application/json" }, ...init });
      if (!r.ok && r.status !== 204) throw new Error((await r.json()).erro ?? "Erro na API");
      return r.status === 204 ? null : r.json();
    } catch (e) {
      setErro(e instanceof Error && e.message !== "Failed to fetch" ? e.message : `Não foi possível conectar à API (${API})`);
      return undefined;
    }
  }

  const carregar = async () => {
    const d = await chamar("/tarefas");
    if (d) setTarefas(d);
  };
  useEffect(() => {
    carregar();
  }, []);

  async function criar(e: FormEvent) {
    e.preventDefault();
    if (!titulo.trim()) return;
    if (await chamar("/tarefas", { method: "POST", body: JSON.stringify({ titulo }) })) {
      setTitulo("");
      carregar();
    }
  }
  async function atualizar(id: number, dados: Partial<Tarefa>) {
    if (await chamar(`/tarefas/${id}`, { method: "PUT", body: JSON.stringify(dados) })) carregar();
  }
  async function remover(id: number) {
    if ((await chamar(`/tarefas/${id}`, { method: "DELETE" })) !== undefined) carregar();
  }

  const feitas = tarefas.filter((t) => t.concluida).length;

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-xl">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">API REST · SQLite</p>
        <h1 className="mt-2 font-display text-5xl text-foreground">Minhas tarefas</h1>
        <p className="mt-2 text-muted-foreground">
          {tarefas.length} tarefas · {feitas} concluídas
        </p>

        <form onSubmit={criar} className="mt-8 flex gap-2">
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Nova tarefa..."
            className="flex-1 rounded-md border border-input bg-card px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          <button className="rounded-md bg-primary px-5 font-medium text-primary-foreground hover:opacity-90">
            Adicionar
          </button>
        </form>

        {erro && <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{erro}</p>}

        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
          {tarefas.length === 0 && <li className="px-4 py-8 text-center text-muted-foreground">Nenhuma tarefa ainda.</li>}
          {tarefas.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-4 py-3">
              <input
                type="checkbox"
                checked={t.concluida}
                onChange={() => atualizar(t.id, { concluida: !t.concluida })}
                className="h-5 w-5 accent-primary"
                aria-label="Concluir"
              />
              {editando === t.id ? (
                <input
                  autoFocus
                  value={textoEdicao}
                  onChange={(e) => setTextoEdicao(e.target.value)}
                  onBlur={() => {
                    setEditando(null);
                    if (textoEdicao.trim() && textoEdicao !== t.titulo) atualizar(t.id, { titulo: textoEdicao });
                  }}
                  onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
                  className="flex-1 rounded border border-input bg-background px-2 py-1 text-foreground"
                />
              ) : (
                <span
                  onDoubleClick={() => {
                    setEditando(t.id);
                    setTextoEdicao(t.titulo);
                  }}
                  className={`flex-1 ${t.concluida ? "text-muted-foreground line-through" : "text-foreground"}`}
                  title="Clique duas vezes para editar"
                >
                  {t.titulo}
                </span>
              )}
              <button onClick={() => remover(t.id)} className="text-sm text-muted-foreground hover:text-destructive">
                Excluir
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">Clique duas vezes numa tarefa para editar.</p>
      </div>
    </main>
  );
}
