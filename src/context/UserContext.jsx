// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { bootstrapCronograma } from "../relevo-bootstrap";

const UserContext = createContext();

export function UserProvider({ children, initialUser }) {
  console.log("[UserProvider] MONTANDO UserProvider — initialUser:", initialUser);

  // Se o portal já enviou o usuário, começamos com ele
  const [user, setUser] = useState(initialUser || null);
  const [loading, setLoading] = useState(!initialUser);

  useEffect(() => {
    // Case 1: usuário já veio pronto do main.jsx
    if (initialUser) {
      console.log("[UserProvider] Usuário já fornecido pelo Portal:", initialUser);
      setUser(initialUser);
      setLoading(false);
      return;
    }

    // Case 2: usuário ainda não existe → aguardar Portal
    console.log("[UserProvider] Aguardando usuário via bootstrapCronograma()…");

    bootstrapCronograma()
      .then((res) => {
        console.log("[UserProvider] Bootstrap OK — usuário recebido (BRUTO):", res.user);

        const raw = res.user;

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
