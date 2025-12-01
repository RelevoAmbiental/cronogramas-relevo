// src/services/cronogramaService.js
// Camada de acesso ao Firestore para Projetos e Tarefas
// Integrado com o Firebase compat exposto pelo Portal Relevo.

//
// 🔧 Helper para garantir que temos um DB válido
//
function ensureDb(db) {
  if (!db) {
    throw new Error("Firestore DB não informado em cronogramaService.");
  }
  return db;
}

//
// 🔹 PROJETOS
//
export async function listarProjetos(db, uid = null) {
  try {
    const firestore = ensureDb(db);

    let ref = firestore.collection("projetos");

    // 🔥 Aqui está o ajuste crítico:
    // No seu Firestore o campo se chama "uid" (não "userId").
    // Se quiser ver projetos por usuário logado, usamos esse campo.
    if (uid) {
      ref = ref.where("uid", "==", uid);
    }

    const snap = await ref.get();
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Erro ao listar projetos:", err);
    return [];
  }
}

export async function criarProjeto(db, dados) {
  const firestore = ensureDb(db);
  const payload = {
    ...dados,
    criadoEm: dados.criadoEm || new Date(),
  };
  const docRef = await firestore.collection("projetos").add(payload);
  return { id: docRef.id, ...payload };
}

export async function editarProjeto(db, id, dados) {
  const firestore = ensureDb(db);
  await firestore.collection("projetos").doc(id).update(dados);
}

export async function removerProjeto(db, id) {
  const firestore = ensureDb(db);
  await firestore.collection("projetos").doc(id).delete();
}

//
// 🔹 TAREFAS
//
export async function listarTarefas(db, projetoId = null) {
  try {
    const firestore = ensureDb(db);

    let ref = firestore.collection("tarefas");
    if (projetoId) {
      ref = ref.where("projetoId", "==", projetoId);
    }

    const snap = await ref.get();
    return snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (err) {
    console.error("Erro ao listar tarefas:", err);
    return [];
  }
}

export async function criarTarefa(db, dados) {
  const firestore = ensureDb(db);
  const payload = {
    ...dados,
    criadoEm: dados.criadoEm || new Date(),
  };
  const docRef = await firestore.collection("tarefas").add(payload);
  return { id: docRef.id, ...payload };
}

export async function editarTarefa(db, id, dados) {
  const firestore = ensureDb(db);
  await firestore.collection("tarefas").doc(id).update(dados);
}

export async function removerTarefa(db, id) {
  const firestore = ensureDb(db);
  await firestore.collection("tarefas").doc(id).delete();
}
