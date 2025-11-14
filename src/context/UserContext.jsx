import { createContext, useContext, useEffect, useState } from "react";
import { db } from "../services/firebase/firestore";
import { doc, getDoc } from "firebase/firestore";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null); // gestao, colaborador, cliente
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("relevoSession");

    if (!raw) {
      setLoading(false);
      return;
    }

    const session = JSON.parse(raw);
    setUser(session);

    async function loadTipo() {
      const ref = doc(db, "users", session.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setTipo(snap.data().tipo);
      }
      setLoading(false);
    }

    loadTipo();
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
