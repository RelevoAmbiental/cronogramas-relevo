import React from "react";

export default function WeekView({ dataBase, tarefasExpandida }) {
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
        <div key={i} className="semana-celula">
          <strong>
            {dia.data.toLocaleDateString("pt-BR", { weekday: "short" })}{" "}
            {dia.data.getDate()}
          </strong>

          {dia.tarefas.map((t) => (
            <div key={t.id} className="tag-tarefa">
              {t.nome}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
