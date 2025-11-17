import { useCronograma } from "../../context/CronogramaContext";

export default function DayView({ data }) {
  const { tarefas } = useCronograma();

  const dia = new Date(data);

  function tarefasDoDia() {
    return tarefas.filter((t) => {
      const ini = new Date(t.inicio);
      const fim = new Date(t.fim);
      return ini <= dia && fim >= dia;
    });
  }

  return (
    <div>
      <h2>
        {dia.toLocaleDateString("pt-BR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </h2>

      <ul>
        {tarefasDoDia().map((t) => (
          <li key={t.id}>{t.nome}</li>
        ))}
      </ul>

      {tarefasDoDia().length === 0 && <p>Nenhuma tarefa neste dia.</p>}
    </div>
  );
}
