import { createContext, useContext, useEffect, useState } from "react";
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

/* ============================================================
   🔥 1) ESPERA O FIREBASE DO PORTAL ESTAR PRONTO
   ============================================================ */
function aguardarFirebasePortal() {
  return new Promise((resolve) => {
    // Se já estiver pronto → resolve imediatamente
    if (window.__RELEVO_DB__ && window.__RELEVO_AUTH__) {
      return resolve();
    }

    // Caso contrário, checa a cada 50ms
    const timer = setInterval(() => {
      if (window.__RELEVO_DB__ && window.__RELEVO_AUTH__) {
        clearInterval(timer);
        resolve();
      }
    }, 50);
  });
}

/* ============================================================
   CONTEXTO DO CRONOGRAMA
   ============================================================ */
const CronogramaContext = createContext();

export function useCronograma() {
  return useContext(CronogramaContext);
}

export function CronogramaProvider({ children }) {
  const [firebasePronto, setFirebasePronto] = useState(false);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [carregando, setCarregando] = useState(true);

  /* ============================================================
     🔥 2) INICIALIZA APÓS O PORTAL
     ============================================================ */
  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      console.log("⏳ Aguardando Firebase do Portal...");
      await aguardarFirebasePortal(); // 🔥 Evita warnings

      if (!ativo) return;

      const authPortal = window.__RELEVO_AUTH__;
      const dbPortal = window.__RELEVO_DB__;

      if (!authPortal || !dbPortal) {
        console.error("❌ Erro crítico: Firebase deveria estar pronto aqui.");
        return;
      }

      setAuth(authPortal);
      setDb(dbPortal);
      setFirebasePronto(true);

      console.log("🔥 Cronograma inicializado após Firebase do Portal.");

      await carregarDados();
    }

    iniciar();
    return () => { ativo = false; };
  }, []);

  /* ============================================================
     🔄 3) CARREGAR PROJETOS + TAREFAS
     ============================================================ */
  async function carregarDados() {
    try {
      setCarregando(true);
      const listaProjetos = await listarProjetos();
      const listaTarefas = await listarTarefas();

      setProjetos(listaProjetos);
      setTarefas(listaTarefas);
    } catch (err) {
      console.error("Erro carregando dados do Cronograma:", err);
    } finally {
      setCarregando(false);
    }
  }

  /* ============================================================
     🟩 4) CRUD — PROJETOS
     ============================================================ */
  async function adicionarProjeto(data) {
    await criarProjeto(data);
    await carregarDados();
  }

  async function atualizarProjeto(id, data) {
    await editarProjeto(id, data);
    await carregarDados();
  }

  async function deletarProjeto(id) {
    await removerProjeto(id);
    await carregarDados();
  }

  /* ============================================================
     🟦 5) CRUD — TAREFAS
     ============================================================ */
  async function adicionarTarefa(data) {
    await criarTarefa(data);
    await carregarDados();
  }

  async function atualizarTarefa(id, data) {
    await editarTarefa(id, data);
    await carregarDados();
  }

  async function deletarTarefa(id) {
    await removerTarefa(id);
    await carregarDados();
  }

  /* ============================================================
     📦 6) VALORES DO CONTEXTO
     ============================================================ */
  const value = {
    firebasePronto,
    auth,
    db,

    projetos,
    tarefas,
    carregando,

    adicionarProjeto,
    atualizarProjeto,
    deletarProjeto,

    adicionarTarefa,
    atualizarTarefa,
    deletarTarefa,
  };

  return (
    <CronogramaContext.Provider value={value}>
      {children}
    </CronogramaContext.Provider>
  );
}
