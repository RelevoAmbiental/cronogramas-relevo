// src/firebase-adapter.js

import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

export function ensureCompat(dbFromPortal) {
  if (!dbFromPortal) return null;

  // já é compat?
  if (typeof dbFromPortal.collection === "function") {
    return dbFromPortal;
  }

  // é modular — validar pelo delegate interno
  if (dbFromPortal._delegate) {
    console.log("🔧 Convertendo Firestore modular para compat dentro do Cronograma...");

    // Criar um app compat isolado APENAS para o cronograma
    const compatApp = firebase.initializeApp(
      window.__RELEVO_FIREBASE__._options,
      "cronograma-compat"
    );

    return compatApp.firestore();
  }

  console.warn("⚠️ Tipo de DB desconhecido:", dbFromPortal);
  return null;
}
