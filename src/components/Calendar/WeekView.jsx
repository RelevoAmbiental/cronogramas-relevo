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
      {semana.map((dia, i) => {
        const isHoje = dia.data.toDateString() === hoje.toDateString();
        const isSelecionado =
          dia.data.toDateString() === dataBase.toDateString();

        const qt = dia.tarefas.length;
        let heatClass = "";
        if (qt >= 1 && qt <= 2) heatClass = "celula-heatmap-1";
        else if (qt >= 3 && qt <= 4) heatClass = "celula-heatmap-2";
        else if (qt >= 5 && qt <= 7) heatClass = "celula-heatmap-3";
        else if (qt >= 8) heatClass = "celula-heatmap-4";

        return (
          <div
            key={i}
            className={
              "semana-celula " +
              heatClass +
              (isHoje ? " celula-hoje" : "") +
              (isSelecionado ? " celula-selecionada" : "")
            }
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
                      ? `6px solid ${getCorProjeto(t.projetoId)}`
                      : undefined,
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onTarefaClick && onTarefaClick(t);
                  }}
                  title={t.nome}
                >
                  {t.nome}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
