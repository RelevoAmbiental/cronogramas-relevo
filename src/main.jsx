import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

import { UserProvider } from "./context/UserContext";
import { CronogramaProvider } from "./context/CronogramaContext";

import "./styles/global.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <UserProvider>
      <CronogramaProvider>
        <App />
      </CronogramaProvider>
    </UserProvider>
  </React.StrictMode>
);
