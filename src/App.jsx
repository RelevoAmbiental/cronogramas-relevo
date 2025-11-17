import React from "react";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import { useUser } from "./context/UserContext";

export default function App() {
  const { user, tipo, loading } = useUser();

  if (loading) return <div>Carregando sessão…</div>;
  if (!user) return <div>Acesso negado. Faça login pelo Portal.</div>;
  if (tipo !== "gestao") return <div>Permissão negada. Apenas Gestão tem acesso.</div>;

  return (
    <div className="layout">
      <Header />
      <main className="content">
        <h1>Cronogramas Relevo</h1>
        <p>Sessão validada com sucesso!</p>
      </main>
      <Footer />
    </div>
  );
}
