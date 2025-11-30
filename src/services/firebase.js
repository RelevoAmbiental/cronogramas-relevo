// src/services/firebase.js

// =======================================
//  Integração Firebase via Portal Relevo
//  Usa instâncias já inicializadas no Portal
// =======================================

let app = null;
let auth = null;
let db = null;

// Estado interno de prontidão + observadores
let ready = false;
const listeners = new Set();
let warned = false;

const MAX_ATTEMPTS = 20; // tenta por ~6s antes do primeiro alerta
const RETRY_MS = 300;

// Tenta pegar tudo do namespace global exposto pelo Portal
function initFromPortal() {
  if (typeof window === "undefined") return false;

  const portalApp = window.__RELEVO_FIREBASE__;
  const portalAuth = window.__RELEVO_AUTH__;
  const portalDb = window.__RELEVO_DB__;

  if (!portalApp || !portalAuth || !portalDb) {
    return false;
  }

  app = portalApp;
  auth = portalAuth;
  db = portalDb;
  ready = true;

  console.log("✅ Firebase integrado via Portal Relevo (Cronograma).");
  listeners.forEach((cb) => cb());
  return true;
}

// Inicializa imediatamente ao importar o módulo, com re-tentativas
(function bootstrapFirebaseFromPortal() {
  let attempts = 0;

  const tryInit = () => {
    attempts += 1;
    const ok = initFromPortal();

    if (ok) {
      clearInterval(timer);
      return;
    }

    if (attempts >= MAX_ATTEMPTS && !warned) {
      console.warn("⚠️ Firebase do Portal ainda não está pronto no Cronograma.");
      warned = true;
    }
  };

  const timer = setInterval(tryInit, RETRY_MS);
  tryInit();
})();

/**
 * Indica se o Firebase já está pronto para uso dentro do Cronograma.
 * Usado pelo <App /> para exibir "Preparando ambiente Relevo…"
 */
export function isFirebaseReady() {
  return ready && !!(app && auth && db);
}

/**
 * Permite reagir assim que o Firebase do portal ficar pronto.
 */
export function onFirebaseReady(callback) {
  if (ready) {
    callback();
    return () => {};
  }

  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Exporta as referências (podem ser null se chamado cedo demais)
export { app, auth, db };
