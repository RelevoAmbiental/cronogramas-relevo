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
      window.removeEventListener("relevo-firebase-ready", onReady);
      resolve(window.__RELEVO_DB__);
    };

    // ⚠️ O portal envia o evento "relevo-firebase-ready"
    window.addEventListener("relevo-firebase-ready", onReady);

    // Timeout defensivo
    setTimeout(() => {
      window.removeEventListener("relevo-firebase-ready", onReady);

      if (window.__RELEVO_DB__) {
        resolve(window.__RELEVO_DB__);
      } else {
        console.error(
          "[Relevo Bootstrap] Timeout aguardando evento relevo-firebase-ready"
        );
        reject(new Error("Timeout aguardando Firebase do Portal Relevo."));
      }
    }, timeoutMs);
  });
}

/**
 * Helper opcional
 */
export async function getRelevoDb() {
  const db = await waitForRelevoFirebase();
  return db;
}
