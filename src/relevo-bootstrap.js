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
  return new Promise((resolve, reject) => {
    console.log("[Bootstrap] Aguardando Firebase do Portal...");

    // 🔥 1) Se já está tudo disponível, devolve na hora
    if (
      window.__RELEVO_DB__ &&
      window.__RELEVO_AUTH__ &&
      window.__RELEVO_USER__
    ) {
      console.log("[Bootstrap] Firebase já encontrado (startup imediato).");
      resolve({
        db: window.__RELEVO_DB__,
        auth: window.__RELEVO_AUTH__,
        user: window.__RELEVO_USER__,
      });
      return;
    }

    // 🔥 2) Listener para o portal
    const onReady = () => {
      console.log("[Bootstrap] Evento relevo-firebase-ready recebido.");
      cleanup();
      resolve({
        db: window.__RELEVO_DB__,
        auth: window.__RELEVO_AUTH__,
        user: window.__RELEVO_USER__,
      });
    };

    window.addEventListener("relevo-firebase-ready", onReady);

    // 🔥 3) Fallback interval (caso evento dispare antes do listener)
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
      console.error("[Bootstrap] Timeout esperando Firebase do Portal.");
      cleanup();
      reject(new Error("Firebase não disponível depois do timeout."));
    }, timeoutMs);

    function cleanup() {
      clearInterval(interval);
      clearTimeout(timeout);
      window.removeEventListener("relevo-firebase-ready", onReady);
    }
  });
}
