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

/**
 * Ajustes finos:
 * 1) Remove título duplicado dentro do card (fica só o <h1> da página)
 * 2) "Todos os projetos" não pode virar valor "Todos" (truthy) — deve ser "" (sem filtro)
 */

const STATUS_OPCOES = ["A fazer", "Fazendo", "Acompanhando"]; // exibidas como ativas
const STATUS_TODOS = ["A fazer", "Fazendo", "Acompanhando", "Concluida"]; // incluindo arquivadas/concluídas

const PRIORIDADE_OPCOES = ["Baixa", "Média", "Alta", "Urgente"];

const RECORRENCIA_TIPO = ["Sem recorrência", "Diária", "Semanal", "Mensal"];
const DIAS_SEMANA = [
  { v: 0, l: "Domingo" },
  { v: 1, l: "Segunda" },
  { v: 2, l: "Terça" },
  { v: 3, l: "Quarta" },
  { v: 4, l: "Quinta" },
  { v: 5, l: "Sexta" },
  { v: 6, l: "Sábado" },
];

function toISODateInput(value) {
  // aceita "DD/MM/AAAA" e retorna "AAAA-MM-DD" (para input date)
  if (!value) return "";
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [_, dd, mm, yyyy] = m;
  return `${yyyy}-${mm}-${dd}`;
}

function fromISODateInput(iso) {
  // "AAAA-MM-DD" -> "DD/MM/AAAA"
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  const [_, yyyy, mm, dd] = m;
  return `${dd}/${mm}/${yyyy}`;
}

function uniq(arr) {
  return Array.from(new Set(arr.filter(Boolean)));
}

