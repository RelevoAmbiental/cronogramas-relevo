import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

import "./styles/cronograma-scope.css";
import { bootRelevo } from "./relevo-bootstrap.js";

bootRelevo();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
