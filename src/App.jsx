import React from "react";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import Projetos from "./pages/Projetos";
import Tarefas from "./pages/Tarefas";

/**
 * Shell (limpo)
 * - Remove topbar/nav internos do React
 * - Mantém apenas um wrapper de escopo e um container simples
 * - A navegação (sidebar/drawer) e layout geral ficam no Portal (container externo)
 */
function Shell({ title, children }) {
  return (
    <div className="cronograma-scope">
      <main className="crono-main">
        {title ? <h1 className="crono-page-title">{title}</h1> : null}
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
      <p>
        Próximo passo: conectar Firebase (herdado do Portal), modelo de dados e
        permissões.
      </p>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
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
    </HashRouter>
  );
}
