// src/services/firebase/config.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcQi5nToMOGVDBWprhhOY0NSJX4qE100w",
  authDomain: "portal-relevo.firebaseapp.com",
  projectId: "portal-relevo",
  storageBucket: "portal-relevo.firebasestorage.app",
  messagingSenderId: "182759626683",
  appId: "1:182759626683:web:2dde2eeef910d4c288569e",
  measurementId: "G-W8TTP3D3YQ"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta Firestore para uso nos serviços
export const db = getFirestore(app);
