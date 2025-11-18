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

  return (
    <div className="mes-grid">
      {dias.map((dia, i) => (
        <div
          key={i}
          className="mes-celula"
          onClick={() => dia.data && onDiaClick && onDiaClick(dia.data)}
        >
          {dia.data && (
            <>
              <div className="mes-celula-header">
                <strong>{dia.data.getDate()}</strong>
              </div>

              <div className="mes-celula-tarefas">
                {dia.tarefas.map((t) => (
                  <div
                    key={t.id}
                    className="tag-tarefa"
                    style={{
                      backgroundColor: getCorProjeto
                        ? getCorProjeto(t.projetoId)
                        : undefined,
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onTarefaClick && onTarefaClick(t);
                    }}
                  >
                    {t.nome}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
