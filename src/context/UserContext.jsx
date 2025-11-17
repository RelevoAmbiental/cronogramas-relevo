import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null); // gestao, colaborador, cliente
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("relevoSession");

    if (!raw) {
      setLoading(false);
      return;
    }

    try {
      const session = JSON.parse(raw);
      setUser(session);
      setTipo(session.tipo || null); // 👈 Usa o tipo vindo da sessão
    } catch (err) {
      console.error("Erro ao ler relevoSession:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, tipo, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
