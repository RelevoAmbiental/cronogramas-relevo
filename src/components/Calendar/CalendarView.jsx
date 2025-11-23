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

  const [modo, setModo] = useState("mes"); // "mes" | "semana" | "dia"
  const [dataBase, setDataBase] = useState(new Date());
  const [tarefasExpandida, setTarefasExpandida] = useState({});
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);

  // Expande tarefas em um mapa YYYY-MM-DD -> [tarefas]
  useEffect(() => {
    const mapa = expandTarefasPorDia(tarefas);
    setTarefasExpandida(mapa);
  }, [tarefas]);

  // Mapa de cores por projeto (fallback)
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
    if (!projetoId) return "#0a4723";
    const projeto = projetoPorId[projetoId];
    if (projeto && projeto.cor) return projeto.cor;
    return coresProjetos[projetoId] || "#0a4723";
  }

  // Navegação temporal
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

  function abrirDia(data) {
    if (!data) return;
    setDataBase(data);
    setModo("dia");
  }

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
    
      <button className="calendar-btn" onClick={() => mudarMes(-1)}>◀</button>
      <button className="calendar-btn" onClick={irHoje}>Hoje</button>
      <button className="calendar-btn" onClick={() => mudarMes(1)}>▶</button>
    
      <div className="calendar-view-switch">
        <button
          className={`calendar-btn ${modo === "mes" ? "active" : ""}`}
          onClick={() => setModo("mes")}
        >
          Mês
        </button>
    
        <button
          className={`calendar-btn ${modo === "semana" ? "active" : ""}`}
          onClick={() => setModo("semana")}
        >
          Semana
        </button>
    
        <button
          className={`calendar-btn ${modo === "dia" ? "active" : ""}`}
          onClick={() => setModo("dia")}
        >
          Dia
        </button>
      </div>
    
      <span className="calendar-data">
        {dataBase.toLocaleDateString("pt-BR", {
          year: "numeric",
          month: "long",
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

      {/* MODAL DE DETALHE DA TAREFA */}
      {tarefaSelecionada && (
        <div className="tarefa-modal-overlay" onClick={fecharModalTarefa}>
          <div
            className="tarefa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderTopColor: getCorProjeto(tarefaSelecionada.projetoId),
            }}
          >
            <h3>{tarefaSelecionada.nome}</h3>

            {tarefaSelecionada.projetoId && (
              <p>
                <strong>Projeto:</strong>{" "}
                {projetoPorId[tarefaSelecionada.projetoId]?.nome || "—"}
              </p>
            )}

            <p>
              <strong>Período:</strong> {tarefaSelecionada.inicio} até{" "}
              {tarefaSelecionada.fim}
            </p>

            {tarefaSelecionada.status && (
              <p>
                <strong>Status:</strong> {tarefaSelecionada.status}
              </p>
            )}

            {tarefaSelecionada.descricao && (
              <p style={{ marginTop: "0.5rem" }}>
                {tarefaSelecionada.descricao}
              </p>
            )}

            <div className="modal-btns">
              <button
                type="button"
                className="modal-btn"
                onClick={abrirTarefaNaTelaDeTarefas}
              >
                Abrir na tela de Tarefas
              </button>
              <button
                type="button"
                className="modal-btn"
                onClick={fecharModalTarefa}
                style={{ background: "#777" }}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
