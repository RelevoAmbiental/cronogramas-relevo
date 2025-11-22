import { useState, useMemo } from "react";
import { useCronograma } from "../../context/CronogramaContext";

import TarefaLista from "./TarefaLista";
import TarefaForm from "./TarefaForm";
import Modal from "../ui/Modal";

import TimelineVertical from "./TimelineVertical";
import Gantt from "./Gantt";

import "./filtros.css";
import "./tarefaform.css";
import "./timeline.css";
import "./gantt.css";

export default function Tarefas() {
  const { tarefas, projetos, loading, removerTarefa } = useCronograma();

  const [modalNovaAberto, setModalNovaAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroProjeto, setFiltroProjeto] = useState("todos");

  // Abrir modal de nova tarefa
  function novaTarefa() {
    setModalNovaAberto(true);
  }

  function fecharNova() {
    setModalNovaAberto(false);
  }

  // Manipuladores de edição e exclusão
  function handleEditar(tarefa) {
    setTarefaEditando(tarefa);
  }

  async function handleExcluir(id) {
    if (confirm("Tem certeza que deseja excluir esta tarefa?")) {
      await removerTarefa(id);
    }
  }

  // ORDENAR TAREFAS: DATA → NOME → ID
  const tarefasOrdenadas = useMemo(() => {
    if (!tarefas) return [];

    return [...tarefas].sort((a, b) => {
      const dataA = new Date(a.inicio);
      const dataB = new Date(b.inicio);

      if (dataA - dataB !== 0) return dataA - dataB;

      const nomeA = (a.nome || "").toLowerCase();
      const nomeB = (b.nome || "").toLowerCase();
      if (nomeA < nomeB) return -1;
      if (nomeA > nomeB) return 1;

      return (a.id || "").localeCompare(b.id || "");
    });
  }, [tarefas]);

  // FILTRAR TAREFAS
  const tarefasFiltradas = useMemo(() => {
    return tarefasOrdenadas
      .filter((t) => {
        if (!busca) return true;
        return t.nome.toLowerCase().includes(busca.toLowerCase());
      })
      .filter((t) => {
        if (filtroStatus === "todos") return true;
        return t.status === filtroStatus;
      })
      .filter((t) => {
        if (filtroProjeto === "todos") return true;
        return t.projetoId === filtroProjeto;
      });
  }, [tarefasOrdenadas, busca, filtroStatus, filtroProjeto]);

  return (
    <div className="tarefas-container">

      {/* HEADER */}
      <div className="tarefas-header">
        <h1>Cronograma de Tarefas</h1>

        <button className="btn-nova-tarefa" onClick={novaTarefa}>
          + Nova Tarefa
        </button>
      </div>

      {/* FILTROS */}
      <div className="filtros-container">
        <input
          type="text"
          placeholder="Buscar tarefa..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      
        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>
      
        <select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)}>
          <option value="todos">Todos os projetos</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

        <select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
          <option value="todos">Todos os status</option>
          <option value="pendente">Pendente</option>
          <option value="andamento">Em andamento</option>
          <option value="concluida">Concluída</option>
        </select>

        <select value={filtroProjeto} onChange={(e) => setFiltroProjeto(e.target.value)}>
          <option value="todos">Todos os projetos</option>
          {projetos.map((p) => (
            <option key={p.id} value={p.id}>{p.nome}</option>
          ))}
        </select>
      </div>

      {/* LISTA PRINCIPAL */}
      {loading ? (
        <p>Carregando tarefas...</p>
      ) : (
        <TarefaLista
          tarefas={tarefasFiltradas}
          projetos={projetos}
          onEditar={handleEditar}
          onExcluir={handleExcluir}
        />
      )}

      {/* BOTÃO FLUTUANTE */}
      <button className="btn-flutuante" onClick={novaTarefa}>+</button>

      {/* GANTT */}
      {!loading && tarefasFiltradas.length > 0 && (
        <>
          <hr style={{ margin: "40px 0", opacity: 0.3 }} />
          <h2 style={{ marginBottom: "10px" }}>Gantt Simplificado</h2>
          <Gantt tarefas={tarefasFiltradas} projetos={projetos} />
        </>
      )}

      {/* TIMELINE */}
      {!loading && tarefasFiltradas.length > 0 && (
        <>
          <hr style={{ margin: "40px 0", opacity: 0.3 }} />
          <h2 style={{ marginBottom: "10px" }}>Linha do Tempo</h2>
          <TimelineVertical tarefas={tarefasFiltradas} projetos={projetos} />
        </>
      )}

      {/* MODAL DE NOVA TAREFA */}
      <Modal open={modalNovaAberto} onClose={fecharNova} title="Nova Tarefa">
        <TarefaForm tarefaInicial={null} fechar={fecharNova} />
      </Modal>

    </div>
  );
}
