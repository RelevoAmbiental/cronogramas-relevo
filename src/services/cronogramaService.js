// ============================================
//  Cronograma Service — Padrão Relevo (Compat)
//  Usa Firestore compat herdado do Portal
// ============================================

import { getFirestore } from "./firebase";

function db() {
  const instance = getFirestore();
  if (!instance) {
    throw new Error("Firestore não está disponível. Verifique integração com o Portal.");
  }
  return instance;
}

// ==========================
// PROJETOS
// ==========================

// Listar projetos do usuário
export async function listarProjetos(uid) {
  const ref = db().collection("projetos");
  const snap = await ref.where("uid", "==", uid).get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

// Criar novo projeto (com todos os campos)
export async function criarProjeto(uid, dados) {
  return db().collection("projetos").add({
    uid,
    nome: dados.nome || "",
    descricao: dados.descricao || "",
    cliente: dados.cliente || "",
    status: dados.status || "Ativo",
    dataInicio: dados.dataInicio || null,
    cor: dados.cor || "#0a4723", // padrão Relevo
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

export async function listarTarefas(uid) {
  const ref = db().collection("tarefas");
  const snap = await ref.where("uid", "==", uid).get();

  return snap.docs.map((d) => ({
    id: d.id,
    ...d.data(),
  }));
}

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

export async function editarTarefa(id, dados) {
  return db().collection("tarefas").doc(id).update(dados);
}

export async function removerTarefa(id) {
  return db().collection("tarefas").doc(id).delete();
}
