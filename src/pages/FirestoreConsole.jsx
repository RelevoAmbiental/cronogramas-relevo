// src/pages/FirestoreConsole.jsx
import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "../firebase-adapter";
import {
  criarProjeto,
  listenProjetos,
  atualizarProjeto,
  apagarProjeto,
  arquivarProjeto,
  desarquivarProjeto,
} from "../services/projetosService";
import {
  criarTarefa,
  listenTarefas,
  atualizarTarefa,
  apagarTarefa,
  arquivarTarefa,
  desarquivarTarefa,
} from "../services/tarefasService";

export default function FirestoreConsole() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");

  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState("");

  const [tarefas, setTarefas] = useState([]);

  const [novoProjeto, setNovoProjeto] = useState({
    nome: "",
    cliente: "Relevo Consultoria",
    cor: "#0a4723",
    descricao: "",
  });

  const [novaTarefa, setNovaTarefa] = useState({
    nome: "",
    inicio: "",
    fim: "",
    status: "A fazer",
  });

  const [mostrarProjetosArquivados, setMostrarProjetosArquivados] = useState(false);
  const [mostrarTarefasArquivadas, setMostrarTarefasArquivadas] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged((u) => setUser(u || null));
    return () => unsub?.();
  }, []);

  // Projetos
  useEffect(() => {
    setErro("");
    if (!user) return;

    let unsub = null;
    try {
      unsub = listenProjetos({
        incluirArquivados: mostrarProjetosArquivados,
        onData: (items) => {
          setProjetos(items);
          if (!projetoId && items[0]?.id) setProjetoId(items[0].id);
          if (projetoId && !items.some((p) => p.id === projetoId)) {
            setProjetoId(items[0]?.id || "");
          }
        },
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, mostrarProjetosArquivados]);

  // Tarefas
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
        incluirArquivadas: mostrarTarefasArquivadas,
        onData: setTarefas,
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
  }, [user, projetoId, mostrarTarefasArquivadas]);

  async function handleCriarProjeto() {
    setErro("");
    try {
      const id = await criarProjeto({
        nome: novoProjeto.nome,
        cliente: novoProjeto.cliente,
        cor: novoProjeto.cor,
        descricao: novoProjeto.descricao,
        status: "ativo",
      });
      setNovoProjeto({ nome: "", cliente: "Relevo Consultoria", cor: "#0a4723", descricao: "" });
      setProjetoId(id);
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  async function handleCriarTarefa() {
    setErro("");
    try {
      await criarTarefa({
        projetoId,
        nome: novaTarefa.nome,
        inicio: novaTarefa.inicio || null,
        fim: novaTarefa.fim || null,
        status: novaTarefa.status,
        ordem: tarefas.length,
      });
      setNovaTarefa({ nome: "", inicio: "", fim: "", status: "A fazer" });
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  const projetoAtual = useMemo(
    () => projetos.find((p) => p.id === projetoId) || null,
    [projetos, projetoId]
  );

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: "0 auto", color: "#fff" }}>
      <h2 style={{ margin: "0 0 8px" }}>Cronograma → Firestore (Projetos + Tarefas)</h2>
      <div style={{ opacity: 0.85, marginBottom: 12 }}>
        {user ? <>Logado como <b>{user.email}</b></> : "Aguardando autenticação do Portal..."}
      </div>

      {erro && (
        <div style={{ background: "rgba(220,60,60,0.25)", border: "1px solid rgba(220,60,60,0.35)", padding: 12, borderRadius: 12, marginBottom: 12 }}>
          <b>Erro:</b> {erro}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>
        {/* Projetos */}
        <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", padding: 14, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>Projetos</h3>
            <label style={{ fontSize: 12, opacity: 0.9, display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={mostrarProjetosArquivados} onChange={(e) => setMostrarProjetosArquivados(e.target.checked)} />
              Mostrar arquivados
            </label>
          </div>

          <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <input
              value={novoProjeto.nome}
              onChange={(e) => setNovoProjeto((s) => ({ ...s, nome: e.target.value }))}
              placeholder="Nome do projeto"
              style={inputStyle}
            />
            <input
              value={novoProjeto.cliente}
              onChange={(e) => setNovoProjeto((s) => ({ ...s, cliente: e.target.value }))}
              placeholder="Cliente"
              style={inputStyle}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={novoProjeto.cor}
                onChange={(e) => setNovoProjeto((s) => ({ ...s, cor: e.target.value }))}
                placeholder="#0a4723"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={handleCriarProjeto} disabled={!user || !novoProjeto.nome.trim()} style={btnStyle}>
                Criar
              </button>
            </div>
            <textarea
              value={novoProjeto.descricao}
              onChange={(e) => setNovoProjeto((s) => ({ ...s, descricao: e.target.value }))}
              placeholder="Descrição (opcional)"
              style={{ ...inputStyle, minHeight: 70 }}
            />
          </div>

          <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
            {projetos.map((p) => (
              <div
                key={p.id}
                onClick={() => setProjetoId(p.id)}
                style={{
                  padding: 12,
                  borderRadius: 14,
                  border: p.id === projetoId ? "2px solid rgba(255,255,255,0.45)" : "1px solid rgba(255,255,255,0.18)",
                  cursor: "pointer",
                  background: p.arquivado ? "rgba(255,255,255,0.05)" : "transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 800 }}>{p.nome || "(sem nome)"}</div>
                    <div style={{ opacity: 0.8, fontSize: 12 }}>{p.cliente || "—"}</div>
                  </div>
                  <div style={{ width: 16, height: 16, borderRadius: 6, background: p.cor || "#0a4723", border: "1px solid rgba(255,255,255,0.3)" }} />
                </div>

                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {!p.arquivado ? (
                    <button
                      style={btnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        arquivarProjeto(p.id).catch((err) => setErro(String(err?.message || err)));
                      }}
                    >
                      Concluir/Arquivar
                    </button>
                  ) : (
                    <button
                      style={btnStyle}
                      onClick={(e) => {
                        e.stopPropagation();
                        desarquivarProjeto(p.id).catch((err) => setErro(String(err?.message || err)));
                      }}
                    >
                      Reabrir
                    </button>
                  )}

                  <button
                    style={btnStyle}
                    onClick={(e) => {
                      e.stopPropagation();
                      const novo = prompt("Editar nome do projeto:", p.nome || "");
                      if (novo === null) return;
                      atualizarProjeto(p.id, { nome: novo }).catch((err) => setErro(String(err?.message || err)));
                    }}
                  >
                    Editar
                  </button>

                  <button
                    style={{ ...btnStyle, opacity: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Apagar projeto? (tarefas ficarão com projetoId órfão)")) {
                        apagarProjeto(p.id).catch((err) => setErro(String(err?.message || err)));
                      }
                    }}
                  >
                    Apagar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tarefas */}
        <div style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)", padding: 14, borderRadius: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
            <h3 style={{ margin: 0 }}>
              Tarefas {projetoAtual ? <span style={{ opacity: 0.8, fontWeight: 500 }}>— {projetoAtual.nome}</span> : null}
            </h3>
            <label style={{ fontSize: 12, opacity: 0.9, display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={mostrarTarefasArquivadas} onChange={(e) => setMostrarTarefasArquivadas(e.target.checked)} />
              Mostrar concluídas
            </label>
          </div>

          {!projetoId ? (
            <div style={{ opacity: 0.85, marginTop: 12 }}>Selecione/crie um projeto.</div>
          ) : (
            <>
              <div style={{ display: "grid", gap: 8, marginTop: 12 }}>
                <input
                  value={novaTarefa.nome}
                  onChange={(e) => setNovaTarefa((s) => ({ ...s, nome: e.target.value }))}
                  placeholder="Nome da tarefa"
                  style={inputStyle}
                />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 170px 120px", gap: 8 }}>
                  <input
                    value={novaTarefa.inicio}
                    onChange={(e) => setNovaTarefa((s) => ({ ...s, inicio: e.target.value }))}
                    placeholder="Início (YYYY-MM-DD)"
                    style={inputStyle}
                  />
                  <input
                    value={novaTarefa.fim}
                    onChange={(e) => setNovaTarefa((s) => ({ ...s, fim: e.target.value }))}
                    placeholder="Fim (YYYY-MM-DD)"
                    style={inputStyle}
                  />
                  <select
                    value={novaTarefa.status}
                    onChange={(e) => setNovaTarefa((s) => ({ ...s, status: e.target.value }))}
                    style={inputStyle}
                  >
                    <option>A fazer</option>
                    <option>Fazendo</option>
                    <option>Concluida</option>
                  </select>
                  <button onClick={handleCriarTarefa} disabled={!user || !novaTarefa.nome.trim()} style={btnStyle}>
                    Adicionar
                  </button>
                </div>
              </div>

              <div style={{ display: "grid", gap: 10, marginTop: 16 }}>
                {tarefas.map((t) => (
                  <div key={t.id} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.18)", background: t.arquivado ? "rgba(255,255,255,0.05)" : "transparent" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                      <div>
                        <div style={{ fontWeight: 800 }}>{t.nome || "(sem nome)"}</div>
                        <div style={{ opacity: 0.8, fontSize: 12 }}>
                          {t.status || "A fazer"} · {t.inicio || "—"} → {t.fim || "—"}
                        </div>
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {!t.arquivado ? (
                          <button
                            style={btnStyle}
                            onClick={() => arquivarTarefa(t.id).catch((err) => setErro(String(err?.message || err)))}
                          >
                            Concluir
                          </button>
                        ) : (
                          <button
                            style={btnStyle}
                            onClick={() => desarquivarTarefa(t.id).catch((err) => setErro(String(err?.message || err)))}
                          >
                            Reabrir
                          </button>
                        )}

                        <button
                          style={btnStyle}
                          onClick={() => {
                            const novo = prompt("Editar nome da tarefa:", t.nome || "");
                            if (novo === null) return;
                            atualizarTarefa(t.id, { nome: novo }).catch((err) => setErro(String(err?.message || err)));
                          }}
                        >
                          Editar
                        </button>

                        <button
                          style={btnStyle}
                          onClick={() => {
                            const proximo =
                              t.status === "A fazer" ? "Fazendo" : t.status === "Fazendo" ? "Concluida" : "A fazer";
                            atualizarTarefa(t.id, { status: proximo }).catch((err) => setErro(String(err?.message || err)));
                          }}
                        >
                          Status
                        </button>

                        <button
                          style={{ ...btnStyle, opacity: 0.9 }}
                          onClick={() => {
                            if (confirm("Apagar tarefa?")) {
                              apagarTarefa(t.id).catch((err) => setErro(String(err?.message || err)));
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

              <div style={{ marginTop: 10, opacity: 0.75, fontSize: 12 }}>
                Padrão: concluída = arquivada e sai do painel. Marque “Mostrar concluídas” para consultar.
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: 10,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(0,0,0,0.15)",
  color: "#fff",
  outline: "none",
};

const btnStyle = {
  padding: "10px 12px",
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.22)",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  cursor: "pointer",
};
