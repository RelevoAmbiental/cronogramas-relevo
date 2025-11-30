// src/services/cronogramaService.js
// CRUD simplificado usando Firestore compat exposto pelo portal

export async function listarProjetos(db, userId = null) {
  try {
    let ref = db.collection("projetos");

    if (userId) {
      ref = ref.where("userId", "==", userId);
    }

    const snap = await ref.get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.error("Erro ao listar projetos:", err);
    return [];
  }
}

export function criarProjeto(db, data) {
  return db.collection("projetos").add(data);
}

export function editarProjeto(db, id, data) {
  return db.collection("projetos").doc(id).update(data);
}

export function removerProjeto(db, id) {
  return db.collection("projetos").doc(id).delete();
}

// ============================================================
// TAREFAS
// ============================================================

export async function listarTarefas(db, projetoId = null) {
  try {
    let ref = db.collection("tarefas");

    if (projetoId) {
      ref = ref.where("projetoId", "==", projetoId);
    }

    const snap = await ref.get();
    return snap.docs.map((d) => ({
      id: d.id,
      ...d.data(),
    }));
  } catch (err) {
    console.error("Erro ao listar tarefas:", err);
    return [];
  }
}

export function criarTarefa(db, data) {
  return db.collection("tarefas").add(data);
}

export function editarTarefa(db, id, data) {
  return db.collection("tarefas").doc(id).update(data);
}

export function removerTarefa(db, id) {
  return db.collection("tarefas").doc(id).delete();
}
