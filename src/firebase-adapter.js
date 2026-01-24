// src/firebase-adapter.js
// Adapter para usar o Firebase já inicializado pelo Portal (compat).
// Garante exports estáveis para o resto do app.

export function getFirebaseCompat() {
  const fb = window.firebase;
  if (!fb) throw new Error("Firebase compat não encontrado em window.firebase.");
  return fb;
}

export function getAuth() {
  const fb = getFirebaseCompat();
  if (!fb.auth) throw new Error("firebase.auth() não disponível (compat).");
  return fb.auth();
}

export function getFirestore() {
  const fb = getFirebaseCompat();
  if (!fb.firestore) throw new Error("firebase.firestore() não disponível (compat).");
  return fb.firestore();
}

export function getCurrentUser() {
  const auth = getAuth();
  return auth.currentUser;
}

export function onAuthStateChanged(callback) {
  const auth = getAuth();
  return auth.onAuthStateChanged(callback);
}
