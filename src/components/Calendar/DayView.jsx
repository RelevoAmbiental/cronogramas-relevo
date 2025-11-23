import React from "react";

export default function DayView({
  dataBase,
  tarefasExpandida,
  onTarefaClick,
  getCorProjeto,
}) {
  const chave = dataBase.toISOString().substring(0, 10);
  const tarefas = tarefasExpandida[chave] || [];

  const hoje = new Date();
  const isHoje = dataBase.toDateString() === hoje.toDateString();

  return (
    <div className="dia-container">
      <h3 style={{ color: isHoje ? "#0a4723" : "#222" }}>
        {dataBase.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </h3>

      {tarefas.length === 0 && <p>Nenhuma tarefa neste dia.</p>}

      {tarefas.map((tarefa) => {
        const status = tarefa.status || "";
        let statusClass = "";
        if (status === "concluida") statusClass = "concluida";
        if (status === "atrasada") statusClass = "atrasada";

        return (
          <div
            key={tarefa.id}
            className={`tag-tarefa grande ${statusClass}`}
            style={{
              borderLeftColor: getCorProjeto
                ? getCorProjeto(tarefa.projetoId)
                : "#0a4723",
            }}
            onClick={() => onTarefaClick && onTarefaClick(tarefa)}
          >
            <strong>{tarefa.nome}</strong>
            {tarefa.descricao && <p>{tarefa.descricao}</p>}
            <p>
              {tarefa.inicio} até {tarefa.fim}
            </p>
          </div>
        );
      })}
    </div>
  );
}
