import { useState } from "react";
import MonthView from "./MonthView";
import WeekView from "./WeekView";
import DayView from "./DayView";

export default function Calendario() {
  const [view, setView] = useState("month");
  const [dataAtual, setDataAtual] = useState(new Date());

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

  return (
    <div className="content">
      <h1>Calendário</h1>

      {/* NAV DE VISÕES */}
      <div style={{ marginBottom: "20px" }}>
        <button onClick={() => setView("month")}>Mensal</button>
        <button onClick={() => setView("week")}>Semanal</button>
        <button onClick={() => setView("day")}>Diário</button>
      </div>

      {/* NAV DE TEMPO */}
      <div style={{ marginBottom: "20px" }}>
        {view === "month" && (
          <>
            <button onClick={() => mudarMes(-1)}>◀ Mês anterior</button>
            <button onClick={() => setDataAtual(new Date())}>Hoje</button>
            <button onClick={() => mudarMes(1)}>Próximo mês ▶</button>
          </>
        )}

        {view === "week" && (
          <>
            <button onClick={() => mudarSemana(-1)}>◀ Semana anterior</button>
            <button onClick={() => setDataAtual(new Date())}>Hoje</button>
            <button onClick={() => mudarSemana(1)}>Próxima semana ▶</button>
          </>
        )}

        {view === "day" && (
          <>
            <button onClick={() => mudarDia(-1)}>◀ Dia anterior</button>
            <button onClick={() => setDataAtual(new Date())}>Hoje</button>
            <button onClick={() => mudarDia(1)}>Próximo dia ▶</button>
          </>
        )}
      </div>

      {/* VISÕES */}
      {view === "month" && <MonthView data={dataAtual} />}
      {view === "week" && <WeekView data={dataAtual} />}
      {view === "day" && <DayView data={dataAtual} />}
    </div>
  );
}
