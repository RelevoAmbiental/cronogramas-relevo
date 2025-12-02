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
  // 1) DETECTAR FIRESTORE + USUÁRIO EXPOSOS PELO PORTAL
  //
  //    - Firestore vem de window.__RELEVO_DB__
  //    - Usuário vem de window.__RELEVO_USER__
  //
  //    O Cronograma carrega antes do Portal em alguns casos,
  //    então usamos um polling leve até que AMBOS estejam prontos.
  // ================================================================
  useEffect(() => {
    console.log("[CronogramaContext] Iniciando detecção de DB + USER...");

    const tentar = () => {
      const dbPortal = window.__RELEVO_DB__;
      const userPortal = window.__RELEVO_USER__;

      if (dbPortal && userPortal) {
        console.log(
          "[CronogramaContext] DB + USER detectados com sucesso.",
          { db: !!dbPortal, user: !!userPortal }
        );
        setDb(dbPortal);
        return true;
      }

      return false;
    };

    // tentar imediatamente
    if (tentar()) return;

    // caso ainda não estejam prontos, tentar a cada 200ms
    const interval = setInterval(() => {
      if (tentar()) {
        clearInterval(interval);
      }
    }, 200);

    return () => clearInterval(interval);
  }, []);

  // ================================================================
  // 2) CARREGAMENTO DE PROJETOS E TAREFAS
  //
  //    Só executa quando db e user EXISTEM.
  // ================================================================
  const carregarDados = useCallback(async () => {
    if (!db || !user) {
      console.log(
        "[CronogramaContext] carregarDados() aguardando DB + USER...",
        { db: !!db, user: !!user }
      );
      return;
    }

    try {
      setCarregando(true);

      console.log(
        "[CronogramaContext] carregarDados() iniciando fetch",
        "uid:",
        user.uid
      );

      const [lp, lt] = await Promise.all([
        listarProjetos(db, user.uid),
        listarTarefas(db),
      ]);

      console.log(
        `[CronogramaContext] carregarDados() — ${lp.length} projetos, ${lt.length} tarefas`
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
  // 3) CRUD DE PROJETOS
  // ================================================================
  const criarProjetoCtx = async (dados) => {
    if (!db || !user) return;

    await criarProjeto(db, {
      ...dados,
      uid: user.uid,
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
  // 4) CRUD DE TAREFAS
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

  // ================================================================
  // 5) ENTREGA DO CONTEXTO PARA A UI
  // ================================================================
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
