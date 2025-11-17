import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";

export default function TarefaForm({ tarefa, fechar }) {
  const { criarTarefa, editarTarefa, projetos } = useCronograma();

  const [nome, setNome] = useState(tarefa?.nome || "");
  const [projetoId, setProjetoId] = useState(tarefa?.projetoId || "");
  const [inicio, setInicio] = useState(tarefa?.inicio?.slice(0, 10) || "");
  const [fim, setFim] = useState(tarefa?.fim?.slice(0, 10) || "");
  const [status, setStatus] = useState(tarefa?.status || "pendente");

  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);

    const dados = {
      nome,
      projetoId,
      inicio,
      fim,
      status,
    };

    if (tarefa) {
      await editarTarefa(tarefa.id, dados);
    } else {
      await criarTarefa(dados);
    }

    setSalvando(false);
    fechar();
  }

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 0 10px rgba(0,0,0,0.1)",
        marginTop: "20px",
      }}
    >
      <h2>{tarefa ? "Editar Tarefa" : "Nova Tarefa"}</h2>

      <form onSubmit={salvar}>
        <label>Nome</label>
        <input
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <label>Projeto vinculado</label>
        <select
          value={projetoId}
          onChange={(e) => setProjetoId(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        >
          <option value="">Selecione um projeto</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome}
            </option>
          ))}
        </select>

        <label>Início</label>
        <input
          type="date"
          value={inicio}
          onChange={(e) => setInicio(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <label>Fim</label>
        <input
          type="date"
          value={fim}
          onChange={(e) => setFim(e.target.value)}
          required
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <label>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "15px" }}
        >
          <option value="pendente">Pendente</option>
          <option value="andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>

        <button
          type="submit"
          disabled={salvando}
          style={{
            padding: "10px 16px",
            background: "#0a4723",
            color: "white",
            border: "none",
            borderRadius: "6px",
            marginRight: "10px",
          }}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>

        <button
          type="button"
          onClick={fechar}
          style={{
            padding: "10px 16px",
            background: "#777",
            color: "white",
            border: "none",
            borderRadius: "6px",
          }}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
