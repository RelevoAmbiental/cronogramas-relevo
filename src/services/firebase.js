// ==============================================
//  Firebase inicializado via Portal Relevo
//  cronogramas-relevo usa a sessão exposta
// ==============================================

let app = null;
let auth = null;
let db = null;

// O portal expõe estes valores globalmente quando carrega
function loadFromPortal() {
  if (window.__RELEVO_FIREBASE__ && window.__RELEVO_AUTH__ && window.__RELEVO_DB__) {
    app = window.__RELEVO_FIREBASE__;
    auth = window.__RELEVO_AUTH__;
    db = window.__RELEVO_DB__;
    return true;
  }
  return false;
}

// Fallback — caso o Guard ainda não tenha carregado
function loadFallback() {
  if (typeof firebase === "undefined") {
    console.warn("⚠️ Firebase ainda não está disponível (fallback aguardando compat SDK).");
    return false;
  }

  try {
    app = firebase.app();       // usa a mesma instância compat
    auth = firebase.auth();
    db = firebase.firestore();
    return true;
  } catch (err) {
    console.error("❌ Erro ao tentar carregar Firebase no fallback:", err);
    return false;
  }
}

// Carregar agora
loadFromPortal() || loadFallback();

// 🔥 Exportar exatamente o que o projeto React importa
export { app, auth, db };
