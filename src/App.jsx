import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";

import Dashboard from "./components/Dashboard/Dashboard";
import Projetos from "./components/Projetos/Projetos";
import Tarefas from "./components/Tarefas/Tarefas";
import CalendarView from "./components/Calendar/CalendarView";

import ImportarCronograma from "./components/Importador/ImportarCronograma";
import { useUser } from "./context/UserContext";

export default function App() {
  const { user, loading } = useUser();

  if (loading) return <p>Carregando sessão…</p>;
  if (!user) return <p>Acesso negado. Faça login pelo Portal.</p>;

  return (
    <Router>
      {/* 🔥 Barra premium, fixa e única */}
      <Header />

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
    </Router>
  );
}
