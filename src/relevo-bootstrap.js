// src/relevo-bootstrap.js

/**
 * Aguarda o Firebase do Portal Relevo ficar pronto
 * (inicializado pelo firebase-init-guard.js)
 */
export function waitForRelevoFirebase(timeoutMs = 15000) {
  // Se já estiver pronto, devolve direto
  if (window.__RELEVO_DB__) {
    return Promise.resolve(window.__RELEVO_DB__);
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      document.removeEventListener("RELEVO_FIREBASE_READY", onReady);
      resolve(window.__RELEVO_DB__);
    };

    document.addEventListener("RELEVO_FIREBASE_READY", onReady);

    // Timeout defensivo para evitar travar eternamente
    setTimeout(() => {
      document.removeEventListener("RELEVO_FIREBASE_READY", onReady);
      if (window.__RELEVO_DB__) {
        resolve(window.__RELEVO_DB__);
      } else {
        console.error(
          "[Relevo Bootstrap] Timeout aguardando RELEVO_FIREBASE_READY. Verificar firebase-init-guard.js no portal."
        );
        reject(new Error("Timeout aguardando Firebase do Portal Relevo."));
      }
    }, timeoutMs);
  });
}

/**
 * Helper opcional, caso você queira pegar o DB direto dentro de algum módulo.
 */
export async function getRelevoDb() {
  const db = await waitForRelevoFirebase();
  return db;
}
