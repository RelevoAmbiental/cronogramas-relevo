// src/services/firebase.js
// ==================================================================
// 🔥 Versão segura — apenas LÊ Firebase já exposto pelo Portal Relevo
// Não inicializa nada, não cria duplicatas e não força compat/modular
// ==================================================================

let app = null;
let auth = null;
let db = null;

// Para detectar quando o Portal já expôs Firebase
function tentarCarregarDoPortal() {
  if (!window.__RELEVO_FIREBASE__ ||
      !window.__RELEVO_AUTH__ ||
      !window.__RELEVO_DB__) {
    return false;
  }

  app = window.__RELEVO_FIREBASE__;
  auth = window.__RELEVO_AUTH__;
  db  = window.__RELEVO_DB__;

  return true;
}

// Tenta imediatamente
tentarCarregarDoPortal();

// API usada pelo App.jsx
export function isFirebaseReady() {
  return !!(app && auth && db);
}

// Uso interno do projeto
export { app, auth, db };
