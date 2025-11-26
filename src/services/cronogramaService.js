// ============================================
//  Cronograma Service — Padrão Relevo (Compat)
//  Usa Firestore compat fornecido pelo Portal
// ============================================

import { getFirestore } from "./firebase";

//
// FIRESTORE GLOBAL (compat do Portal Relevo)
//
function db() {
  return getFirestore();
}

// ==========================
// PROJETOS
// ==========================

// Listar todos os projetos do usuário
export async function listarProjetos(uid) {
  const snap = await db()
    .collection("projetos")
    .where("uid", "==", uid)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Criar novo projeto
export async function criarProjeto(uid, dados) {
  return await db().collection("projetos").add({
    uid,
    nome: dados.nome,
    descricao: dados.descricao || "",
    criadoEm: new Date(),
  });
}

// Editar projeto
export async function editarProjeto(id, dados) {
  return await db().collection("projetos").doc(id).update(dados);
}

// Remover projeto
export async function removerProjeto(id) {
  return await db().collection("projetos").doc(id).delete();
}

// ==========================
// TAREFAS
// ==========================

// Listar tarefas do usuário
export async function listarTarefas(uid) {
  const snap = await db()
    .collection("tarefas")
    .where("uid", "==", uid)
    .get();

  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

// Criar tarefa
export async function criarTarefa(uid, dados) {
  return await db().collection("tarefas").add({
    uid,
    projetoId:
