import React, { useEffect, useState } from "react";
import { onAuthStateChanged } from "../firebase-adapter";
import {
  criarProjeto,
  listenProjetos,
  atualizarProjeto,
  apagarProjeto,
  arquivarProjeto,
  desarquivarProjeto,
} from "../services/projetosService";

export default function Projetos() {
  const [user, setUser] = useState(null);
  const [erro, setErro] = useState("");
  const [mostrarArquivados, setMostrarArquivados] = useState(false);

  const [items, setItems] = useState([]);
  const [form, setForm] = useState({
    nome: "",
    cliente: "Relevo Consultoria",
    cor: "#0a4723",
    descricao: "",
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
      await criarProjeto(form);
      setForm({ nome: "", cliente: "Relevo Consultoria", cor: "#0a4723", descricao: "" });
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

      <div style={{ marginTop: 14, display: "grid", gap: 10 }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 220px 1fr", gap: 10 }}>
          <input
            value={form.nome}
            onChange={(e) => setForm((s) => ({ ...s, nome: e.target.value }))}
            placeholder="Nome do projeto"
            className="crono-input"
          />

          <input
            value={form.cliente}
            onChange={(e) => setForm((s) => ({ ...s, cliente: e.target.value }))}
            placeholder="Cliente"
            className="crono-input"
          />

          {/* ✅ Seletor de cor (bloquinho) + valor ao lado */}
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <input
              type="color"
              value={form.cor}
              onChange={(e) => setForm((s) => ({ ...s, cor: e.target.value }))}
              title="Escolher cor"
              style={{
                width: 48,
                height: 42,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.22)",
                background: "transparent",
                padding: 0,
                cursor: "pointer",
              }}
            />
            <input
              value={form.cor}
              onChange={(e) => setForm((s) => ({ ...s, cor: e.target.value }))}
              placeholder="#0a4723"
              className="crono-input"
              style={{ width: 140 }}
            />
          </div>

          <button className="crono-btn" onClick={handleCriar} disabled={!user || !form.nome.trim()}>
            Criar
          </button>
        </div>

        <textarea
          value={form.descricao}
          onChange={(e) => setForm((s) => ({ ...s, descricao: e.target.value }))}
          placeholder="Descrição (opcional)"
          className="crono-input"
          style={{ minHeight: 72 }}
        />
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 12 }}>
        {items.map((p) => (
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
                <div style={{ fontWeight: 800 }}>{p.nome || "(sem nome)"}</div>
                <div style={{ opacity: 0.8, fontSize: 12 }}>
                  {p.cliente || "—"} · {p.status || "ativo"}
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

            {p.descricao ? <div style={{ marginTop: 8, opacity: 0.9 }}>{p.descricao}</div> : null}

            <div style={{ marginTop: 10, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!p.arquivado ? (
                <button
                  className="crono-btn"
                  onClick={() => arquivarProjeto(p.id).catch((e) => setErro(String(e?.message || e)))}
                >
                  Concluir/Arquivar
                </button>
              ) : (
                <button
                  className="crono-btn"
                  onClick={() => desarquivarProjeto(p.id).catch((e) => setErro(String(e?.message || e)))}
                >
                  Reabrir
                </button>
              )}

              <button
                className="crono-btn"
                onClick={() => {
                  const novo = prompt("Editar nome do projeto:", p.nome || "");
                  if (novo === null) return;
                  atualizarProjeto(p.id, { nome: novo }).catch((e) => setErro(String(e?.message || e)));
                }}
              >
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
