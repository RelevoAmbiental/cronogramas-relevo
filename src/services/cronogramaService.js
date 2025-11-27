// ============================================
//  Cronograma Service — Padrão Relevo (Compat)
//  Usa Firestore compat fornecido pelo Portal
// ============================================

import { getFirestore } from "./firebase";

// Firestore compat do Portal
function db() {
  return getFirestore();
}

// ==========================
// PROJETOSimport { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where 
} from "firebase/firestore";

import { db } from "./firebase/firestore";


// ==========================
// PROJETOS
// ==========================

// Criar novo projeto — VERSÃO CORRIGIDA
export async function criarProjeto(uid, dados) {
  return await addDoc(collection(db, "projetos"), {
    uid,
    nome: dados.nome,
    descricao: dados.descricao || "",
    cliente: dados.cliente || "",
    status: dados.status || "Ativo",
    dataInicio: dados.dataInicio || null,
    cor: dados.cor || "#0a4723",  // padrão Relevo
    criadoEm: new Date(),
  });
}

// Editar projeto (já estava OK)
export async function editarProjeto(id, dados) {
  const ref = doc(db, "projetos", id);
  return await updateDoc(ref, dados);
}

// Listar projetos
export async function listarProjetos(uid) {
  const q = query(collection(db, "projetos"), where("uid", "==", uid));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Remover
export async function removerProjeto(id) {
  const ref = doc(db, "projetos", id);
  return await deleteDoc(ref);
}



// ==========================
// TAREFAS (continua igual)
// ==========================

export async function listarTarefas(uid) {
  const q = query(collection(db, "tarefas"), where("uid", "==", uid));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function criarTarefa(uid, dados) {
  return await addDoc(collection(db, "tarefas"), {
    uid,
    projetoId: dados.projetoId,
    nome: dados.nome,
    inicio: dados.inicio,
    fim: dados.fim,
    status: dados.status || "pendente",
    criadoEm: new Date(),
  });
}

export async function editarTarefa(id, dados) {
  const ref = doc(db, "tarefas", id);
  return await updateDoc(ref, dados);
}

export async function removerTarefa(id) {
  const ref = doc(db, "tarefas", id);
  return await deleteDoc(ref);
}

// ==========================

// Listar todos os projetos do usuário
export async function listarProjetos(uid) {
  const ref = db().collection("projetos");
  const snap = await ref.where("uid", "==", uid).get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// Criar novo projeto
export async function criarProjeto(uid, dados) {
  return db().collection("projetos").add({
    uid,
    nome: dados.nome,
    descricao: dados.descricao || "",
    criadoEm: new Date(),
  });
}

// Editar projeto
export async function editarProjeto(id, dados) {
  return db().collection("projetos").doc(id).update(dados);
}

// Remover projeto
export async function removerProjeto(id) {
  return db().collection("projetos").doc(id).delete();
}

// ==========================
// TAREFAS
// ==========================

// Listar tarefas do usuário
export async function listarTarefas(uid) {
  const ref = db().collection("tarefas");
  const snap = await ref.where("uid", "==", uid).get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// Criar tarefa
export async function criarTarefa(uid, dados) {
  return db().collection("tarefas").add({
    uid,
    projetoId: dados.projetoId,
    nome: dados.nome,
    inicio: dados.inicio,
    fim: dados.fim,
    status: dados.status || "pendente",
    criadoEm: new Date(),
  });
}

// Editar tarefa
export async function editarTarefa(id, dados) {
  return db().collection("tarefas").doc(id).update(dados);
}

// Remover tarefa
export async function removerTarefa(id) {
  return db().collection("tarefas").doc(id).delete();
}
