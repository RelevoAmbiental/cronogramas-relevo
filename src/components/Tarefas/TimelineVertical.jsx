import "./timeline.css";

export default function TimelineVertical({ tarefas }) {
  if (!tarefas?.length) {
    return <p>Nenhuma tarefa encontrada.</p>;
  }

  // Ordena pela data de início
  const ordenadas = [...tarefas].sort(
    (a, b) => new Date(a.inicio) - new Date(b.inicio)
  );

  const statusColor = {
    pendente: "#c9c900",
    andamento: "#0aa3e8",
    concluida: "#0a8f3a",
  };

  return (
    <div className="timeline-container">
      {ordenadas.map((tarefa, i) => (
        <div className="timeline-item" key={tarefa.id}>
          <div
            className="timeline-dot"
            style={{ background: statusColor[tarefa.status] }}
          ></div>

          <div className="timeline-content">
            <h3>{tarefa.nome}</h3>
            <p>
              <strong>Início:</strong>{" "}
              {new Date(tarefa.inicio).toLocaleDateString()}
            </p>
            <p>
              <strong>Fim:</strong>{" "}
              {new Date(tarefa.fim).toLocaleDateString()}
            </p>
            <span className="tag" style={{ background: statusColor[tarefa.status] }}>
              {tarefa.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
