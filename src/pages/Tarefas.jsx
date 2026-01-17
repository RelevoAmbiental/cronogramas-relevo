import React, { useMemo, useState } from "react";
import { useCronograma } from "../context/CronogramaContext";

function toISODate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
  try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
}

export default function Tarefas() {
  const { carregando, projetos, tarefas, criarTarefa, editarTarefa, removerTarefa } = useCronograma();
  const [filtroProjeto, setFiltroProjeto] = useState("");
  const [novoNome, setNovoNome] = useState("");
  const [novoInicio, setNovoInicio] = useState("");
  const [novoFim, setNovoFim] = useState("");
  const [novoStatus, setNovoStatus] = useState("pendente");
  const [error, setError] = useState("");
  const [salvando, setSalvando] = useState(false);

  const lista = useMemo(() => {
    const arr = filtroProjeto
      ? tarefas.filter((t) => t.projetoId === filtroProjeto)
      : tarefas;
    return arr
      .slice()
      .sort((a, b) => (toISODate(a.inicio) || "9999").localeCompare(toISODate(b.inicio) || "9999"));
  }, [tarefas, filtroProjeto]);

  async function onCreate() {
    setError("");
    if (!filtroProjeto) {
      setError("Selecione um projeto antes de criar tarefas.");
      return;
    }
    if (!novoNome.trim()) {
      setError("Nome da tarefa é obrigatório.");
      return;
    }

    setSalvando(true);
    try {
      await criarTarefa({
        projetoId: filtroProjeto,
        nome: novoNome.trim(),
        inicio: novoInicio || "",
        fim: novoFim || novoInicio || "",
        status: novoStatus,
        descricao: "",
        responsavel: "",
        categoria: "",
        produto: "",
        criadoEm: new Date(),
      });
      setNovoNome("");
      setNovoInicio("");
      setNovoFim("");
      setNovoStatus("pendente");
    } catch (e) {
      console.error(e);
      setError("Falha ao criar tarefa.");
    } finally {
      setSalvando(false);
    }
  }

  async function quickEdit(t) {
    const nome = window.prompt("Nome da tarefa:", t.nome || "");
    if (nome === null) return;
    const inicio = window.prompt("Início (YYYY-MM-DD):", toISODate(t.inicio) || "");
    if (inicio === null) return;
    const fim = window.prompt("Fim (YYYY-MM-DD):", toISODate(t.fim) || inicio || "");
    if (fim === null) return;
    await editarTarefa(t.id, { nome: nome.trim() || t.nome, inicio: (inicio || "").slice(0, 10), fim: (fim || "").slice(0, 10) });
  }

  async function toggleDone(t) {
    const st = (t.status || "pendente").toLowerCase();
    const novo = st === "concluida" ? "pendente" : "concluida";
    await editarTarefa(t.id, { status: novo });
  }

  async function onDelete(t) {
    const ok = window.confirm(`Remover tarefa “${t.nome || "(sem nome)"}”?`);
    if (!ok) return;
    await removerTarefa(t.id);
  }

  return (
    <div className="crono-page">
      <div className="crono-pagehead">
        <div>
          <h1>Tarefas</h1>
          <p>Operação: simples, limpa e sem texto invisível. (A gente gosta de ler o que escreve.)</p>
        </div>
      </div>

      <div className="crono-card">
        <div className="crono-toolbar">
          <div className="crono-field">
            <label>Projeto</label>
            <select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} disabled={carregando}>
              <option value="">— Todos —</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>

          <div className="crono-toolbar-spacer" />

          <button className="crono-btn secondary" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
            ↑ topo
          </button>
        </div>

        <div className="crono-divider" />

        <h2>Nova tarefa</h2>
        <div className="crono-form inline">
          <label>
            <span>Nome</span>
            <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Revisão de dados (gabinete)" />
          </label>
          <label>
            <span>Início</span>
            <input type="date" value={novoInicio} onChange={(e) => setNovoInicio(e.target.value)} />
          </label>
          <label>
            <span>Fim</span>
            <input type="date" value={novoFim} onChange={(e) => setNovoFim(e.target.value)} />
          </label>
          <label>
            <span>Status</span>
            <select value={novoStatus} onChange={(e) => setNovoStatus(e.target.value)}>
              <option value="pendente">pendente</option>
              <option value="em_andamento">em_andamento</option>
              <option value="concluida">concluida</option>
            </select>
          </label>
          <button className="crono-btn" onClick={onCreate} disabled={salvando || carregando}> {salvando ? "Salvando…" : "Adicionar"}</button>
        </div>
        {error && <div className="crono-alert error" style={{ marginTop: 12 }}>{error}</div>}

        <div className="crono-divider" />

        <h2>Lista</h2>
        <p className="crono-muted">Total visível: {carregando ? "…" : lista.length}.</p>

        <div className="crono-tablewrap">
          <table className="crono-table">
            <thead>
              <tr>
                <th>Início</th>
                <th>Fim</th>
                <th>Tarefa</th>
                <th>Projeto</th>
                <th>Status</th>
                <th style={{ width: 220 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando ? (
                <tr><td colSpan={6} className="crono-td-muted">Carregando…</td></tr>
              ) : lista.length === 0 ? (
                <tr><td colSpan={6} className="crono-td-muted">Nada por aqui ainda.</td></tr>
              ) : (
                lista.map((t) => (
                  <tr key={t.id}>
                    <td>{toISODate(t.inicio) || "—"}</td>
                    <td>{toISODate(t.fim) || "—"}</td>
                    <td className="crono-td-strong">{t.nome || "(sem nome)"}</td>
                    <td>{projetos.find((p) => p.id === t.projetoId)?.nome || "—"}</td>
                    <td><span className={"crono-pill " + ((t.status || "pendente").toLowerCase())}>{t.status || "pendente"}</span></td>
                    <td>
                      <div className="crono-row-actions">
                        <button className="crono-btn tiny secondary" onClick={() => quickEdit(t)}>Editar</button>
                        <button className="crono-btn tiny" onClick={() => toggleDone(t)}>{(t.status || "pendente").toLowerCase() === "concluida" ? "Reabrir" : "Concluir"}</button>
                        <button className="crono-btn tiny danger" onClick={() => onDelete(t)}>Remover</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
