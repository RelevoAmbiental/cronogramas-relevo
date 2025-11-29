// =========================================
//  SERVIÇOS DO FIRESTORE — CRONOGRAMA RELEVO
//  Versão completa e compatível com CronogramaContext.jsx
// =========================================

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";

import { db } from "./firebase";

// =========================================
//  PROJETOS (coleção: "projetos")
// =========================================

export async function listarProjetos() {
  try {
    const colRef = collection(db, "projetos");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Erro ao listar projetos:", err);
    return [];
  }
}

export async function criarProjeto(data) {
  try {
    const colRef = collection(db, "projetos");
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (err) {
    console.error("Erro ao criar projeto:", err);
  }
}

export async function editarProjeto(id, data) {
  try {
    await updateDoc(doc(db, "projetos", id), data);
  } catch (err) {
    console.error("Erro ao editar projeto:", err);
  }
}

export async function removerProjeto(id) {
  try {
    await deleteDoc(doc(db, "projetos", id));
  } catch (err) {
    console.error("Erro ao remover projeto:", err);
  }
}

// =========================================
//  TAREFAS (coleção: "tarefas")
// =========================================

export async function listarTarefas() {
  try {
    const colRef = collection(db, "tarefas");
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error("Erro ao listar tarefas:", err);
    return [];
  }
}

export async function criarTarefa(data) {
  try {
    const colRef = collection(db, "tarefas");
    const docRef = await addDoc(colRef, data);
    return docRef.id;
  } catch (err) {
    console.error("Erro ao criar tarefa:", err);
  }
}

export async function editarTarefa(id, data) {
  try {
    await updateDoc(doc(db, "tarefas", id), data);
  } catch (err) {
    console.error("Erro ao editar tarefa:", err);
  }
}

export async function removerTarefa(id) {
  try {
    await deleteDoc(doc(db, "tarefas", id));
  } catch (err) {
    console.error("Erro ao remover tarefa:", err);
  }
}
