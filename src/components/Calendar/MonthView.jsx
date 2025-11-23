import React from "react";

export default function MonthView({
  dataBase,
  tarefasExpandida,
  onDiaClick,
  onTarefaClick,
  getCorProjeto,
}) {
  const ano = dataBase.getFullYear();
  const mes = dataBase.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const diasNoMes = ultimoDia.getDate();
  const indicePrimeiroDia = primeiroDia.getDay(); // 0 DOM → 6 SAB

  const dias = [];

  // dias "em branco" antes do 1º
  for (let i = 0; i < indicePrimeiroDia; i++) {
    dias.push({ data: null, tarefas: [] });
  }

  for (let d = 1; d <= diasNoMes; d++) {
    const data = new Date(ano, mes, d);
    const chave = data.toISOString().substring(0, 10);

    dias.push({
      data,
      tarefas: tarefasExpandida[chave] || [],
    });
  }

  const hoje = new Date();

  return (
    <div className="mes-grid">
      {dias.map((dia, i) => {
        if (!dia.data) {
          return (
            <div key={i} className="mes-celula mes-celula-vazia" />
          );
        }

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
              "mes-celula " +
              heatClass +
              (isHoje ? " celula-hoje" : "") +
              (isSelecionado ? " celula-selecionada" : "")
            }
            onClick={() => onDiaClick && onDiaClick(dia.data)}
          >
            <div className="mes-celula-header">
              <strong>{dia.data.getDate()}</strong>
            </div>

            <div className="mes-celula-tarefas">
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
          </div>
        );
      })}
    </div>
  );
}
