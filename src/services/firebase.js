// src/services/firebase.js
// ===========================================================
// 🔥 Integração Firebase via Portal Relevo
// VersãoVALIDA — exporta app/auth/db corretamente
// ===========================================================

let app = null;
let auth = null;
let db = null;

let ready = false;
const listeners = new Set();

function tentarInicializar() {
  if (typeof window === "undefined") return false;

  const portal = window.__RELEVO_FIREBASE__;
  const portalAuth = window.__RELEVO_AUTH__;
  const portalDb = window.__RELEVO_DB__;

  if (!portal || !portalAuth || !portalDb) {
    return false;
  }

  app = portal;
  auth = portalAuth;
  db = portalDb;

  ready = true;
  console.log("✅ Firebase integrado via Portal (cronograma)");

  listeners.forEach((cb) => cb());
  return true;
}

// Tenta inicializar repetidamente (até 6s)
(function bootstrap() {
  let tentativas = 0;
  const limite = 20;

  const id = setInterval(() => {
    tentativas++;
    if (tentarInicializar()) {
      clearInterval(id);
      return;
    }

    if (tentativas === limite) {
      console.warn("⚠️ Firebase do Portal ainda não disponível.");
    }
  }, 300);

  tentarInicializar();
})();

export function isFirebaseReady() {
  return ready && app && auth && db;
}

export function onFirebaseReady(cb) {
  if (ready) {
    cb();
  } else {
    listeners.add(cb);
  }
}

export { app, auth, db };
