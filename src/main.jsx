// ======================================================================
// src/main.jsx — Cronograma Relevo
// Integração oficial com o Portal Relevo (Firebase compat v9)
// Monta o React SOMENTE após:
//   1) Firebase do portal estar disponível
//   2) Usuário do portal estar disponível
// ======================================================================

import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { UserProvider } from "./context/UserContext";
import { CronogramaProvider } from "./context/CronogramaContext";

import "./styles/globals.css";
import "./styles/layout.css";
import "./styles/cronograma-scope.css";

// Função unificada que aguarda Firebase + User
import { bootstrapCronograma } from "./relevo-bootstrap";

// ======================================================================
// 🔥 1) Bootstrap — aguarda Firebase + Usuário do Portal
// ======================================================================
bootstrapCronograma()
  .then(({ db, auth, user }) => {
    console.log("🔥 [main.jsx] Bootstrap concluído via Portal Relevo:", {
      db,
      auth,
      user,
    });

    const rootElement = document.getElementById("root");

    if (!rootElement) {
      console.error("❌ [main.jsx] ERRO FATAL: #root não encontrado no DOM.");
      return;
    }

    // ================================================================
    // 🔥 2) Monta o React APENAS quando tudo estiver pronto
    // ================================================================
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        {/* Passa o usuário inicial fornecido pelo Portal Relevo */}
        <UserProvider initialUser={user}>
          <CronogramaProvider>
            <App />
          </CronogramaProvider>
        </UserProvider>
      </React.StrictMode>
    );
  })

  // ====================================================================
  // ❌ Falha no bootstrap (Firebase ou usuário não carregou)
  // ====================================================================
  .catch((err) => {
    console.error("❌ [main.jsx] Erro no bootstrap do Cronograma:", err);
  });
