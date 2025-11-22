import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import TarefaLista from "./TarefaLista";
import TarefaForm from "./TarefaForm";
import Modal from "../ui/Modal";
import "./tarefaform.css";

export default function Tarefas() {
  const { tarefas, loading } = useCronograma();

  const [modalNovaAberto, setModalNovaAberto] = useState(false);

  function novaTarefa() {
    setModalNovaAberto(true);
  }

  function fecharNova() {
    setModalNovaAberto(false);
  }

  return (
    <div className="tarefas-container">
      <div className="tarefas-header">
        <h1>Cronograma de Tarefas</h1>

        <button className="btn-nova-tarefa" onClick={novaTarefa}>
          + Nova Tarefa
        </button>
      </div>

      {loading ? (
        <p>Carregando tarefas...</p>
      ) : (
        <TarefaLista tarefas={tarefas} />
      )}

      {/* Botão flutuante para nova tarefa */}
      <button className="btn-flutuante" onClick={novaTarefa}>
        +
      </button>

      {/* Modal de criação de nova tarefa */}
      <Modal
        open={modalNovaAberto}
        onClose={fecharNova}
        title="Nova Tarefa"
      >
        <TarefaForm tarefaInicial={null} fechar={fecharNova} />
      </Modal>
    </div>
  );
}
