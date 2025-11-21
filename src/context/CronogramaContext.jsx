import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "./UserContext";

import {
  listarProjetos,
  listarTarefas,
  criarProjeto,
  editarProjeto,
  removerProjeto,
  criarTarefa,
  editarTarefa,
  removerTarefa
} from "../services/cronogramaService";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 🔥 Função estável para carregar dados do Firestore
   */
  const carregarDados = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Carrega projetos e tarefas em paralelo
    const [listaProjetos, listaTarefas] = await Promise.all([
      listarProjetos(user.uid),
      listarTarefas(user.uid),
    ]);

    // Atualiza estado de forma atômica
    setProjetos(listaProjetos);
    setTarefas(listaTarefas);

    setLoading(false);
  }, [user]);

  // Ações que também atualizam o estado local após cada operação
  const criarProjetoCtx = async (dados) => {
    await criarProjeto(user.uid, dados);
    await carregarDados();
  };

  const editarProjetoCtx = async (id, dados) => {
    await editarProjeto(id, dados);
    await carregarDados();
  };

  const removerProjetoCtx = async (id) => {
    await removerProjeto(id);
    await carregarDados();
  };

  const criarTarefaCtx = async (dados) => {
    await criarTarefa(user.uid, dados);
    await carregarDados();
  };

  const editarTarefaCtx = async (id, dados) => {
    await editarTarefa(id, dados);
    await carregarDados();
  };

  const removerTarefaCtx = async (id) => {
    await removerTarefa(id);
    await carregarDados();
  };

  /**
   * Carrega dados na montagem e quando o usuário mudar
   */
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <CronogramaContext.Provider
      value={{
        projetos,
        tarefas,
        loading,

        // Operações com UID + atualização de estado
        criarProjeto: criarProjetoCtx,
        editarProjeto: editarProjetoCtx,
        removerProjeto: removerProjetoCtx,

        criarTarefa: criarTarefaCtx,
        editarTarefa: editarTarefaCtx,
        removerTarefa: removerTarefaCtx,
      }}
    >
      {children}
    </CronogramaContext.Provider>
  );
}

export function useCronograma() {
  return useContext(CronogramaContext);
}
