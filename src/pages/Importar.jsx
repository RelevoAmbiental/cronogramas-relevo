import React, { useMemo, useState } from "react";
import { useCronograma } from "../context/CronogramaContext";

const ENDPOINT = "https://us-central1-portal-relevo.cloudfunctions.net/interpretarArquivo";

function toISODate(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
  try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
}

function addDays(baseISO, days) {
  const d = new Date(baseISO + "T00:00:00");
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10);
}

function normalizeTask(raw, idx) {
  const nome = (raw?.nome || raw?.title || raw?.tarefa || "").toString();
  const descricao = (raw?.descricao || raw?.description || "").toString();
  const categoria = (raw?.categoria || "").toString();
  const produto = (raw?.produto || "").toString();
  const responsavel = (raw?.responsavel || raw?.owner || "").toString();

  const inicioAbs = toISODate(raw?.inicio || raw?.start || raw?.dataInicio);
  const fimAbs = toISODate(raw?.fim || raw?.end || raw?.dataFim);

  const inicioRel = Number(raw?.inicioRelativoDias ?? raw?.inicio_relativo_dias ?? 0) || 0;
  const dur = Math.max(1, Number(raw?.duracaoDias ?? raw?.duracao_dias ?? 1) || 1);

  return {
    idLocal: `${Date.now()}-${idx}`,
    nome,
    descricao,
    categoria,
    produto,
    responsavel,
    inicioAbs,
    fimAbs,
    inicioRel,
    dur,
    collapsed: false,
  };
}

