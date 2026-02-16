import React, { useEffect, useMemo, useState } from "react";
import { httpsCallable } from "../firebase-adapter";
import { listenProjetos } from "../services/projetosService";
import { criarTarefa } from "../services/tarefasService";

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Falha ao ler arquivo."));
    reader.onload = () => {
      const res = String(reader.result || "");
      // res = data:<mime>;base64,....
      const base64 = res.includes(",") ? res.split(",")[1] : res;
      resolve(base64);
    };
    reader.readAsDataURL(file);
  });
}

export default function Importar() {
  const [projetos, setProjetos] = useState([]);
  const [projetoId, setProjetoId] = useState("");
  const [file, setFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [texto, setTexto] = useState("");
  const [tarefas, setTarefas] = useState([]);
  const [salvando, setSalvando] = useState(false);
  const [salvoMsg, setSalvoMsg] = useState("");

  useEffect(() => {
    const unsub = listenProjetos((items) => {
      setProjetos(items || []);
      if (!projetoId && items?.length) setProjetoId(items[0].id);
    });
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canRun = useMemo(() => !!projetoId && !!file && !loading, [projetoId, file, loading]);

  async function onInterpretar() {
    setErro("");
    setSalvoMsg("");
    setLoading(true);
    setTexto("");
    setTarefas([]);

    try {
      const base64 = await fileToBase64(file);
      const call = httpsCallable("interpretarArquivo", "us-central1");
      const resp = await call({
        fileBase64: base64,
        mimeType: file.type || "application/octet-stream",
        fileName: file.name || "arquivo",
      });

      const payload = resp?.data || {};
      setTexto(String(payload.texto || ""));
      setTarefas(Array.isArray(payload.tarefas) ? payload.tarefas : []);
    } catch (e) {
      setErro(e?.message || "Erro ao interpretar arquivo.");
    } finally {
      setLoading(false);
    }
  }

  async function onSalvarTarefas() {
    setErro("");
    setSalvoMsg("");
    if (!projetoId) return setErro("Selecione um projeto.");

    if (!tarefas.length) return setErro("Não há tarefas para salvar.");
    setSalvando(true);

    try {
      // Cria tarefas como “A_FAZER” e tag IA
      for (const t of tarefas) {
        const titulo = String(t?.titulo || t?.title || "").trim();
        if (!titulo) continue;

        await criarTarefa({
          projetoId,
          titulo,
          responsavel: String(t?.responsavel || t?.owner || "").trim(),
          prioridade: String(t?.prioridade || "MEDIA").toUpperCase(),
          status: "A_FAZER",
          descricao: String(t?.descricao || t?.description || "").trim(),
          tags: Array.from(new Set([...(t?.tags || []), "IA"])).filter(Boolean),
          checklist: Array.isArray(t?.checklist) ? t.checklist : [],
          dataInicio: t?.dataInicio || null,
          dataVencimento: t?.dataVencimento || null,
          recorrencia: t?.recorrencia || { tipo: "SEM_RECORRENCIA" },
        });
      }

      setSalvoMsg("Tarefas criadas com sucesso ✅");
    } catch (e) {
      setErro(e?.message || "Erro ao salvar tarefas.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="crono-importar">
      <div className="crono-row" style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}>
        <label className="crono-field">
          <span className="crono-label">Projeto</span>
          <select value={projetoId} onChange={(e) => setProjetoId(e.target.value)} className="crono-input">
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || "(sem nome)"}
              </option>
            ))}
          </select>
        </label>

        <label className="crono-field">
          <span className="crono-label">Arquivo (PDF/DOCX/TXT)</span>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="crono-input"
          />
        </label>
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <button className="crono-btn primary" onClick={onInterpretar} disabled={!canRun}>
          {loading ? "Interpretando..." : "Interpretar com IA"}
        </button>

        <button className="crono-btn" onClick={onSalvarTarefas} disabled={!tarefas.length || salvando}>
          {salvando ? "Salvando..." : "Salvar tarefas no projeto"}
        </button>
      </div>

      {erro ? (
        <div className="crono-alert error" style={{ marginTop: 12 }}>
          {erro}
        </div>
      ) : null}

      {salvoMsg ? (
        <div className="crono-alert success" style={{ marginTop: 12 }}>
          {salvoMsg}
        </div>
      ) : null}

      {tarefas?.length ? (
        <div style={{ marginTop: 16 }}>
          <h3 style={{ margin: "10px 0" }}>Prévia ({tarefas.length})</h3>
          <div className="crono-mini-list">
            {tarefas.map((t, idx) => (
              <div key={idx} className="crono-mini-item">
                <div style={{ fontWeight: 700 }}>{t.titulo || t.title || "(sem título)"}</div>
                <div style={{ opacity: 0.8, fontSize: 13 }}>
                  {t.responsavel ? `Resp.: ${t.responsavel}` : ""}{" "}
                  {t.prioridade ? `• Prior.: ${t.prioridade}` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {texto ? (
        <details style={{ marginTop: 16 }}>
          <summary style={{ cursor: "pointer" }}>Ver texto extraído</summary>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 10 }}>{texto}</pre>
        </details>
      ) : null}
    </div>
  );
}
