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
  concluirTarefa,
  STATUS_TAREFA,
  PRIORIDADE_TAREFA,
  RECORRENCIA_TIPO,
} from "../services/tarefasService";

const STATUS_LABEL = {
  A_FAZER: "A fazer",
  FAZENDO: "Fazendo",
  ACOMPANHANDO: "Acompanhando",
  ARQUIVADA: "Arquivada",
};

const PRIOR_LABEL = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  URGENTE: "Urgente",
};

const REC_LABEL = {
  SEM_RECORRENCIA: "Sem recorrência",
  DIARIO: "Diário",
  SEMANAL: "Semanal",
  MENSAL: "Mensal",
};

const DIAS_SEMANA = [
  { key: "SEG", label: "Segunda" },
  { key: "TER", label: "Terça" },
  { key: "QUA", label: "Quarta" },
  { key: "QUI", label: "Quinta" },
  { key: "SEX", label: "Sexta" },
  { key: "SAB", label: "Sábado" },
  { key: "DOM", label: "Domingo" },
];

function toInputDateBR(d) {
  // input type="date" usa YYYY-MM-DD; guardamos Timestamp no Firestore, mas no form usamos string YYYY-MM-DD
  return d || "";
}

function parseTags(text) {
  return String(text || "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function nextStatus(s) {
  if (s === "A_FAZER") return "FAZENDO";
  if (s === "FAZENDO") return "ACOMPANHANDO";
  if (s === "ACOMPANHANDO") return "A_FAZER";
  return "A_FAZER";
}

function uid() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(16).slice(2);
  }
}

function buildSubtarefasFromLines(linesText) {
  const lines = String(linesText || "")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return lines.map((texto, i) => ({ id: uid(), texto, done: false, ordem: i }));
}

function formatDateFromTs(ts) {
  if (!ts?.toDate) return "";
  const d = ts.toDate();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

function Chip({ text }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 999,
        fontSize: 12,
        border: "1px solid rgba(0,0,0,0.10)",
        background: "rgba(255,255,255,0.70)",
        marginRight: 6,
        marginTop: 6,
      }}
    >
      {text}
    </span>
  );
}

function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="crono-modal-overlay">
      <div className="crono-modal" role="dialog" aria-modal="true">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ fontWeight: 900, fontSize: 18 }}>{title}</div>
          <button className="crono-btn" onClick={onClose}>
            Fechar
          </button>
        </div>
        <div style={{ marginTop: 14 }}>{children}</div>
      </div>
    </div>
  );
}

