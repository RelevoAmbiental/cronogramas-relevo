// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Aguarda o Firebase do PORTAL ficar pronto
  function esperarAuthDoPortal() {
    return new Promise((resolve) => {
      if (window.__RELEVO_AUTH__) return resolve(window.__RELEVO_AUTH__);

      const timer = setInterval(() => {
        if (window.__RELEVO_AUTH__) {
          clearInterval(timer);
          resolve(window.__RELEVO_AUTH__);
        }
      }, 50);
    });
  }

  useEffect(() => {
    let ativo = true;

    async function iniciar() {
      const authPortal = await esperarAuthDoPortal();

      if (!ativo) return;

      if (!authPortal) {
        console.error("❌ Erro crítico: Auth do Portal não carregou.");
        setLoading(false);
        return;
      }

      const unsubscribe = authPortal.onAuthStateChanged((u) => {
        if (!ativo) return;
        setUser(u || null);
        setLoading(false);
      });

      return () => unsubscribe();
    }

    iniciar();

    return () => {
      ativo = false;
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
