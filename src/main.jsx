// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { UserProvider } from "./context/UserContext";
import { CronogramaProvider } from "./context/CronogramaContext";

import "./styles/globals.css";
import "./styles/layout.css";

import { waitForRelevoFirebase } from "./relevo-bootstrap";

waitForRelevoFirebase()
  .then(() => {
    console.log("🔥 Firebase realmente pronto — iniciando React (Cronograma).");

    ReactDOM.createRoot(document.getElementById("root")).render(
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
      "❌ Erro ao aguardar Firebase do Portal Relevo. React não será iniciado:",
      err
    );
  });
