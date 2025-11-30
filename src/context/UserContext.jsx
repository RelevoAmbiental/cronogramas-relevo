// src/context/UserContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { auth, isFirebaseReady, onFirebaseReady } from "../services/firebase";

const UserContext = createContext({ user: null, loading: true });

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // 👈 alinhado com App

  useEffect(() => {
    let unsubscribeAuth = null;
    let unsubscribeReady = null;

    const startAuthListener = () => {
      if (!auth) {
        console.warn(
          "⚠️ Auth não disponível no UserContext (Firebase não pronto)."
        );
        setLoading(false);
        return;
      }

      unsubscribeAuth = auth.onAuthStateChanged((u) => {
        setUser(u || null);
        setLoading(false);
      });
    };

    if (isFirebaseReady()) {
      startAuthListener();
    } else {
      unsubscribeReady = onFirebaseReady(() => {
        startAuthListener();
      });
    }

    return () => {
      if (typeof unsubscribeAuth === "function") unsubscribeAuth();
      if (typeof unsubscribeReady === "function") unsubscribeReady();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, loading }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);

  if (!context) {
    console.warn(
      "⚠️ UserContext não encontrado. Verifique se o componente está dentro do <UserProvider>."
    );
    return { user: null, loading: true };
  }

  return context;
};
