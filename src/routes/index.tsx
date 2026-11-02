import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";

const API = (import.meta.env["VITE_API_URL"] as string | undefined) ?? "http://localhost:3000";

type Subtarefa = { id: number; tarefa_id: number; titulo: string; concluida: boolean };
type Tarefa = {
  id: number;
  titulo: string;
  concluida: boolean;
  criada_em: string;
  responsavel: string | null;
  prazo: string | null;
  descricao: string | null;
  subtarefas: Subtarefa[];
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tarefas" },
      { name: "description", content: "Lista de tarefas." },
      { property: "og:title", content: "Tarefas" },
      { property: "og:description", content: "Lista de tarefas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const campo =
  "rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring";

function formatarData(d: string) {
  const [a, m, dia] = d.split("-");
  return `${dia}/${m}/${a}`;
}

function Index() {
  const [tarefas, setTarefas] = useState<Tarefa[]>([]);
  const [form, setForm] = useState({ titulo: "", responsavel: "", prazo: "", descricao: "" });
  const [erro, setErro] = useState<string | null>(null);
  const [aberta, setAberta] = useState<number | null>(null);

  async function chamar(path: string, init?: RequestInit) {
    try {
      setErro(null);
      const r = await fetch(API + path, {
        headers: { "Content-Type": "application/json" },
        ...init,
      });
      if (!r.ok && r.status !== 204) throw new Error((await r.json()).erro ?? "Erro na API");
      return r.status === 204 ? null : r.json();
    } catch (e) {
      setErro(
        e instanceof Error && e.message !== "Failed to fetch"
          ? e.message
          : `Não foi possível conectar à API (${API})`,
      );
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
    if (!form.titulo.trim()) return;
    if (await chamar("/tarefas", { method: "POST", body: JSON.stringify(form) })) {
      setForm({ titulo: "", responsavel: "", prazo: "", descricao: "" });
      carregar();
    }
  }
  async function atualizar(id: number, dados: Record<string, unknown>) {
    if (await chamar(`/tarefas/${id}`, { method: "PUT", body: JSON.stringify(dados) })) carregar();
  }
  async function remover(id: number) {
    if ((await chamar(`/tarefas/${id}`, { method: "DELETE" })) !== undefined) carregar();
  }
  async function criarSub(id: number, titulo: string) {
    if (
      await chamar(`/tarefas/${id}/subtarefas`, {
        method: "POST",
        body: JSON.stringify({ titulo }),
      })
    )
      carregar();
  }
  async function atualizarSub(id: number, dados: Record<string, unknown>) {
    if (await chamar(`/subtarefas/${id}`, { method: "PUT", body: JSON.stringify(dados) }))
      carregar();
  }
  async function removerSub(id: number) {
    if ((await chamar(`/subtarefas/${id}`, { method: "DELETE" })) !== undefined) carregar();
  }

  const feitas = tarefas.filter((t) => t.concluida).length;
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="min-h-screen bg-background px-4 py-16">
      <div className="mx-auto max-w-2xl">
        <p className="font-mono text-xs uppercase tracking-widest text-primary">
          Planner de tarefas
        </p>
        <h1 className="mt-2 font-display text-5xl text-foreground">Minhas tarefas</h1>
        <p className="mt-2 text-muted-foreground">
          {tarefas.length} tarefas · {feitas} concluídas
        </p>

        <form
          onSubmit={criar}
          className="mt-8 grid gap-2 rounded-md border border-border bg-card p-4 sm:grid-cols-2"
        >
          <input
            value={form.titulo}
            onChange={(e) => setForm({ ...form, titulo: e.target.value })}
            placeholder="Nova tarefa..."
            className={`${campo} sm:col-span-2`}
          />
          <input
            value={form.responsavel}
            onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
            placeholder="De quem é? (responsável)"
            className={campo}
          />
          <input
            type="date"
            value={form.prazo}
            onChange={(e) => setForm({ ...form, prazo: e.target.value })}
            className={campo}
            aria-label="Prazo"
          />
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            placeholder="Descrição (opcional)"
            rows={2}
            className={`${campo} sm:col-span-2`}
          />
          <button className="rounded-md bg-primary px-5 py-2 font-medium text-primary-foreground hover:opacity-90 sm:col-span-2">
            Adicionar
          </button>
        </form>

        {erro && (
          <p className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {erro}
          </p>
        )}

        <ul className="mt-6 divide-y divide-border rounded-md border border-border bg-card">
          {tarefas.length === 0 && (
            <li className="px-4 py-8 text-center text-muted-foreground">Nenhuma tarefa ainda.</li>
          )}
          {tarefas.map((t) => {
            const subFeitas = t.subtarefas.filter((s) => s.concluida).length;
            const atrasada = t.prazo && !t.concluida && t.prazo < hoje;
            return (
              <li key={t.id} className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={t.concluida}
                    onChange={() => atualizar(t.id, { concluida: !t.concluida })}
                    className="h-5 w-5 accent-primary"
                    aria-label="Concluir"
                  />
                  <button
                    onClick={() => setAberta(aberta === t.id ? null : t.id)}
                    className="flex-1 text-left"
                  >
                    <span
                      className={
                        t.concluida ? "text-muted-foreground line-through" : "text-foreground"
                      }
                    >
                      {t.titulo}
                    </span>
                    <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      {t.responsavel && <span>👤 {t.responsavel}</span>}
                      {t.prazo && (
                        <span className={atrasada ? "text-destructive" : ""}>
                          📅 {formatarData(t.prazo)}
                        </span>
                      )}
                      {t.subtarefas.length > 0 && (
                        <span>
                          ☑ {subFeitas}/{t.subtarefas.length}
                        </span>
                      )}
                    </span>
                  </button>
                  <button
                    onClick={() => remover(t.id)}
                    className="text-sm text-muted-foreground hover:text-destructive"
                  >
                    Excluir
                  </button>
                </div>
                {aberta === t.id && (
                  <Detalhes
                    t={t}
                    atualizar={atualizar}
                    criarSub={criarSub}
                    atualizarSub={atualizarSub}
                    removerSub={removerSub}
                  />
                )}
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Clique numa tarefa para ver e editar os detalhes.
        </p>
      </div>
    </main>
  );
}

function Detalhes({
  t,
  atualizar,
  criarSub,
  atualizarSub,
  removerSub,
}: {
  t: Tarefa;
  atualizar: (id: number, d: Record<string, unknown>) => void;
  criarSub: (id: number, titulo: string) => void;
  atualizarSub: (id: number, d: Record<string, unknown>) => void;
  removerSub: (id: number) => void;
}) {
  const [d, setD] = useState({
    titulo: t.titulo,
    responsavel: t.responsavel ?? "",
    prazo: t.prazo ?? "",
    descricao: t.descricao ?? "",
  });
  const [novaSub, setNovaSub] = useState("");

  return (
    <div className="mt-3 grid gap-2 rounded-md bg-background p-3 sm:grid-cols-2">
      <input
        value={d.titulo}
        onChange={(e) => setD({ ...d, titulo: e.target.value })}
        className={`${campo} sm:col-span-2`}
        aria-label="Título"
      />
      <input
        value={d.responsavel}
        onChange={(e) => setD({ ...d, responsavel: e.target.value })}
        placeholder="Responsável"
        className={campo}
      />
      <input
        type="date"
        value={d.prazo}
        onChange={(e) => setD({ ...d, prazo: e.target.value })}
        className={campo}
        aria-label="Prazo"
      />
      <textarea
        value={d.descricao}
        onChange={(e) => setD({ ...d, descricao: e.target.value })}
        placeholder="Descrição"
        rows={3}
        className={`${campo} sm:col-span-2`}
      />
      <button
        onClick={() => atualizar(t.id, d)}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 sm:col-span-2"
      >
        Salvar alterações
      </button>

      <div className="sm:col-span-2">
        <p className="mb-1 mt-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Subtarefas
        </p>
        <ul className="space-y-1">
          {t.subtarefas.map((s) => (
            <li key={s.id} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={s.concluida}
                onChange={() => atualizarSub(s.id, { concluida: !s.concluida })}
                className="h-4 w-4 accent-primary"
                aria-label="Concluir subtarefa"
              />
              <span
                className={`flex-1 ${s.concluida ? "text-muted-foreground line-through" : "text-foreground"}`}
              >
                {s.titulo}
              </span>
              <button
                onClick={() => removerSub(s.id)}
                className="text-xs text-muted-foreground hover:text-destructive"
              >
                remover
              </button>
            </li>
          ))}
        </ul>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!novaSub.trim()) return;
            criarSub(t.id, novaSub);
            setNovaSub("");
          }}
          className="mt-2 flex gap-2"
        >
          <input
            value={novaSub}
            onChange={(e) => setNovaSub(e.target.value)}
            placeholder="Nova subtarefa..."
            className={`${campo} flex-1`}
          />
          <button className="rounded-md border border-border px-3 text-sm text-foreground hover:bg-card">
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
}
