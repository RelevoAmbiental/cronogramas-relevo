import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth } from "../services/firebase";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null); // reservado para futura regra per-user
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    // Firebase ainda não inicializou no Portal
    if (!auth) {
      console.warn("⏳ Aguardando Firebase do Portal…");
      const t = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(t);
    }

    // Listener unificado baseado na sessão real do Firebase
    const unsubscribe = auth.onAuthStateChanged((raw) => {
      if (raw) {
        setUser({
          uid: raw.uid,
          email: raw.email,
          provider: raw.providerData?.[0]?.providerId,
        });
      } else {
        setUser(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
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
