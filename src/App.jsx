import React from "react";
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
import { isFirebaseReady } from "./services/firebase";

function AppContent() {
  const { user, loading } = useUser();

  if (loading) return <p>Carregando sessão…</p>;
  if (!user) return <p>Acesso negado. Faça login pelo Portal.</p>;

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
  // Garante que o Portal já inicializou o Firebase
  if (!isFirebaseReady()) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h3>Preparando ambiente Relevo…</h3>
      </div>
    );
  }

  return (
    <UserProvider>
      <Router basename="/cronograma">
        <AppContent />
      </Router>
    </UserProvider>
  );
}
