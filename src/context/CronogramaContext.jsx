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
  console.log("[Provider] MONTANDO CronogramaProvider");

  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ==========================================================
  // 1) Inicializa o Firestore APENAS via bootstrap
  // ==========================================================
  useEffect(() => {
    console.log("[Provider] useEffect() START — aguardando waitForRelevoFirebase");

    waitForRelevoFirebase()
      .then((res) => {
        console.log("[Provider] DB DEFINIDO via bootstrap:", res.db);
        setDb(res.db);
      })
      .catch((err) => {
        console.error("[Provider] Erro no bootstrap:", err);
      });
  }, []);

  // ==========================================================
  // 2) Carregar dados quando db + user estiverem prontos
  // ==========================================================
  const carregarDados = useCallback(async () => {
    console.log("[Provider] carregarDados() CHAMADO", {
      temDb: !!db,
      temUser: !!user,
    });

    if (!db || !user) return;

    try {
      setCarregando(true);
      console.log("[Provider] carregarDados() – iniciando | uid:", user.uid);

      const [lp, lt] = await Promise.all([
        listarProjetos(db, user.uid),
        listarTarefas(db),
      ]);

      console.log(
        "[Provider] carregarDados() – recebidos:",
        lp.length,
        "projetos e",
        lt.length,
        "tarefas"
      );

      setProjetos(lp);
      setTarefas(lt);
    } catch (e) {
      console.error("[Provider] Erro ao carregar dados:", e);
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

  console.log(
    "[Provider] RENDER — projetos:",
    projetos.length,
    "| tarefas:",
    tarefas.length
  );

  // ==========================================================
  // 4) Provider exposto
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
