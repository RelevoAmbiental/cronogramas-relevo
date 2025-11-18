import React from "react";

export default function MonthView({ dataBase, tarefasExpandida }) {
  const ano = dataBase.getFullYear();
  const mes = dataBase.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);

  const diasNoMes = ultimoDia.getDate();
  const indicePrimeiroDia = primeiroDia.getDay(); // 0 DOM → 6 SAB

  const dias = [];

  // Preenche células vazias antes do 1°
  for (let i = 0; i < indicePrimeiroDia; i++) {
    dias.push({ data: null });
  }

  // Dias reais
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
        <div key={i} className="mes-celula">
          {dia.data && (
            <>
              <strong>{dia.data.getDate()}</strong>

              {dia.tarefas.map((t) => (
                <div key={t.id} className="tag-tarefa">
                  {t.nome}
                </div>
              ))}
            </>
          )}
        </div>
      ))}
    </div>
  );
}
