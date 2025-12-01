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

// 🔥 Agora usamos a API de readiness do Firebase
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
  // 1) Aguardar Firebase do Portal de forma reativa
  // ================================================================
  useEffect(() => {
    // Se já estiver pronto, seta direto
    if (isFirebaseReady() && firebaseDb) {
      setDb(firebaseDb);
      return;
    }

    // Caso contrário, assinamos o evento de "ready"
    const unsubscribe = onFirebaseReady(() => {
      if (firebaseDb) {
        setDb(firebaseDb);
      } else if (window.__RELEVO_DB__) {
        // fallback extra de segurança
        setDb(window.__RELEVO_DB__);
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // ================================================================
  // 2) Carregar dados sempre que o db ficar disponível
  // ================================================================
  const carregarDados = useCallback(async () => {
    if (!db) return;

    try {
      setCarregando(true);

      const lp = await listarProjetos(db, user?.uid || null);
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
    if (db) carregarDados();
  }, [db, carregarDados]);

  // ================================================================
  // CRUD Project
  // ================================================================
  const criarProjetoCtx = async (dados) => {
    if (!db) return;
    await criarProjeto(db, dados);
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
  // CRUD Tasks
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
