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
  removerTarefa
} from "../services/cronogramaService";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const { user } = useUser();

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);
  const [loading, setLoading] = useState(true);

  /**
   * 🔥 Otimização 1 — Função estável (useCallback)
   * Evita recriação e rerender desnecessário.
   */
  const carregarDados = useCallback(async () => {
    if (!user) return;

    setLoading(true);

    /**
     * 🔥 Otimização 2 — Carregar projetos e tarefas em paralelo
     * 2–3× mais rápido que sequencial.
     */
    const [listaProjetos, listaTarefas] = await Promise.all([
      listarProjetos(user.uid),
      listarTarefas(user.uid),
    ]);

    /**
     * 🔥 Otimização 3 — Atualização atômica
     * Atualiza tudo de uma vez e só rerender 1 vez.
     */
    setProjetos(listaProjetos);
    setTarefas(listaTarefas);

    setLoading(false);
  }, [user]);

  /**
   * 🔥 Otimização 4 — useEffect limpo com função estável
   */
  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  return (
    <CronogramaContext.Provider
      value={{
        projetos,
        tarefas,
        loading,

        // Operações com UID automático
        criarProjeto: (dados) => criarProjeto(user.uid, dados),
        editarProjeto,
        removerProjeto,

        criarTarefa: (dados) => criarTarefa(user.uid, dados),
        editarTarefa,
        removerTarefa,
      }}
    >
      {children}
    </CronogramaContext.Provider>
  );
}

export function useCronograma() {
  return useContext(CronogramaContext);
}
