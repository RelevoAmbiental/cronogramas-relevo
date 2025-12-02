// src/services/cronogramaService.js
// Camada de acesso ao Firestore para Projetos e Tarefas,
// usando SEMPRE o Firestore compat exposto pelo Portal em window.__RELEVO_DB__.

function getDb() {
  const db = window.__RELEVO_DB__;
  if (!db) {
    throw new Error(
      "Firestore ainda não disponível em window.__RELEVO_DB__ (cronogramaService)."
    );
  }
  return db;
}

// ========================== PROJETOS =============================

export async function listarProjetos(uid = null) {
  const firestore = getDb();

  console.log("[cronogramaService] listarProjetos() – uid =", uid);

  let ref = firestore.collection("projetos");

  if (uid) {
    ref = ref.where("uid", "==", uid);
  }

  const snap = await ref.get();

  console.log(
    "[cronogramaService] listarProjetos() – docs encontrados:",
    snap.docs.length
  );

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function criarProjeto(dados) {
  const firestore = getDb();

  const payload = {
    ...dados,
    criadoEm: dados.criadoEm || new Date(),
  };

  console.log("[cronogramaService] criarProjeto() – payload:", payload);

  const docRef = await firestore.collection("projetos").add(payload);
  return { id: docRef.id, ...payload };
}

export async function editarProjeto(id, dados) {
  const firestore = getDb();
  await firestore.collection("projetos").doc(id).update(dados);
}

export async function removerProjeto(id) {
  const firestore = getDb();
  await firestore.collection("projetos").doc(id).delete();
}

// ========================== TAREFAS =============================

export async function listarTarefas(projetoId = null) {
  const firestore = getDb();

  let ref = firestore.collection("tarefas");
  if (projetoId) {
    ref = ref.where("projetoId", "==", projetoId);
  }

  const snap = await ref.get();

  console.log(
    "[cronogramaService] listarTarefas() – docs encontrados:",
    snap.docs.length,
    "filtro projetoId =",
    projetoId
  );

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function criarTarefa(dados) {
  const firestore = getDb();

  const payload = {
    ...dados,
    criadoEm: dados.criadoEm || new Date(),
  };

  console.log("[cronogramaService] criarTarefa() – payload:", payload);

  const docRef = await firestore.collection("tarefas").add(payload);
  return { id: docRef.id, ...payload };
}

export async function editarTarefa(id, dados) {
  const firestore = getDb();
  await firestore.collection("tarefas").doc(id).update(dados);
}

export async function removerTarefa(id) {
  const firestore = getDb();
  await firestore.collection("tarefas").doc(id).delete();
}
