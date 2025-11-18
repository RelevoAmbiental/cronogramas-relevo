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

  // Mapa de cores por projeto
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

  // 🔹 Clicar em um dia (mês/semana) → ir para visão dia
  function abrirDia(data) {
    if (!data) return;
    setDataBase(data);
    setModo("dia");
  }

  // 🔹 Clicar em uma tarefa em qualquer visão
  function abrirTarefa(tarefa) {
    setTarefaSelecionada(tarefa);
  }

  function fecharModalTarefa() {
    setTarefaSelecionada(null);
  }

  function abrirTarefaNaTelaDeTarefas() {
    // Por enquanto, navega para /tarefas
    // (no futuro podemos implementar foco direto na tarefa)
    navigate("/tarefas");
  }

  return (
    <div className="calendar-container">
      {/* Toolbar */}
      <div className="calendar-toolbar">
        {modo === "mes" && (
          <>
            <button onClick={() => mudarMes(-1)}>◀</button>
            <button onClick={irHoje}>Hoje</button>
            <button onClick={() => mudarMes(1)}>▶</button>
          </>
        )}

        {modo === "semana" && (
          <>
            <button onClick={() => mudarSemana(-1)}>◀</button>
            <button onClick={irHoje}>Hoje</button>
            <button onClick={() => mudarSemana(1)}>▶</button>
          </>
        )}

        {modo === "dia" && (
          <>
            <button onClick={() => mudarDia(-1)}>◀</button>
            <button onClick={irHoje}>Hoje</button>
            <button onClick={() => mudarDia(1)}>▶</button>
          </>
        )}

        <select
          value={modo}
          onChange={(e) => setModo(e.target.value)}
          style={{ marginLeft: "1rem" }}
        >
          <option value="mes">Mês</option>
          <option value="semana">Semana</option>
          <option value="dia">Dia</option>
        </select>

        <span className="calendar-data">
          {dataBase.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            day: modo === "dia" ? "numeric" : undefined,
          })}
        </span>
      </div>

      {/* Visões */}
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

      {/* Modal de detalhes da tarefa */}
      {tarefaSelecionada && (
        <div className="tarefa-modal-overlay" onClick={fecharModalTarefa}>
          <div
            className="tarefa-modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              borderTop: `4px solid ${getCorProjeto(
                tarefaSelecionada.projetoId
              )}`,
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

            {tarefaSelecionada.descricao && (
              <p style={{ marginTop: "0.5rem" }}>{tarefaSelecionada.descricao}</p>
            )}

            <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem" }}>
              <button onClick={abrirTarefaNaTelaDeTarefas}>
                Abrir na tela de Tarefas
              </button>
              <button onClick={fecharModalTarefa}>Fechar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
