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

import { bootstrapCronograma } from "../relevo-bootstrap";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  console.log("[Provider] MONTANDO CronogramaProvider");

  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ==========================================================
  // 1) Inicializa o Firestore via bootstrap (mantém v10 interno)
  // ==========================================================
  useEffect(() => {
    console.log("[Provider] useEffect START — aguardando bootstrapCronograma");

    bootstrapCronograma()
      .then(({ db }) => {
        console.log("[Provider] DB DEFINIDO via bootstrap:", db);
        setDb(db);
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

    if (!db || !user) {
      console.warn("[Provider] carregarDados abortado — db ou user indisponível");
      return;
    }

    try {
      setCarregando(true);

      const [lp, lt] = await Promise.all([
        listarProjetos(db, user.uid), // ← assinatura correta
        listarTarefas(db),            // ← assinatura correta
      ]);

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
  // 3) CRUDs expostos — preservando assinatura correta
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
