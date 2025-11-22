import { useState, useMemo } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import ProjetoLista from "./ProjetoLista";
import ProjetoForm from "./ProjetoForm";
import Modal from "../ui/Modal";

import "./projetos.css";

export default function Projetos() {
  const { projetos, loading } = useCronograma();

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");

  const [modalNovoAberto, setModalNovoAberto] = useState(false);
  const [modalEditarAberto, setModalEditarAberto] = useState(false);
  const [projetoSelecionado, setProjetoSelecionado] = useState(null);

  function abrirNovo() {
    setProjetoSelecionado(null);
    setModalNovoAberto(true);
  }

  function fecharNovo() {
    setModalNovoAberto(false);
  }

  function abrirEdicao(projeto) {
    setProjetoSelecionado(projeto);
    setModalEditarAberto(true);
  }

  function fecharEdicao() {
    setModalEditarAberto(false);
    setProjetoSelecionado(null);
  }

  const projetosFiltrados = useMemo(() => {
    return (projetos || [])
      .filter((p) => {
        if (!busca) return true;
        const termo = busca.toLowerCase();
        return (
          p.nome?.toLowerCase().includes(termo) ||
          p.cliente?.toLowerCase().includes(termo)
        );
      })
      .filter((p) => {
        if (filtroStatus === "todos") return true;
        return (p.status || "ativo") === filtroStatus;
      });
  }, [projetos, busca, filtroStatus]);

  return (
    <div className="projetos-container">
      {/* HEADER */}
      <div className="projetos-header">
        <h1>Projetos</h1>

        <button className="btn-novo-projeto" onClick={abrirNovo}>
          + Novo Projeto
        </button>
      </div>

      {/* FILTROS */}
      <div className="projetos-filtros">
        <input
          type="text"
          placeholder="Buscar por nome ou cliente..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
        >
          <option value="todos">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="concluido">Concluído</option>
          <option value="arquivado">Arquivado</option>
        </select>
      </div>

      {/* LISTA DE PROJETOS */}
      {loading ? (
        <p>Carregando projetos...</p>
      ) : (
        <ProjetoLista projetos={projetosFiltrados} onEditar={abrirEdicao} />
      )}

      {/* BOTÃO FLUTUANTE */}
      <button className="btn-flutuante-projetos" onClick={abrirNovo}>
        +
      </button>

      {/* MODAL: NOVO PROJETO */}
      <Modal
        open={modalNovoAberto}
        onClose={fecharNovo}
        title="Novo Projeto"
      >
        <ProjetoForm projetoInicial={null} fechar={fecharNovo} />
      </Modal>

      {/* MODAL: EDITAR PROJETO */}
      <Modal
        open={modalEditarAberto}
        onClose={fecharEdicao}
        title="Editar Projeto"
      >
        {projetoSelecionado && (
          <ProjetoForm
            projetoInicial={projetoSelecionado}
            fechar={fecharEdicao}
          />
        )}
      </Modal>
    </div>
  );
}
