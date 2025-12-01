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

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ================================================================
  // 1) Detectar o Firestore vindo do Portal (window.__RELEVO_DB__)
  // ================================================================
  useEffect(() => {
    // Se já está pronto, seta direto
    if (window.__RELEVO_DB__) {
      console.log(
        "[CronogramaContext] DB já disponível em window.__RELEVO_DB__"
      );
      setDb(window.__RELEVO_DB__);
      return;
    }

    // Caso não esteja pronto, faz polling leve
    let tentativas = 0;
    const maxTentativas = 50; // ~10s com 200ms

    const id = setInterval(() => {
      tentativas += 1;
      if (window.__RELEVO_DB__) {
        console.log(
          "[CronogramaContext] DB detectado via polling em window.__RELEVO_DB__"
        );
        setDb(window.__RELEVO_DB__);
        clearInterval(id);
      } else if (tentativas >= maxTentativas) {
        console.error(
          "[CronogramaContext] Timeout aguardando window.__RELEVO_DB__"
        );
        clearInterval(id);
      }
    }, 200);

    return () => clearInterval(id);
  }, []);

  // ================================================================
  // 2) Carregar dados sempre que db OU user mudarem
  // ================================================================
  const carregarDados = useCallback(async () => {
    if (!db || !user) {
      console.log(
        "[CronogramaContext] carregarDados() abortado – db ou user ausentes",
        { temDb: !!db, temUser: !!user }
      );
      return;
    }

    try {
      setCarregando(true);
      console.log(
        "[CronogramaContext] carregarDados() – iniciando",
        "uid:",
        user.uid
      );

      const lp = await listarProjetos(db, user.uid);
      const lt = await listarTarefas(db);

      console.log(
        "[CronogramaContext] carregarDados() – recebidos",
        lp.length,
        "projetos e",
        lt.length,
        "tarefas"
      );

      setProjetos(lp);
      setTarefas(lt);
    } catch (e) {
      console.error("[CronogramaContext] Erro ao carregar dados:", e);
    } finally {
      setCarregando(false);
    }
  }, [db, user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ================================================================
  // 3) CRUD Projetos
  // ================================================================
  const criarProjetoCtx = async (dados) => {
    if (!db || !user) {
      console.warn(
        "[CronogramaContext] criarProjetoCtx() – sem db ou user",
        { temDb: !!db, temUser: !!user }
      );
      return;
    }

    await criarProjeto(db, {
      ...dados,
      uid: user.uid, // 🔥 chave para o filtro
    });

    await carregarDados();
  };

  const editarProjetoCtx = async (id, dados) => {
    if (!db) return;
    await editarProjeto(db, id, dados);
    await carregarDados();
  };

  const removerProjetoCtx = async (id) => {
    if (!db) return;
    await removerProjeto(db, id);
    await carregarDados();
  };

  // ================================================================
  // 4) CRUD Tarefas
  // ================================================================
  const criarTarefaCtx = async (dados) => {
    if (!db) return;
    await criarTarefa(db, dados);
    await carregarDados();
  };

  const editarTarefaCtx = async (id, dados) => {
    if (!db) return;
    await editarTarefa(db, id, dados);
    await carregarDados();
  };

  const removerTarefaCtx = async (id) => {
    if (!db) return;
    await removerTarefa(db, id);
    await carregarDados();
  };

  return (
    <CronogramaContext.Provider
      value={{
        carregando,
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
