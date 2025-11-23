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
      <h3 className={isHoje ? "dia-header-hoje" : ""}>
        {dataBase.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </h3>

      {tarefas.length === 0 && <p>Nenhuma tarefa neste dia.</p>}

      {tarefas.map((t) => {
        const statusClass = t.status ? `status-${t.status}` : "";
        return (
          <div
            key={t.id}
            className={`tag-tarefa grande ${statusClass}`}
            style={{
              borderLeft: getCorProjeto
                ? `6px solid ${getCorProjeto(t.projetoId)}`
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
        );
      })}
    </div>
  );
}
