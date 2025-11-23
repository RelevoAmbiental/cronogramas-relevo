import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import { useCronograma } from "../../context/CronogramaContext";
import { expandTarefasPorDia } from "./utils";
import "./calendar.css";

export default function CalendarView() {
  const { tarefas, projetos } = useCronograma();
  const navigate = useNavigate();

  const [modo, setModo] = useState("mes"); // mes | semana | dia
  const [dataBase, setDataBase] = useState(new Date());
  const [tarefasExpandida, setTarefasExpandida] = useState({});
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);

  // Expansão das tarefas por dia (mapa YYYY-MM-DD -> [tarefas])
  useEffect(() => {
    const mapa = expandTarefasPorDia(tarefas);
    setTarefasExpandida(mapa);
  }, [tarefas]);

  // Mapa de cores por projeto (fallback caso o projeto não tenha cor própria)
  const coresProjetos = useMemo(() => {
    const coresBase = [
      "#2E7D32",
      "#1565C0",
      "#AD1457",
      "#6A1B9A",
      "#EF6C00",
      "#00897B",
      "#455A64",
    ];
    const mapa = {};
    projetos.forEach((p, idx) => {
      mapa[p.id] = coresBase[idx % coresBase.length];
    });
    return mapa;
  }, [projetos]);

  const projetoPorId = useMemo(() => {
    const mapa = {};
    projetos.forEach((p) => {
      mapa[p.id] = p;
    });
    return mapa;
  }, [projetos]);

  function getCorProjeto(projetoId) {
    if (!projetoId) return "#26C04C";
    // se o projeto tiver cor própria (aba Projetos), prioriza
    const projeto = projetoPorId[projetoId];
    if (projeto && projeto.cor) return projeto.cor;
    return coresProjetos[projetoId] || "#26C04C";
  }

  // Navegação de tempo
  function mudarDia(delta) {
    const nova = new Date(dataBase);
    nova.setDate(nova.getDate() + delta);
    setDataBase(nova);
  }

  function mudarSemana(delta) {
    const nova = new Date(dataBase);
    nova.setDate(nova.getDate() + delta * 7);
    setDataBase(nova);
  }

  function mudarMes(delta) {
    const nova = new Date(dataBase);
    nova.setMonth(nova.getMonth() + delta);
    setDataBase(nova);
  }

  function irHoje() {
    setDataBase(new Date());
  }

  // Clicar em um dia (mês/semana) → ir para visão dia
  function abrirDia(data) {
    if (!data) return;
    setDataBase(data);
    setModo("dia");
  }

  // Clicar em uma tarefa em qualquer visão
  function abrirTarefa(tarefa) {
    setTarefaSelecionada(tarefa);
  }

  function fecharModalTarefa() {
    setTarefaSelecionada(null);
  }

  function abrirTarefaNaTelaDeTarefas() {
    navigate("/tarefas");
  }

  return (
    <div className="calendar-container">
      {/* TOOLBAR SUPERIOR */}
      <div className="calendar-toolbar">
        {/* Navegação temporal */}
        <div className="calendar-nav-group">
          {modo === "mes" && (
            <>
              <button className="nav-btn" onClick={() => mudarMes(-1)}>◀</button>
              <button className="nav-btn" onClick={irHoje}>Hoje</button>
              <button className="nav-btn" onClick={() => mudarMes(1)}>▶</button>
            </>
          )}

          {modo === "semana" && (
            <>
              <button className="nav-btn" onClick={() => mudarSemana(-1)}>◀</button>
              <button className="nav-btn" onClick={irHoje}>Hoje</button>
              <button className="nav-btn" onClick={() => mudarSemana(1)}>▶</button>
            </>
          )}

          {modo === "dia" && (
            <>
              <button className="nav-btn" onClick={() => mudarDia(-1)}>◀</button>
              <button className="nav-btn" onClick={irHoje}>Hoje</button>
              <button className="nav-btn" onClick={() => mudarDia(1)}>▶</button>
            </>
          )}
        </div>

        {/* Segmented control: Mês | Semana | Dia */}
        <div className="calendar-modo-toggle">
          <button
            className={modo === "mes" ? "modo-btn ativo" : "modo-btn"}
            onClick={() => setModo("mes")}
          >
            Mês
          </button>
          <button
            className={modo === "semana" ? "modo-btn ativo" : "modo-btn"}
            onClick={() => setModo("semana")}
          >
            Semana
          </button>
          <button
            className={modo === "dia" ? "modo-btn ativo" : "modo-btn"}
            onClick={() => setModo("dia")}
          >
            Dia
          </button>
        </div>

        {/* Data atual formatada */}
        <span className="calendar-data">
          {dataBase.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            day: modo === "dia" ? "numeric" : undefined,
          })}
        </span>
      </div>

      {/* VISÕES */}
      {modo === "mes" && (
        <MonthView
          dataBase={dataBase}
          tarefasExpandida={tarefasExpandida}
          onDiaClick={abrirDia}
          onTarefaClick={abrirTarefa}
          getCorProjeto={getCorProjeto}
        />
      )}

      {modo === "semana" && (
        <WeekView
          dataBase={dataBase}
          tarefasExpandida={tarefasExpandida}
          onDiaClick={abrirDia}
          onTarefaClick={abrirTarefa}
          getCorProjeto={getCorProjeto}
        />
      )}

      {modo === "dia" && (
        <DayView
          dataBase={dataBase}
          tarefasExpandida={tarefasExpandida}
          onTarefaClick={abrirTarefa}
          getCorProjeto={getCorProjeto}
        />
      )}

      {/* MODAL DE DETALHES DA TAREFA */}
      {tarefaSelecionada && (
        <div className="tarefa-modal-overlay" onClick={fecharModalTarefa}>
          <div
            className="tarefa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderTop: `8px solid ${getCorProjeto(
                tarefaSelecionada.projetoId
              )}`,
              boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
            }}
          >
            <h3>{tarefaSelecionada.nome}</h3>

            {tarefaSelecionada.projetoId && (
              <p>
                <b>Projeto:</b>{" "}
                {projetoPorId[tarefaSelecionada.projetoId]?.nome || "—"}
              </p>
            )}

            <p>
              <b>Período:</b>{" "}
              {tarefaSelecionada.inicio} até {tarefaSelecionada.fim}
            </p>

            {tarefaSelecionada.status && (
              <p>
                <b>Status:</b> {tarefaSelecionada.status}
              </p>
            )}

            {tarefaSelecionada.descricao && (
              <p style={{ marginTop: "0.5rem" }}>
                {tarefaSelecionada.descricao}
              </p>
            )}

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button className="nav-btn" onClick={abrirTarefaNaTelaDeTarefas}>
                Abrir na tela de Tarefas
              </button>
              <button className="nav-btn" onClick={fecharModalTarefa}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
