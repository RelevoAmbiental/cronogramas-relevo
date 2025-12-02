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

import { waitForRelevoFirebase } from "../relevo-bootstrap";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ==========================================================
  // 1) Inicializa o Firestore APENAS via bootstrap
  // ==========================================================
  useEffect(() => {
    waitForRelevoFirebase().then((dbPortal) => {
      console.log("[CronogramaContext] DB recebido via bootstrap:", dbPortal);
      setDb(dbPortal);
    });
  }, []);

  // ==========================================================
  // 2) Carregar dados sempre que db + user estiverem disponíveis
  // ==========================================================
  const carregarDados = useCallback(async () => {
    if (!db || !user) {
      console.log("[CronogramaContext] carregarDados abortado", {
        temDb: !!db,
        temUser: !!user,
      });
      return;
    }

    try {
      setCarregando(true);
      console.log(
        "[CronogramaContext] carregarDados() – iniciando | uid:",
        user.uid
      );

      const [lp, lt] = await Promise.all([
        listarProjetos(db, user.uid),
        listarTarefas(db),
      ]);

      console.log(
        "[CronogramaContext] carregarDados() – recebidos:",
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

  // ==========================================================
  // 3) CRUDs expostos para UI
  // ==========================================================
  const criarProjetoCtx = async (dados) => {
    await criarProjeto(db, { ...dados, uid: user.uid });
    await carregarDados();
  };

  const editarProjetoCtx = async (id, dados) => {
    await editarProjeto(db, id, dados);
    await carregarDados();
  };

  const removerProjetoCtx = async (id) => {
    await removerProjeto(db, id);
    await carregarDados();
  };

  const criarTarefaCtx = async (dados) => {
    await criarTarefa(db, dados);
    await carregarDados();
  };

  const editarTarefaCtx = async (id, dados) => {
    await editarTarefa(db, id, dados);
    await carregarDados();
  };

  const removerTarefaCtx = async (id) => {
    await removerTarefa(db, id);
    await carregarDados();
  };

  // ==========================================================
  // 4) Retorno do contexto
  // ==========================================================
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
