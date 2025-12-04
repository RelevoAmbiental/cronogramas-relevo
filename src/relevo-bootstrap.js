// ======================================================================
//  Bootstrap Relevo — Cronograma integrado ao Portal Relevo
//  Aguarda Firebase (compat v9) + Usuário exposto globalmente
//  antes de montar o React.
// ======================================================================

/**
 * Espera pelo Firebase exposto pelo Portal:
 *   window.__RELEVO_DB__
 *   window.__RELEVO_AUTH__
 */
export function waitForRelevoFirebase(timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const db = window.__RELEVO_DB__;
      const auth = window.__RELEVO_AUTH__;

      if (db && auth) {
        console.log("✅ [relevo-bootstrap] Firebase disponível via Portal:", {
          hasDb: !!db,
          hasAuth: !!auth,
        });
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

/**
 * Espera pelo usuário exposto pelo Portal:
 *   window.__RELEVO_USER__
 *
 * Isso é ESSENCIAL porque o Cronograma estava renderizando antes da
 * autenticação do Portal ser concluída.
 */
export function waitForRelevoUser(timeoutMs = 15000) {
  return new Promise((resolve) => {
    const start = Date.now();

    function check() {
      const user = window.__RELEVO_USER__;

      if (user) {
        console.log("✅ [relevo-bootstrap] Usuário disponível via Portal:", user);
        resolve(user);
        return;
      }

      if (Date.now() - start > timeoutMs) {
        console.warn(
          "[relevo-bootstrap] Timeout aguardando window.__RELEVO_USER__. Prosseguindo como null."
        );
        resolve(null);
        return;
      }

      requestAnimationFrame(check);
    }

    check();
  });
}

/**
 * Função usada pelo main.jsx para aguardar tudo pronto antes de montar o React.
 */
export async function bootstrapCronograma() {
  console.log("⏳ [relevo-bootstrap] Aguardando Firebase + Usuário do Portal...");

  const { db, auth } = await waitForRelevoFirebase();
  const user = await waitForRelevoUser();

  return { db, auth, user };
}
