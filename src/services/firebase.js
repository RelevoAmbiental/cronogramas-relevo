// ================================
// Firebase Gateway do Cronograma
// Usa a instância do Portal Relevo
// ================================

// Importa compat (necessário para tipos e serviços Vite)
import "firebase/compat/app";
import "firebase/compat/auth";
import "firebase/compat/firestore";

// Garante que o Firebase já foi carregado pelo Portal
if (!window.__RELEVO_FIREBASE__) {
  console.warn("⚠️ Firebase ainda não disponível — aguardando Portal.");
}

// App herdado do Portal
export const app = window.__RELEVO_FIREBASE__ || null;

// Auth herdado do Portal
export const auth =
  (window.__RELEVO_FIREBASE__ && window.__RELEVO_FIREBASE__.auth()) || null;

// Firestore herdado do Portal
export const db =
  (window.__RELEVO_FIREBASE__ && window.__RELEVO_FIREBASE__.firestore()) ||
  null;
