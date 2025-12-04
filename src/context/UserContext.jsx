// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { bootstrapCronograma } from "../relevo-bootstrap";

const UserContext = createContext();

export function UserProvider({ children }) {
  console.log("[UserProvider] MONTANDO UserProvider");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[UserProvider] useEffect START — aguardando bootstrapCronograma");

    bootstrapCronograma()
      .then((res) => {
        console.log("[UserProvider] Bootstrap OK — usuário recebido (BRUTO):", res.user);

        const raw = res.user;

        // ===============================================================
        // 🔥 MANTIDA sua normalização PADRÃO (versão original)
        // ===============================================================
        const safeUser = raw
          ? {
              uid: raw.uid || null,
              email: raw.email || null,
            }
          : null;

        console.log("[UserProvider] Usuário NORMALIZADO:", safeUser);

        setUser(safeUser);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[UserProvider] Erro no bootstrapCronograma:", err);
        setLoading(false);
      });
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
