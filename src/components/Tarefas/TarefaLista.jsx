import { useCronograma } from "../../context/CronogramaContext";
import Modal from "../ui/Modal";
import TarefaForm from "./TarefaForm";
import { useState } from "react";

export default function TarefaLista({ tarefas }) {
  const { removerTarefa, projetos } = useCronograma();

  const [modalAberto, setModalAberto] = useState(false);
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null);

  async function excluir(id) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await removerTarefa(id);
    }
  }

  function nomeProjeto(id) {
    return projetos.find((p) => p.id === id)?.nome || "—";
  }

  const abrirEdicao = (tarefa) => {
    setTarefaSelecionada(tarefa);
    setModalAberto(true);
  };

  if (!tarefas.length) {
    return <p>Nenhuma tarefa cadastrada.</p>;
  }

  return (
    <>
      <table>
        <thead>
          <tr>
            <th>Tarefa</th>
            <th>Projeto</th>
            <th>Início</th>
            <th>Fim</th>
            <th>Status</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {tarefas.map((t) => (
            <tr key={t.id}>
              <td>{t.nome}</td>
              <td>{nomeProjeto(t.projetoId)}</td>
              <td>{new Date(t.inicio).toLocaleDateString()}</td>
              <td>{new Date(t.fim).toLocaleDateString()}</td>
              <td>{t.status}</td>

              <td>
                <button
                  onClick={() => abrirEdicao(t)}
                  style={{ marginRight: "10px" }}
                >
                  Editar
                </button>

                <button
                  onClick={() => excluir(t.id)}
                  style={{
                    color: "white",
                    background: "red",
                    border: "none",
                    padding: "5px 10px",
                  }}
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* MODAL DE EDIÇÃO */}
      <Modal
        open={modalAberto}
        onClose={() => setModalAberto(false)}
        title="Editar Tarefa"
      >
        {tarefaSelecionada && (
          <TarefaForm
            tarefaInicial={tarefaSelecionada}
            fechar={() => setModalAberto(false)}
          />
        )}
      </Modal>
    </>
  );
}
