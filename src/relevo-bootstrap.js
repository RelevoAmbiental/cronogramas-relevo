// src/relevo-bootstrap.js
/**
 * Espera o Firebase do Portal Relevo ficar pronto.
 * O portal expõe:
 *   window.__RELEVO_APP__
 *   window.__RELEVO_AUTH__
 *   window.__RELEVO_DB__
 *   window.__RELEVO_USER__
 *
 * E dispara o evento:
 *   relevo-firebase-ready
 */

export function waitForRelevoFirebase(timeoutMs = 15000) {
  console.log("[Bootstrap] INICIANDO waitForRelevoFirebase()");

  return new Promise((resolve, reject) => {
    // 🔥 1) Checagem imediata
    if (
      window.__RELEVO_DB__ &&
      window.__RELEVO_AUTH__ &&
      window.__RELEVO_USER__
    ) {
      console.log("[Bootstrap] DB já existe na chegada:", window.__RELEVO_DB__);
      resolve({
        db: window.__RELEVO_DB__,
        auth: window.__RELEVO_AUTH__,
        user: window.__RELEVO_USER__,
      });
      return;
    }

    console.log("[Bootstrap] Aguardando evento relevo-firebase-ready...");

    // 🔥 2) Listener do evento
    const onReady = () => {
      console.log("[Bootstrap] EVENTO RECEBIDO → DB pronto:", window.__RELEVO_DB__);
      cleanup();
      resolve({
        db: window.__RELEVO_DB__,
        auth: window.__RELEVO_AUTH__,
        user: window.__RELEVO_USER__,
      });
    };

    window.addEventListener("relevo-firebase-ready", onReady);

    // 🔥 3) Fallback polling
    const interval = setInterval(() => {
      if (
        window.__RELEVO_DB__ &&
        window.__RELEVO_AUTH__ &&
        window.__RELEVO_USER__
      ) {
        console.log("[Bootstrap] Firebase detectado via polling.");
        cleanup();
        resolve({
          db: window.__RELEVO_DB__,
          auth: window.__RELEVO_AUTH__,
          user: window.__RELEVO_USER__,
        });
      }
    }, 200);

    // 🔥 4) Timeout
    const timeout = setTimeout(() => {
      console.error("[Bootstrap] TIMEOUT FATAL — Firebase não disponível.");
      cleanup();
      reject(new Error("Timeout aguardando Firebase do Portal Relevo."));
    }, timeoutMs);

    function cleanup() {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("relevo-firebase-ready", onReady);
    }
  });
}
