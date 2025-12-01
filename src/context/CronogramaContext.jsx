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

import {
  db as firebaseDb,
  isFirebaseReady,
  onFirebaseReady,
} from "../services/firebase";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // 1) Esperar o Firebase do Portal ficar pronto
  useEffect(() => {
    // Se já estiver pronto, usa direto
    if (isFirebaseReady() && firebaseDb) {
      setDb(firebaseDb);
      return;
    }

    // Caso contrário, registra callback para quando ficar pronto
    const unsubscribe = onFirebaseReady(() => {
      if (firebaseDb) {
        setDb(firebaseDb);
      }
    });

    return unsubscribe;
  }, []);

  // 2) Carregar dados assim que tivermos um db válido
  const carregarDados = useCallback(async () => {
    if (!db) return;
    try {
      setLoading(true);

      // 👇 Sem filtro por userId por enquanto
      const lp = await listarProjetos(db);
      const lt = await listarTarefas(db);

      setProjetos(lp);
      setTarefas(lt);
    } catch (e) {
      console.error("Erro ao carregar dados:", e);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    if (db) {
      carregarDados();
    }
  }, [db, carregarDados, user?.uid]);

  // CRUD Projetos
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

  // CRUD Tarefas
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
        loading,
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
