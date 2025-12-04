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
  console.log("[CronogramaProvider] MONTANDO");

  const { user } = useUser();

  const [carregando, setCarregando] = useState(true);
  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // ==========================================================
  // 1) Carregar dados quando o USER estiver pronto
  //    (DB vem do Portal via window.__RELEVO_DB__ no service)
  // ==========================================================
  const carregarDados = useCallback(async () => {
    console.log("[CronogramaProvider] carregarDados() CHAMADO", {
      temUser: !!user,
      uid: user?.uid,
    });

    if (!user || !user.uid) {
      console.warn(
        "[CronogramaProvider] carregarDados abortado — user/uid indisponível:",
        user
      );
      return;
    }

    try {
      setCarregando(true);

      const [lp, lt] = await Promise.all([
        listarProjetos(user.uid), // ✅ agora passa só o UID string
        listarTarefas(),          // ✅ sem parâmetros
      ]);

      console.log(
        "[CronogramaProvider] Dados recebidos:",
        lp.length,
        "projetos e",
        lt.length,
        "tarefas"
      );

      setProjetos(lp);
      setTarefas(lt);
    } catch (e) {
      console.error("[CronogramaProvider] Erro ao carregar dados:", e);
    } finally {
      setCarregando(false);
    }
  }, [user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // ==========================================================
  // 2) CRUDs expostos — usando sempre os services
  // ==========================================================
  const criarProjetoCtx = async (dados) => {
    if (!user || !user.uid) {
      console.warn("[CronogramaProvider] criarProjeto abortado — sem user.uid");
      return;
    }

    await criarProjeto({ ...dados, uid: user.uid });
    await carregarDados();
  };

  const editarProjetoCtx = async (id, dados) => {
    await editarProjeto(id, dados);
    await carregarDados();
  };

  const removerProjetoCtx = async (id) => {
    await removerProjeto(id);
    await carregarDados();
  };

  const criarTarefaCtx = async (dados) => {
    await criarTarefa(dados);
    await carregarDados();
  };

  const editarTarefaCtx = async (id, dados) => {
    await editarTarefa(id, dados);
    await carregarDados();
  };

  const removerTarefaCtx = async (id) => {
    await removerTarefa(id);
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
