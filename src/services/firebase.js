// src/services/firebase.js
// Integração com Firebase exposto pelo Portal via window.__RELEVO_FIREBASE__

let app = null;
let auth = null;
let db = null;

let ready = false;
const listeners = new Set();

function tentarInicializar() {
  if (typeof window === "undefined") return false;

  const portalApp = window.__RELEVO_FIREBASE__;
  const portalAuth = window.__RELEVO_AUTH__;
  const portalDb = window.__RELEVO_DB__;

  if (!portalApp || !portalAuth || !portalDb) return false;

  app = portalApp;
  auth = portalAuth;
  db = portalDb;

  ready = true;
  listeners.forEach((cb) => cb({ app, auth, db }));

  console.log("🔥 Firebase integrado com sucesso via Guard (Cronograma).");
  return true;
}

// Tenta inicializar a cada 200ms (até 20 tentativas)
(function initLoop() {
  let tentativas = 0;
  const max = 20;

  const timer = setInterval(() => {
    tentativas++;
    if (tentarInicializar()) {
      clearInterval(timer);
    } else if (tentativas >= max) {
      console.warn(
        "⚠️ Firebase do Portal ainda não disponível para o Cronograma."
      );
      clearInterval(timer);
    }
  }, 200);
})();

export function getFirebase() {
  return { app, auth, db };
}

export function isFirebaseReady() {
  return ready && !!db && !!auth;
}

export function onFirebaseReady(callback) {
  if (ready) {
    callback({ app, auth, db });
    return () => {};
  }
  listeners.add(callback);
  return () => listeners.delete(callback);
}

export { app, auth, db };
