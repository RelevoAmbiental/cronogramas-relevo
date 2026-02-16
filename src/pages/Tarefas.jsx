import React, { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "../firebase-adapter";
import { listenProjetos } from "../services/projetosService";
import {
  criarTarefa,
  listenTarefas,
  atualizarTarefa,
  apagarTarefa,
  concluirTarefa,
  reabrirTarefa,
  arquivarTarefa,
  desarquivarTarefa,
  STATUS,
  PRIORIDADE,
} from "../services/tarefasService";

// ========================
// Helpers (UI)
// ========================
function ymdToBr(ymd) {
  if (!ymd) return "";
  const [y, m, d] = String(ymd).split("-");
  if (!y || !m || !d) return "";
  return `${d.padStart(2, "0")}/${m.padStart(2, "0")}/${y}`;
}

function tsToBr(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function brToYmd(br) {
  // "DD/MM/YYYY" -> "YYYY-MM-DD"
  if (!br) return "";
  const m = String(br).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, dd, mm, yy] = m;
  return `${yy}-${mm}-${dd}`;
}

function parseTags(input) {
  return String(input || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 25);
}

function tagsToInput(tags) {
  return Array.isArray(tags) ? tags.join(", ") : "";
}

function parseSubtarefasText(multiline) {
  const lines = String(multiline || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 50);

  return lines.map((texto, i) => ({
    id: `st_${i + 1}`,
    texto,
    done: false,
    ordem: i,
  }));
}

function subtarefasToText(subtarefas) {
  if (!Array.isArray(subtarefas) || !subtarefas.length) return "";
  return subtarefas
    .slice(0, 50)
    .sort((a, b) => (a?.ordem ?? 0) - (b?.ordem ?? 0))
    .map((st) => st?.texto || "")
    .filter(Boolean)
    .join("\n");
}

function cicloStatus(status) {
  const s = status || STATUS.A_FAZER;
  if (s === STATUS.A_FAZER) return STATUS.FAZENDO;
  if (s === STATUS.FAZENDO) return STATUS.ACOMPANHANDO;
  if (s === STATUS.ACOMPANHANDO) return STATUS.CONCLUIDA;
  if (s === STATUS.CONCLUIDA) return STATUS.A_FAZER;
  if (s === STATUS.ARQUIVADA) return STATUS.A_FAZER;
  return STATUS.A_FAZER;
}

const STATUS_LABEL = {
  [STATUS.A_FAZER]: "A fazer",
  [STATUS.FAZENDO]: "Fazendo",
  [STATUS.ACOMPANHANDO]: "Acompanhando",
  [STATUS.CONCLUIDA]: "Concluída",
  [STATUS.ARQUIVADA]: "Arquivada",
};

const PRIOR_LABEL = {
  [PRIORIDADE.BAIXA]: "Baixa",
  [PRIORIDADE.MEDIA]: "Média",
  [PRIORIDADE.ALTA]: "Alta",
  [PRIORIDADE.URGENTE]: "Urgente",
};

export default function Tarefas() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");

  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState("");

  const [tarefas, setTarefas] = useState([]);

  const [mostrarConcluidas, setMostrarConcluidas] = useState(false);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);

  const [filtroStatus, setFiltroStatus] = useState(""); // "" = todos (exceto concluídas/arquivadas conforme toggle)
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroTags, setFiltroTags] = useState("");

  const [form, setForm] = useState({
    titulo: "",
    responsavel: "",
    prioridade: PRIORIDADE.MEDIA,
    status: STATUS.A_FAZER,
    dataVencimento: "",
    dataInicio: "",
    tags: "",
    descricao: "",
    subtarefasTexto: "",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [editForm, setEditForm] = useState(null);

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
    if (!user) {
      setTarefas([]);
      return;
    }

    let unsub = null;
    try {
      unsub = listenTarefas({
        projetoId: projetoId || null,
        status: filtroStatus || null,
        incluirConcluidas: mostrarConcluidas,
        incluirArquivadas: mostrarArquivadas,
        filtroResponsavel,
        filtroTags: parseTags(filtroTags),
        onData: setTarefas,
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
  }, [user, projetoId, filtroStatus, mostrarConcluidas, mostrarArquivadas, filtroResponsavel, filtroTags]);

  const projetoAtual = useMemo(
    () => projetos.find((p) => p.id === projetoId) || null,
    [projetos, projetoId]
  );

  const tarefasPorStatus = useMemo(() => {
    const groups = {
      [STATUS.A_FAZER]: [],
      [STATUS.FAZENDO]: [],
      [STATUS.ACOMPANHANDO]: [],
      [STATUS.CONCLUIDA]: [],
      [STATUS.ARQUIVADA]: [],
    };
    tarefas.forEach((t) => {
      const s = t.status || STATUS.A_FAZER;
      if (!groups[s]) groups[s] = [];
      groups[s].push(t);
    });
    return groups;
  }, [tarefas]);

  async function handleCriar() {
    setErro("");
    try {
      await criarTarefa({
        projetoId: projetoId || null,
        titulo: form.titulo,
        responsavel: form.responsavel,
        prioridade: form.prioridade,
        status: form.status,
        dataVencimento: form.dataVencimento || null, // YYYY-MM-DD
        dataInicio: form.dataInicio || null, // YYYY-MM-DD
        tags: parseTags(form.tags),
        descricao: form.descricao,
        subtarefas: parseSubtarefasText(form.subtarefasTexto),
      });

      setForm({
        titulo: "",
        responsavel: "",
        prioridade: PRIORIDADE.MEDIA,
        status: STATUS.A_FAZER,
        dataVencimento: "",
        dataInicio: "",
        tags: "",
        descricao: "",
        subtarefasTexto: "",
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  function abrirEditar(t) {
    setEditId(t.id);
    setEditForm({
      titulo: t.titulo || "",
      responsavel: t.responsavel || "",
      prioridade: t.prioridade || PRIORIDADE.MEDIA,
      status: t.status || STATUS.A_FAZER,
      dataVencimento: t.dataVencimento?.toDate
        ? brToYmd(tsToBr(t.dataVencimento))
        : "",
      dataInicio: t.dataInicio?.toDate ? brToYmd(tsToBr(t.dataInicio)) : "",
      tags: tagsToInput(t.tags),
      descricao: t.descricao || "",
      subtarefas: Array.isArray(t.subtarefas) ? t.subtarefas : [],
    });
    setEditOpen(true);
  }

  async function salvarEditar() {
    if (!editId || !editForm) return;
    setErro("");
    try {
      await atualizarTarefa(editId, {
        titulo: editForm.titulo,
        responsavel: editForm.responsavel,
        prioridade: editForm.prioridade,
        status: editForm.status,
        dataVencimento: editForm.dataVencimento || null,
        dataInicio: editForm.dataInicio || null,
        tags: parseTags(editForm.tags),
        descricao: editForm.descricao,
        subtarefas: editForm.subtarefas,
      });
      setEditOpen(false);
      setEditId("");
      setEditForm(null);
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  function toggleSubtarefaDone(i) {
    setEditForm((s) => {
      if (!s) return s;
      const arr = Array.isArray(s.subtarefas) ? [...s.subtarefas] : [];
      if (!arr[i]) return s;
      arr[i] = { ...arr[i], done: !arr[i].done };
      return { ...s, subtarefas: arr };
    });
  }

  function addSubtarefa(texto) {
    const t = String(texto || "").trim();
    if (!t) return;
    setEditForm((s) => {
      if (!s) return s;
      const arr = Array.isArray(s.subtarefas) ? [...s.subtarefas] : [];
      arr.push({ id: `st_${Date.now()}`, texto: t, done: false, ordem: arr.length });
      return { ...s, subtarefas: arr.slice(0, 50) };
    });
  }

  function removeSubtarefa(i) {
    setEditForm((s) => {
      if (!s) return s;
      const arr = Array.isArray(s.subtarefas) ? [...s.subtarefas] : [];
      arr.splice(i, 1);
      return { ...s, subtarefas: arr.map((x, idx) => ({ ...x, ordem: idx })) };
    });
  }

  const secOrder = [STATUS.A_FAZER, STATUS.FAZENDO, STATUS.ACOMPANHANDO, STATUS.CONCLUIDA, STATUS.ARQUIVADA];

  return (
    <div className="crono-main">
      <h2 className="crono-page-title">Tarefas</h2>

      <div className="crono-card">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div style={{ opacity: 0.9 }}>
            {user ? (
              <>
                Logado: <b>{user.email}</b>
              </>
            ) : (
              "Aguardando autenticação..."
            )}
          </div>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
            <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} className="crono-input">
              <option value="">Todos os projetos</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome || "(sem nome)"}{p.arquivado ? " [ARQ]" : ""}
                </option>
              ))}
            </select>

            <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)} className="crono-input">
              <option value="">Status (todos)</option>
              <option value={STATUS.A_FAZER}>A fazer</option>
              <option value={STATUS.FAZENDO}>Fazendo</option>
              <option value={STATUS.ACOMPANHANDO}>Acompanhando</option>
              <option value={STATUS.CONCLUIDA}>Concluídas</option>
              <option value={STATUS.ARQUIVADA}>Arquivadas</option>
            </select>

            <input
              className="crono-input"
              placeholder="Filtrar responsável"
              value={filtroResponsavel}
              onChange={(e) => setFiltroResponsavel(e.target.value)}
              style={{ minWidth: 220 }}
            />

            <input
              className="crono-input"
              placeholder="Tags (ex: financeiro, campo)"
              value={filtroTags}
              onChange={(e) => setFiltroTags(e.target.value)}
              style={{ minWidth: 240 }}
            />

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={mostrarConcluidas} onChange={(e) => setMostrarConcluidas(e.target.checked)} />
              Mostrar concluídas
            </label>

            <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input type="checkbox" checked={mostrarArquivadas} onChange={(e) => setMostrarArquivadas(e.target.checked)} />
              Mostrar arquivadas
            </label>
          </div>
        </div>

        {erro && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(220,60,60,0.14)", border: "1px solid rgba(220,60,60,0.28)" }}>
            <b>Erro:</b> {erro}
          </div>
        )}

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Projeto (filtro): <b>{projetoAtual?.nome || "Todos"}</b>
        </div>

        {/* Form Criar */}
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div className="crono-form-grid" style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 1fr 140px", gap: 10 }}>
            <input
              value={form.titulo}
              onChange={(e) => setForm((s) => ({ ...s, titulo: e.target.value }))}
              placeholder="Título/Nome da tarefa"
              className="crono-input"
            />

            <input
              value={form.responsavel}
              onChange={(e) => setForm((s) => ({ ...s, responsavel: e.target.value }))}
              placeholder="Responsável"
              className="crono-input"
            />

            <input
              type="date"
              value={form.dataVencimento}
              onChange={(e) => setForm((s) => ({ ...s, dataVencimento: e.target.value }))}
              className="crono-input"
              title="Data de vencimento"
            />

            <input
              type="date"
              value={form.dataInicio}
              onChange={(e) => setForm((s) => ({ ...s, dataInicio: e.target.value }))}
              className="crono-input"
              title="Data de início (opcional)"
            />

            <select value={form.prioridade} onChange={(e) => setForm((s) => ({ ...s, prioridade: e.target.value }))} className="crono-input">
              <option value={PRIORIDADE.BAIXA}>Baixa</option>
              <option value={PRIORIDADE.MEDIA}>Média</option>
              <option value={PRIORIDADE.ALTA}>Alta</option>
              <option value={PRIORIDADE.URGENTE}>Urgente</option>
            </select>

            <button className="crono-btn" onClick={handleCriar} disabled={!user || !form.titulo.trim()}>
              Criar
            </button>
          </div>

          <div className="crono-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 240px", gap: 10 }}>
            <input
              value={form.tags}
              onChange={(e) => setForm((s) => ({ ...s, tags: e.target.value }))}
              placeholder="Etiquetas/Tags (separe por vírgula)"
              className="crono-input"
            />

            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="crono-input" title="Status inicial">
              <option value={STATUS.A_FAZER}>A fazer</option>
              <option value={STATUS.FAZENDO}>Fazendo</option>
              <option value={STATUS.ACOMPANHANDO}>Acompanhando</option>
              <option value={STATUS.CONCLUIDA}>Concluída</option>
              <option value={STATUS.ARQUIVADA}>Arquivada</option>
            </select>
          </div>

          <textarea
            value={form.descricao}
            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
            placeholder="Descrição"
            className="crono-input"
            rows={3}
          />

          <textarea
            value={form.subtarefasTexto}
            onChange={(e) => setForm((s) => ({ ...s, subtarefasTexto: e.target.value }))}
            placeholder="Subtarefas (1 por linha — opcional, até ~15 recomendado)"
            className="crono-input"
            rows={3}
          />
        </div>

        {/* Lista */}
        <div style={{ marginTop: 18, display: "grid", gap: 16 }}>
          {secOrder.map((st) => {
            const items = tarefasPorStatus[st] || [];
            if (!items.length) return null;

            // Se toggles não permitem, não renderiza seção (por segurança)
            if (st === STATUS.CONCLUIDA && !mostrarConcluidas && filtroStatus !== STATUS.CONCLUIDA) return null;
            if (st === STATUS.ARQUIVADA && !mostrarArquivadas && filtroStatus !== STATUS.ARQUIVADA) return null;

            return (
              <div key={st} style={{ display: "grid", gap: 10 }}>
                <div style={{ fontWeight: 900, fontSize: 14, opacity: 0.9 }}>
                  {STATUS_LABEL[st]} <span style={{ opacity: 0.65 }}>({items.length})</span>
                </div>

                {items.map((t) => (
                  <div key={t.id} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.38)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
                      <div style={{ minWidth: 260 }}>
                        <div style={{ fontWeight: 900 }}>{t.titulo || "(sem título)"}</div>
                        <div style={{ opacity: 0.85, fontSize: 12, marginTop: 2 }}>
                          {t.responsavel ? <>{t.responsavel} · </> : null}
                          {t.prioridade ? <>{PRIOR_LABEL[t.prioridade] || t.prioridade} · </> : null}
                          {t.dataVencimento ? <>Vence: {tsToBr(t.dataVencimento)} · </> : null}
                          {STATUS_LABEL[t.status] || t.status}
                        </div>

                        {Array.isArray(t.tags) && t.tags.length ? (
                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                            {t.tags.slice(0, 12).map((tag) => (
                              <span key={tag} style={{ fontSize: 12, padding: "4px 8px", borderRadius: 999, background: "rgba(0,0,0,0.06)", border: "1px solid rgba(0,0,0,0.08)" }}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        ) : null}

                        {t.descricao ? (
                          <div style={{ marginTop: 8, opacity: 0.9 }}>
                            {t.descricao}
                          </div>
                        ) : null}

                        {Array.isArray(t.subtarefas) && t.subtarefas.length ? (
                          <div style={{ marginTop: 10, display: "grid", gap: 4 }}>
                            {t.subtarefas.slice(0, 15).map((stf) => (
                              <div key={stf.id} style={{ fontSize: 12, opacity: 0.9 }}>
                                {stf.done ? "✅" : "⬜"} {stf.texto}
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {t.status !== STATUS.CONCLUIDA ? (
                          <button className="crono-btn" onClick={() => concluirTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                            Concluir
                          </button>
                        ) : (
                          <button className="crono-btn" onClick={() => reabrirTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                            Reabrir
                          </button>
                        )}

                        {t.status !== STATUS.ARQUIVADA ? (
                          <button className="crono-btn" onClick={() => arquivarTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                            Arquivar
                          </button>
                        ) : (
                          <button className="crono-btn" onClick={() => desarquivarTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                            Desarquivar
                          </button>
                        )}

                        <button className="crono-btn" onClick={() => atualizarTarefa(t.id, { status: cicloStatus(t.status) }).catch((e) => setErro(String(e?.message || e)))}>
                          Evoluir status
                        </button>

                        <button className="crono-btn" onClick={() => abrirEditar(t)}>
                          Editar
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
            );
          })}
        </div>
      </div>

      {/* Modal editar */}
      {editOpen && editForm && (
        <div className="crono-modal-overlay" onMouseDown={() => setEditOpen(false)}>
          <div className="crono-modal" onMouseDown={(e) => e.stopPropagation()} style={{ maxWidth: 980, width: "calc(100% - 24px)", borderRadius: 18, padding: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Editar tarefa</div>
              <button className="crono-btn" onClick={() => setEditOpen(false)}>Fechar</button>
            </div>

            <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr 1fr 220px", gap: 10 }}>
                <input className="crono-input" value={editForm.titulo} onChange={(e) => setEditForm((s) => ({ ...s, titulo: e.target.value }))} placeholder="Título" />
                <input className="crono-input" value={editForm.responsavel} onChange={(e) => setEditForm((s) => ({ ...s, responsavel: e.target.value }))} placeholder="Responsável" />
                <input className="crono-input" type="date" value={editForm.dataVencimento} onChange={(e) => setEditForm((s) => ({ ...s, dataVencimento: e.target.value }))} />
                <input className="crono-input" type="date" value={editForm.dataInicio} onChange={(e) => setEditForm((s) => ({ ...s, dataInicio: e.target.value }))} />

                <select className="crono-input" value={editForm.status} onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}>
                  <option value={STATUS.A_FAZER}>A fazer</option>
                  <option value={STATUS.FAZENDO}>Fazendo</option>
                  <option value={STATUS.ACOMPANHANDO}>Acompanhando</option>
                  <option value={STATUS.CONCLUIDA}>Concluída</option>
                  <option value={STATUS.ARQUIVADA}>Arquivada</option>
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 220px", gap: 10 }}>
                <input className="crono-input" value={editForm.tags} onChange={(e) => setEditForm((s) => ({ ...s, tags: e.target.value }))} placeholder="Tags (vírgula)" />
                <select className="crono-input" value={editForm.prioridade} onChange={(e) => setEditForm((s) => ({ ...s, prioridade: e.target.value }))}>
                  <option value={PRIORIDADE.BAIXA}>Baixa</option>
                  <option value={PRIORIDADE.MEDIA}>Média</option>
                  <option value={PRIORIDADE.ALTA}>Alta</option>
                  <option value={PRIORIDADE.URGENTE}>Urgente</option>
                </select>
              </div>

              <textarea className="crono-input" rows={3} value={editForm.descricao} onChange={(e) => setEditForm((s) => ({ ...s, descricao: e.target.value }))} placeholder="Descrição" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, alignItems: "start" }}>
                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Checklist / Subtarefas</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {(editForm.subtarefas || []).slice(0, 50).map((st, i) => (
                      <div key={st.id || i} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <input type="checkbox" checked={!!st.done} onChange={() => toggleSubtarefaDone(i)} />
                        <div style={{ flex: 1, opacity: st.done ? 0.65 : 1, textDecoration: st.done ? "line-through" : "none" }}>
                          {st.texto}
                        </div>
                        <button className="crono-btn crono-btn-danger" onClick={() => removeSubtarefa(i)} style={{ padding: "6px 10px", minHeight: 0 }}>
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                    <input
                      className="crono-input"
                      placeholder="Nova subtarefa..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addSubtarefa(e.currentTarget.value);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <button
                      className="crono-btn"
                      onClick={(e) => {
                        const input = e.currentTarget.parentElement?.querySelector("input");
                        if (!input) return;
                        addSubtarefa(input.value);
                        input.value = "";
                      }}
                    >
                      Adicionar
                    </button>
                  </div>
                </div>

                <div>
                  <div style={{ fontWeight: 800, marginBottom: 8 }}>Atalhos</div>
                  <div style={{ display: "grid", gap: 8 }}>
                    <button className="crono-btn" onClick={() => setEditForm((s) => ({ ...s, status: cicloStatus(s.status) }))}>
                      Evoluir status
                    </button>

                    <button
                      className="crono-btn"
                      onClick={() => {
                        const txt = subtarefasToText(editForm.subtarefas);
                        navigator.clipboard?.writeText(txt);
                      }}
                      title="Copia as subtarefas para texto"
                    >
                      Copiar checklist
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 6 }}>
                <button className="crono-btn" onClick={salvarEditar}>
                  Salvar
                </button>
                <button className="crono-btn crono-btn-danger" onClick={() => setEditOpen(false)}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSS local mínimo (layout do modal overlay) */}
      <style>{`
        .crono-modal-overlay{
          position: fixed;
          inset: 0;
          display:flex;
          align-items:center;
          justify-content:center;
          padding: 12px;
          z-index: 9999;
        }
      `}</style>
    </div>
  );
}
