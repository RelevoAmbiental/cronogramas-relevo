import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

// Todas as funções recebem "db" vindo do firebase.js
// E funcionam mesmo sendo db compat, pois compat delega para modular internamente.

// =========================================
// PROJETOS
// =========================================

export async function listarProjetos(db, userId = null) {
  try {
    let ref = collection(db, "projetos");

    if (userId) {
      ref = query(ref, where("userId", "==", userId));
    }

    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Erro ao listar projetos:", err);
    return [];
  }
}

export async function criarProjeto(db, data) {
  return addDoc(collection(db, "projetos"), data);
}

export async function editarProjeto(db, id, data) {
  return updateDoc(doc(db, "projetos", id), data);
}

export async function removerProjeto(db, id) {
  return deleteDoc(doc(db, "projetos", id));
}

// =========================================
// TAREFAS
// =========================================

export async function listarTarefas(db, projetoId = null) {
  try {
    let ref = collection(db, "tarefas");

    if (projetoId) {
      ref = query(ref, where("projetoId", "==", projetoId));
    }

    const snap = await getDocs(ref);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Erro ao listar tarefas:", err);
    return [];
  }
}

export async function criarTarefa(db, data) {
  return addDoc(collection(db, "tarefas"), data);
}

export async function editarTarefa(db, id, data) {
  return updateDoc(doc(db, "tarefas", id), data);
}

export async function removerTarefa(db, id) {
  return deleteDoc(doc(db, "tarefas", id));
}
