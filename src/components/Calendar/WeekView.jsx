import { useCronograma } from "../../context/CronogramaContext";

export default function WeekView({ data }) {
  const { tarefas } = useCronograma();

  const inicio = new Date(data);
  inicio.setDate(data.getDate() - data.getDay());

  const dias = [];
  for (let i = 0; i < 7; i++) {
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
        Semana de{" "}
        {dias[0].toLocaleDateString("pt-BR")} até{" "}
        {dias[6].toLocaleDateString("pt-BR")}
      </h2>

      <div>
        {dias.map((d) => (
          <div
            key={d.toISOString()}
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              padding: "10px",
              marginBottom: "10px",
              borderRadius: "6px",
            }}
          >
            <strong>
              {d.toLocaleDateString("pt-BR", { weekday: "long" })} —{" "}
              {d.getDate()}/{d.getMonth() + 1}
            </strong>

            <ul style={{ marginLeft: "20px" }}>
              {tarefasDoDia(d).map((t) => (
                <li key={t.id}>{t.nome}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
