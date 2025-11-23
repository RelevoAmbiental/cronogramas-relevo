import React, { useMemo } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import "./dashboard.css";

export default function Dashboard() {
  const { projetos = [], tarefas = [], loading } = useCronograma();

  const hoje = new Date();
  const hojeISO = hoje.toISOString().substring(0, 10);

  // ==============================
  // DERIVAÇÕES / MÉTRICAS GERAIS
  // ==============================
  const {
    totalProjetos,
    totalTarefas,
    tarefasPendentes,
    tarefasAndamento,
    tarefasConcluidas,
    tarefasAtrasadas,
    percentConclusao,
    tarefasCriticas,
    resumoProjetos,
    periodoGeral,
    saudeGeral,
  } = useMemo(() => {
    const totalProjetos = projetos.length;
    const totalTarefas = tarefas.length;

    let pendentes = 0;
    let andamento = 0;
    let concluidas = 0;
    let atrasadas = 0;

    const hojeData = new Date(hojeISO);

    const tarefasNormalizadas = tarefas.map((t) => {
      const fimData = t.fim ? new Date(t.fim) : null;
      let status = t.status || "pendente";

      if (
        status !== "concluida" &&
        fimData &&
        fimData < hojeData
      ) {
        status = "atrasada";
      }

      if (status === "pendente") pendentes++;
      if (status === "andamento") andamento++;
      if (status === "concluida") concluidas++;
      if (status === "atrasada") atrasadas++;

      return { ...t, status };
    });

    // % de conclusão
    const percentConclusao =
      totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0;

    // Tarefas críticas: atrasadas ou vencendo em até 3 dias
    const tarefasCriticas = (() => {
      const limite = new Date(hojeISO);
      limite.setDate(limite.getDate() + 3);

      return tarefasNormalizadas
        .filter((t) => {
          const fim = t.fim ? new Date(t.fim) : null;
          if (!fim) return false;

          if (t.status === "atrasada") return true;

          if (t.status !== "concluida" && fim >= hojeData && fim <= limite) {
            return true;
          }

          return false;
        })
        .sort((a, b) => new Date(a.fim) - new Date(b.fim))
        .slice(0, 8);
    })();

    // Resumo por projeto
    const resumoProjetos = projetos.map((proj) => {
      const tarefasDoProjeto = tarefasNormalizadas.filter(
        (t) => t.projetoId === proj.id
      );
      const total = tarefasDoProjeto.length;
      const concl = tarefasDoProjeto.filter((t) => t.status === "concluida").length;
      const atras = tarefasDoProjeto.filter((t) => t.status === "atrasada").length;
      const pend = tarefasDoProjeto.filter((t) => t.status === "pendente").length;
      const anda = tarefasDoProjeto.filter((t) => t.status === "andamento").length;

      const perc = total > 0 ? Math.round((concl / total) * 100) : 0;

      const iniciosValidos = tarefasDoProjeto
        .map((t) => (t.inicio ? new Date(t.inicio) : null))
        .filter(Boolean);
      const finsValidos = tarefasDoProjeto
        .map((t) => (t.fim ? new Date(t.fim) : null))
        .filter(Boolean);

      const inicioProj =
        iniciosValidos.length > 0
          ? new Date(Math.min(...iniciosValidos))
          : null;
      const fimProj =
        finsValidos.length > 0 ? new Date(Math.max(...finsValidos)) : null;

      return {
        projeto: proj,
        total,
        concluidas: concl,
        atrasadas: atras,
        pendentes: pend,
        andamento: anda,
        percent: perc,
        inicio: inicioProj,
        fim: fimProj,
      };
    });

    // Período geral para o micro-Gantt
    const todosInicios = tarefas
      .map((t) => (t.inicio ? new Date(t.inicio) : null))
      .filter(Boolean);
    const todosFins = tarefas
      .map((t) => (t.fim ? new Date(t.fim) : null))
      .filter(Boolean);

    const inicioGlobal =
      todosInicios.length > 0
        ? new Date(Math.min(...todosInicios))
        : null;
    const fimGlobal =
      todosFins.length > 0 ? new Date(Math.max(...todosFins)) : null;

    const periodoGeral = {
      inicio: inicioGlobal,
      fim: fimGlobal,
    };

    // "Saúde" do cronograma (pré-visão qualitativa)
    let saudeGeral = {
      nivel: "neutro",
      titulo: "Andamento em linha",
      mensagem: "O cronograma segue dentro de parâmetros aceitáveis.",
    };

    if (atrasadas > 0 && atrasadas / (totalTarefas || 1) >= 0.3) {
      saudeGeral = {
        nivel: "critico",
        titulo: "Risco elevado de atraso",
        mensagem:
          "Mais de 30% das tarefas estão atrasadas. Reavalie prioridades e redistribua esforços.",
      };
    } else if (atrasadas > 0) {
      saudeGeral = {
        nivel: "atencao",
        titulo: "Algumas tarefas em atraso",
        mensagem:
          "Há tarefas atrasadas, mas ainda é possível recuperar o cronograma com ajustes pontuais.",
      };
    } else if (percentConclusao >= 80) {
      saudeGeral = {
        nivel: "positivo",
        titulo: "Cronograma bem avançado",
        mensagem:
          "A maior parte das tarefas já está concluída. Mantenha o ritmo para finalizar dentro do prazo.",
      };
    }

    return {
      totalProjetos,
      totalTarefas,
      tarefasPendentes: pendentes,
      tarefasAndamento: andamento,
      tarefasConcluidas: concluidas,
      tarefasAtrasadas: atrasadas,
      percentConclusao,
      tarefasCriticas,
      resumoProjetos,
      periodoGeral,
      saudeGeral,
    };
  }, [projetos, tarefas, hojeISO]);

  if (loading) {
    return (
      <div className="dashboard-container">
        <p>Carregando dados do cronograma...</p>
      </div>
    );
  }

  // Helper para micro-Gantt
  function calcularPosicoesGantt(inicio, fim) {
    if (!periodoGeral.inicio || !periodoGeral.fim || !inicio || !fim) {
      return { left: "0%", width: "0%" };
    }

    const totalMs = periodoGeral.fim - periodoGeral.inicio;
    if (totalMs <= 0) return { left: "0%", width: "0%" };

    const clampedInicio = Math.max(inicio.getTime(), periodoGeral.inicio.getTime());
    const clampedFim = Math.min(fim.getTime(), periodoGeral.fim.getTime());

    const offsetInicio = clampedInicio - periodoGeral.inicio.getTime();
    const duracao = clampedFim - clampedInicio;

    const left = (offsetInicio / totalMs) * 100;
    const width = (duracao / totalMs) * 100;

    return {
      left: `${left}%`,
      width: `${Math.max(width, 3)}%`, // largura mínima para enxergar
    };
  }

  return (
    <div className="dashboard-container">
      {/* HEADER */}
      <header className="dashboard-header">
        <div>
          <h1>Cockpit do Cronograma</h1>
          <p className="dashboard-subtitle">
            Visão executiva dos projetos, tarefas e riscos.
          </p>
        </div>
        <div className="dashboard-header-meta">
          <span className="dashboard-date">
            {new Date().toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </span>
        </div>
      </header>

      {/* KPIs */}
      <section className="dashboard-section">
        <div className="kpi-grid">
          <div className="kpi-card">
            <span className="kpi-label">Projetos ativos</span>
            <span className="kpi-value">{totalProjetos}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">Tarefas em andamento</span>
            <span className="kpi-value">{tarefasAndamento}</span>
          </div>

          <div className="kpi-card kpi-alert">
            <span className="kpi-label">Tarefas atrasadas</span>
            <span className="kpi-value">{tarefasAtrasadas}</span>
          </div>

          <div className="kpi-card">
            <span className="kpi-label">% de conclusão global</span>
            <span className="kpi-value">
              {percentConclusao}
              <span className="kpi-suffix">%</span>
            </span>
          </div>
        </div>
      </section>

      {/* SAÚDE DO CRONOGRAMA */}
      <section className="dashboard-section">
        <div className={`saude-card saude-${saudeGeral.nivel}`}>
          <h2>{saudeGeral.titulo}</h2>
          <p>{saudeGeral.mensagem}</p>
        </div>
      </section>

      {/* RESUMO POR PROJETO */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Projetos e status</h2>
        </div>

        {resumoProjetos.length === 0 ? (
          <p>Nenhum projeto cadastrado.</p>
        ) : (
          <div className="projetos-grid">
            {resumoProjetos.map((item) => {
              const cor = item.projeto.cor || "#0a4723";
              return (
                <div key={item.projeto.id} className="projeto-card">
                  <div className="projeto-header">
                    <span
                      className="projeto-dot"
                      style={{ backgroundColor: cor }}
                    />
                    <h3>{item.projeto.nome}</h3>
                  </div>

                  <p className="projeto-metadata">
                    {item.total} tarefas • {item.concluidas} concluídas •{" "}
                    {item.atrasadas} atrasadas
                  </p>

                  <div className="projeto-progress-bar">
                    <div
                      className="projeto-progress-fill"
                      style={{ width: `${item.percent}%`, backgroundColor: cor }}
                    />
                  </div>

                  <p className="projeto-progress-label">
                    {item.percent}% concluído
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* TAREFAS CRÍTICAS */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2>Tarefas críticas e prazos iminentes</h2>
        </div>

        {tarefasCriticas.length === 0 ? (
          <p>Não há tarefas atrasadas ou com vencimento próximo.</p>
        ) : (
          <div className="criticas-list">
            {tarefasCriticas.map((t) => {
              const proj = projetos.find((p) => p.id === t.projetoId);
              const cor = proj?.cor || "#0a4723";

              const fimData = t.fim ? new Date(t.fim) : null;
              const fimFmt = fimData
                ? fimData.toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                  })
                : "—";

              return (
                <div key={t.id} className="critica-item">
                  <div className="critica-main">
                    <span
                      className="critica-dot"
                      style={{ backgroundColor: cor }}
                    />
                    <div>
                      <h3>{t.nome}</h3>
                      {proj && (
                        <p className="critica-projeto">Projeto: {proj.nome}</p>
                      )}
                    </div>
                  </div>

                  <div className="critica-meta">
                    <span className="critica-data">Fim: {fimFmt}</span>
                    <span
                      className={`critica-status critica-status-${t.status}`}
                    >
                      {t.status === "atrasada"
                        ? "Atrasada"
                        : "Vencimento próximo"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MICRO-GANTT POR PROJETO */}
      {periodoGeral.inicio && periodoGeral.fim && resumoProjetos.length > 0 && (
        <section className="dashboard-section">
          <div className="dashboard-section-header">
            <h2>Visão temporal por projeto</h2>
            <p className="dashboard-section-subtitle">
              Faixa de atuação de cada projeto ao longo do período total do
              cronograma.
            </p>
          </div>

          <div className="gantt-projetos">
            <div className="gantt-header">
              <span>
                {periodoGeral.inicio.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
              <span>
                {periodoGeral.fim.toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </span>
            </div>

            <div className="gantt-linhas">
              {resumoProjetos.map((item) => {
                if (!item.inicio || !item.fim) {
                  return (
                    <div key={item.projeto.id} className="gantt-linha">
                      <span className="gantt-label">{item.projeto.nome}</span>
                      <div className="gantt-track gantt-track-vazio">
                        <span className="gantt-sem-dados">Sem dados de datas</span>
                      </div>
                    </div>
                  );
                }

                const posicoes = calcularPosicoesGantt(item.inicio, item.fim);
                const cor = item.projeto.cor || "#0a4723";

                return (
                  <div key={item.projeto.id} className="gantt-linha">
                    <span className="gantt-label">{item.projeto.nome}</span>
                    <div className="gantt-track">
                      <div
                        className="gantt-bar"
                        style={{
                          left: posicoes.left,
                          width: posicoes.width,
                          backgroundColor: cor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
