// src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import Navegacao from "./components/Navegacao/Navegacao";

import Dashboard from "./components/Dashboard/Dashboard";
import Projetos from "./components/Projetos/Projetos";
import Tarefas from "./components/Tarefas/Tarefas";
import CalendarView from "./components/Calendar/CalendarView";
import ImportarCronograma from "./components/Importador/ImportarCronograma";

import { UserProvider, useUser } from "./context/UserContext";
import { CronogramaProvider } from "./context/CronogramaContext";
import { isFirebaseReady, onFirebaseReady } from "./services/firebase";

function AppContent() {
  const { user, loading } = useUser();

  if (loading) {
    return <p style={{ padding: "20px" }}>Carregando sessão…</p>;
  }

  if (!user) {
    return (
      <p style={{ padding: "20px" }}>
        Acesso negado. Faça login pelo Portal Relevo.
      </p>
    );
  }

  return (
    <>
      <Header />
      <Navegacao />
      <main className="content" style={{ padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/calendario" element={<CalendarView />} />
          <Route path="/importar" element={<ImportarCronograma />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  const [portalReady, setPortalReady] = useState(isFirebaseReady());

  useEffect(() => {
    if (portalReady) return undefined;

    const unsubscribe = onFirebaseReady(() => setPortalReady(true));
    return unsubscribe;
  }, [portalReady]);

  if (!portalReady) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Preparando ambiente Relevo…</h3>
        <p style={{ marginTop: "8px", color: "#666" }}>
          Estamos aguardando o Portal inicializar o Firebase.
        </p>
      </div>
    );
  }

  return (
    <UserProvider>
      <CronogramaProvider>
        <Router basename="/cronograma">
          <AppContent />
        </Router>
      </CronogramaProvider>
    </UserProvider>
  );
}
