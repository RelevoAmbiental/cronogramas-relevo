import { useState, useMemo } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import TarefaLista from "./TarefaLista";
import TarefaForm from "./TarefaForm";
import Modal from "../ui/Modal";

import TimelineVertical from "./TimelineVertical";
import Gantt from "./Gantt";

import "./tarefaform.css";
import "./timeline.css";
import "./gantt.css";

export default function Tarefas() {
  const { tarefas, loading } = useCronograma();

  const [modalNovaAberto, setModalNovaAberto] = useState(false);

  function novaTarefa() {
    setModalNovaAberto(true);
  }

  function fecharNova() {
    setModalNovaAberto(false);
  }

  // 🔥 ORDENAR TAREFAS: (A) data → (B) nome → (C) id
  const tarefasOrdenadas = useMemo(() => {
    if (!tarefas) return [];

    return [...tarefas].sort((a, b) => {
      // A) ordena por data de início
      const dataA = new Date(a.inicio);
      const dataB = new Date(b.inicio);

      if (dataA.getTime() !== dataB.getTime()) {
        return dataA - dataB;
      }

      // B) ordena por nome
      const nomeA = (a.nome || "").toLowerCase();
      const nomeB = (b.nome || "").toLowerCase();

      if (nomeA < nomeB) return -1;
      if (nomeA > nomeB) return 1;

      // C) ordena por id (garante estabilidade)
      return (a.id || "").localeCompare(b.id || "");
    });
  }, [tarefas]);

  return (
    <div className="tarefas-container">
      {/* HEADER */}
      <div className="tarefas-header">
        <h1>Cronograma de Tarefas</h1>

        <button className="btn-nova-tarefa" onClick={novaTarefa}>
          + Nova Tarefa
        </button>
      </div>

      {/* LISTA PRINCIPAL */}
      {loading ? (
        <p>Carregando tarefas...</p>
      ) : (
        <TarefaLista tarefas={tarefasOrdenadas} />
      )}

      {/* BOTÃO FLUTUANTE */}
      <button className="btn-flutuante" onClick={novaTarefa}>
        +
      </button>

      {/* SEÇÃO: TIMELINE VERTICAL */}
      {!loading && tarefasOrdenadas.length > 0 && (
        <>
          <hr style={{ margin: "40px 0", opacity: 0.3 }} />

          <h2 style={{ marginBottom: "10px" }}>Linha do Tempo</h2>
          <TimelineVertical tarefas={tarefasOrdenadas} />
        </>
      )}

      {/* SEÇÃO: GANTT */}
      {!loading && tarefasOrdenadas.length > 0 && (
        <>
          <hr style={{ margin: "40px 0", opacity: 0.3 }} />

          <h2 style={{ marginBottom: "10px" }}>Gantt Simplificado</h2>
          <Gantt tarefas={tarefasOrdenadas} />
        </>
      )}

      {/* MODAL: NOVA TAREFA */}
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
