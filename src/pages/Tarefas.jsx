import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "../firebase-adapter";
import { listenProjetos } from "../services/projetosService";
import {
  criarTarefa,
  listenTarefas,
  atualizarTarefa,
  apagarTarefa,
  arquivarTarefa,
  desarquivarTarefa,
} from "../services/tarefasService";

export default function Tarefas() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");

  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState("");

  const [tarefas, setTarefas] = useState([]);
  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);

  const [form, setForm] = useState({ nome: "", inicio: "", fim: "", status: "A fazer" });

  useEffect(() => {
    const unsub = onAuthStateChanged((u) => setUser(u || null));
    return () => unsub?.();
  }, []);

  useEffect(() => {
    setErro("");
    if (!user) return;

    let unsub = null;
    try {
      unsub = listenProjetos({
        incluirArquivados: true,
        onData: (items) => {
          setProjetos(items);
          if (!projetoId && items[0]?.id) setProjetoId(items[0].id);
        },
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    setErro("");
    if (!user || !projetoId) {
      setTarefas([]);
      return;
    }

    let unsub = null;
    try {
      unsub = listenTarefas({
        projetoId,
        incluirArquivadas: mostrarConcluidas,
        onData: setTarefas,
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
  }, [user, projetoId, mostrarConcluidas]);

  const projetoAtual = useMemo(() => projetos.find((p) => p.id === projetoId) || null, [projetos, projetoId]);

  async function handleCriar() {
    setErro("");
    try {
      await criarTarefa({
        projetoId,
        nome: form.nome,
        inicio: form.inicio || null,
        fim: form.fim || null,
        status: form.status,
        ordem: tarefas.length,
      });
      setForm({ nome: "", inicio: "", fim: "", status: "A fazer" });
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ opacity: 0.85 }}>
          {user ? <>Logado: <b>{user.email}</b></> : "Aguardando autenticação..."}
        </div>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} className="crono-input">
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || "(sem nome)"}{p.arquivado ? " [ARQ]" : ""}
              </option>
            ))}
          </select>

          <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="checkbox" checked={mostrarConcluidas} onChange={(e) => setMostrarConcluidas(e.target.checked)} />
            Mostrar concluídas
          </label>
        </div>
      </div>

      {erro && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(220,60,60,0.18)", border: "1px solid rgba(220,60,60,0.35)" }}>
          <b>Erro:</b> {erro}
        </div>
      )}

      <div style={{ marginTop: 14, opacity: 0.85 }}>
        Projeto: <b>{projetoAtual?.nome || "—"}</b>
      </div>

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 180px 120px", gap: 10 }}>
          <input value={form.nome} onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))} placeholder="Nome da tarefa" className="crono-input" />
          <input value={form.inicio} onChange={(e) => setForm((s) => ({ ...s, inicio: e.target.value }))} placeholder="Início (YYYY-MM-DD)" className="crono-input" />
          <input value={form.fim} onChange={(e) => setForm((s) => ({ ...s, fim: e.target.value }))} placeholder="Fim (YYYY-MM-DD)" className="crono-input" />
          <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="crono-input">
            <option>A fazer</option>
            <option>Fazendo</option>
            <option>Concluida</option>
          </select>
          <button className="crono-btn" onClick={handleCriar} disabled={!user || !form.nome.trim() || !projetoId}>
            Adicionar
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {tarefas.map((t) => (
          <div key={t.id} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.18)", background: t.arquivado ? "rgba(255,255,255,0.04)" : "transparent" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 800 }}>{t.nome || "(sem nome)"}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>
                  {t.status || "A fazer"} · {t.inicio || "—"} → {t.fim || "—"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {!t.arquivado ? (
                  <button className="crono-btn" onClick={() => arquivarTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                    Concluir
                  </button>
                ) : (
                  <button className="crono-btn" onClick={() => desarquivarTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                    Reabrir
                  </button>
                )}

                <button
                  className="crono-btn"
                  onClick={() => {
                    const novo = prompt("Editar nome da tarefa:", t.nome || "");
                    if (novo === null) return;
                    atualizarTarefa(t.id, { nome: novo }).catch((e) => setErro(String(e?.message || e)));
                  }}
                >
                  Editar
                </button>

                <button
                  className="crono-btn"
                  onClick={() => {
                    const proximo =
                      t.status === "A fazer" ? "Fazendo" : t.status === "Fazendo" ? "Concluida" : "A fazer";
                    atualizarTarefa(t.id, { status: proximo }).catch((e) => setErro(String(e?.message || e)));
                  }}
                >
                  Status
                </button>

                <button
                  className="crono-btn crono-btn-danger"
                  onClick={() => {
                    if (confirm("Apagar tarefa?")) {
                      apagarTarefa(t.id).catch((e) => setErro(String(e?.message || e)));
                    }
                  }}
                >
                  Apagar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .crono-input{
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.22);
          background: rgba(0,0,0,0.15);
          color:#fff;
          outline:none;
          min-height: 42px;
        }
        .crono-btn{
          padding:10px 12px;
          border-radius:12px;
          border:1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.12);
          color:#fff;
          cursor:pointer;
          min-height: 42px;
        }
        .crono-btn:disabled{opacity:.5; cursor:not-allowed;}
        .crono-btn-danger{
          border-color: rgba(255,120,120,0.35);
          background: rgba(255,120,120,0.16);
        }
      `}</style>
    </div>
  );
}
