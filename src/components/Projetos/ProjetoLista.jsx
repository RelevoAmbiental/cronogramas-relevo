import { useCronograma } from "../../context/CronogramaContext";

export default function ProjetoLista({ projetos, onEditar }) {
  const { removerProjeto } = useCronograma();

  async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      await removerProjeto(id);
    }
  }

  if (!projetos.length) {
    return <p>Nenhum projeto cadastrado.</p>;
  }

  return (
    <table>
      <thead>
        <tr>
          <th>Nome</th>
          <th>Descrição</th>
          <th>Criado em</th>
          <th>Ações</th>
        </tr>
      </thead>

      <tbody>
        {projetos.map((p) => (
          <tr key={p.id}>
            <td>{p.nome}</td>
            <td>{p.descricao || "-"}</td>
            <td>{new Date(p.criadoEm?.seconds * 1000).toLocaleDateString()}</td>
            <td>

              <button
                onClick={() => onEditar(p)}
                style={{
                  marginRight: "10px",
                  padding: "5px 10px",
                  cursor: "pointer",
                }}
              >
                Editar
              </button>

              <button
                onClick={() => excluir(p.id)}
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  color: "white",
                  background: "red",
                  border: "none",
                }}
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
