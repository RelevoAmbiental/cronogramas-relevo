import React, { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../services/firebase";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setReady(true);
    });

    return () => unsub();
  }, []);

  return (
    <UserContext.Provider value={{ user, ready }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
