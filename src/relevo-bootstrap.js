// ======================================================================
//  bootstrapCronograma
//  Aguarda DB + AUTH + USER expostos pelo Portal
//  E converte o Firestore modular para compat (se necessário)
// ======================================================================

// 🔧 Importa compat para criar um clone compat isolado:
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// ======================================================================
//  ADAPTADOR: converte Firestore MODULAR → COMPAT
// ======================================================================
function ensureCompat(dbFromPortal) {
  if (!dbFromPortal) return null;

  // Já é compat?
  if (typeof dbFromPortal.collection === "function") {
    console.log("🔧 Firestore já está em modo compat (Portal).");
    return dbFromPortal;
  }

  // Modular → converter
  if (dbFromPortal._delegate) {
    console.log("🔧 Convertendo Firestore modular → compat (Cronograma)…");

    // usamos a config do app já inicializado no portal:
    const appOptions = window.__RELEVO_FIREBASE__?._options;

    if (!appOptions) {
      console.error("❌ Não foi possível obter opções do Firebase para adaptação compat.");
      return null;
    }

    // cria app compat isolado APENAS para o Cronograma
    let compatApp;

    try {
      compatApp = firebase.initializeApp(appOptions, "cronograma-compat");
    } catch (e) {
      // caso já exista:
      compatApp = firebase.app("cronograma-compat");
    }

    return compatApp.firestore();
  }

  console.warn("⚠️ Tipo de DB não reconhecido:", dbFromPortal);
  return null;
}

// ======================================================================
//  BOOTSTRAP PRINCIPAL
// ======================================================================
export function bootstrapCronograma(timeout = 15000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function check() {
      const rawDb = window.__RELEVO_DB__;
      const auth  = window.__RELEVO_AUTH__;
      const user  = window.__RELEVO_USER__;

      const ready = rawDb && auth && user;

      if (ready) {
        console.log("✅ [relevo-bootstrap] Firebase + USER prontos via Portal.");

        // 🔧 CONVERTE db (modular) → compat antes de liberar:
        const db = ensureCompat(rawDb);

        if (!db) {
          return reject(new Error(
            "[relevo-bootstrap] Falha ao converter Firestore para compat."
          ));
        }

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
