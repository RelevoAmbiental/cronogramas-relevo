// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 alinhado com App

  useEffect(() => {
    // Se por algum motivo o auth ainda não está pronto
    if (!auth) {
      console.warn("⚠️ Auth não disponível no UserContext (Firebase não pronto).");
      setLoading(false);
      return;
    }

    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u || null);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
