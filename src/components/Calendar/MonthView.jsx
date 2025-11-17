import { useCronograma } from "../../context/CronogramaContext";

export default function MonthView({ data }) {
  const { tarefas } = useCronograma();

  const ano = data.getFullYear();
  const mes = data.getMonth();

  // Primeira célula do calendário
  const primeiroDia = new Date(ano, mes, 1);
  const inicio = new Date(primeiroDia);
  inicio.setDate(primeiroDia.getDate() - primeiroDia.getDay());

  // Gerar 42 dias (grade fixa 6x7)
  const dias = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(inicio);
    d.setDate(inicio.getDate() + i);
    dias.push(d);
  }

  function tarefasDoDia(dia) {
    return tarefas.filter((t) => {
      const ini = new Date(t.inicio);
      const fim = new Date(t.fim);
      return ini <= dia && fim >= dia;
    });
  }

  return (
    <div>
      <h2>
        {data.toLocaleDateString("pt-BR", {
          month: "long",
          year: "numeric",
        })}
      </h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "5px",
        }}
      >
        {dias.map((d, idx) => {
          const lista = tarefasDoDia(d);

          return (
            <div
              key={idx}
              style={{
                padding: "10px",
                background: d.getMonth() === mes ? "#fff" : "#eee",
                border: "1px solid #ddd",
                borderRadius: "6px",
                minHeight: "80px",
              }}
            >
              <strong>{d.getDate()}</strong>

              {lista.length > 0 && (
                <ul style={{ fontSize: "12px", paddingLeft: "16px" }}>
                  {lista.map((t) => (
                    <li key={t.id}>{t.nome}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
