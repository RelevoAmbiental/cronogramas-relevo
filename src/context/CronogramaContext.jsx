// src/context/CronogramaContext.jsx
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useUser } from "./UserContext";
import { waitForRelevoFirebase } from "../relevo-bootstrap";

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

  const [db, setDb] = useState(null);
  const [carregando, setCarregando] = useState(true);

  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  // 🔥 1) Inicializar SOMENTE via relevo-bootstrap
  useEffect(() => {
    waitForRelevoFirebase().then((dbPortal) => {
      setDb(dbPortal);
    });
  }, []);

  // 🔥 2) Carregar dados quando db e user estiverem prontos
  const carregarDados = useCallback(async () => {
    if (!db || !user) return;
    try {
      setCarregando(true);

      const [lp, lt] = await Promise.all([
        listarProjetos(db, user.uid),
        listarTarefas(db)
      ]);

      setProjetos(lp);
      setTarefas(lt);
    } finally {
      setCarregando(false);
    }
  }, [db, user]);

  useEffect(() => {
    carregarDados();
  }, [carregarDados]);

  // 🔥 3) Expor API limpa
  return (
    <CronogramaContext.Provider
      value={{
        carregando,
        projetos,
        tarefas,
        criarProjeto: (d) => criarProjeto(db, { ...d, uid: user.uid }).then(carregarDados),
        editarProjeto: (id, d) => editarProjeto(db, id, d).then(carregarDados),
        removerProjeto: (id) => removerProjeto(db, id).then(carregarDados),
        criarTarefa: (d) => criarTarefa(db, d).then(carregarDados),
        editarTarefa: (id, d) => editarTarefa(db, id, d).then(carregarDados),
        removerTarefa: (id) => removerTarefa(db, id).then(carregarDados),
        atualizar: carregarDados
      }}
    >
      {children}
    </CronogramaContext.Provider>
  );
}

export function useCronograma() {
  return useContext(CronogramaContext);
}