export default function Tarefas() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");

  const [projetos, setProjetos] = useState([]);

  // ✅ filtro: "" = todos (NÃO usar "Todos" como value)
  const [projetoFiltroId, setProjetoFiltroId] = useState("");

  const [tarefas, setTarefas] = useState([]);
  const [mostrarArquivadas, setMostrarArquivadas] = useState(false);

  // filtros adicionais
  const [statusFiltro, setStatusFiltro] = useState("");
  const [responsavelFiltro, setResponsavelFiltro] = useState("");
  const [tagFiltro, setTagFiltro] = useState("");

  // form de criação
  const [form, setForm] = useState({
    nome: "",
    responsavel: "",
    prioridade: "Média",
    status: "A fazer",
    inicio: "",
    fim: "",
    tagsTexto: "",
    descricao: "",
    recorrenciaTipo: "Sem recorrência",
    recorrenciaDiaSemana: 4, // quinta (default)
    recorrenciaDiaMes: 20,
  });

  // checklist (subtarefas)
  const [subtarefas, setSubtarefas] = useState([]);
  const [subInput, setSubInput] = useState("");

  // modal edição
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubtarefas, setEditSubtarefas] = useState([]);

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
        onData: (items) => setProjetos(items || []),
        onError: (e) => setErro(e?.message || String(e)),
      });
    } catch (e) {
      setErro(e?.message || String(e));
    }
    return () => unsub?.();
  }, [user]);

  useEffect(() => {
    setErro("");
    if (!user) return;

    let unsub = null;
    try {
      unsub = listenTarefas({
        // ✅ se projetoFiltroId === "" => sem filtro
        projetoId: projetoFiltroId || null,
        incluirArquivadas: mostrarArquivadas,
        onData: (items) => setTarefas(items || []),
        onError: (e) => setErro(e?.message || String(e)),
      });
    } catch (e) {
      setErro(e?.message || String(e));
    }
    return () => unsub?.();
  }, [user, projetoFiltroId, mostrarArquivadas]);

  // opções derivadas do que já existe nas tarefas
  const responsaveisDisponiveis = useMemo(() => {
    const all = tarefas.map((t) => t.responsavel || t.ownerEmail || "");
    return uniq(all).sort((a, b) => a.localeCompare(b));
  }, [tarefas]);

  const tagsDisponiveis = useMemo(() => {
    const all = [];
    for (const t of tarefas) {
      const tg = Array.isArray(t.tags) ? t.tags : [];
      tg.forEach((x) => all.push(String(x).trim()));
    }
    return uniq(all).sort((a, b) => a.localeCompare(b));
  }, [tarefas]);

  // aplica filtros locais (status / responsável / tags)
  const tarefasFiltradas = useMemo(() => {
    let items = [...tarefas];

    if (statusFiltro) items = items.filter((t) => t.status === statusFiltro);

    if (responsavelFiltro) {
      items = items.filter((t) => (t.responsavel || t.ownerEmail || "") === responsavelFiltro);
    }

    if (tagFiltro) {
      items = items.filter((t) => Array.isArray(t.tags) && t.tags.includes(tagFiltro));
    }

    return items;
  }, [tarefas, statusFiltro, responsavelFiltro, tagFiltro]);

  const porStatus = useMemo(() => {
    const map = { "A fazer": [], Fazendo: [], Acompanhando: [], Concluida: [] };
    for (const t of tarefasFiltradas) {
      if (map[t.status]) map[t.status].push(t);
      else map["A fazer"].push(t);
    }
    return map;
  }, [tarefasFiltradas]);

  const projetoNomeFiltro = useMemo(() => {
    if (!projetoFiltroId) return "Todos";
    return projetos.find((p) => p.id === projetoFiltroId)?.nome || "Projeto";
  }, [projetos, projetoFiltroId]);

  function parseTags(texto) {
    return uniq(
      String(texto || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    );
  }

  function buildRecorrenciaPayload() {
    const tipo = form.recorrenciaTipo;
    if (tipo === "Sem recorrência") return null;

    if (tipo === "Diária") {
      return { tipo: "DIARIO", intervalo: 1 };
    }
    if (tipo === "Semanal") {
      return { tipo: "SEMANAL", intervalo: 1, diasSemana: [Number(form.recorrenciaDiaSemana)] };
    }
    if (tipo === "Mensal") {
      return { tipo: "MENSAL", intervalo: 1, diasMes: [Number(form.recorrenciaDiaMes)] };
    }
    return null;
  }

  async function onCriar() {
    setErro("");
    try {
      // projeto: se filtro selecionado, usa ele; senão, usa primeiro projeto disponível
      const projetoId = projetoFiltroId || projetos[0]?.id;
      if (!projetoId) throw new Error("Cadastre um projeto primeiro.");

      const payload = {
        nome: form.nome,
        descricao: form.descricao,
        status: form.status,
        inicio: form.inicio ? toISODateInput(form.inicio) : null,
        fim: form.fim ? toISODateInput(form.fim) : null,
        projetoId,
        responsavel: (form.responsavel || "").trim(),
        prioridade: form.prioridade,
        tags: parseTags(form.tagsTexto),
        subtarefas: subtarefas.map((s, idx) => ({
          id: s.id,
          texto: s.texto,
          done: !!s.done,
          ordem: idx + 1,
        })),
        recorrencia: buildRecorrenciaPayload(),
      };

      await criarTarefa(payload);

      // limpa
      setForm((f) => ({ ...f, nome: "", descricao: "", tagsTexto: "", responsavel: "", inicio: "", fim: "", status: "A fazer", prioridade: "Média", recorrenciaTipo: "Sem recorrência" }));
      setSubtarefas([]);
      setSubInput("");
    } catch (e) {
      setErro(e?.message || String(e));
    }
  }

  function addSubtarefa() {
    const texto = (subInput || "").trim();
    if (!texto) return;
    setSubtarefas((prev) => [
      ...prev,
      { id: `st_${Date.now()}_${Math.random().toString(16).slice(2)}`, texto, done: false },
    ]);
    setSubInput("");
  }

  function toggleSub(idx) {
    setSubtarefas((prev) => prev.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)));
  }

  function removeSub(idx) {
    setSubtarefas((prev) => prev.filter((_, i) => i !== idx));
  }

  function abrirEditar(t) {
    setEditId(t.id);
    setEditForm({
      nome: t.nome || "",
      responsavel: t.responsavel || "",
      prioridade: t.prioridade || "Média",
      status: t.status || "A fazer",
      inicio: t.inicio ? fromISODateInput(t.inicio) : "",
      fim: t.fim ? fromISODateInput(t.fim) : "",
      tagsTexto: Array.isArray(t.tags) ? t.tags.join(", ") : "",
      descricao: t.descricao || "",
      recorrenciaTipo: t.recorrencia?.tipo === "DIARIO" ? "Diária" : t.recorrencia?.tipo === "SEMANAL" ? "Semanal" : t.recorrencia?.tipo === "MENSAL" ? "Mensal" : "Sem recorrência",
      recorrenciaDiaSemana: (t.recorrencia?.diasSemana?.[0] ?? 4),
      recorrenciaDiaMes: (t.recorrencia?.diasMes?.[0] ?? 20),
    });

    const subs = Array.isArray(t.subtarefas) ? t.subtarefas : [];
    setEditSubtarefas(
      subs.map((s, i) => ({
        id: s.id || `st_${i}`,
        texto: s.texto || "",
        done: !!s.done,
      }))
    );

    setEditOpen(true);
  }

  async function salvarEdicao() {
    setErro("");
    try {
      if (!editId || !editForm) return;

      const patch = {
        nome: editForm.nome,
        descricao: editForm.descricao,
        status: editForm.status,
        inicio: editForm.inicio ? toISODateInput(editForm.inicio) : null,
        fim: editForm.fim ? toISODateInput(editForm.fim) : null,
        responsavel: (editForm.responsavel || "").trim(),
        prioridade: editForm.prioridade,
        tags: parseTags(editForm.tagsTexto),
        subtarefas: editSubtarefas.map((s, idx) => ({ id: s.id, texto: s.texto, done: !!s.done, ordem: idx + 1 })),
        recorrencia: (() => {
          const tipo = editForm.recorrenciaTipo;
          if (tipo === "Sem recorrência") return null;
          if (tipo === "Diária") return { tipo: "DIARIO", intervalo: 1 };
          if (tipo === "Semanal") return { tipo: "SEMANAL", intervalo: 1, diasSemana: [Number(editForm.recorrenciaDiaSemana)] };
          if (tipo === "Mensal") return { tipo: "MENSAL", intervalo: 1, diasMes: [Number(editForm.recorrenciaDiaMes)] };
          return null;
        })(),
      };

      await atualizarTarefa(editId, patch);
      setEditOpen(false);
      setEditId(null);
      setEditForm(null);
      setEditSubtarefas([]);
    } catch (e) {
      setErro(e?.message || String(e));
    }
  }

  function editarToggleSub(idx) {
    setEditSubtarefas((prev) => prev.map((s, i) => (i === idx ? { ...s, done: !s.done } : s)));
  }

  function editarRemoveSub(idx) {
    setEditSubtarefas((prev) => prev.filter((_, i) => i !== idx));
  }

  function editarAddSub(texto) {
    const t = (texto || "").trim();
    if (!t) return;
    setEditSubtarefas((prev) => [...prev, { id: `st_${Date.now()}_${Math.random().toString(16).slice(2)}`, texto: t, done: false }]);
  }

  async function evoluirStatus(t) {
    const ordem = ["A fazer", "Fazendo", "Acompanhando", "Concluida"];
    const idx = Math.max(0, ordem.indexOf(t.status));
    const next = ordem[(idx + 1) % ordem.length];

    if (next === "Concluida") {
      await arquivarTarefa(t.id); // concluir = arquivar
    } else {
      await atualizarTarefa(t.id, { status: next });
    }
  }

  function TaskCard({ t }) {
    const isArquivada = !!t.arquivado || t.status === "Concluida";
    return (
      <div className="crono-task-item">
        <div className="crono-task-left">
          <div className="crono-task-title">{t.nome}</div>
          <div className="crono-task-meta">
            {(t.prioridade ? `${t.prioridade}` : "Média")}
            {" · "}
            {t.status}
            {t.responsavel ? ` · ${t.responsavel}` : ""}
          </div>

          {!!t.descricao && <div className="crono-task-desc">{t.descricao}</div>}

          {Array.isArray(t.subtarefas) && t.subtarefas.length > 0 && (
            <div className="crono-task-sublist">
              {t.subtarefas.map((s, i) => (
                <label key={s.id || i} className="crono-subcheck">
                  <input
                    type="checkbox"
                    checked={!!s.done}
                    onChange={() => atualizarTarefa(t.id, {
                      subtarefas: t.subtarefas.map((x, j) => j === i ? { ...x, done: !x.done } : x)
                    })}
                  />
                  <span className={s.done ? "crono-subtext done" : "crono-subtext"}>{s.texto}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="crono-task-actions">
          {!isArquivada && (
            <>
              <button className="crono-btn" onClick={() => arquivarTarefa(t.id)}>Concluir</button>
              <button className="crono-btn" onClick={() => evoluirStatus(t)}>Evoluir status</button>
              <button className="crono-btn" onClick={() => abrirEditar(t)}>Editar</button>
              <button className="crono-btn crono-btn-danger" onClick={() => apagarTarefa(t.id)}>Apagar</button>
            </>
          )}

          {isArquivada && (
            <>
              <button className="crono-btn" onClick={() => desarquivarTarefa(t.id)}>Reabrir</button>
              <button className="crono-btn crono-btn-danger" onClick={() => apagarTarefa(t.id)}>Apagar</button>
            </>
          )}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="crono-main">
       <div className="crono-card">
          <p>Faça login no Portal para acessar as tarefas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="crono-main">
      <h1 className="crono-page-title">Tarefas</h1>

      <div className="crono-card">
        <div className="crono-topbar">
          <div className="crono-topbar-left">
            <span className="crono-muted">Logado: </span>
            <strong>{user.email}</strong>
          </div>

          <div className="crono-topbar-right">
            <label className="crono-inline-check">
              <input
                type="checkbox"
                checked={mostrarArquivadas}
                onChange={(e) => setMostrarArquivadas(e.target.checked)}
              />
              <span>Mostrar arquivadas</span>
            </label>
          </div>
        </div>

        {erro && <div className="crono-error">{erro}</div>}

        {/* filtros */}
        <div className="crono-filters-row">
          <select
            className="crono-input"
            value={projetoFiltroId}
            onChange={(e) => setProjetoFiltroId(e.target.value)}
          >
            <option value="">Todos os projetos</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>

          <select className="crono-input" value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)}>
            <option value="">Status (todos)</option>
            {STATUS_TODOS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <select className="crono-input" value={responsavelFiltro} onChange={(e) => setResponsavelFiltro(e.target.value)}>
            <option value="">Responsável (todos)</option>
            {responsaveisDisponiveis.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select className="crono-input" value={tagFiltro} onChange={(e) => setTagFiltro(e.target.value)}>
            <option value="">Tags (todas)</option>
            {tagsDisponiveis.map((tg) => (
              <option key={tg} value={tg}>
                {tg}
              </option>
            ))}
          </select>

          <div className="crono-filter-hint">
            Projeto (filtro): <strong>{projetoNomeFiltro}</strong>
          </div>
        </div>

        {/* form criação */}
        <div className="crono-form-grid">
          <input
            className="crono-input"
            placeholder="Título/Nome da tarefa"
            value={form.nome}
            onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
          />

          <input
            className="crono-input"
            placeholder="Responsável"
            value={form.responsavel}
            onChange={(e) => setForm((f) => ({ ...f, responsavel: e.target.value }))}
          />

          <div className="crono-field">
            <div className="crono-field-label">Data de início</div>
            <input
              className="crono-input"
              type="date"
              value={toISODateInput(form.inicio)}
              onChange={(e) => setForm((f) => ({ ...f, inicio: fromISODateInput(e.target.value) }))}
            />
          </div>

          <div className="crono-field">
            <div className="crono-field-label">Data de vencimento</div>
            <input
              className="crono-input"
              type="date"
              value={toISODateInput(form.fim)}
              onChange={(e) => setForm((f) => ({ ...f, fim: fromISODateInput(e.target.value) }))}
            />
          </div>

          <select
            className="crono-input"
            value={form.prioridade}
            onChange={(e) => setForm((f) => ({ ...f, prioridade: e.target.value }))}
          >
            {PRIORIDADE_OPCOES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>

          <select
            className="crono-input"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            {STATUS_OPCOES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button className="crono-btn" onClick={onCriar} disabled={!form.nome.trim()}>
            Criar
          </button>
        </div>

        <div className="crono-form-row">
          <input
            className="crono-input"
            placeholder="Etiquetas/Tags (separe por vírgula)"
            value={form.tagsTexto}
            onChange={(e) => setForm((f) => ({ ...f, tagsTexto: e.target.value }))}
          />

          <select
            className="crono-input"
            value={form.recorrenciaTipo}
            onChange={(e) => setForm((f) => ({ ...f, recorrenciaTipo: e.target.value }))}
          >
            {RECORRENCIA_TIPO.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          {form.recorrenciaTipo === "Semanal" && (
            <select
              className="crono-input"
              value={form.recorrenciaDiaSemana}
              onChange={(e) => setForm((f) => ({ ...f, recorrenciaDiaSemana: Number(e.target.value) }))}
            >
              {DIAS_SEMANA.map((d) => (
                <option key={d.v} value={d.v}>
                  {d.l}
                </option>
              ))}
            </select>
          )}

          {form.recorrenciaTipo === "Mensal" && (
            <input
              className="crono-input"
              type="number"
              min="1"
              max="31"
              value={form.recorrenciaDiaMes}
              onChange={(e) => setForm((f) => ({ ...f, recorrenciaDiaMes: Number(e.target.value) }))}
              placeholder="Dia do mês"
            />
          )}
        </div>

        <textarea
          className="crono-input"
          placeholder="Descrição"
          rows={3}
          value={form.descricao}
          onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
        />

        {/* checklist criação */}
        <div className="crono-subcreator">
          <input
            className="crono-input"
            placeholder="Adicionar subtarefa (checklist)"
            value={subInput}
            onChange={(e) => setSubInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addSubtarefa();
              }
            }}
          />
          <button className="crono-btn" onClick={addSubtarefa} disabled={!subInput.trim()}>
            Adicionar
          </button>
          <span className="crono-muted">até ~15 recomendado</span>
        </div>

        {subtarefas.length > 0 && (
          <div className="crono-task-sublist">
            {subtarefas.map((s, i) => (
              <label key={s.id} className="crono-subcheck">
                <input type="checkbox" checked={!!s.done} onChange={() => toggleSub(i)} />
                <span className={s.done ? "crono-subtext done" : "crono-subtext"}>{s.texto}</span>
                <button className="crono-iconbtn" onClick={() => removeSub(i)} title="Remover">
                  ✕
                </button>
              </label>
            ))}
          </div>
        )}

        {/* listas */}
        <div className="crono-status-section">
          <h3>A fazer ({porStatus["A fazer"].length})</h3>
          {porStatus["A fazer"].map((t) => <TaskCard key={t.id} t={t} />)}
        </div>

        <div className="crono-status-section">
          <h3>Fazendo ({porStatus["Fazendo"].length})</h3>
          {porStatus["Fazendo"].map((t) => <TaskCard key={t.id} t={t} />)}
        </div>

        <div className="crono-status-section">
          <h3>Acompanhando ({porStatus["Acompanhando"].length})</h3>
          {porStatus["Acompanhando"].map((t) => <TaskCard key={t.id} t={t} />)}
        </div>

        {mostrarArquivadas && (
          <div className="crono-status-section">
            <h3>Arquivadas ({porStatus["Concluida"].length})</h3>
            {porStatus["Concluida"].map((t) => <TaskCard key={t.id} t={t} />)}
          </div>
        )}
      </div>

      {/* modal edição */}
      {editOpen && editForm && (
        <div className="crono-modal-overlay" onMouseDown={() => setEditOpen(false)}>
          <div className="crono-modal" onMouseDown={(e) => e.stopPropagation()}>
            <div className="crono-modal-header">
              <h3>Editar tarefa</h3>
              <button className="crono-btn" onClick={() => setEditOpen(false)}>Fechar</button>
            </div>

            <div className="crono-form-grid">
              <input className="crono-input" value={editForm.nome} onChange={(e)=>setEditForm(f=>({...f, nome:e.target.value}))} />
              <input className="crono-input" placeholder="Responsável" value={editForm.responsavel} onChange={(e)=>setEditForm(f=>({...f, responsavel:e.target.value}))} />

              <div className="crono-field">
                <div className="crono-field-label">Data de início</div>
                <input className="crono-input" type="date" value={toISODateInput(editForm.inicio)} onChange={(e)=>setEditForm(f=>({...f, inicio: fromISODateInput(e.target.value)}))} />
              </div>

              <div className="crono-field">
                <div className="crono-field-label">Data de vencimento</div>
                <input className="crono-input" type="date" value={toISODateInput(editForm.fim)} onChange={(e)=>setEditForm(f=>({...f, fim: fromISODateInput(e.target.value)}))} />
              </div>

              <select className="crono-input" value={editForm.prioridade} onChange={(e)=>setEditForm(f=>({...f, prioridade:e.target.value}))}>
                {PRIORIDADE_OPCOES.map(p=><option key={p} value={p}>{p}</option>)}
              </select>

              <select className="crono-input" value={editForm.status} onChange={(e)=>setEditForm(f=>({...f, status:e.target.value}))}>
                {STATUS_TODOS.map(s=><option key={s} value={s}>{s}</option>)}
              </select>

              <button className="crono-btn" onClick={salvarEdicao}>Salvar</button>
            </div>

            <div className="crono-form-row">
              <input className="crono-input" placeholder="Etiquetas/Tags (separe por vírgula)" value={editForm.tagsTexto} onChange={(e)=>setEditForm(f=>({...f, tagsTexto:e.target.value}))} />
              <select className="crono-input" value={editForm.recorrenciaTipo} onChange={(e)=>setEditForm(f=>({...f, recorrenciaTipo:e.target.value}))}>
                {RECORRENCIA_TIPO.map(r=><option key={r} value={r}>{r}</option>)}
              </select>
              {editForm.recorrenciaTipo === "Semanal" && (
                <select className="crono-input" value={editForm.recorrenciaDiaSemana} onChange={(e)=>setEditForm(f=>({...f, recorrenciaDiaSemana:Number(e.target.value)}))}>
                  {DIAS_SEMANA.map(d=><option key={d.v} value={d.v}>{d.l}</option>)}
                </select>
              )}
              {editForm.recorrenciaTipo === "Mensal" && (
                <input className="crono-input" type="number" min="1" max="31" value={editForm.recorrenciaDiaMes} onChange={(e)=>setEditForm(f=>({...f, recorrenciaDiaMes:Number(e.target.value)}))} />
              )}
            </div>

            <textarea className="crono-input" rows={3} value={editForm.descricao} onChange={(e)=>setEditForm(f=>({...f, descricao:e.target.value}))} />

            <div className="crono-subcreator">
              <input className="crono-input" placeholder="Adicionar subtarefa" onKeyDown={(e)=>{ if(e.key==="Enter"){ e.preventDefault(); editarAddSub(e.target.value); e.target.value=""; }}} />
              <span className="crono-muted">Enter para adicionar</span>
            </div>

            {editSubtarefas.length > 0 && (
              <div className="crono-task-sublist">
                {editSubtarefas.map((s,i)=>(
                  <label key={s.id} className="crono-subcheck">
                    <input type="checkbox" checked={!!s.done} onChange={()=>editarToggleSub(i)} />
                    <span className={s.done ? "crono-subtext done" : "crono-subtext"}>{s.texto}</span>
                    <button className="crono-iconbtn" onClick={()=>editarRemoveSub(i)} title="Remover">✕</button>
                  </label>
                ))}
              </div>
            )}

            <div className="crono-modal-actions">
              <button className="crono-btn" onClick={salvarEdicao}>Salvar</button>
              <button className="crono-btn crono-btn-danger" onClick={()=>{ setEditOpen(false); }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* micro-ajustes locais (sem mexer em paleta do Portal) */
        .crono-topbar{
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:10px;
        }
        .crono-muted{ opacity:.75; }
        .crono-error{ margin: 10px 0; padding: 10px; border-radius: 10px; background: rgba(255,120,120,.18); border: 1px solid rgba(180,40,40,.25); }
        .crono-filters-row{
          display: flex;
          gap: 10px;
          flex-wrap: nowrap; /* Impede a quebra de linha */
          align-items: center;
          margin-bottom: 10px;
          overflow-x: auto;
        }
        .crono-filter-hint{ justify-self:end; opacity:.85; }
        .crono-form-grid{
          display:grid;
          grid-template-columns: 2.2fr 1.2fr 1fr 1fr 1fr 1fr 140px;
          gap:10px;
          align-items:end;
          margin: 12px 0 8px;
        }
        .crono-form-row{
          display:flex; gap:10px; flex-wrap:wrap; align-items:center;
          margin: 8px 0;
        }
        .crono-field-label{ font-size: 13px; margin: 0 0 4px 2px; opacity:.85; }
        .crono-input{
          font-size: 15px;
          padding: 10px 12px;
          border-radius: 12px;
          width: 100%;
          box-sizing: border-box;
        }
        .crono-btn{
          font-size: 15px;
          padding: 10px 12px;
          border-radius: 12px;
          cursor:pointer;
        }
        .crono-subcreator{
          display:flex; gap:10px; align-items:center; margin: 10px 0;
        }
        .crono-task-item{
          display:flex; justify-content:space-between; gap:12px;
          padding: 12px;
          border-radius: 14px;
          border: 1px solid rgba(0,0,0,.06);
          background: rgba(255,255,255,.55);
          margin: 10px 0;
        }
        .crono-task-title{ font-weight: 800; font-size: 16px; }
        .crono-task-meta{ font-size: 13px; opacity: .75; margin-top: 2px;}
        .crono-task-desc{ margin-top: 8px; opacity: .9; }
        .crono-task-actions{ display:flex; gap:8px; flex-wrap:wrap; align-items:flex-start; justify-content:flex-end; }
        .crono-btn-danger{ }
        .crono-status-section h3{ margin: 18px 0 6px; }
        .crono-task-sublist{ margin-top: 10px; display:flex; flex-direction:column; gap:8px; }
        .crono-subcheck{ display:flex; gap:8px; align-items:center; }
        .crono-subtext.done{ text-decoration: line-through; opacity: .75; }
        .crono-iconbtn{ border:none; background:transparent; cursor:pointer; padding: 2px 6px; opacity:.8; }
        .crono-modal-overlay{ position: fixed; inset: 0; display:flex; align-items:center; justify-content:center; z-index: 9999; }
        .crono-modal{ width: min(980px, calc(100vw - 40px)); max-height: calc(100vh - 40px); overflow:auto; padding: 16px; border-radius: 18px; }
        .crono-modal-header{ display:flex; justify-content:space-between; align-items:center; gap:10px; margin-bottom: 10px; }
        .crono-modal-actions{ display:flex; gap:10px; justify-content:flex-end; margin-top: 12px; }
        @media (max-width: 980px){
          .crono-filters-row{ grid-template-columns: 1fr; }
          .crono-filter-hint{ justify-self:start; width: 100%; margin-top: 2px; }
          .crono-form-grid{ grid-template-columns: 1fr 1fr; }
          .crono-task-item{ flex-direction:column; }
          .crono-task-actions{ justify-content:flex-start; }
        }
      `}</style>
    </div>
  );
}
