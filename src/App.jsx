// src/App.jsx
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

import { useUser } from "./context/UserContext";


// --------------------------------------------------------
// COMPONENTE PRINCIPAL DO CRONOGRAMA (escopo isolado)
// --------------------------------------------------------
function CronogramaApp() {
  return (
    <div className="cronograma-scope">
      <Header />
      <Navegacao />
      <main className="content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/calendario" element={<CalendarView />} />
          <Route path="/importar" element={<ImportarCronograma />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}


// --------------------------------------------------------
// LÓGICA DE AUTENTICAÇÃO VIA PORTAL
// --------------------------------------------------------
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

  // 🔥 Retorna o aplicativo do cronograma isolado no wrapper
  return <CronogramaApp />;
}


// --------------------------------------------------------
// EXPORTAÇÃO FINAL — única
// --------------------------------------------------------
export default function App() {
  return (
    <Router basename="/cronograma">
      <AppContent />
    </Router>
  );
}
