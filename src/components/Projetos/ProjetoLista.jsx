import { useCronograma } from "../../context/CronogramaContext";
import "./projetos.css";

const STATUS_LABEL = {
  ativo: "Ativo",
  concluido: "Concluído",
  arquivado: "Arquivado",
};

export default function ProjetoLista({ projetos, onEditar }) {
  const { removerProjeto } = useCronograma();

  async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir este projeto?")) {
      await removerProjeto(id);
    }
  }

  if (!projetos || !projetos.length) {
    return <p>Nenhum projeto cadastrado.</p>;
  }

  return (
    <div className="projetos-lista">
      {projetos.map((p) => (
        <div key={p.id} className="projeto-card">
          <div className="projeto-topo">
            <span
              className="projeto-cor-bolinha"
              style={{ backgroundColor: p.cor || "#0a4723" }}
            />

            <div className="projeto-titulo-bloco">
              <div className="projeto-titulo-linha">
                <h3>{p.nome}</h3>
                <span
                  className={`projeto-status-chip status-${p.status || "ativo"}`}
                >
                  {STATUS_LABEL[p.status || "ativo"]}
                </span>
              </div>
              {p.cliente && (
                <p className="projeto-cliente">
                  Cliente: <strong>{p.cliente}</strong>
                </p>
              )}
            </div>
          </div>

          <div className="projeto-meta">
            {p.dataInicio && (
              <span>
                Início:{" "}
                {new Date(p.dataInicio).toLocaleDateString("pt-BR")}
              </span>
            )}
            {p.descricao && (
              <p className="projeto-descricao">
                {p.descricao.length > 140
                  ? p.descricao.slice(0, 140) + "..."
                  : p.descricao}
              </p>
            )}
          </div>

          <div className="projeto-acoes">
            <button
              className="btn-projeto-editar"
              onClick={() => onEditar(p)}
            >
              Editar
            </button>

            <button
              className="btn-projeto-excluir"
              onClick={() => excluir(p.id)}
            >
              Excluir
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