export default function Importar() {
  const { carregando, projetos, criarTarefa } = useCronograma();

  const [projetoId, setProjetoId] = useState("");
  const [dataBase, setDataBase] = useState(() => new Date().toISOString().slice(0, 10));

  const [file, setFile] = useState(null);
  const [textoColado, setTextoColado] = useState("");

  const [rawPreview, setRawPreview] = useState("");
  const [tarefas, setTarefas] = useState([]);

  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const canRun = useMemo(() => {
    return !!projetoId && (!!file || textoColado.trim().length > 20);
  }, [projetoId, file, textoColado]);

  function reset() {
    setFile(null);
    setTextoColado("");
    setRawPreview("");
    setTarefas([]);
    setError("");
    setOkMsg("");
    const inp = document.getElementById("crono-file");
    if (inp) inp.value = "";
  }

  function onPickFile(e) {
    const f = e.target.files?.[0] || null;
    setFile(f);
    setError("");
    setOkMsg("");
  }

  async function callIA() {
    setError("");
    setOkMsg("");

    if (!projetoId) {
      setError("Selecione um projeto.");
      return;
    }

    let payloadFile = file;
    if (!payloadFile) {
      const blob = new Blob([textoColado], { type: "text/plain" });
      payloadFile = new File([blob], "texto-colado.txt", { type: "text/plain" });
    }

    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", payloadFile);

      const resp = await fetch(ENDPOINT, { method: "POST", body: form });

      let bodyText = "";
      let json = null;
      try {
        bodyText = await resp.text();
        json = bodyText ? JSON.parse(bodyText) : null;
      } catch {
        json = null;
      }

      if (!resp.ok) {
        const msg = json?.error || bodyText || `Erro HTTP ${resp.status}`;
        throw new Error(msg);
      }

      const tarefasRaw = Array.isArray(json) ? json : json?.tarefas;
      if (!Array.isArray(tarefasRaw)) {
        throw new Error("Resposta inesperada da IA (sem lista de tarefas).");
      }

      const previewTxt = json?.texto || json?.textoOriginal || bodyText;
      setRawPreview(typeof previewTxt === "string" ? previewTxt : JSON.stringify(json, null, 2));

      const norm = tarefasRaw.map((t, i) => normalizeTask(t, i));
      setTarefas(norm);
      setOkMsg("Tarefas geradas. Agora é só revisar e salvar.");
    } catch (e) {
      console.error(e);
      setError(
        "Falha ao processar com IA. " +
          (e?.message || "Erro desconhecido") +
          "\n\nDica rápida: se for PDF escaneado, cole o texto aqui (ou exporte para texto) e tente novamente."
      );
    } finally {
      setBusy(false);
    }
  }

  function updateTask(i, patch) {
    setTarefas((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }

  function moveTask(from, to) {
    if (from === to) return;
    setTarefas((prev) => {
      const arr = prev.slice();
      const [it] = arr.splice(from, 1);
      arr.splice(to, 0, it);
      return arr;
    });
  }

  async function saveAll() {
    setError("");
    setOkMsg("");

    if (!projetoId) {
      setError("Selecione um projeto.");
      return;
    }
    if (tarefas.length === 0) {
      setError("Nenhuma tarefa para salvar.");
      return;
    }

    setSaving(true);
    try {
      for (const t of tarefas) {
        const inicio = t.inicioAbs || addDays(dataBase, t.inicioRel);
        const fim = t.fimAbs || addDays(inicio, Math.max(0, (t.dur || 1) - 1));

        await criarTarefa({
          projetoId,
          nome: t.nome || "Tarefa sem nome",
          descricao: t.descricao || "",
          categoria: t.categoria || "",
          produto: t.produto || "",
          responsavel: t.responsavel || "",
          status: "pendente",
          inicio,
          fim,
          criadoEm: new Date(),
        });
      }

      setOkMsg("Tarefas salvas no projeto. Bora tocar o cronograma.");
    } catch (e) {
      console.error(e);
      setError("Falha ao salvar tarefas no Firestore.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="crono-page">
      <div className="crono-pagehead">
        <div>
          <h1>Importar cronograma (IA)</h1>
          <p>
            Envie um PDF/DOCX/TXT (ou cole o texto), deixe a IA sugerir tarefas e revise antes de gravar.
          </p>
        </div>
      </div>

      <div className="crono-card">
        <div className="crono-grid two" style={{ alignItems: "end" }}>
          <div className="crono-form">
            <label>
              <span>Projeto</span>
              <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} disabled={carregando || busy || saving}>
                <option value="">— Selecione —</option>
                {projetos.map((p) => (
                  <option key={p.id} value={p.id}>{p.nome}</option>
                ))}
              </select>
            </label>

            <label>
              <span>Data base (para tarefas relativas)</span>
              <input type="date" value={dataBase} onChange={(e) => setDataBase(e.target.value)} disabled={busy || saving} />
            </label>

            <label>
              <span>Arquivo</span>
              <input id="crono-file" type="file" accept=".pdf,.doc,.docx,.txt" onChange={onPickFile} disabled={busy || saving} />
            </label>
          </div>

          <div className="crono-form">
            <label>
              <span>Ou cole o texto (fallback)</span>
              <textarea
                rows={7}
                value={textoColado}
                onChange={(e) => setTextoColado(e.target.value)}
                placeholder="Cole aqui o conteúdo da proposta/relatório. (Se tiver menos de ~20 caracteres, eu suspeito que foi Ctrl+C sem querer.)"
                disabled={busy || saving}
              />
            </label>

            <div className="crono-row-actions" style={{ justifyContent: "flex-end" }}>
              <button className="crono-btn secondary" onClick={reset} disabled={busy || saving}>Limpar</button>
              <button className="crono-btn" onClick={callIA} disabled={!canRun || busy || saving || carregando}>
                {busy ? "Processando…" : "Extrair tarefas com IA"}
              </button>
            </div>
          </div>
        </div>

        {(error || okMsg) && (
          <div style={{ marginTop: 12 }}>
            {error && <div className="crono-alert error" style={{ whiteSpace: "pre-wrap" }}>{error}</div>}
            {okMsg && <div className="crono-alert ok">{okMsg}</div>}
          </div>
        )}

        <div className="crono-divider" />

        <div className="crono-grid two">
          <div className="crono-card inner">
            <h2>Texto/retorno</h2>
            <p className="crono-muted">Útil para depurar quando a IA resolve ser… criativa.</p>
            <pre className="crono-pre">{rawPreview || "Nada ainda."}</pre>
          </div>

          <div className="crono-card inner">
            <div className="crono-row" style={{ justifyContent: "space-between", alignItems: "baseline" }}>
              <div>
                <h2>Tarefas extraídas</h2>
                <p className="crono-muted">Arraste (↑/↓) para reordenar. Clique para expandir.</p>
              </div>
              <button className="crono-btn" onClick={saveAll} disabled={saving || busy || carregando || tarefas.length === 0 || !projetoId}>
                {saving ? "Salvando…" : "Salvar no projeto"}
              </button>
            </div>

            {tarefas.length === 0 ? (
              <div className="crono-td-muted">Nenhuma tarefa ainda.</div>
            ) : (
              <div className="crono-tasklist">
                {tarefas.map((t, i) => (
                  <div key={t.idLocal} className={"crono-taskcard " + (t.collapsed ? "collapsed" : "")}
                       onClick={() => updateTask(i, { collapsed: !t.collapsed })}>
                    <div className="crono-taskhead">
                      <div className="crono-tasktitle">
                        <span className="crono-tasknum">#{i + 1}</span>
                        <strong>{t.nome || "(sem nome)"}</strong>
                      </div>
                      <div className="crono-row-actions" onClick={(e) => e.stopPropagation()}>
                        <button className="crono-btn tiny secondary" onClick={() => moveTask(i, Math.max(0, i - 1))} disabled={i === 0}>↑</button>
                        <button className="crono-btn tiny secondary" onClick={() => moveTask(i, Math.min(tarefas.length - 1, i + 1))} disabled={i === tarefas.length - 1}>↓</button>
                        <button className="crono-btn tiny danger" onClick={() => setTarefas((prev) => prev.filter((_, idx) => idx !== i))}>Remover</button>
                      </div>
                    </div>

                    <div className="crono-taskbody" onClick={(e) => e.stopPropagation()}>
                      <div className="crono-form inline twoCols">
                        <label>
                          <span>Nome</span>
                          <input value={t.nome} onChange={(e) => updateTask(i, { nome: e.target.value })} />
                        </label>
                        <label>
                          <span>Responsável</span>
                          <input value={t.responsavel} onChange={(e) => updateTask(i, { responsavel: e.target.value })} />
                        </label>
                        <label>
                          <span>Categoria</span>
                          <input value={t.categoria} onChange={(e) => updateTask(i, { categoria: e.target.value })} />
                        </label>
                        <label>
                          <span>Produto</span>
                          <input value={t.produto} onChange={(e) => updateTask(i, { produto: e.target.value })} />
                        </label>
                        <label className="span2">
                          <span>Descrição</span>
                          <textarea rows={2} value={t.descricao} onChange={(e) => updateTask(i, { descricao: e.target.value })} />
                        </label>
                      </div>

                      <div className="crono-divider slim" />

                      <div className="crono-grid three">
                        <div className="crono-mini">
                          <div className="crono-mini-label">Modo</div>
                          <div className="crono-mini-value">{t.inicioAbs ? "Datas absolutas" : "Relativo à data base"}</div>
                        </div>
                        <div className="crono-mini">
                          <div className="crono-mini-label">Início</div>
                          <div className="crono-mini-value">{t.inicioAbs || addDays(dataBase, t.inicioRel)}</div>
                        </div>
                        <div className="crono-mini">
                          <div className="crono-mini-label">Fim</div>
                          <div className="crono-mini-value">{t.fimAbs || addDays(t.inicioAbs || addDays(dataBase, t.inicioRel), Math.max(0, (t.dur || 1) - 1))}</div>
                        </div>
                      </div>

                      {!t.inicioAbs && (
                        <div className="crono-form inline" style={{ marginTop: 10 }}>
                          <label>
                            <span>Início relativo (dias)</span>
                            <input type="number" value={t.inicioRel} onChange={(e) => updateTask(i, { inicioRel: Number(e.target.value || 0) })} />
                          </label>
                          <label>
                            <span>Duração (dias)</span>
                            <input type="number" value={t.dur} onChange={(e) => updateTask(i, { dur: Math.max(1, Number(e.target.value || 1)) })} />
                          </label>
                        </div>
                      )}

                      {t.inicioAbs && (
                        <div className="crono-form inline" style={{ marginTop: 10 }}>
                          <label>
                            <span>Início (YYYY-MM-DD)</span>
                            <input type="date" value={t.inicioAbs} onChange={(e) => updateTask(i, { inicioAbs: e.target.value })} />
                          </label>
                          <label>
                            <span>Fim (YYYY-MM-DD)</span>
                            <input type="date" value={t.fimAbs} onChange={(e) => updateTask(i, { fimAbs: e.target.value })} />
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
