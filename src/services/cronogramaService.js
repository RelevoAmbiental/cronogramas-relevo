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
// PROJETOS
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
