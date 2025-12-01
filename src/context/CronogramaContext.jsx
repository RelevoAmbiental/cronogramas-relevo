// src/context/CronogramaContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
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

  // ================================================================
  // 1) Aguardar Firebase do Portal — (CORREÇÃO CRÍTICA)
  // ================================================================
  useEffect(() => {
    async function init() {
      try {
        const dbPortal = await waitForRelevoFirebase(); // ← Firebase correto
        setDb(dbPortal);
      } catch (err) {
        console.error("Erro ao inicializar Firebase no CronogramaContext:", err);
      }
    }

    init();
  }, []);

  // ================================================================
  // 2) Carregar dados (projetos + tarefas)
  // ================================================================
  const carregarDados = useCallback(async () => {
    if (!db) return;

    try {
      setCarregando(true);

      const lp = await listarProjetos(db, user?.uid);
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
