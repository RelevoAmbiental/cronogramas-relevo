// src/router.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./components/Dashboard/Dashboard";
import Projetos from "./components/Projetos/Projetos";
import Tarefas from "./components/Tarefas/Tarefas";
import Calendar from "./components/Calendar/Calendar";
import ImportarCronograma from "./components/Importador/ImportarCronograma";

import Navegacao from "./components/Navegacao/Navegacao";

export default function AppRouter() {
  return (
    <BrowserRouter basename="/cronograma">
      <Navegacao />

      <div className="page-container">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projetos" element={<Projetos />} />
          <Route path="/tarefas" element={<Tarefas />} />
          <Route path="/calendario" element={<Calendar />} />
          <Route path="/importar" element={<ImportarCronograma />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}
