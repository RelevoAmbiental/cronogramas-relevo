// ============================================
//  Firebase Gateway — Cronogramas Relevo
//  Usa SOMENTE a instância exposta pelo Portal
// ============================================

// App herdado do Portal
export function getFirebaseApp() {
  return window.__RELEVO_FIREBASE__ || null;
}

// Auth herdado do Portal
export function getAuth() {
  if (window.__RELEVO_AUTH__) return window.__RELEVO_AUTH__;

  const app = getFirebaseApp();
  if (app && typeof app.auth === "function") {
    return app.auth();
  }

  return null;
}

// Firestore herdado do Portal
export function getFirestore() {
  if (window.__RELEVO_DB__) return window.__RELEVO_DB__;

  const app = getFirebaseApp();
  if (app && typeof app.firestore === "function") {
    return app.firestore();
  }

  return null;
}

// Usuário bruto exposto pelo Portal
export function getCurrentUserRaw() {
  return window.__RELEVO_USER__ || null;
}

// Verifica se o Firebase já foi inicializado pelo Portal
export function isFirebaseReady() {
  return !!getFirebaseApp();
}
