import React from "react";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import "./styles/layout.css";

export default function App() {
  return (
    <div className="layout">
      <Header />

      <main className="content">
        <h1>Cronogramas Relevo</h1>
        <p>Aplicação inicial pronta para integração.</p>
      </main>

      <Footer />
    </div>
  );
}
