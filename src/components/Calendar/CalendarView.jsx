import React, { useState, useEffect } from "react";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";
import { useCronograma } from "../../contexts/CronogramaContext";
import { expandTarefasPorDia } from "./utils";
import "./calendar.css";

export default function CalendarView() {
  const { tarefas } = useCronograma();

  const [modo, setModo] = useState("mes");      // mes | semana | dia
  const [dataBase, setDataBase] = useState(new Date());
  const [tarefasExpandida, setTarefasExpandida] = useState({});

  // Expande tarefas em todas as datas
  useEffect(() => {
    const mapa = expandTarefasPorDia(tarefas);
    setTarefasExpandida(mapa);
  }, [tarefas]);

  const irParaAnterior = () => {
    const nova = new Date(dataBase);

    if (modo === "mes") nova.setMonth(nova.getMonth() - 1);
    if (modo === "semana") nova.setDate(nova.getDate() - 7);
    if (modo === "dia") nova.setDate(nova.getDate() - 1);

    setDataBase(nova);
  };

  const irParaProximo = () => {
    const nova = new Date(dataBase);

    if (modo === "mes") nova.setMonth(nova.getMonth() + 1);
    if (modo === "semana") nova.setDate(nova.getDate() + 7);
    if (modo === "dia") nova.setDate(nova.getDate() + 1);

    setDataBase(nova);
  };

  const irHoje = () => setDataBase(new Date());

  return (
    <div className="calendar-container">

      {/* Toolbar */}
      <div className="calendar-toolbar">
        <button onClick={irParaAnterior}>←</button>
        <button onClick={irHoje}>Hoje</button>
        <button onClick={irParaProximo}>→</button>

        <select value={modo} onChange={(e) => setModo(e.target.value)}>
          <option value="mes">Mês</option>
          <option value="semana">Semana</option>
          <option value="dia">Dia</option>
        </select>

        <span className="calendar-data">
          {dataBase.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </span>
      </div>

      {/* Renderização do modo selecionado */}
      {modo === "mes" && (
        <MonthView dataBase={dataBase} tarefasExpandida={tarefasExpandida} />
      )}

      {modo === "semana" && (
        <WeekView dataBase={dataBase} tarefasExpandida={tarefasExpandida} />
      )}

      {modo === "dia" && (
        <DayView dataBase={dataBase} tarefasExpandida={tarefasExpandida} />
      )}
    </div>
  );
}
