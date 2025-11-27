import { createContext, useContext, useEffect, useState } from "react";
import { getAuth, getCurrentUserRaw } from "../services/firebase";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tipo, setTipo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();

    // Caso raro: Firebase ainda não pronto
    if (!auth) {
      const raw = getCurrentUserRaw();
      if (raw) {
        setUser({
          uid: raw.uid,
          email: raw.email,
          provider: raw.provider || raw.providerId || null,
        });
        setTipo(raw.tipo || null);
      }
      setLoading(false);
      return;
    }

    // Listener oficial da sessão
    const unsubscribe = auth.onAuthStateChanged((raw) => {
      if (raw) {
        setUser({
          uid: raw.uid,
          email: raw.email,
          provider: raw.providerData?.[0]?.providerId || null,
        });
      } else {
        setUser(null);
      }
      setTipo(null); // reservado pra uso futuro (gestão/colaborador/cliente)
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
