// src/services/firebase.js

// ===========================================================
//  Integração Firebase via Portal Relevo
//  NÃO inicializa automaticamente.
//  SOMENTE fornece funções utilitárias
//  O CronogramaProvider controla o momento de inicializar.
// ===========================================================

export function obterFirebaseDoPortal() {
  if (typeof window === "undefined") return null;

  const portalApp = window.__RELEVO_FIREBASE__;
  const portalAuth = window.__RELEVO_AUTH__;
  const portalDb = window.__RELEVO_DB__;

  if (!portalApp || !portalAuth || !portalDb) {
    return null;
  }

  return {
    app: portalApp,
    auth: portalAuth,
    db: portalDb,
  };
}

// Apenas helper opcional — não usado mais no App
export function isFirebaseReady() {
  const fb = obterFirebaseDoPortal();
  return !!fb;
}
