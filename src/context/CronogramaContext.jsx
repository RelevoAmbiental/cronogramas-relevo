import { createContext, useContext, useEffect, useState } from "react";
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

  // Carregar dados
  useEffect(() => {
    if (!user) return;

    async function carregar() {
      setLoading(true);

      const listaProjetos = await listarProjetos(user.uid);
      const listaTarefas = await listarTarefas(user.uid);

      setProjetos(listaProjetos);
      setTarefas(listaTarefas);
      setLoading(false);
    }

    carregar();
  }, [user]);

  return (
    <CronogramaContext.Provider
      value={{
        projetos,
        tarefas,
        loading,

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
