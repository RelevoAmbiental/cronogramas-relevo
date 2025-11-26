import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth, getCurrentUserRaw } from "../services/firebase";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    // Firebase ainda não inicializou no Portal
    if (!auth) {
      console.warn("⏳ Aguardando Firebase do Portal...");
      const timer = setTimeout(() => setLoading(false), 300);
      return () => clearTimeout(timer);
    }

    // Listener unificado do Portal
    const unsubscribe = auth.onAuthStateChanged((raw) => {
      if (raw) {
        setUser({
          uid: raw.uid,
          email: raw.email,
          provider: raw.providerData?.[0]?.providerId,
        });

        // Tipo do usuário pode vir depois da consulta no Firestore
        setTipo(null);
      } else {
        setUser(null);
        setTipo(null);
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
