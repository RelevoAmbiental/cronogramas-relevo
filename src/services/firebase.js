// src/services/firebase.js

// =======================================
//  Integração Firebase via Portal Relevo
//  Usa instâncias já inicializadas no Portal
// =======================================

let app = null;
let auth = null;
let db = null;

// Tenta pegar tudo do namespace global exposto pelo Portal
function initFromPortal() {
  if (typeof window === "undefined") return false;

  const portalApp = window.__RELEVO_FIREBASE__;
  const portalAuth = window.__RELEVO_AUTH__;
  const portalDb = window.__RELEVO_DB__;

  if (!portalApp || !portalAuth || !portalDb) {
    console.warn("⚠️ Firebase do Portal ainda não está pronto no Cronograma.");
    return false;
  }

  app = portalApp;
  auth = portalAuth;
  db = portalDb;

  console.log("✅ Firebase integrado via Portal Relevo (Cronograma).");
  return true;
}

// Inicializa imediatamente ao importar o módulo
initFromPortal();

/**
 * Indica se o Firebase já está pronto para uso dentro do Cronograma.
 * Usado pelo <App /> para exibir "Preparando ambiente Relevo…"
 */
export function isFirebaseReady() {
  return !!(app && auth && db);
}

// Exporta as referências (podem ser null se chamado cedo demais)
export { app, auth, db };