export default function Tarefas() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");

  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState("");

  const [tarefas, setTarefas] = useState([]);

  // filtros
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroResponsavel, setFiltroResponsavel] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);

  // form criar
  const [form, setForm] = useState({
    titulo: "",
    responsavel: "",
    dataInicio: "",
    dataVencimento: "",
    prioridade: "MEDIA",
    status: "A_FAZER",
    tagsText: "",
    descricao: "",
    // subtarefas
    subtarefaNova: "",
    subtarefas: [],
    // recorrência
    recorrenciaTipo: "SEM_RECORRENCIA",
    recorrenciaDiaSemana: "QUI",
    recorrenciaDiaMes: 20,
  });

  // edição
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState("");
  const [edit, setEdit] = useState(null);

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
        incluirArquivadas: mostrarArquivadas,
        onData: setTarefas,
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
  }, [user, projetoId, mostrarArquivadas]);

  const projetoAtual = useMemo(() => projetos.find((p) => p.id === projetoId) || null, [projetos, projetoId]);

  const responsaveisDisponiveis = useMemo(() => {
    return uniq(
      tarefas
        .map((t) => (t.responsavel || "").trim())
        .filter(Boolean)
        .sort((a, b) => a.localeCompare(b, "pt-BR"))
    );
  }, [tarefas]);

  const tagsDisponiveis = useMemo(() => {
    const all = [];
    tarefas.forEach((t) => (t.tags || []).forEach((x) => all.push(String(x).trim())));
    return uniq(all)
      .filter(Boolean)
      .sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [tarefas]);

  const tarefasFiltradas = useMemo(() => {
    let items = [...tarefas];

    // por status (se não mostrar arquivadas, items já vem sem arquivadas)
    if (filtroStatus) items = items.filter((t) => t.status === filtroStatus);

    if (filtroResponsavel) items = items.filter((t) => (t.responsavel || "").trim() === filtroResponsavel);

    if (filtroTag) items = items.filter((t) => (t.tags || []).includes(filtroTag));

    return items;
  }, [tarefas, filtroStatus, filtroResponsavel, filtroTag]);

  const grupos = useMemo(() => {
    const g = {
      A_FAZER: [],
      FAZENDO: [],
      ACOMPANHANDO: [],
      ARQUIVADA: [],
    };
    tarefasFiltradas.forEach((t) => {
      const k = STATUS_TAREFA.includes(t.status) ? t.status : "A_FAZER";
      g[k].push(t);
    });
    return g;
  }, [tarefasFiltradas]);

  function resetFormCriar() {
    setForm((s) => ({
      ...s,
      titulo: "",
      responsavel: "",
      dataInicio: "",
      dataVencimento: "",
      prioridade: "MEDIA",
      status: "A_FAZER",
      tagsText: "",
      descricao: "",
      subtarefaNova: "",
      subtarefas: [],
      recorrenciaTipo: "SEM_RECORRENCIA",
      recorrenciaDiaSemana: "QUI",
      recorrenciaDiaMes: 20,
    }));
  }

  async function handleCriar() {
    setErro("");
    try {
      await criarTarefa({
        projetoId,
        titulo: form.titulo,
        descricao: form.descricao,
        responsavel: form.responsavel,
        prioridade: form.prioridade,
        status: form.status,
        tags: parseTags(form.tagsText),
        subtarefas: form.subtarefas,
        dataInicio: form.dataInicio ? new Date(form.dataInicio) : null,
        dataVencimento: form.dataVencimento ? new Date(form.dataVencimento) : null,
        recorrencia: buildRecorrenciaFromForm(form),
        ordem: tarefas.length,
      });
      resetFormCriar();
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  function buildRecorrenciaFromForm(f) {
    const tipo = f.recorrenciaTipo || "SEM_RECORRENCIA";
    if (tipo === "SEMANAL") return { tipo, diaSemana: f.recorrenciaDiaSemana || "QUI" };
    if (tipo === "MENSAL") return { tipo, diaMes: Number(f.recorrenciaDiaMes) || 20 };
    if (tipo === "DIARIO") return { tipo };
    return { tipo: "SEM_RECORRENCIA" };
  }

  function openEdit(t) {
    setEditId(t.id);
    setEdit({
      titulo: t.titulo || "",
      responsavel: t.responsavel || "",
      dataInicio: t.dataInicio?.toDate ? toDateInputString(t.dataInicio.toDate()) : "",
      dataVencimento: t.dataVencimento?.toDate ? toDateInputString(t.dataVencimento.toDate()) : "",
      prioridade: t.prioridade || "MEDIA",
      status: t.status || "A_FAZER",
      tagsText: (t.tags || []).join(", "),
      descricao: t.descricao || "",
      subtarefaNova: "",
      subtarefas: Array.isArray(t.subtarefas) ? t.subtarefas : [],
      recorrenciaTipo: t.recorrencia?.tipo || "SEM_RECORRENCIA",
      recorrenciaDiaSemana: t.recorrencia?.diaSemana || "QUI",
      recorrenciaDiaMes: t.recorrencia?.diaMes || 20,
    });
    setEditOpen(true);
  }

  function closeEdit() {
    setEditOpen(false);
    setEditId("");
    setEdit(null);
  }

  function toDateInputString(dateObj) {
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  }

  async function handleSalvarEdicao() {
    if (!edit || !editId) return;
    setErro("");
    try {
      await atualizarTarefa(editId, {
        titulo: edit.titulo,
        responsavel: edit.responsavel,
        descricao: edit.descricao,
        prioridade: edit.prioridade,
        status: edit.status,
        tags: parseTags(edit.tagsText),
        subtarefas: edit.subtarefas,
        dataInicio: edit.dataInicio ? new Date(edit.dataInicio) : null,
        dataVencimento: edit.dataVencimento ? new Date(edit.dataVencimento) : null,
        recorrencia: buildRecorrenciaFromForm(edit),
      });
      closeEdit();
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  function addSubtask(setter, state) {
    const txt = (state.subtarefaNova || "").trim();
    if (!txt) return;
    const next = [...(state.subtarefas || []), { id: uid(), texto: txt, done: false, ordem: (state.subtarefas || []).length }];
    setter({ ...state, subtarefaNova: "", subtarefas: next });
  }

  function toggleSubtask(setter, state, subId) {
    const next = (state.subtarefas || []).map((s) => (s.id === subId ? { ...s, done: !s.done } : s));
    setter({ ...state, subtarefas: next });
  }

  function removeSubtask(setter, state, subId) {
    const next = (state.subtarefas || []).filter((s) => s.id !== subId);
    setter({ ...state, subtarefas: next });
  }

  return (
    <div className="cronograma-scope">
      {/* TÍTULO somente fora */}
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
        <h1 className="crono-page-title" style={{ margin: 0 }}>Tarefas</h1>

        <div style={{ opacity: 0.85 }}>
          {user ? (
            <>
              Logado: <b>{user.email}</b>
            </>
          ) : (
            "Aguardando autenticação..."
          )}
        </div>
      </div>

      <div className="crono-card" style={{ marginTop: 14 }}>
        {/* filtros topo */}
        <div style={{ display: "grid", gridTemplateColumns: "200px 180px 220px 240px 1fr", gap: 10, alignItems: "center" }}>
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
            <option value="A_FAZER">A fazer</option>
            <option value="FAZENDO">Fazendo</option>
            <option value="ACOMPANHANDO">Acompanhando</option>
            <option value="ARQUIVADA">Arquivada</option>
          </select>

          {/* dropdown responsável */}
          <select value={filtroResponsavel} onChange={(e) => setFiltroResponsavel(e.target.value)} className="crono-input">
            <option value="">Responsável (todos)</option>
            {responsaveisDisponiveis.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {/* dropdown tag */}
          <select value={filtroTag} onChange={(e) => setFiltroTag(e.target.value)} className="crono-input">
            <option value="">Tags (todas)</option>
            {tagsDisponiveis.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          <label style={{ display: "flex", gap: 8, alignItems: "center", justifySelf: "end" }}>
            <input type="checkbox" checked={mostrarArquivadas} onChange={(e) => setMostrarArquivadas(e.target.checked)} />
            Mostrar arquivadas
          </label>
        </div>

        {erro && (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 12, background: "rgba(220,60,60,0.18)", border: "1px solid rgba(220,60,60,0.35)" }}>
            <b>Erro:</b> {erro}
          </div>
        )}

        <div style={{ marginTop: 10, opacity: 0.85 }}>
          Projeto (filtro): <b>{projetoAtual?.nome || "Todos"}</b>
        </div>

        {/* formulário criar */}
        <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 160px 160px 170px 120px 140px", gap: 10 }}>
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

            <div style={{ display: "grid", gap: 6 }}>
              <small style={{ opacity: 0.75 }}>Data de início</small>
              <input
                type="date"
                value={toInputDateBR(form.dataInicio)}
                onChange={(e) => setForm((s) => ({ ...s, dataInicio: e.target.value }))}
                className="crono-input"
              />
            </div>

            <div style={{ display: "grid", gap: 6 }}>
              <small style={{ opacity: 0.75 }}>Data de vencimento</small>
              <input
                type="date"
                value={toInputDateBR(form.dataVencimento)}
                onChange={(e) => setForm((s) => ({ ...s, dataVencimento: e.target.value }))}
                className="crono-input"
              />
            </div>

            <select value={form.prioridade} onChange={(e) => setForm((s) => ({ ...s, prioridade: e.target.value }))} className="crono-input">
              {PRIORIDADE_TAREFA.map((p) => (
                <option key={p} value={p}>
                  {PRIOR_LABEL[p] || p}
                </option>
              ))}
            </select>

            <select value={form.status} onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))} className="crono-input">
              <option value="A_FAZER">A fazer</option>
              <option value="FAZENDO">Fazendo</option>
              <option value="ACOMPANHANDO">Acompanhando</option>
              <option value="ARQUIVADA">Arquivada</option>
            </select>

            <button className="crono-btn" onClick={handleCriar} disabled={!user || !form.titulo.trim()}>
              Criar
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 10 }}>
            <input
              value={form.tagsText}
              onChange={(e) => setForm((s) => ({ ...s, tagsText: e.target.value }))}
              placeholder="Etiquetas/Tags (separe por vírgula)"
              className="crono-input"
            />

            {/* Recorrência */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <select
                value={form.recorrenciaTipo}
                onChange={(e) => setForm((s) => ({ ...s, recorrenciaTipo: e.target.value }))}
                className="crono-input"
              >
                {RECORRENCIA_TIPO.map((t) => (
                  <option key={t} value={t}>
                    {REC_LABEL[t] || t}
                  </option>
                ))}
              </select>

              {form.recorrenciaTipo === "SEMANAL" ? (
                <select
                  value={form.recorrenciaDiaSemana}
                  onChange={(e) => setForm((s) => ({ ...s, recorrenciaDiaSemana: e.target.value }))}
                  className="crono-input"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.key} value={d.key}>
                      {d.label}
                    </option>
                  ))}
                </select>
              ) : form.recorrenciaTipo === "MENSAL" ? (
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={form.recorrenciaDiaMes}
                  onChange={(e) => setForm((s) => ({ ...s, recorrenciaDiaMes: e.target.value }))}
                  className="crono-input"
                  placeholder="Dia do mês (1-31)"
                />
              ) : (
                <div />
              )}
            </div>

            <div />
          </div>

          <textarea
            value={form.descricao}
            onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
            placeholder="Descrição"
            className="crono-input"
            style={{ minHeight: 90, resize: "vertical" }}
          />

          {/* Checklist */}
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={form.subtarefaNova}
                onChange={(e) => setForm((s) => ({ ...s, subtarefaNova: e.target.value }))}
                placeholder="Adicionar subtarefa (checklist)"
                className="crono-input"
                style={{ flex: "1 1 380px" }}
              />
              <button className="crono-btn" onClick={() => addSubtask(setForm, form)} disabled={!form.subtarefaNova.trim()}>
                Adicionar
              </button>
              <small style={{ opacity: 0.75, alignSelf: "center" }}>até ~15 recomendado</small>
            </div>

            {form.subtarefas?.length > 0 && (
              <div style={{ display: "grid", gap: 8 }}>
                {form.subtarefas.map((s) => (
                  <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <input type="checkbox" checked={!!s.done} onChange={() => toggleSubtask(setForm, form, s.id)} />
                    <div style={{ flex: 1, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.75 : 1 }}>
                      {s.texto}
                    </div>
                    <button className="crono-btn" onClick={() => removeSubtask(setForm, form, s.id)}>
                      Remover
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* LISTAGEM */}
        <div style={{ marginTop: 18, display: "grid", gap: 12 }}>
          {["A_FAZER", "FAZENDO", "ACOMPANHANDO", ...(mostrarArquivadas ? ["ARQUIVADA"] : [])].map((k) => (
            <div key={k}>
              <div style={{ fontWeight: 900, fontSize: 16, margin: "6px 0" }}>
                {STATUS_LABEL[k]} ({grupos[k]?.length || 0})
              </div>

              <div style={{ display: "grid", gap: 10 }}>
                {(grupos[k] || []).map((t) => (
                  <div key={t.id} style={{ padding: 12, borderRadius: 14, border: "1px solid rgba(0,0,0,0.08)", background: "rgba(255,255,255,0.62)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 900, fontSize: 16 }}>{t.titulo || "(sem título)"}</div>

                        <div style={{ opacity: 0.75, fontSize: 13, marginTop: 2 }}>
                          {PRIOR_LABEL[t.prioridade] || "Média"} · {STATUS_LABEL[t.status] || "A fazer"}
                          {t.responsavel ? ` · ${t.responsavel}` : ""}
                          {t.dataInicio?.toDate ? ` · Início: ${formatDateFromTs(t.dataInicio)}` : ""}
                          {t.dataVencimento?.toDate ? ` · Vence: ${formatDateFromTs(t.dataVencimento)}` : ""}
                        </div>

                        {t.tags?.length > 0 && (
                          <div style={{ marginTop: 6, display: "flex", flexWrap: "wrap" }}>
                            {t.tags.map((x) => (
                              <Chip key={x} text={x} />
                            ))}
                          </div>
                        )}

                        {t.descricao ? <div style={{ marginTop: 8, opacity: 0.9 }}>{t.descricao}</div> : null}

                        {/* checklist */}
                        {Array.isArray(t.subtarefas) && t.subtarefas.length > 0 && (
                          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
                            {t.subtarefas.map((s) => (
                              <label key={s.id} style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <input
                                  type="checkbox"
                                  checked={!!s.done}
                                  onChange={() => {
                                    const next = t.subtarefas.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x));
                                    atualizarTarefa(t.id, { subtarefas: next }).catch((e) => setErro(String(e?.message || e)));
                                  }}
                                />
                                <span style={{ textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.75 : 1 }}>
                                  {s.texto}
                                </span>
                              </label>
                            ))}
                          </div>
                        )}

                        {/* recorrência */}
                        {t.recorrencia?.tipo && t.recorrencia.tipo !== "SEM_RECORRENCIA" && (
                          <div style={{ marginTop: 8, fontSize: 13, opacity: 0.8 }}>
                            Recorrência: <b>{REC_LABEL[t.recorrencia.tipo] || t.recorrencia.tipo}</b>
                            {t.recorrencia.tipo === "SEMANAL" && t.recorrencia.diaSemana ? ` · ${t.recorrencia.diaSemana}` : ""}
                            {t.recorrencia.tipo === "MENSAL" && t.recorrencia.diaMes ? ` · dia ${t.recorrencia.diaMes}` : ""}
                          </div>
                        )}
                      </div>

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                        {!t.arquivado ? (
                          <>
                            <button className="crono-btn" onClick={() => concluirTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                              Concluir
                            </button>
                            <button className="crono-btn" onClick={() => arquivarTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                              Arquivar
                            </button>
                          </>
                        ) : (
                          <button className="crono-btn" onClick={() => desarquivarTarefa(t.id).catch((e) => setErro(String(e?.message || e)))}>
                            Reabrir
                          </button>
                        )}

                        <button className="crono-btn" onClick={() => atualizarTarefa(t.id, { status: nextStatus(t.status) }).catch((e) => setErro(String(e?.message || e)))}>
                          Evoluir status
                        </button>

                        <button className="crono-btn" onClick={() => openEdit(t)}>
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
            </div>
          ))}
        </div>
      </div>

      {/* MODAL DE EDIÇÃO */}
      <Modal open={editOpen} title="Editar tarefa" onClose={closeEdit}>
        {edit && (
          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 160px 160px 170px 170px", gap: 10 }}>
              <input value={edit.titulo} onChange={(e) => setEdit((s) => ({ ...s, titulo: e.target.value }))} className="crono-input" placeholder="Título" />
              <input value={edit.responsavel} onChange={(e) => setEdit((s) => ({ ...s, responsavel: e.target.value }))} className="crono-input" placeholder="Responsável" />

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.75 }}>Data de início</small>
                <input type="date" value={edit.dataInicio || ""} onChange={(e) => setEdit((s) => ({ ...s, dataInicio: e.target.value }))} className="crono-input" />
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <small style={{ opacity: 0.75 }}>Data de vencimento</small>
                <input type="date" value={edit.dataVencimento || ""} onChange={(e) => setEdit((s) => ({ ...s, dataVencimento: e.target.value }))} className="crono-input" />
              </div>

              <select value={edit.prioridade} onChange={(e) => setEdit((s) => ({ ...s, prioridade: e.target.value }))} className="crono-input">
                {PRIORIDADE_TAREFA.map((p) => (
                  <option key={p} value={p}>
                    {PRIOR_LABEL[p] || p}
                  </option>
                ))}
              </select>

              <select value={edit.status} onChange={(e) => setEdit((s) => ({ ...s, status: e.target.value }))} className="crono-input">
                <option value="A_FAZER">A fazer</option>
                <option value="FAZENDO">Fazendo</option>
                <option value="ACOMPANHANDO">Acompanhando</option>
                <option value="ARQUIVADA">Arquivada</option>
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input value={edit.tagsText} onChange={(e) => setEdit((s) => ({ ...s, tagsText: e.target.value }))} className="crono-input" placeholder="Tags (vírgula)" />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                <select value={edit.recorrenciaTipo} onChange={(e) => setEdit((s) => ({ ...s, recorrenciaTipo: e.target.value }))} className="crono-input">
                  {RECORRENCIA_TIPO.map((t) => (
                    <option key={t} value={t}>
                      {REC_LABEL[t] || t}
                    </option>
                  ))}
                </select>

                {edit.recorrenciaTipo === "SEMANAL" ? (
                  <select value={edit.recorrenciaDiaSemana} onChange={(e) => setEdit((s) => ({ ...s, recorrenciaDiaSemana: e.target.value }))} className="crono-input">
                    {DIAS_SEMANA.map((d) => (
                      <option key={d.key} value={d.key}>
                        {d.label}
                      </option>
                    ))}
                  </select>
                ) : edit.recorrenciaTipo === "MENSAL" ? (
                  <input type="number" min={1} max={31} value={edit.recorrenciaDiaMes} onChange={(e) => setEdit((s) => ({ ...s, recorrenciaDiaMes: e.target.value }))} className="crono-input" placeholder="Dia do mês" />
                ) : (
                  <div />
                )}
              </div>
            </div>

            <textarea value={edit.descricao} onChange={(e) => setEdit((s) => ({ ...s, descricao: e.target.value }))} className="crono-input" placeholder="Descrição" style={{ minHeight: 100 }} />

            {/* checklist edição */}
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <input value={edit.subtarefaNova} onChange={(e) => setEdit((s) => ({ ...s, subtarefaNova: e.target.value }))} className="crono-input" placeholder="Adicionar subtarefa" style={{ flex: "1 1 380px" }} />
                <button className="crono-btn" onClick={() => addSubtask(setEdit, edit)} disabled={!edit.subtarefaNova.trim()}>
                  Adicionar
                </button>
              </div>

              {edit.subtarefas?.length > 0 && (
                <div style={{ display: "grid", gap: 8 }}>
                  {edit.subtarefas.map((s) => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <input type="checkbox" checked={!!s.done} onChange={() => toggleSubtask(setEdit, edit, s.id)} />
                      <div style={{ flex: 1, textDecoration: s.done ? "line-through" : "none", opacity: s.done ? 0.75 : 1 }}>
                        {s.texto}
                      </div>
                      <button className="crono-btn" onClick={() => removeSubtask(setEdit, edit, s.id)}>
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button className="crono-btn" onClick={handleSalvarEdicao}>
                Salvar
              </button>
              <button className="crono-btn crono-btn-danger" onClick={closeEdit}>
                Cancelar
              </button>
            </div>
          </div>
        )}
      </Modal>

      <style>{`
        /* 7) Fonte +1 nos campos */
        .cronograma-scope .crono-input{
          font-size: 15px !important;
        }
        .cronograma-scope .crono-btn{
          font-size: 15px !important;
        }
        /* Modal */
        .crono-modal{
          max-width: 1100px;
          width: min(1100px, 92vw);
          padding: 16px;
          border-radius: 18px;
        }
        .crono-modal-overlay{
          position: fixed;
          inset: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 18px;
          z-index: 9999;
        }
      `}</style>
    </div>
  );
}
