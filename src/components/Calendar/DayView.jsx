import React from "react";

export default function DayView({ dataBase, tarefasExpandida }) {
  const chave = dataBase.toISOString().substring(0, 10);
  const tarefas = tarefasExpandida[chave] || [];

  return (
    <div className="dia-container">
      <h3>
        {dataBase.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </h3>

      {tarefas.length === 0 && <p>Nenhuma tarefa neste dia.</p>}

      {tarefas.map((t) => (
        <div key={t.id} className="tag-tarefa grande">
          <strong>{t.nome}</strong>
          <p>{t.descricao || ""}</p>
        </div>
      ))}
    </div>
  );
}
