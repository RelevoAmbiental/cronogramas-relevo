import React, { createContext, useContext, useEffect, useState } from "react";
import { getAuth } from "../services/firebase";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    if (!auth) {
      console.warn("⏳ Aguardando Firebase do Portal…");
      const t = setTimeout(() => setLoading(false), 200);
      return () => clearTimeout(t);
    }

    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser({
          uid: u.uid,
          email: u.email,
          provider: u.providerData?.[0]?.providerId,
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsub();
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
