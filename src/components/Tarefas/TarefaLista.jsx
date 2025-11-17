import { useCronograma } from "../../context/CronogramaContext";

export default function TarefaLista({ tarefas, onEditar }) {
  const { removerTarefa, projetos } = useCronograma();

  async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await removerTarefa(id);
    }
  }

  if (!tarefas.length) {
    return <p>Nenhuma tarefa cadastrada.</p>;
  }

  function nomeProjeto(id) {
    return projetos.find(p => p.id === id)?.nome || "—";
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Tarefa</th>
          <th>Projeto</th>
          <th>Início</th>
          <th>Fim</th>
          <th>Status</th>
          <th>Ações</th>
        </tr>
      </thead>

      <tbody>
        {tarefas.map((t) => (
          <tr key={t.id}>
            <td>{t.nome}</td>
            <td>{nomeProjeto(t.projetoId)}</td>
            <td>{new Date(t.inicio).toLocaleDateString()}</td>
            <td>{new Date(t.fim).toLocaleDateString()}</td>
            <td>{t.status}</td>

            <td>
              <button onClick={() => onEditar(t)} style={{ marginRight: "10px" }}>
                Editar
              </button>

              <button
                onClick={() => excluir(t.id)}
                style={{ color: "white", background: "red", border: "none", padding: "5px 10px" }}
              >
                Excluir
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
