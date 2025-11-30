// =======================================================================
//  FIREBASE SERVICE – Cronograma Relevo
//  Integração 100% sincronizada com Firebase já inicializado no PORTAL.
// =======================================================================

// Referências internas (inicialmente nulas)
let app = null;
let auth = null;
let db = null;

// Estado de prontidão
let ready = false;
const listeners = new Set();

/**
 * Aguarda o Portal inicializar o Firebase.
 * O Portal expõe:
 *   window.__RELEVO_FIREBASE__
 *   window.__RELEVO_AUTH__
 *   window.__RELEVO_DB__
 */
function tentarSincronizarComPortal() {
  if (!window) return false;

  const portalApp  = window.__RELEVO_FIREBASE__;
  const portalAuth = window.__RELEVO_AUTH__;
  const portalDb   = window.__RELEVO_DB__;

  if (!portalApp || !portalAuth || !portalDb) return false;

  app = portalApp;
  auth = portalAuth;
  db = portalDb;
  ready = true;

  console.log("🔥 Cronograma: Firebase sincronizado via Portal.");

  // Notifica todos os listeners aguardando
  listeners.forEach((fn) => fn());
  listeners.clear();

  return true;
}

/**
 * Inicialização automática com retentativas
 * (resolve race conditions de carregamento entre Portal e Cronograma)
 */
(function bootstrapFirebase() {
  let tentativas = 0;
  const MAX = 40; // tenta por ~5s

  const tryInit = () => {
    tentativas++;

    // Se sincronizou, para
    if (tentarSincronizarComPortal()) {
      clearInterval(timer);
      return;
    }

    // Logging moderado
    if (tentativas === 10) {
      console.warn("⏳ Cronograma aguardando Firebase do Portal…");
    }
  };

  const timer = setInterval(tryInit, 125);
  tryInit();
})();

/**
 * Retorna true quando Firebase está pronto.
 */
export function isFirebaseReady() {
  return ready && db !== null && auth !== null;
}

/**
 * Aguarda a prontidão do Firebase.
 */
export function onFirebaseReady(callback) {
  if (isFirebaseReady()) {
    callback();
    return () => {};
  }

  listeners.add(callback);
  return () => listeners.delete(callback);
}

// Exporte referências
export { app, auth, db };
