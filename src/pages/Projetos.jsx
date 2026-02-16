import React, { useEffect, useMemo, useState, useRef } from "react";
import { onAuthStateChanged } from "../firebase-adapter";
import {
  criarProjeto,
  listenProjetos,
  atualizarProjeto,
  apagarProjeto,
  desarquivarProjeto,
} from "../services/projetosService";

/**
 * ColorPicker
 * - Exibe apenas um swatch + caret
 * - Ao clicar, abre popover com paleta 3x4
 * - Fecha ao clicar fora ou ESC
 */
function ColorPicker({ value, onChange, colors, title = "Selecionar cor" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleDown(e) {
      if (!open) return;
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    function handleKey(e) {
      if (open && e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleDown);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleDown);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const selected = colors.find((c) => c.key === value) || colors[0];

  return (
    <div className="crono-colorwrap" ref={ref}>
      <button
        type="button"
        className="crono-colorbtn"
        title={title}
        aria-label={title}
        onClick={() => setOpen((s) => !s)}
      >
        <span className="crono-colorswatch" style={{ background: selected?.hex }} />
        <span className="crono-colorcaret" aria-hidden="true">
          ▾
        </span>
      </button>

      {open ? (
        <div className="crono-colorpop" role="menu" aria-label="Paleta de cores">
          <div className="crono-colorgrid">
            {colors.map((c) => (
              <button
                key={c.key}
                type="button"
                className={"crono-color " + (value === c.key ? "is-selected" : "")}
                onClick={() => {
                  onChange(c.key);
                  setOpen(false);
                }}
                title={c.label}
                aria-label={`Cor: ${c.label}`}
                style={{ background: c.hex }}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function Projetos() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  const [items, setItems] = useState([]);

  const CORES = useMemo(
    () => [
      { key: "verde-escuro", label: "Verde escuro", hex: "#0a4723" },
      { key: "verde", label: "Verde", hex: "#116b3a" },
      { key: "oliva", label: "Oliva", hex: "#5c7c2a" },
      { key: "turquesa", label: "Turquesa", hex: "#1abc9c" },

      { key: "azul", label: "Azul", hex: "#1e5aa8" },
      { key: "azul-escuro", label: "Azul escuro", hex: "#0d3b66" },
      { key: "roxo", label: "Roxo", hex: "#6b3fa0" },
      { key: "rosa", label: "Rosa", hex: "#d63384" },

      { key: "laranja", label: "Laranja", hex: "#d6791d" },
      { key: "amarelo", label: "Amarelo", hex: "#f4b400" },
      { key: "vinho", label: "Vinho", hex: "#7b2d26" },
      { key: "cinza", label: "Cinza", hex: "#5a6b76" },
    ],
    []
  );

  const STATUS = useMemo(
    () => [
      { key: "planejado", label: "Planejado" },
      { key: "execucao", label: "Execução" },
      { key: "acompanhar", label: "Acompanhar" },
      { key: "arquivado", label: "Arquivado" },
    ],
    []
  );

  const STATUS_FLOW = useMemo(() => ["planejado", "execucao", "acompanhar", "arquivado"], []);

  function corHexFromKey(keyOrHex) {
    if ((keyOrHex || "").startsWith("#")) return keyOrHex;
    return CORES.find((c) => c.key === (keyOrHex || ""))?.hex || "#0a4723";
  }

  function corKeyFromHex(hex) {
    if (!hex) return "verde-escuro";
    const found = CORES.find((c) => c.hex.toLowerCase() === String(hex).toLowerCase());
    return found?.key || "verde-escuro";
  }

  function statusLabel(key) {
    return STATUS.find((s) => s.key === key)?.label || key || "—";
  }

  function nextStatus(curr) {
    const i = Math.max(0, STATUS_FLOW.indexOf(curr));
    return STATUS_FLOW[(i + 1) % STATUS_FLOW.length];
  }

  function formatPrazo(prazo) {
    const v = (prazo || "").trim();
    if (!v) return "—";
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [y, m, d] = v.split("-").map((n) => parseInt(n, 10));
      const dt = new Date(y, m - 1, d);
      if (!Number.isNaN(dt.getTime())) return dt.toLocaleDateString("pt-BR");
    }
    return v;
  }

  const [form, setForm] = useState({
    nome: "",
    cliente: "Relevo Consultoria",
    numeroProposta: "",
    cor: "verde-escuro",
    prazoExecucao: "",
    descricao: "",
    status: "planejado",
  });

  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({
    nome: "",
    cliente: "Relevo Consultoria",
    numeroProposta: "",
    cor: "verde-escuro",
    prazoExecucao: "",
    descricao: "",
    status: "planejado",
  });

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
        incluirArquivados: mostrarArquivados,
        onData: setItems,
        onError: (e) => setErro(String(e?.message || e)),
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
    return () => unsub?.();
  }, [user, mostrarArquivados]);

  async function handleCriar() {
    setErro("");
    try {
      await criarProjeto({
        ...form,
        cor: corHexFromKey(form.cor),
      });
      setForm({
        nome: "",
        cliente: "Relevo Consultoria",
        numeroProposta: "",
        cor: "verde-escuro",
        prazoExecucao: "",
        descricao: "",
        status: "planejado",
      });
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  function abrirEdicao(p) {
    setErro("");
    setEditId(p.id);
    setEditForm({
      nome: p.nome || "",
      cliente: p.cliente || "Relevo Consultoria",
      numeroProposta: p.numeroProposta || "",
      cor: corKeyFromHex(p.cor),
      prazoExecucao: p.prazoExecucao || "",
      descricao: p.descricao || "",
      status: p.status || (p.arquivado ? "arquivado" : "planejado"),
    });
    setEditOpen(true);
  }

  async function salvarEdicao() {
    if (!editId) return;
    setErro("");
    try {
      await atualizarProjeto(editId, {
        ...editForm,
        cor: corHexFromKey(editForm.cor),
      });
      setEditOpen(false);
      setEditId(null);
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  async function evoluirStatusProjeto(p) {
    setErro("");
    try {
      const atual = p.status || (p.arquivado ? "arquivado" : "planejado");
      const novo = nextStatus(atual);
      await atualizarProjeto(p.id, { status: novo });
    } catch (e) {
      setErro(String(e?.message || e));
    }
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
        <div style={{ opacity: 0.85 }}>
          {user ? (
            <>
              Logado: <b>{user.email}</b>
            </>
          ) : (
            "Aguardando autenticação..."
          )}
        </div>

        <label style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            type="checkbox"
            checked={mostrarArquivados}
            onChange={(e) => setMostrarArquivados(e.target.checked)}
          />
          Mostrar arquivados
        </label>
      </div>

      {erro && (
        <div
          style={{
            marginTop: 12,
            padding: 12,
            borderRadius: 12,
            background: "rgba(220,60,60,0.18)",
            border: "1px solid rgba(220,60,60,0.35)",
          }}
        >
          <b>Erro:</b> {erro}
        </div>
      )}

      {/* Cadastro */}
      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <div className="crono-form-grid">
          <input
            value={form.nome}
            onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
            placeholder="Nome do projeto"
            className="crono-input"
          />

          <input
            value={form.cliente}
            onChange={(e) => setForm((s) => ({ ...s, cliente: e.target.value }))}
            placeholder="Nome do cliente"
            className="crono-input"
          />

          <input
            value={form.numeroProposta}
            onChange={(e) => setForm((s) => ({ ...s, numeroProposta: e.target.value }))}
            placeholder="Nº da proposta"
            className="crono-input"
          />

          <ColorPicker
            value={form.cor}
            onChange={(newKey) => setForm((s) => ({ ...s, cor: newKey }))}
            colors={CORES}
            title="Cor do projeto"
          />

          <input
            type="date"
            value={form.prazoExecucao}
            onChange={(e) => setForm((s) => ({ ...s, prazoExecucao: e.target.value }))}
            className="crono-input"
            title="Prazo de execução"
          />

          <select
            value={form.status}
            onChange={(e) => setForm((s) => ({ ...s, status: e.target.value }))}
            className="crono-input"
            title="Status"
          >
            {STATUS.filter((s) => s.key !== "arquivado").map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>

          <button className="crono-btn" onClick={handleCriar} disabled={!user || !form.nome.trim()}>
            Criar
          </button>
        </div>

        <textarea
          value={form.descricao}
          onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
          placeholder="Descrição"
          className="crono-input"
          style={{ minHeight: 72 }}
        />
      </div>

      {/* Lista */}
      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {items.map((p) => {
          const st = p.status || (p.arquivado ? "arquivado" : "planejado");
          return (
            <div
              key={p.id}
              style={{
                padding: 12,
                borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.18)",
                background: p.arquivado ? "rgba(255,255,255,0.04)" : "transparent",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: 16 }}>{p.nome || "(sem nome)"}</div>
                  <div style={{ opacity: 0.85, fontSize: 12, marginTop: 2 }}>
                    {p.cliente || "—"}
                    {p.numeroProposta ? ` · Proposta: ${p.numeroProposta}` : ""}
                    {` · ${statusLabel(st)}`}
                    {p.prazoExecucao ? ` · Prazo: ${formatPrazo(p.prazoExecucao)}` : ""}
                  </div>
                </div>

                <div
                  title={p.cor || "#0a4723"}
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 7,
                    background: p.cor || "#0a4723",
                    border: "1px solid rgba(255,255,255,0.25)",
                  }}
                />
              </div>

              {p.descricao ? <div style={{ marginTop: 8, opacity: 0.92 }}>{p.descricao}</div> : null}

              <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
                {!p.arquivado ? (
                  <button className="crono-btn" onClick={() => evoluirStatusProjeto(p)}>
                    Evoluir status
                  </button>
                ) : (
                  <button
                    className="crono-btn"
                    onClick={() => desarquivarProjeto(p.id).catch((e) => setErro(String(e?.message || e)))}
                  >
                    Reabrir
                  </button>
                )}

                <button className="crono-btn" onClick={() => abrirEdicao(p)}>
                  Editar
                </button>

                <button
                  className="crono-btn crono-btn-danger"
                  onClick={() => {
                    if (confirm("Apagar projeto? (tarefas ficarão vinculadas por projetoId)")) {
                      apagarProjeto(p.id).catch((e) => setErro(String(e?.message || e)));
                    }
                  }}
                >
                  Apagar
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de edição */}
      {editOpen ? (
        <div className="crono-modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && setEditOpen(false)}>
          <div className="crono-modal" role="dialog" aria-modal="true" aria-label="Editar projeto">
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
              <div style={{ fontWeight: 900, fontSize: 16 }}>Editar projeto</div>
              <button className="crono-btn" onClick={() => setEditOpen(false)}>
                Fechar
              </button>
            </div>

            <div style={{ marginTop: 12 }} className="crono-form-grid">
              <input
                value={editForm.nome}
                onChange={(e) => setEditForm((s) => ({ ...s, nome: e.target.value }))}
                placeholder="Nome do projeto"
                className="crono-input"
              />

              <input
                value={editForm.cliente}
                onChange={(e) => setEditForm((s) => ({ ...s, cliente: e.target.value }))}
                placeholder="Nome do cliente"
                className="crono-input"
              />

              <input
                value={editForm.numeroProposta}
                onChange={(e) => setEditForm((s) => ({ ...s, numeroProposta: e.target.value }))}
                placeholder="Nº da proposta"
                className="crono-input"
              />

              <ColorPicker
                value={editForm.cor}
                onChange={(newKey) => setEditForm((s) => ({ ...s, cor: newKey }))}
                colors={CORES}
                title="Cor do projeto"
              />

              <input
                type="date"
                value={editForm.prazoExecucao}
                onChange={(e) => setEditForm((s) => ({ ...s, prazoExecucao: e.target.value }))}
                className="crono-input"
                title="Prazo de execução"
              />

              <select
                value={editForm.status}
                onChange={(e) => setEditForm((s) => ({ ...s, status: e.target.value }))}
                className="crono-input"
                title="Status"
              >
                {STATUS.map((s) => (
                  <option key={s.key} value={s.key}>
                    {s.label}
                  </option>
                ))}
              </select>

              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button className="crono-btn" onClick={salvarEdicao} disabled={!editForm.nome.trim()}>
                  Salvar
                </button>
                <button className="crono-btn crono-btn-danger" onClick={() => setEditOpen(false)}>
                  Cancelar
                </button>
              </div>
            </div>

            <textarea
              value={editForm.descricao}
              onChange={(e) => setEditForm((s) => ({ ...s, descricao: e.target.value }))}
              placeholder="Descrição"
              className="crono-input"
              style={{ minHeight: 96, marginTop: 10, width: "100%" }}
            />
          </div>
        </div>
      ) : null}

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

        .crono-form-grid{
          display:grid;
          gap:10px;
          grid-template-columns: 2fr 2fr 1.2fr 140px 1.1fr 1.2fr 160px;
          align-items: center;
        }
        @media (max-width: 980px){
          .crono-form-grid{ grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px){
          .crono-form-grid{ grid-template-columns: 1fr; }
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

        .crono-modal-overlay{
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.55);
          display: grid;
          place-items: center;
          padding: 18px;
          z-index: 9999;
        }
        .crono-modal{
          width: min(980px, 100%);
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(12, 28, 22, 0.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 14px;
          box-shadow: 0 14px 60px rgba(0,0,0,0.55);
        }

        /* Swatch + popover */
        .crono-colorwrap{
          position: relative;
          display: inline-flex;
          align-items: center;
          width: 100%;
        }
        .crono-colorbtn{
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.10);
          color: #fff;
          cursor: pointer;
          min-height: 42px;
          width: 100%;
          justify-content: center;
        }
        .crono-colorswatch{
          width: 24px;
          height: 24px;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,0.25);
          box-shadow: 0 8px 22px rgba(0,0,0,0.25);
        }
        .crono-colorcaret{
          opacity: .8;
          font-size: 12px;
        }
        .crono-colorpop{
          position: absolute;
          top: calc(100% + 10px);
          left: 0;
          z-index: 9999;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(12, 28, 22, 0.92);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          padding: 10px;
          box-shadow: 0 14px 60px rgba(0,0,0,0.55);
        }
        .crono-colorgrid{
          display: grid;
          grid-template-columns: repeat(4, 34px);
          gap: 10px;
        }
        .crono-color{
          width: 34px;
          height: 34px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.25);
          cursor: pointer;
          box-shadow: 0 8px 22px rgba(0,0,0,0.25);
          transition: transform .08s ease, box-shadow .08s ease, outline .08s ease;
        }
        .crono-color:hover{
          transform: translateY(-1px);
          box-shadow: 0 12px 26px rgba(0,0,0,0.32);
        }
        .crono-color.is-selected{
          outline: 3px solid rgba(255,255,255,0.70);
          outline-offset: 2px;
        }
      `}</style>
    </div>
  );
}
