// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { UserProvider } from "./context/UserContext";
import { CronogramaProvider } from "./context/CronogramaContext";

import "./styles/globals.css";
import "./styles/layout.css";

import { waitForRelevoFirebase } from "./relevo-bootstrap";

// ===========================================================
// 🔥 1) Aguarda o Firebase do portal ANTES de montar o React
// ===========================================================
waitForRelevoFirebase()
  .then((db) => {
    console.log("🔥 [main.jsx] Firebase pronto via bootstrap:", db);

    const rootElement = document.getElementById("root");
    if (!rootElement) {
      console.error("❌ [main.jsx] ERRO FATAL: #root não encontrado no DOM.");
      return;
    }

    // ===========================================================
    // 🔥 2) Aqui sim montamos o React com segurança
    // ===========================================================
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <UserProvider>
          <CronogramaProvider>
            <App />
          </CronogramaProvider>
        </UserProvider>
      </React.StrictMode>
    );
  })
  .catch((err) => {
    console.error(
      "❌ [main.jsx] Erro esperando Firebase do Portal Relevo:",
      err
    );
  });
