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
  const indicePrimeiroDia = primeiroDia.getDay(); // 0 = domingo

  const dias = [];

  // espaços vazios antes do 1º dia
  for (let i = 0; i < indicePrimeiroDia; i++) {
    dias.push({ data: null, tarefas: [] });
  }

  // dias do mês com tarefas
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
    <>
      {/* Cabeçalho dos dias da semana */}
      <div className="semana-header">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((dia) => (
          <div key={dia} className="semana-header-item">
            {dia}
          </div>
        ))}
      </div>

      {/* Grade do mês */}
      <div className="mes-grid">
        {dias.map((dia, idx) => {
          // células vazias
          if (!dia.data) {
            return <div key={idx} className="mes-celula" />;
          }

          const isHoje = dia.data.toDateString() === hoje.toDateString();
          const celulaClasses = `mes-celula ${isHoje ? "hoje" : ""}`;

          return (
            <div
              key={idx}
              className={celulaClasses}
              onClick={() => onDiaClick && onDiaClick(dia.data)}
            >
              <div className="mes-celula-header">
                <span>{dia.data.getDate()}</span>
              </div>

              <div className="mes-celula-tarefas">
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
            </div>
          );
        })}
      </div>
    </>
  );
}
