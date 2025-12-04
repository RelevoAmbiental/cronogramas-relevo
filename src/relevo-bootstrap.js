// src/relevo-bootstrap.js

// Aguarda Firebase compat (portal) + usuário real antes de liberar o cronograma

export function bootstrapCronograma(timeout = 15000) {
  return new Promise((resolve, reject) => {

    const start = Date.now();

    function check() {
      const db = window.__RELEVO_DB__;
      const auth = window.__RELEVO_AUTH__;
      const user = window.__RELEVO_USER__;

      // 🔥 TRÊS CONDIÇÕES NECESSÁRIAS:
      const ready = db && auth && user;

      if (ready) {
        console.log("✅ [relevo-bootstrap] Firebase + USER prontos via Portal:", {
          db, auth, user
        });
        return resolve({ db, auth, user });
      }

      if (Date.now() - start > timeout) {
        return reject(
          new Error("[relevo-bootstrap] Timeout aguardando DB/AUTH/USER do Portal")
        );
      }

      requestAnimationFrame(check);
    }

    check();
  });
}
