import React from "react";
import { BrowserRouter, Routes, Route, Link, Navigate } from "react-router-dom";
import Projetos from "./pages/Projetos";
import Tarefas from "./pages/Tarefas";

function Shell({ title, children }) {
  return (
    <div className="cronograma-scope">
      <header className="crono-topbar">
        <div className="crono-brand">
          <span className="crono-badge">R</span>
          <div>
            <div className="crono-title">Cronogramas</div>
            <div className="crono-subtitle">Portal Relevo</div>
          </div>
        </div>

        <nav className="crono-nav">
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/projetos">Projetos</Link>
          <Link to="/tarefas">Tarefas</Link>
          <Link to="/importar">Importar</Link>
          <Link to="/calendario">Calendário</Link>
        </nav>
      </header>

      <main className="crono-main">
        <h1 className="crono-page-title">{title}</h1>
        <div className="crono-card">{children}</div>
      </main>
    </div>
  );
}

function Placeholder({ name }) {
  return (
    <div>
      <p>
        <strong>{name}</strong> (motor v2) — tela em construção.
      </p>
      <p>Próximo passo: conectar Firebase (herdado do Portal), modelo de dados e permissões.</p>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter basename="/cronograma">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route
          path="/dashboard"
          element={
            <Shell title="Dashboard">
              <Placeholder name="Dashboard" />
            </Shell>
          }
        />

        <Route
          path="/projetos"
          element={
            <Shell title="Projetos">
              <Projetos />
            </Shell>
          }
        />

        <Route
          path="/tarefas"
          element={
            <Shell title="Tarefas">
              <Tarefas />
            </Shell>
          }
        />

        <Route
          path="/importar"
          element={
            <Shell title="Importar">
              <Placeholder name="Importar IA" />
            </Shell>
          }
        />
        <Route
          path="/calendario"
          element={
            <Shell title="Calendário">
              <Placeholder name="Calendário" />
            </Shell>
          }
        />

        <Route
          path="*"
          element={
            <Shell title="404">
              <p>Rota não encontrada.</p>
            </Shell>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
