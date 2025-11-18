import React from "react";

export default function DayView({
  dataBase,
  tarefasExpandida,
  onTarefaClick,
  getCorProjeto,
}) {
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
        <div
          key={t.id}
          className="tag-tarefa grande"
          style={{
            backgroundColor: getCorProjeto
              ? getCorProjeto(t.projetoId)
              : undefined,
          }}
          onClick={() => onTarefaClick && onTarefaClick(t)}
        >
          <strong>{t.nome}</strong>
          {t.descricao && <p>{t.descricao}</p>}
          <p>
            {t.inicio} até {t.fim}
          </p>
        </div>
      ))}
    </div>
  );
}
