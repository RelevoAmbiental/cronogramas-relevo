// =========================================
//  SERVIÇOS DO FIRESTORE — CRONOGRAMA RELEVO
//  Atualizado e padronizado
// =========================================

import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where
} from "firebase/firestore";

import { db } from "./firebase";

// =========================================
//  PROJETOS
//  Coleção: "projetos"
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

export async function atualizarProjeto(id, data) {
  try {
    await updateDoc(doc(db, "projetos", id), data);
  } catch (err) {
    console.error("Erro ao atualizar projeto:", err);
  }
}

export async function deletarProjeto(id) {
  try {
    await deleteDoc(doc(db, "projetos", id));
  } catch (err) {
    console.error("Erro ao deletar projeto:", err);
  }
}

// =========================================
//  TAREFAS
//  Coleção: "tarefas"
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

export async function atualizarTarefa(id, data) {
  try {
    await updateDoc(doc(db, "tarefas", id), data);
  } catch (err) {
    console.error("Erro ao atualizar tarefa:", err);
  }
}

export async function deletarTarefa(id) {
  try {
    await deleteDoc(doc(db, "tarefas", id));
  } catch (err) {
    console.error("Erro ao deletar tarefa:", err);
  }
}

