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

// 🔥 Adapter real que conecta ao Firebase exposto pelo Portal
import {
  onFirebaseReady,
  isFirebaseReady,
} from "../services/firebase";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ================================================================
  // 1) Detectar o Firestore do Portal
  // ================================================================
  useEffect(() => {
    // Caso o adapter já tenha sinalizado que está pronto
    if (isFirebaseReady() && window.__RELEVO_DB__) {
      console.log(
        "[CronogramaContext] Firebase pronto via adapter (isFirebaseReady)."
      );
      setDb(window.__RELEVO_DB__);
      return;
    }

    // Caso o adapter ainda vá sinalizar futuramente
    const unsubscribe = onFirebaseReady(({ db: dbPronto }) => {
      console.log("[CronogramaContext] onFirebaseReady disparado.");
      setDb(dbPronto);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  // ================================================================
  // 2) Carregar dados quando db OU user mudarem
  // ================================================================
  const carregarDados = useCallback(async () => {
    if (!db || !user) {
      console.log(
        "[CronogramaContext] carregarDados() abortado — db ou user ausentes",
        { temDb: !!db, temUser: !!user }
      );
      return;
    }

    try {
      setCarregando(true);
      console.log(
        "[CronogramaContext] carregarDados() — iniciando",
        "uid:",
        user.uid
      );

      const [lp, lt] = await Promise.all([
        listarProjetos(db, user.uid),
        listarTarefas(db),
      ]);

      console.log(
        "[CronogramaContext] carregarDados() — recebidos:",
        lp.length,
        "projetos |",
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

  // ================================================================
  // 5) Expor contexto para UI
  // ================================================================
  return (
    <CronogramaContext.Provider
      value={{
        carregando,
        loading: carregando, // alias para compatibilidade
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
