// src/context/CronogramaContext.jsx

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { useUser } from "./UserContext";

import {
  listarProjetos,
  listarTarefas,
  criarProjeto,
  editarProjeto,
  removerProjeto,
  criarTarefa,
  editarTarefa,
  removerTarefa,
} from "../services/cronogramaService";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [carregando, setCarregando] = useState(true);
  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ================================================================
  // 1) Carregar Projetos + Tarefas quando USER + DB estiverem prontos
  // ================================================================
  const carregarDados = useCallback(async () => {
    const dbGlobal = window.__RELEVO_DB__;

    if (!dbGlobal || !user) {
      console.log(
        "[CronogramaContext] carregarDados() aguardando user/DB...",
        { temDb: !!dbGlobal, temUser: !!user }
      );
      return;
    }

    try {
      setCarregando(true);

      console.log(
        "[CronogramaContext] carregarDados() iniciando – uid:",
        user.uid
      );

      const [lp, lt] = await Promise.all([
        listarProjetos(user.uid),
        listarTarefas(),
      ]);

      console.log(
        `[CronogramaContext] carregarDados() – ${lp.length} projetos, ${lt.length} tarefas`
      );

      setProjetos(lp);
      setTarefas(lt);
    } catch (e) {
      console.error("[CronogramaContext] Erro ao carregar dados:", e);
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ================================================================
  // 2) CRUD Projetos
  // ================================================================
  const criarProjetoCtx = async (dados) => {
    if (!user || !window.__RELEVO_DB__) return;

    await criarProjeto({
      ...dados,
      uid: user.uid,
    });

    await carregarDados();
  };

  const editarProjetoCtx = async (id, dados) => {
    if (!window.__RELEVO_DB__) return;
    await editarProjeto(id, dados);
    await carregarDados();
  };

  const removerProjetoCtx = async (id) => {
    if (!window.__RELEVO_DB__) return;
    await removerProjeto(id);
    await carregarDados();
  };

  // ================================================================
  // 3) CRUD Tarefas
  // ================================================================
  const criarTarefaCtx = async (dados) => {
    if (!window.__RELEVO_DB__) return;
    await criarTarefa(dados);
    await carregarDados();
  };

  const editarTarefaCtx = async (id, dados) => {
    if (!window.__RELEVO_DB__) return;
    await editarTarefa(id, dados);
    await carregarDados();
  };

  const removerTarefaCtx = async (id) => {
    if (!window.__RELEVO_DB__) return;
    await removerTarefa(id);
    await carregarDados();
  };

  return (
    <CronogramaContext.Provider
      value={{
        carregando,
        loading: carregando,
        projetos,
        tarefas,
        criarProjeto: criarProjetoCtx,
        editarProjeto: editarProjetoCtx,
        removerProjeto: removerProjetoCtx,
        criarTarefa: criarTarefaCtx,
        editarTarefa: editarTarefaCtx,
        removerTarefa: removerTarefaCtx,
        atualizar: carregarDados,
      }}
    >
      {children}
    </CronogramaContext.Provider>
  );
}

export function useCronograma() {
  return useContext(CronogramaContext);
}
