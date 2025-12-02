import "./tarefaslista.css";

export default function TarefaLista({ tarefas, projetos, onEditar, onExcluir }) {
  function corDoProjeto(id) {
    return projetos.find((p) => p.id === id)?.cor || "#0a4723";
  }

  function nomeDoProjeto(id) {
    return projetos.find((p) => p.id === id)?.nome || "—";
  }

  if (!tarefas.length) return <p>Nenhuma tarefa encontrada.</p>;

  return (
    <div className="tarefas-lista-container">
      <table className="tarefas-tabela">
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Período</th>
            <th>Projeto</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {tarefas.map((tarefa) => {
            const inicio = new Date(tarefa.inicio);
            const fim = new Date(tarefa.fim);
            const periodo = `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;

            return (
              <tr key={tarefa.id} className="tarefa-row">

                {/* COLUNA — Tarefa */}
                <td className="tarefa-col-nome">
                  <span
                    className="tarefa-bolinha"
                    style={{ backgroundColor: corDoProjeto(tarefa.projetoId) }}
                  />
                  {tarefa.nome}
                </td>

                {/* COLUNA — Período */}
                <td className="tarefa-col-periodo">{periodo}</td>

                {/* COLUNA — Projeto */}
                <td className="tarefa-col-projeto">{nomeDoProjeto(tarefa.projetoId)}</td>

                {/* COLUNA — Status */}
                <td className="tarefa-col-status">{tarefa.status}</td>

                {/* COLUNA — Ações */}
                <td className="tarefa-col-acoes">
                  <button className="btn-editar" onClick={() => onEditar(tarefa)}>
                    Editar
                  </button>
                  <button className="btn-excluir" onClick={() => onExcluir(tarefa.id)}>
                    Excluir
                  </button>
                </td>

              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
