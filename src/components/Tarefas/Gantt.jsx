import "./gantt.css";

export default function Gantt({ tarefas }) {
  if (!tarefas?.length) return <p>Nenhuma tarefa encontrada.</p>;

  // Ordenar tarefas por data
  const ordenadas = [...tarefas].sort(
    (a, b) => new Date(a.inicio) - new Date(b.inicio)
  );

  const statusColor = {
    pendente: "#c9c900",
    andamento: "#0aa3e8",
    concluida: "#0a8f3a",
  };

  // Determinar a menor e maior data
  const inicioMin = new Date(
    Math.min(...ordenadas.map((t) => new Date(t.inicio)))
  );
  const fimMax = new Date(
    Math.max(...ordenadas.map((t) => new Date(t.fim)))
  );

  const diasTotais = Math.ceil((fimMax - inicioMin) / (1000 * 60 * 60 * 24));

  function calcularOffset(inicio) {
    return Math.floor(
      (new Date(inicio) - inicioMin) / (1000 * 60 * 60 * 24)
    );
  }

  function calcLargura(inicio, fim) {
    return (
      Math.ceil((new Date(fim) - new Date(inicio)) / (1000 * 60 * 60 * 24)) + 1
    );
  }

  return (
    <div className="gantt-container">
      {ordenadas.map((tarefa) => (
        <div key={tarefa.id} className="gantt-row">
          <div className="gantt-label">{tarefa.nome}</div>

          <div className="gantt-track">
            <div
              className="gantt-bar"
              style={{
                marginLeft: calcularOffset(tarefa.inicio) * 15 + "px",
                width: calcLargura(tarefa.inicio, tarefa.fim) * 15 + "px",
                background: statusColor[tarefa.status],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
