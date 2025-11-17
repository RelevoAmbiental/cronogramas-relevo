import { createContext, useContext, useState } from "react";

const CronogramaContext = createContext();

export function CronogramaProvider({ children }) {
  const [projetos, setProjetos] = useState([]);
  const [tarefas, setTarefas] = useState([]);

  return (
    <CronogramaContext.Provider
      value={{
        projetos,
        tarefas,
        setProjetos,
        setTarefas
      }}
    >
      {children}
    </CronogramaContext.Provider>
  );
}

export function useCronograma() {
  return useContext(CronogramaContext);
}
