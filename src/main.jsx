// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";

import App from "./App";

import { UserProvider } from "./context/UserContext";
import { CronogramaProvider } from "./context/CronogramaContext";

import "./styles/globals.css";
import "./styles/layout.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <CronogramaProvider>
      <UserProvider>
        <App />
      </UserProvider>
    </CronogramaProvider>
  </React.StrictMode>
);
