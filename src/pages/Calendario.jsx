import React, { useMemo, useState } from "react";
import { useCronograma } from "../context/CronogramaContext";

function toISO(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
  try { return new Date(v).toISOString().slice(0, 10); } catch { return ""; }
}

function monthKey(iso) {
  return iso ? iso.slice(0, 7) : "Sem data";
}

export default function Calendario() {
  const { carregando, projetos, tarefas } = useCronograma();
  const [filtroProjeto, setFiltroProjeto] = useState("");

  const grouped = useMemo(() => {
    const list = filtroProjeto ? tarefas.filter((t) => t.projetoId === filtroProjeto) : tarefas;
    const byMonth = new Map();

    for (const t of list) {
      const d = toISO(t.inicio) || "";
      const k = monthKey(d);
      if (!byMonth.has(k)) byMonth.set(k, []);
      byMonth.get(k).push(t);
    }

    const months = Array.from(byMonth.entries())
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const [, arr] of months) {
      arr.sort((a, b) => (toISO(a.inicio) || "9999").localeCompare(toISO(b.inicio) || "9999"));
    }

    return months;
  }, [tarefas, filtroProjeto]);

  return (
    <div className="crono-page">
      <div className="crono-pagehead">
        <div>
          <h1>Calendário</h1>
          <p>Uma visão por mês para enxergar gargalos sem precisar de lupa.</p>
        </div>
      </div>

      <div className="crono-card">
        <div className="crono-toolbar">
          <div className="crono-field">
            <label>Projeto</label>
            <select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)} disabled={carregando}>
              <option value="">— Todos —</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>{p.nome}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="crono-divider" />

        {carregando ? (
          <div className="crono-td-muted">Carregando…</div>
        ) : grouped.length === 0 ? (
          <div className="crono-td-muted">Nenhuma tarefa encontrada.</div>
        ) : (
          grouped.map(([m, arr]) => (
            <div key={m} className="crono-month">
              <h2>{m === "Sem data" ? "Sem data" : m.replace("-", "/")}</h2>
              <div className="crono-tablewrap">
                <table className="crono-table">
                  <thead>
                    <tr>
                      <th>Início</th>
                      <th>Fim</th>
                      <th>Tarefa</th>
                      <th>Projeto</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {arr.map((t) => (
                      <tr key={t.id}>
                        <td>{toISO(t.inicio) || "—"}</td>
                        <td>{toISO(t.fim) || "—"}</td>
                        <td className="crono-td-strong">{t.nome || "(sem nome)"}</td>
                        <td>{projetos.find((p) => p.id === t.projetoId)?.nome || "—"}</td>
                        <td><span className={"crono-pill " + ((t.status || "pendente").toLowerCase())}>{t.status || "pendente"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
