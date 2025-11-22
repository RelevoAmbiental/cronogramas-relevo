import { useState, useEffect } from "react";
import { useCronograma } from "../../context/CronogramaContext";

export default function TarefaForm({ tarefaInicial, fechar }) {
  const { criarTarefa, editarTarefa, projetos } = useCronograma();

  // Estados — carregando a tarefaInicial quando existir
  const [nome, setNome] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [status, setStatus] = useState("pendente");

  const [salvando, setSalvando] = useState(false);

  // Quando abrir o modal, preenche os campos corretamente
  useEffect(() => {
    if (tarefaInicial) {
      setNome(tarefaInicial.nome || "");
      setProjetoId(tarefaInicial.projetoId || "");
      setInicio(tarefaInicial.inicio?.slice(0, 10) || "");
      setFim(tarefaInicial.fim?.slice(0, 10) || "");
      setStatus(tarefaInicial.status || "pendente");
    } else {
      // formulário limpo para criação
      setNome("");
      setProjetoId("");
      setInicio("");
      setFim("");
      setStatus("pendente");
    }
  }, [tarefaInicial]);

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

    if (tarefaInicial) {
      await editarTarefa(tarefaInicial.id, dados);
    } else {
      await criarTarefa(dados);
    }

    setSalvando(false);
    fechar(); // fecha modal
  }

  return (
    <div
      style={{
        background: "white",
        padding: "20px",
        borderRadius: "8px",
      }}
    >
      <h2 style={{ marginBottom: "15px" }}>
        {tarefaInicial ? "Editar Tarefa" : "Nova Tarefa"}
      </h2>

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

        <div style={{ marginTop: "10px" }}>
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
        </div>
      </form>
    </div>
  );
}
