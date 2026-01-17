import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { useUser } from "./context/UserContext";
import AppShell from "./components/AppShell";

import Dashboard from "./pages/Dashboard";
import Projetos from "./pages/Projetos";
import Tarefas from "./pages/Tarefas";
import Calendario from "./pages/Calendario";
import Importar from "./pages/Importar";

function Gate() {
  const { user, loading } = useUser();

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <p>Carregando sessão…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: 24 }}>
        <p>
          Acesso negado. Faça login pelo Portal Relevo e depois volte para o
          Cronograma.
        </p>
      </div>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/projetos" element={<Projetos />} />
        <Route path="/tarefas" element={<Tarefas />} />
        <Route path="/calendario" element={<Calendario />} />
        <Route path="/importar" element={<Importar />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/cronograma">
      <Gate />
    </BrowserRouter>
  );
}
