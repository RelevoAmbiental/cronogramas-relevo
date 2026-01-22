export function getFirebase() {
  // O Portal carrega firebase compat e expõe global `firebase`
  if (!window.firebase) return null;
  return window.firebase;
}

export function getDb() {
  const fb = getFirebase();
  if (!fb?.firestore) return null;
  return fb.firestore();
}

export function getAuth() {
  const fb = getFirebase();
  if (!fb?.auth) return null;
  return fb.auth();
}
