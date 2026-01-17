import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCronograma } from "../context/CronogramaContext";

function toDateStr(v) {
  if (!v) return "";
  if (typeof v === "string") return v.slice(0, 10);
  if (v?.toDate) return v.toDate().toISOString().slice(0, 10);
  try {
    return new Date(v).toISOString().slice(0, 10);
  } catch {
    return "";
  }
}

export default function Dashboard() {
  const { carregando, projetos, tarefas } = useCronograma();

  const stats = useMemo(() => {
    const totalProjetos = projetos.length;
    const totalTarefas = tarefas.length;
    const pendentes = tarefas.filter((t) => (t.status || "").toLowerCase() !== "concluida").length;
    const concluidas = totalTarefas - pendentes;

    const hoje = new Date().toISOString().slice(0, 10);
    const atrasadas = tarefas.filter((t) => {
      const fim = toDateStr(t.fim);
      const st = (t.status || "").toLowerCase();
      return fim && fim < hoje && st !== "concluida";
    }).length;

    return { totalProjetos, totalTarefas, pendentes, concluidas, atrasadas };
  }, [projetos, tarefas]);

  return (
    <div className="crono-page">
      <div className="crono-pagehead">
        <div>
          <h1>Visão geral</h1>
          <p>KPIs rápidos pra você saber se o cronograma está na linha… ou pedindo replanejamento.</p>
        </div>
        <div className="crono-actions">
          <Link className="crono-btn" to="/importar">✨ Importar tarefas</Link>
          <Link className="crono-btn secondary" to="/projetos">🗂️ Ver projetos</Link>
        </div>
      </div>

      <div className="crono-grid kpi">
        <div className="crono-card">
          <div className="crono-kpi-label">Projetos</div>
          <div className="crono-kpi-value">{carregando ? "…" : stats.totalProjetos}</div>
        </div>
        <div className="crono-card">
          <div className="crono-kpi-label">Tarefas</div>
          <div className="crono-kpi-value">{carregando ? "…" : stats.totalTarefas}</div>
        </div>
        <div className="crono-card">
          <div className="crono-kpi-label">Pendentes</div>
          <div className="crono-kpi-value">{carregando ? "…" : stats.pendentes}</div>
        </div>
        <div className="crono-card">
          <div className="crono-kpi-label">Atrasadas</div>
          <div className="crono-kpi-value">{carregando ? "…" : stats.atrasadas}</div>
        </div>
      </div>

      <div className="crono-grid two">
        <div className="crono-card">
          <h2>Próximas entregas</h2>
          <p className="crono-muted">Top 8 por data de início (sem drama: só prioridade).</p>

          <div className="crono-tablewrap">
            <table className="crono-table">
              <thead>
                <tr>
                  <th>Início</th>
                  <th>Tarefa</th>
                  <th>Projeto</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {carregando ? (
                  <tr><td colSpan={4} className="crono-td-muted">Carregando…</td></tr>
                ) : (
                  tarefas
                    .slice()
                    .sort((a, b) => (toDateStr(a.inicio) || "9999").localeCompare(toDateStr(b.inicio) || "9999"))
                    .slice(0, 8)
                    .map((t) => (
                      <tr key={t.id}>
                        <td>{toDateStr(t.inicio) || "—"}</td>
                        <td className="crono-td-strong">{t.nome || "(sem nome)"}</td>
                        <td>{projetos.find((p) => p.id === t.projetoId)?.nome || "—"}</td>
                        <td><span className={"crono-pill " + ((t.status || "pendente").toLowerCase())}>{t.status || "pendente"}</span></td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="crono-card">
          <h2>Checklist de saúde</h2>
          <ul className="crono-list">
            <li><span className="crono-bullet">✓</span> Contraste corrigido: textos sempre em cartão claro, nunca em “camuflagem”.</li>
            <li><span className="crono-bullet">✓</span> Importador com fallback: se a IA falhar, dá pra colar texto e tentar de novo.</li>
            <li><span className="crono-bullet">✓</span> CRUD direto no Firestore compat do portal (sem gambiarras extras).</li>
            <li><span className="crono-bullet">→</span> Próximo passo: Gantt visual (se quiser, a gente sobe o nível).</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
