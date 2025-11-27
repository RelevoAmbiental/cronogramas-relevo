import { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1) Tenta pegar do namespace global (portal)
    if (window.__RELEVO_USER__) {
      setUser(window.__RELEVO_USER__);
      setTipo(window.__RELEVO_USER__.tipo || null);
      setLoading(false);
      return;
    }

    // 2) Fallback para sessão persistida
    const raw = localStorage.getItem("relevoSession");

    if (raw) {
      try {
        const session = JSON.parse(raw);
        setUser(session);
        setTipo(session.tipo || null);
      } catch (err) {
        console.error("Erro ao ler relevoSession:", err);
      }
    }

    setLoading(false);
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
