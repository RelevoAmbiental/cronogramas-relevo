import "./tarefaslista.css";

export default function TarefaLista({ tarefas, projetos, onEditar }) {
  function corDoProjeto(id) {
    return projetos.find((p) => p.id === id)?.cor || "#0a4723";
  }

  function nomeDoProjeto(id) {
    return projetos.find((p) => p.id === id)?.nome || "—";
  }

  if (!tarefas.length) return <p>Nenhuma tarefa encontrada.</p>;

  return (
    <div className="tarefas-grupo">

      {tarefas.map((tarefa) => (
        <div key={tarefa.id} className="tarefa-card">
          <div className="tarefa-cabeca">
            <span className="tarefa-cor" style={{ backgroundColor: corDoProjeto(tarefa.projetoId) }} />
            <h3>{tarefa.nome}</h3>
          </div>

          <p className="tarefa-projeto">
            Projeto: {nomeDoProjeto(tarefa.projetoId)}
          </p>

          <p><strong>Início:</strong> {new Date(tarefa.inicio).toLocaleDateString()}</p>
          <p><strong>Fim:</strong> {new Date(tarefa.fim).toLocaleDateString()}</p>
          <p><strong>Status:</strong> {tarefa.status}</p>

          <div className="tarefa-acoes">
            <button onClick={() => onEditar(tarefa)} className="editar">Editar</button>
            <button onClick={() => excluir(tarefa.id)} className="excluir">Excluir</button>
          </div>
        </div>
      ))}

    </div>
  );
}
