// src/services/cronogramaService.js
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

/* ============================================================
   🔥  Todas as funções recebem "db" como parâmetro
       O DB vem do Portal, via CronogramaContext
   ============================================================ */

// ============================
//  PROJETOS
// ============================

export async function listarProjetos(db, userId = null) {
  try {
    let q = collection(db, "projetos");

    if (userId) {
      q = query(q, where("userId", "==", userId));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (e) {
    console.error("Erro ao listar projetos:", e);
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

// ============================
//  TAREFAS
// ============================

export async function listarTarefas(db, projetoId = null) {
  try {
    let q = collection(db, "tarefas");

    if (projetoId) {
      q = query(q, where("projetoId", "==", projetoId));
    }

    const snapshot = await getDocs(q);

    return snapshot.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (e) {
    console.error("Erro ao listar tarefas:", e);
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
