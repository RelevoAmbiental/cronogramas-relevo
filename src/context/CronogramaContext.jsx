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
   * 🔥 Classificação automática de tarefas atrasadas
   * - Se fim < hoje e status != concluída → atrasada
   * - Não altera Firestore, apenas apresentação
   */
  function classificarAtraso(tarefa) {
    const hoje = new Date();
    const fim = new Date(tarefa.fim);

    if (tarefa.status === "concluida") return tarefa;

    if (fim < hoje) {
      return { ...tarefa, status: "atrasada" };
    }

    return tarefa;
  }

  /**
   * 🔥 Função estável para carregar dados do Firestore
   */
  const carregarDados = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    // Carrega projetos e tarefas em paralelo
    const [listaProjetos, listaTarefasRaw] = await Promise.all([
      listarProjetos(user.uid),
      listarTarefas(user.uid),
    ]);

    // Classificação automática de atraso
    const listaTarefas = listaTarefasRaw.map(classificarAtraso);

    // Atualiza estado
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
