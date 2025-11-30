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

/* ============================================================
   🔥 FUNÇÃO CENTRAL — Aguarda Firebase do Portal
   ============================================================ */
function aguardarFirebasePortal() {
  return new Promise((resolve) => {
    if (window.__RELEVO_DB__ && window.__RELEVO_AUTH__) {
      return resolve();
    }
    const timer = setInterval(() => {
      if (window.__RELEVO_DB__ && window.__RELEVO_AUTH__) {
        clearInterval(timer);
        resolve();
      }
    }, 50);
  });
}

const CronogramaContext = createContext();

/* ============================================================
   🔥 PROVIDER PRINCIPAL
   ============================================================ */
export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [firebasePronto, setFirebasePronto] = useState(false);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  const [carregando, setCarregando] = useState(true);

  /* ============================================================
     1) Esperar Firebase do Portal
     ============================================================ */
  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      await aguardarFirebasePortal();

      if (!ativo) return;

      const portalDb = window.__RELEVO_DB__;
      const portalAuth = window.__RELEVO_AUTH__;

      if (!portalDb || !portalAuth) {
        console.error("❌ Firebase do Portal indisponível — erro crítico.");
        return;
      }

      setDb(portalDb);
      setAuth(portalAuth);
      setFirebasePronto(true);

      console.log("🔥 Cronograma inicializado após Firebase do Portal.");

      await carregarDados(portalDb);
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  /* ============================================================
     2) Carregar Projetos + Tarefas
     ============================================================ */
  const carregarDados = useCallback(
    async (dbRef = db) => {
      if (!dbRef) return;

      try {
        setCarregando(true);
        const listaProjetos = await listarProjetos(dbRef);
        const listaTarefas = await listarTarefas(dbRef);

        setProjetos(listaProjetos);
        setTarefas(listaTarefas);
      } catch (err) {
        console.error("❌ Erro ao carregar dados do Cronograma:", err);
      } finally {
        setCarregando(false);
      }
    },
    [db]
  );

  /* ============================================================
     3) CRUD — Projetos
     ============================================================ */
  const criarProjetoCtx = useCallback(
    async (dados) => {
      if (!db) return;
      await criarProjeto(db, dados);
      await carregarDados(db);
    },
    [db, carregarDados]
  );

  const editarProjetoCtx = useCallback(
    async (id, dados) => {
      if (!db) return;
      await editarProjeto(db, id, dados);
      await carregarDados(db);
    },
    [db, carregarDados]
  );

  const removerProjetoCtx = useCallback(
    async (id) => {
      if (!db) return;
      await removerProjeto(db, id);
      await carregarDados(db);
    },
    [db, carregarDados]
  );

  /* ============================================================
     4) CRUD — Tarefas
     ============================================================ */
  const criarTarefaCtx = useCallback(
    async (dados) => {
      if (!db) return;
      await criarTarefa(db, dados);
      await carregarDados(db);
    },
    [db, carregarDados]
  );

  const editarTarefaCtx = useCallback(
    async (id, dados) => {
      if (!db) return;
      await editarTarefa(db, id, dados);
      await carregarDados(db);
    },
    [db, carregarDados]
  );

  const removerTarefaCtx = useCallback(
    async (id) => {
      if (!db) return;
      await removerTarefa(db, id);
      await carregarDados(db);
    },
    [db, carregarDados]
  );

  /* ============================================================
     5) VALUE EXPOSTO AO APP
     ============================================================ */
  return (
    <CronogramaContext.Provider
      value={{
        firebasePronto,
        auth,
        db,
        carregando,

        projetos,
        tarefas,

        carregarDados,

        criarProjeto: criarProjetoCtx,
        editarProjeto: editarProjetoCtx,
        removerProjeto: removerProjetoCtx,

        criarTarefa: criarTarefaCtx,
        editarTarefa: editarTarefaCtx,
        removerTarefa: removerTarefaCtx,
      }}
    >
      {children}
    </CronogramaContext.Provider>
  );
}

/* ============================================================
   6) Hook de acesso ao Contexto
   ============================================================ */
export function useCronograma() {
  return useContext(CronogramaContext);
}
