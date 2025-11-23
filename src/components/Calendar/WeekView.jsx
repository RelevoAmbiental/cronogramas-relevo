import React from "react";

export default function WeekView({
  dataBase,
  tarefasExpandida,
  onDiaClick,
  onTarefaClick,
  getCorProjeto,
}) {
  const semana = [];
  const inicio = new Date(dataBase);
  inicio.setDate(inicio.getDate() - inicio.getDay()); // domingo

  const hoje = new Date();

  for (let i = 0; i < 7; i++) {
    const data = new Date(inicio);
    data.setDate(inicio.getDate() + i);

    const chave = data.toISOString().substring(0, 10);

    semana.push({
      data,
      tarefas: tarefasExpandida[chave] || [],
    });
  }

  return (
    <div className="semana-grid">
      {semana.map((dia, idx) => {
        const isHoje = dia.data.toDateString() === hoje.toDateString();
        const celulaClasses = `semana-celula ${isHoje ? "hoje" : ""}`;

        return (
          <div
            key={idx}
            className={celulaClasses}
            onClick={() => onDiaClick && onDiaClick(dia.data)}
          >
            <strong>
              {dia.data.toLocaleDateString("pt-BR", { weekday: "short" })}{" "}
              {dia.data.getDate()}
            </strong>

            {dia.tarefas.map((tarefa) => {
              const status = tarefa.status || "";
              let statusClass = "";
              if (status === "concluida") statusClass = "concluida";
              if (status === "atrasada") statusClass = "atrasada";

              return (
                <div
                  key={tarefa.id}
                  className={`tag-tarefa ${statusClass}`}
                  style={{
                    borderLeftColor: getCorProjeto
                      ? getCorProjeto(tarefa.projetoId)
                      : "#0a4723",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTarefaClick && onTarefaClick(tarefa);
                  }}
                  title={tarefa.nome}
                >
                  {tarefa.nome}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
