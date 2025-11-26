// ============================================
//  Firebase Bridge — Cronograma Relevo
//  Usa a instância inicializada pelo Portal
// ============================================

export function getFirebaseApp() {
  return window.__RELEVO_FIREBASE__ || null;
}

export function getAuth() {
  return window.__RELEVO_AUTH__ || null;
}

export function getFirestore() {
  return window.__RELEVO_DB__ || null;
}

export function getCurrentUserRaw() {
  return window.__RELEVO_USER__ || null;
}

export function isFirebaseReady() {
  return Boolean(window.__RELEVO_FIREBASE__);
}
