import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";

export default function ProjetoForm({ projeto, fechar }) {
  const { criarProjeto, editarProjeto } = useCronograma();

  const [nome, setNome] = useState(projeto?.nome || "");
  const [descricao, setDescricao] = useState(projeto?.descricao || "");
  const [salvando, setSalvando] = useState(false);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);

    const dados = { nome, descricao };

    if (projeto) {
      await editarProjeto(projeto.id, dados);
    } else {
      await criarProjeto(dados);
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
        boxShadow: "0 0 10px rgba(0,0,0,0.15)",
        marginTop: "20px",
      }}
    >
      <h2>{projeto ? "Editar Projeto" : "Novo Projeto"}</h2>

      <form onSubmit={salvar}>
        <label>Nome do Projeto</label>
        <input
          type="text"
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <label>Descrição</label>
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
        />

        <button
          type="submit"
          style={{
            padding: "10px 16px",
            marginRight: "10px",
            background: "#0a4723",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
          disabled={salvando}
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
            cursor: "pointer",
          }}
        >
          Cancelar
        </button>
      </form>
    </div>
  );
}
