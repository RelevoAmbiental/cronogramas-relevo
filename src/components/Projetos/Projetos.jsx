import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import ProjetoLista from "./ProjetoLista";
import ProjetoForm from "./ProjetoForm";

export default function Projetos() {
  const { projetos, loading } = useCronograma();

  const [abrirForm, setAbrirForm] = useState(false);
  const [projetoEditando, setProjetoEditando] = useState(null);

  function novoProjeto() {
    setProjetoEditando(null);
    setAbrirForm(true);
  }

  function editar(projeto) {
    setProjetoEditando(projeto);
    setAbrirForm(true);
  }

  function fecharForm() {
    setProjetoEditando(null);
    setAbrirForm(false);
  }

  return (
    <div className="content">
      <h1>Projetos</h1>
      <p>Gerencie aqui todos os projetos ativos da Relevo.</p>

      <button
        style={{
          padding: "10px 16px",
          background: "#0a4723",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          marginBottom: "20px"
        }}
        onClick={novoProjeto}
      >
        + Novo Projeto
      </button>

      {loading ? (
        <p>Carregando projetos...</p>
      ) : (
        <ProjetoLista projetos={projetos} onEditar={editar} />
      )}

      {abrirForm && (
        <ProjetoForm projeto={projetoEditando} fechar={fecharForm} />
      )}
    </div>
  );
}
