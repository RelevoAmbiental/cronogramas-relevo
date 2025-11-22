import { useState, useEffect } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import "./tarefaform.css";

export default function TarefaForm({ tarefaInicial, fechar }) {
  const { criarTarefa, editarTarefa, projetos } = useCronograma();

  const [nome, setNome] = useState("");
  const [projetoId, setProjetoId] = useState("");
  const [inicio, setInicio] = useState("");
  const [fim, setFim] = useState("");
  const [status, setStatus] = useState("pendente");

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (tarefaInicial) {
      setNome(tarefaInicial.nome || "");
      setProjetoId(tarefaInicial.projetoId || "");
      setInicio(tarefaInicial.inicio?.slice(0, 10) || "");
      setFim(tarefaInicial.fim?.slice(0, 10) || "");
      setStatus(tarefaInicial.status || "pendente");
    } else {
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

    const dados = { nome, projetoId, inicio, fim, status };

    if (tarefaInicial) {
      await editarTarefa(tarefaInicial.id, dados);
    } else {
      await criarTarefa(dados);
    }

    setSalvando(false);
    fechar();
  }

  return (
    <form className="relevo-form" onSubmit={salvar}>
      <div className="relevo-grid">
        <div>
          <label>Nome da Tarefa</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Projeto Vinculado</label>
          <select
            value={projetoId}
            onChange={(e) => setProjetoId(e.target.value)}
            required
          >
            <option value="">Selecione...</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label>Início</label>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Fim</label>
          <input
            type="date"
            value={fim}
            onChange={(e) => setFim(e.target.value)}
            required
          />
        </div>

        <div className="full">
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pendente">Pendente</option>
            <option value="andamento">Em andamento</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>
      </div>

      <div className="relevo-actions">
        <button type="submit" className="save" disabled={salvando}>
          {salvando ? "Salvando..." : "Salvar"}
        </button>

        <button type="button" className="cancel" onClick={fechar}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
