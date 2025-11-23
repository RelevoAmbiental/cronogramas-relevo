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
  inicio.setDate(inicio.getDate() - inicio.getDay()); // Domingo

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
      {semana.map((dia, i) => (
        <div
          key={i}
          className="semana-celula"
          onClick={() => onDiaClick && onDiaClick(dia.data)}
        >
          <strong>
            {dia.data.toLocaleDateString("pt-BR", { weekday: "short" })}{" "}
            {dia.data.getDate()}
          </strong>

          {dia.tarefas.map((t) => {
            const statusClass = t.status ? `status-${t.status}` : "";
            return (
              <div
                key={t.id}
                className={`tag-tarefa ${statusClass}`}
                style={{
                  borderLeft: getCorProjeto
                    ? `4px solid ${getCorProjeto(t.projetoId)}`
                    : undefined,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  onTarefaClick && onTarefaClick(t);
                }}
              >
                {t.nome}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
