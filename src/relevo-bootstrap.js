// ======================================================================
// relevo-bootstrap.js
// Espera Firebase (compat v9) + usuário do Portal ANTES de montar React
// ======================================================================

export function bootstrapCronograma(timeoutMs = 20000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const db = window.__RELEVO_DB__;
      const auth = window.__RELEVO_AUTH__;
      const user = window.__RELEVO_USER__;

      const hasDb = !!db;
      const hasAuth = !!auth;
      const hasUser = !!user;

      // Quando tudo estiver pronto → resolve
      if (hasDb && hasAuth && hasUser) {
        console.log("🔥 [relevo-bootstrap] Firebase + User prontos:", {
          db,
          auth,
          user,
        });
        resolve({ db, auth, user });
        return;
      }

      // Timeout
      if (Date.now() - start > timeoutMs) {
        reject(
          new Error(
            `[relevo-bootstrap] Timeout aguardando dependências. Status atual: { db: ${hasDb}, auth: ${hasAuth}, user: ${hasUser} }`
          )
        );
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}
