// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ativo = true;

    function sincronizarUsuario() {
      if (!ativo) return;

      const u = window.__RELEVO_USER__;

      // Caso o portal ainda não tenha carregado o estado do usuário
      if (u === undefined) return;

      setUser(u || null);
      setLoading(false);
    }

    // 🔥 Tenta imediatamente
    sincronizarUsuario();

    // 🔥 Observa o Portal até expor o usuário
    const interval = setInterval(() => {
      if (window.__RELEVO_USER__ !== undefined) {
        sincronizarUsuario();
        clearInterval(interval);
      }
    }, 50);

    return () => {
      ativo = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
