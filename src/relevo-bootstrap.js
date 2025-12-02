// src/relevo-bootstrap.js
// Aguarda o Firebase exposto pelo Portal Relevo
// (window.__RELEVO_DB__ / __RELEVO_AUTH__) antes de montar o React.

export function waitForRelevoFirebase(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const db = window.__RELEVO_DB__;
      const auth = window.__RELEVO_AUTH__;

      if (db && auth) {
        console.log(
          "✅ [relevo-bootstrap] Firebase disponível via Portal:",
          { hasDb: !!db, hasAuth: !!auth }
        );
        resolve({ db, auth });
        return;
      }

      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            "[relevo-bootstrap] Timeout aguardando window.__RELEVO_DB__/__RELEVO_AUTH__"
          )
        );
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}
