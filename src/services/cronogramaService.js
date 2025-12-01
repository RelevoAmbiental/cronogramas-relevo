// src/services/cronogramaService.js
// Camada de acesso ao Firestore para Projetos e Tarefas (Firebase compat).

//
// 🔧 Helper para garantir DB
//
function ensureDb(db) {
  if (!db) throw new Error("Firestore DB não informado em cronogramaService.");
  return db;
}

//
// ========================== PROJETOS =============================
export async function listarProjetos(db, uid = null) {
  const firestore = ensureDb(db);

  console.log("[cronogramaService] listarProjetos() – db OK, uid =", uid);

  let ref = firestore.collection("projetos");

  // filtra pelo campo REAL no Firestore (uid)
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

export async function criarProjeto(db, dados) {
  const firestore = ensureDb(db);

  const payload = {
    ...dados,
    uid: dados.uid, // 🔥 garante associação ao usuário
    criadoEm: dados.criadoEm || new Date(),
  };

  console.log("[cronogramaService] criarProjeto() – payload:", payload);

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
// ========================== TAREFAS =============================
export async function listarTarefas(db, projetoId = null) {
  const firestore = ensureDb(db);

  let ref = firestore.collection("tarefas");
  if (projetoId) {
    ref = ref.where("projetoId", "==", projetoId);
  }

  const snap = await ref.get();

  console.log(
    "[cronogramaService] listarTarefas() – docs encontrados:",
    snap.docs.length
  );

  return snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
}

export async function criarTarefa(db, dados) {
  const firestore = ensureDb(db);

  const payload = {
    ...dados,
    criadoEm: dados.criadoEm || new Date(),
  };

  console.log("[cronogramaService] criarTarefa() – payload:", payload);

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
