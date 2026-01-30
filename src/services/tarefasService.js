// src/services/tarefasService.js
import { getFirestore, getCurrentUser } from "../firebase-adapter";

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user;
}

const nowTs = () => window.firebase.firestore.FieldValue.serverTimestamp();

const STATUS_VALIDO = ["A fazer", "Fazendo", "Concluida"];

function normalizeTarefa(doc) {
  const t = { id: doc.id, ...doc.data() };

  // Compat: se não existir arquivado, assume false
  if (typeof t.arquivado !== "boolean") t.arquivado = false;

  // Compat: status
  if (!STATUS_VALIDO.includes(t.status)) {
    // se veio "todo/doing/done" antigo, tenta mapear
    if (t.status === "todo") t.status = "A fazer";
    else if (t.status === "doing") t.status = "Fazendo";
    else if (t.status === "done") t.status = "Concluida";
    else t.status = "A fazer";
  }

  // Nome
  if (!t.nome) t.nome = t.titulo || "(sem nome)";

  // Ordem
  if (!Number.isFinite(t.ordem)) t.ordem = 0;

  return t;
}

function sortTarefas(a, b) {
  // ordem asc; se empatar, createdAt/criadoEm
  const o = (a.ordem ?? 0) - (b.ordem ?? 0);
  if (o !== 0) return o;

  const aT = (a.updatedAt?.toMillis?.() ?? a.criadoEm?.toMillis?.() ?? 0);
  const bT = (b.updatedAt?.toMillis?.() ?? b.criadoEm?.toMillis?.() ?? 0);
  return aT - bT;
}

export async function criarTarefa({
  nome,
  descricao = "",
  status = "A fazer",
  inicio = null,
  fim = null,
  ordem = 0,
  projetoId,
}) {
  const db = getFirestore();
  const user = requireUser();

  if (!projetoId) throw new Error("projetoId é obrigatório.");
  if (!STATUS_VALIDO.includes(status)) throw new Error("Status inválido.");

  const ref = await db.collection("tarefas").add({
    nome: (nome || "").trim(),
    descricao: (descricao || "").trim(),
    status,
    inicio: inicio || null,
    fim: fim || null,
    ordem: Number.isFinite(ordem) ? ordem : 0,

    projetoId,
    uid: user.uid,

    arquivado: status === "Concluida",

    criadoEm: nowTs(),
    updatedAt: nowTs(),
    createdByUid: user.uid,
    updatedByUid: user.uid,
  });

  return ref.id;
}

export async function atualizarTarefa(tarefaId, patch) {
  const db = getFirestore();
  const user = requireUser();

  const safePatch = { ...patch };

  if (safePatch.status && !STATUS_VALIDO.includes(safePatch.status)) {
    throw new Error("Status inválido.");
  }

  if (safePatch.status === "Concluida") safePatch.arquivado = true;

  safePatch.updatedAt = nowTs();
  safePatch.updatedByUid = user.uid;

  await db.collection("tarefas").doc(tarefaId).update(safePatch);
}

export async function arquivarTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { status: "Concluida", arquivado: true });
}

export async function desarquivarTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { status: "A fazer", arquivado: false });
}

export async function apagarTarefa(tarefaId) {
  const db = getFirestore();
  requireUser();
  await db.collection("tarefas").doc(tarefaId).delete();
}

export function listenTarefas({
  projetoId = null,
  incluirArquivadas = false,
  onData,
  onError,
}) {
  const db = getFirestore();
  const user = requireUser();

  // ✅ Query mínima SEM index composto:
  // pega tudo do usuário e filtra no front.
  return db
    .collection("tarefas")
    .where("uid", "==", user.uid)
    .onSnapshot(
      (snap) => {
        let items = snap.docs.map(normalizeTarefa);

        if (projetoId) items = items.filter((t) => t.projetoId === projetoId);

        if (!incluirArquivadas) items = items.filter((t) => !t.arquivado);

        items.sort(sortTarefas);
        onData(items);
      },
      (err) => onError?.(err)
    );
}
