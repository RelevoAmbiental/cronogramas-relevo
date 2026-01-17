import React, { useMemo, useState } from "react";
import { useCronograma } from "../context/CronogramaContext";

export default function Projetos() {
  const { carregando, projetos, tarefas, criarProjeto, editarProjeto, removerProjeto } = useCronograma();

  const [novoNome, setNovoNome] = useState("");
  const [novoCliente, setNovoCliente] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [error, setError] = useState("");

  const tarefasPorProjeto = useMemo(() => {
    const map = new Map();
    for (const t of tarefas) {
      const k = t.projetoId || "";
      map.set(k, (map.get(k) || 0) + 1);
    }
    return map;
  }, [tarefas]);

  async function onCreate() {
    setError("");
    if (!novoNome.trim()) {
      setError("Dê um nome pro projeto (prometo que não vira burocracia)." );
      return;
    }
    setSalvando(true);
    try {
      await criarProjeto({
        nome: novoNome.trim(),
        cliente: novoCliente.trim(),
        status: "ativo",
        criadoEm: new Date(),
      });
      setNovoNome("");
      setNovoCliente("");
    } catch (e) {
      console.error(e);
      setError("Falha ao criar projeto.");
    } finally {
      setSalvando(false);
    }
  }

  async function onRename(id, nomeAtual) {
    const nome = window.prompt("Novo nome do projeto:", nomeAtual || "");
    if (nome === null) return;
    const trimmed = nome.trim();
    if (!trimmed) return;
    await editarProjeto(id, { nome: trimmed });
  }

  async function onSetStatus(id, statusAtual) {
    const novo = statusAtual === "ativo" ? "encerrado" : "ativo";
    await editarProjeto(id, { status: novo });
  }

  async function onDelete(id, nome) {
    const ok = window.confirm(`Remover o projeto “${nome || "(sem nome)"}”?\n\nAs tarefas continuam no banco; este botão só remove o projeto.`);
    if (!ok) return;
    await removerProjeto(id);
  }

  return (
    <div className="crono-page">
      <div className="crono-pagehead">
        <div>
          <h1>Projetos</h1>
          <p>Estruture o portfólio e mantenha o fluxo de entregáveis em dia.</p>
        </div>
      </div>

      <div className="crono-grid two">
        <div className="crono-card">
          <h2>Novo projeto</h2>
          <p className="crono-muted">Cria o contêiner. As tarefas vêm depois (ou via IA).</p>

          <div className="crono-form">
            <label>
              <span>Nome</span>
              <input value={novoNome} onChange={(e) => setNovoNome(e.target.value)} placeholder="Ex.: Monitoramento espeleológico – Parauapebas" />
            </label>

            <label>
              <span>Cliente</span>
              <input value={novoCliente} onChange={(e) => setNovoCliente(e.target.value)} placeholder="Ex.: Contratante X" />
            </label>

            {error && <div className="crono-alert error">{error}</div>}

            <button className="crono-btn" onClick={onCreate} disabled={salvando || carregando}>
              {salvando ? "Salvando…" : "Criar projeto"}
            </button>
          </div>
        </div>

        <div className="crono-card">
          <h2>Lista</h2>
          <p className="crono-muted">Você tem {carregando ? "…" : projetos.length} projetos cadastrados.</p>

          <div className="crono-tablewrap">
            <table className="crono-table">
              <thead>
                <tr>
                  <th>Projeto</th>
                  <th>Cliente</th>
                  <th>Tarefas</th>
                  <th>Status</th>
                  <th style={{ width: 220 }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={5} className="crono-td-muted">Carregando…</td></tr>
                ) : projetos.length === 0 ? (
                  <tr><td colSpan={5} className="crono-td-muted">Nenhum projeto ainda.</td></tr>
                ) : (
                  projetos
                    .slice()
                    .sort((a, b) => (a.nome || "").localeCompare(b.nome || ""))
                    .map((p) => (
                      <tr key={p.id}>
                        <td className="crono-td-strong">{p.nome || "(sem nome)"}</td>
                        <td>{p.cliente || "—"}</td>
                        <td>{tarefasPorProjeto.get(p.id) || 0}</td>
                        <td><span className={"crono-pill " + (p.status || "ativo")}>{p.status || "ativo"}</span></td>
                        <td>
                          <div className="crono-row-actions">
                            <button className="crono-btn tiny secondary" onClick={() => onRename(p.id, p.nome)}>Renomear</button>
                            <button className="crono-btn tiny secondary" onClick={() => onSetStatus(p.id, p.status || "ativo")}>Ativar/Encerrar</button>
                            <button className="crono-btn tiny danger" onClick={() => onDelete(p.id, p.nome)}>Remover</button>
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
    </div>
  );
}
