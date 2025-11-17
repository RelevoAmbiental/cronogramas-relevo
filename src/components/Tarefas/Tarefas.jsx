import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import TarefaLista from "./TarefaLista";
import TarefaForm from "./TarefaForm";

export default function Tarefas() {
  const { tarefas, loading } = useCronograma();

  const [abrirForm, setAbrirForm] = useState(false);
  const [tarefaEditando, setTarefaEditando] = useState(null);

  function novaTarefa() {
    setTarefaEditando(null);
    setAbrirForm(true);
  }

  function editar(tarefa) {
    setTarefaEditando(tarefa);
    setAbrirForm(true);
  }

  function fecharForm() {
    setTarefaEditando(null);
    setAbrirForm(false);
  }

  return (
    <div className="content">
      <h1>Tarefas</h1>
      <p>Gerencie aqui as tarefas vinculadas aos projetos.</p>

      <button
        onClick={novaTarefa}
        style={{
          padding: "10px 16px",
          background: "#0a4723",
          color: "white",
          border: "none",
          borderRadius: "6px",
          marginBottom: "20px",
          cursor: "pointer",
        }}
      >
        + Nova Tarefa
      </button>

      {loading ? (
        <p>Carregando tarefas...</p>
      ) : (
        <TarefaLista tarefas={tarefas} onEditar={editar} />
      )}

      {abrirForm && (
        <TarefaForm tarefa={tarefaEditando} fechar={fecharForm} />
      )}
    </div>
  );
}
