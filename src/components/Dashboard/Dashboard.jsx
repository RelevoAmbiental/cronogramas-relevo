// src/components/Dashboard/Dashboard.jsx
import React, { useMemo } from "react";
import "./dashboard.css";
import { useCronograma } from "../../context/CronogramaContext";
import { gerarResumoExecutivo } from "../../utils/resumoExecutivo";

export default function Dashboard() {
  const { tarefas, projetos, loading } = useCronograma();

  const resumo = useMemo(
    () => gerarResumoExecutivo(tarefas || [], projetos || []),
    [tarefas, projetos]
  );

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-hero">
          <div>
            <h1>Cockpit de Projetos</h1>
            <p>Carregando dados do cronograma...</p>
          </div>
        </div>
      </div>
    );
  }

  const { kpis, atrasadas, andamento, criticas, sparkline, heatmap, riscos, alertas } =
    resumo;

  return (
    <div className="dashboard-container">
      {/* HERO EXECUTIVO */}
      <section className="dashboard-hero">
        <div className="dashboard-hero-left">
          <h1>Cockpit de Projetos</h1>
          <p>Visão executiva dos projetos, tarefas e riscos.</p>
        </div>
        <div className="dashboard-hero-right">
          <span>{resumo.headline}</span>
        </div>
      </section>

      {/* KPIs PRINCIPAIS */}
      <section className="dashboard-kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Projetos ativos</span>
          <span className="kpi-value">{kpis.totalProjetos}</span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Tarefas cadastradas</span>
          <span className="kpi-value">{kpis.totalTarefas}</span>
        </div>
        <div className="kpi-card kpi-ok">
          <span className="kpi-label">Concluídas</span>
          <span className="kpi-value">
            {kpis.concluidas} ({kpis.percConcluidas}%)
          </span>
        </div>
        <div className="kpi-card kpi-risk">
          <span className="kpi-label">Em atraso</span>
          <span className="kpi-value">
            {kpis.atrasadas} ({kpis.percAtrasadas}%)
          </span>
        </div>
      </section>

      {/* LINHA 2 – RESUMO + ALERTAS + SPARKLINE */}
      <section className="dashboard-row">
        {/* Resumo Executivo */}
        <div className="dashboard-card dashboard-card-large">
          <h2>Resumo Executivo</h2>
          <p className="dashboard-resumo-text">{resumo.textoGeral}</p>

          {criticas.length > 0 && (
            <>
              <h3 className="dashboard-subtitle">Tarefas críticas no caminho</h3>
              <ul className="dashboard-list">
                {criticas.map((t) => (
                  <li key={t.nome + t.projeto}>
                    <strong>{t.nome}</strong> — {t.projeto} (fim previsto{" "}
                    {t.fimPrevisto})
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {/* Alertas inteligentes */}
        <div className="dashboard-card dashboard-card-medium">
          <h2>Alertas inteligentes</h2>
          <ul className="alert-list">
            {alertas.map((a, idx) => (
              <li key={idx} className={`alert-item alert-${a.tipo}`}>
                <span className="alert-pill">
                  {a.tipo === "risco" && "⚠️ Risco"}
                  {a.tipo === "acao" && "🧭 Ação sugerida"}
                  {a.tipo === "info" && "ℹ️ Info"}
                </span>
                <p>{a.mensagem}</p>
              </li>
            ))}
          </ul>
        </div>

        {/* Sparkline de progresso */}
        <div className="dashboard-card dashboard-card-small">
          <h2>Progresso semanal</h2>
          <div className="sparkline">
            {sparkline.map((s, idx) => (
              <div key={idx} className="sparkline-col">
                <div
                  className="sparkline-bar"
                  style={{ height: `${Math.max(s.percent, 5)}%` }}
                  title={`${s.label}: ${s.valor} tarefa(s) concluída(s)`}
                />
                <span className="sparkline-label">{s.label}</span>
              </div>
            ))}
          </div>
          <p className="sparkline-legend">
            Cada barra representa o número de tarefas concluídas por semana.
          </p>
        </div>
      </section>

      {/* LINHA 3 – ATRASOS + HEATMAP + RISCOS */}
      <section className="dashboard-row">
        {/* Tarefas em atraso */}
        <div className="dashboard-card">
          <h2>Tarefas em atraso</h2>
          {atrasadas.length === 0 ? (
            <p className="dashboard-muted">
              Nenhuma tarefa em atraso no momento. Aproveite para antecipar
              entregas futuras.
            </p>
          ) : (
            <ul className="dashboard-list">
              {atrasadas.map((t) => (
                <li key={t.nome + t.projeto}>
                  <strong>{t.nome}</strong> — {t.projeto} (previsto para{" "}
                  {t.fimOriginal}, atraso estimado de {t.diasAtraso} dia(s))
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Heatmap de entregas */}
        <div className="dashboard-card">
          <h2>Heatmap de entregas (próximas semanas)</h2>
          <div className="heatmap-grid">
            {heatmap.map((s, idx) => (
              <div key={idx} className="heatmap-col">
                <div
                  className={`heatmap-cell nivel-${s.nivel}`}
                  title={`${s.label}: ${s.carga} entrega(s)`}
                />
                <span className="heatmap-label">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="heatmap-legend">
            <span className="legend-item">
              <span className="legend-dot nivel-1" /> OK
            </span>
            <span className="legend-item">
              <span className="legend-dot nivel-2" /> Atenção
            </span>
            <span className="legend-item">
              <span className="legend-dot nivel-3" /> Crítico
            </span>
          </div>
        </div>

        {/* Top 5 riscos prováveis */}
        <div className="dashboard-card">
          <h2>Top 5 riscos prováveis</h2>
          <ul className="dashboard-list">
            {riscos.map((r) => (
              <li key={r.id}>
                <div className={`risco-pill risco-${r.nivel}`}>
                  {r.titulo} — {r.nivel === "alto" ? "Alto" : "Médio"} risco
                </div>
                <p className="dashboard-muted">{r.descricao}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
