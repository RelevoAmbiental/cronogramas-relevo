// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { waitForRelevoFirebase } from "../relevo-bootstrap";

const UserContext = createContext();

export function UserProvider({ children }) {
  console.log("[UserProvider] MONTANDO UserProvider");

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("[UserProvider] useEffect START — aguardando bootstrap");

    // 🔥 Usa o mesmo bootstrap do CronogramaProvider.
    waitForRelevoFirebase()
      .then((res) => {
        console.log("[UserProvider] Bootstrap OK — usuário recebido:", res.user);
        setUser(res.user || null);
        setLoading(false);
      })
      .catch((err) => {
        console.error("[UserProvider] Erro no bootstrap:", err);
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
