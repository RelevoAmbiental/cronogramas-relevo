// src/services/tarefasService.js
import { getFirestore, getCurrentUser } from "../firebase-adapter";

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user;
}

const nowTs = () => window.firebase.firestore.FieldValue.serverTimestamp();

const STATUS = ["A fazer", "Fazendo", "Concluida"];

export async function criarTarefa({
  nome,
  descricao = "",
  status = "A fazer",
  inicio = null,   // você hoje usa string "YYYY-MM-DD"; vamos aceitar isso
  fim = null,
  ordem = 0,
  projetoId,       // obrigatório
}) {
  const db = getFirestore();
  const user = requireUser();

  if (!projetoId) throw new Error("projetoId é obrigatório para criar tarefa.");
  if (!STATUS.includes(status)) throw new Error("Status inválido.");

  const ref = await db.collection("tarefas").add({
    nome: (nome || "").trim(),
    descricao: (descricao || "").trim(),
    status,
    inicio: inicio || null,
    fim: fim || null,
    ordem: Number.isFinite(ordem) ? ordem : 0,

    projetoId,

    uid: user.uid, // manter padrão de ownership
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

  if (safePatch.status && !STATUS.includes(safePatch.status)) {
    throw new Error("Status inválido.");
  }

  // Se concluir, arquiva automaticamente
  if (safePatch.status === "Concluida") safePatch.arquivado = true;

  safePatch.updatedAt = nowTs();
  safePatch.updatedByUid = user.uid;

  await db.collection("tarefas").doc(tarefaId).update(safePatch);
}

export async function arquivarTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { arquivado: true, status: "Concluida" });
}

export async function desarquivarTarefa(tarefaId) {
  // volta para "A fazer" por padrão (você pode mudar isso depois)
  return atualizarTarefa(tarefaId, { arquivado: false, status: "A fazer" });
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

  let q = db.collection("tarefas").where("uid", "==", user.uid);

  if (projetoId) q = q.where("projetoId", "==", projetoId);

  if (!incluirArquivadas) {
    q = q.where("arquivado", "==", false);
  }

  // Ordem: se não existir em antigos, ainda assim dá pra ordenar.
  q = q.orderBy("ordem", "asc");

  return q.onSnapshot(
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}
