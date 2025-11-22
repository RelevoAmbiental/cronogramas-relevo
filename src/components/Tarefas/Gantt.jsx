import "./gantt.css";

export default function Gantt({ tarefas, projetos }) {
  if (!tarefas?.length) return <p>Nenhuma tarefa encontrada.</p>;

  const ordenadas = [...tarefas].sort(
    (a, b) => new Date(a.inicio) - new Date(b.inicio)
  );

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

  function corDoProjeto(id) {
    return projetos.find((p) => p.id === id)?.cor || "#0a4723";
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
                background: corDoProjeto(tarefa.projetoId),
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
