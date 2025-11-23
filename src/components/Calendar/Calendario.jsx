import { useState } from "react";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";

export default function Calendario() {
  const [view, setView] = useState("month");
  const [dataAtual, setDataAtual] = useState(new Date());

  // ==== FUNÇÕES DE NAVEGAÇÃO DO CALENDÁRIO ====

  function mudarDia(delta) {
    const nova = new Date(dataAtual);
    nova.setDate(nova.getDate() + delta);
    setDataAtual(nova);
  }

  function mudarSemana(delta) {
    const nova = new Date(dataAtual);
    nova.setDate(nova.getDate() + delta * 7);
    setDataAtual(nova);
  }

  function mudarMes(delta) {
    const nova = new Date(dataAtual);
    nova.setMonth(nova.getMonth() + delta);
    setDataAtual(nova);
  }

  function irHoje() {
    setDataAtual(new Date());
  }

  return (
    <div className="calendar-container">

      {/* ======== TOOLBAR SUPERIOR ======== */}
      <div className="calendar-toolbar">

        {/* Navegação (setas e hoje) */}
        <div className="calendar-nav">
          {view === "month" && (
            <>
              <button className="calendar-btn" onClick={() => mudarMes(-1)}>◀</button>
              <button className="calendar-btn" onClick={irHoje}>Hoje</button>
              <button className="calendar-btn" onClick={() => mudarMes(1)}>▶</button>
            </>
          )}

          {view === "week" && (
            <>
              <button className="calendar-btn" onClick={() => mudarSemana(-1)}>◀</button>
              <button className="calendar-btn" onClick={irHoje}>Hoje</button>
              <button className="calendar-btn" onClick={() => mudarSemana(1)}>▶</button>
            </>
          )}

          {view === "day" && (
            <>
              <button className="calendar-btn" onClick={() => mudarDia(-1)}>◀</button>
              <button className="calendar-btn" onClick={irHoje}>Hoje</button>
              <button className="calendar-btn" onClick={() => mudarDia(1)}>▶</button>
            </>
          )}
        </div>

        {/* ====== MÊS | SEMANA | DIA ====== */}
        <div className="modo-toggle">
          <button
            className={`modo-item ${view === "month" ? "ativo" : ""}`}
            onClick={() => setView("month")}
          >
            Mês
          </button>

          <button
            className={`modo-item ${view === "week" ? "ativo" : ""}`}
            onClick={() => setView("week")}
          >
            Semana
          </button>

          <button
            className={`modo-item ${view === "day" ? "ativo" : ""}`}
            onClick={() => setView("day")}
          >
            Dia
          </button>
        </div>

        {/* Data do calendário (Alinhado à direita) */}
        <span className="calendar-data">
          {dataAtual.toLocaleDateString("pt-BR", {
            year: "numeric",
            month: "long",
            ...(view === "day" && { day: "numeric" })
          })}
        </span>
      </div>

      {/* ======== VISÕES ======== */}
      {view === "month" && <MonthView dataBase={dataAtual} />}
      {view === "week" && <WeekView dataBase={dataAtual} />}
      {view === "day" && <DayView dataBase={dataAtual} />}
    </div>
  );
}
