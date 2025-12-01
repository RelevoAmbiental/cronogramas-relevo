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

// Firebase vindo do portal
import {
  db as firebaseDb,
  isFirebaseReady,
  onFirebaseReady,
} from "../services/firebase";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ================================================================
  // 1) Aguardar Firebase do Portal
  // ================================================================
  useEffect(() => {
    if (isFirebaseReady() && firebaseDb) {
      setDb(firebaseDb);
      return;
    }

    const unsubscribe = onFirebaseReady(() => {
      if (firebaseDb) setDb(firebaseDb);
      else if (window.__RELEVO_DB__) setDb(window.__RELEVO_DB__);
    });

    return () => unsubscribe && unsubscribe();
  }, []);

  // ================================================================
  // 2) Carregar dados sempre que db OU user mudarem
  // ================================================================
  const carregarDados = useCallback(async () => {
    if (!db || !user) return;

    try {
      setCarregando(true);

      const lp = await listarProjetos(db, user.uid);
      const lt = await listarTarefas(db);

      setProjetos(lp);
      setTarefas(lt);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setCarregando(false);
    }
  }, [db, user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ================================================================
  // CRUD Projetos
  // ================================================================
  const criarProjetoCtx = async (dados) => {
    if (!db || !user) return;

    await criarProjeto(db, {
      ...dados,
      uid: user.uid, // 🔥 Obrigatório
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
  // CRUD Tarefas
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
