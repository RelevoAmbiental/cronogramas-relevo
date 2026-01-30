// src/services/projetosService.js
import { getFirestore, getCurrentUser } from "../firebase-adapter";

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user;
}

const nowTs = () => window.firebase.firestore.FieldValue.serverTimestamp();

function normalizeProjeto(doc) {
  const p = { id: doc.id, ...doc.data() };

  // Compat: se não existir arquivado, assume false
  if (typeof p.arquivado !== "boolean") p.arquivado = false;

  // Compat: garantir campos que você usa
  if (!p.status) p.status = "ativo";
  if (!p.nome) p.nome = p.titulo || "(sem nome)";

  return p;
}

function sortProjetos(a, b) {
  // tenta updatedAt, senão criadoEm, senão 0
  const aT =
    (a.updatedAt?.toMillis?.() ?? a.criadoEm?.toMillis?.() ?? 0);
  const bT =
    (b.updatedAt?.toMillis?.() ?? b.criadoEm?.toMillis?.() ?? 0);

  return bT - aT; // desc
}

export async function criarProjeto({
  nome,
  descricao = "",
  status = "ativo",
  cliente = "Relevo Consultoria",
  cor = "#0a4723",
}) {
  const db = getFirestore();
  const user = requireUser();

  const ref = await db.collection("projetos").add({
    nome: (nome || "").trim(),
    descricao: (descricao || "").trim(),
    status,
    cliente: (cliente || "").trim(),
    cor: (cor || "").trim(),

    uid: user.uid,
    ownerEmail: user.email || "",

    arquivado: status === "concluido",

    criadoEm: nowTs(),
    updatedAt: nowTs(),
  });

  return ref.id;
}

export async function atualizarProjeto(projetoId, patch) {
  const db = getFirestore();
  requireUser();

  const safePatch = { ...patch };
  if (safePatch.status === "concluido") safePatch.arquivado = true;

  safePatch.updatedAt = nowTs();

  await db.collection("projetos").doc(projetoId).update(safePatch);
}

export async function arquivarProjeto(projetoId) {
  return atualizarProjeto(projetoId, { status: "concluido", arquivado: true });
}

export async function desarquivarProjeto(projetoId) {
  return atualizarProjeto(projetoId, { status: "ativo", arquivado: false });
}

export async function apagarProjeto(projetoId) {
  const db = getFirestore();
  requireUser();
  await db.collection("projetos").doc(projetoId).delete();
}

export function listenProjetos({ incluirArquivados = false, onData, onError }) {
  const db = getFirestore();
  const user = requireUser();

  // ✅ Query mínima SEM index composto:
  // Só filtra por uid e o resto faz no front.
  return db
    .collection("projetos")
    .where("uid", "==", user.uid)
    .onSnapshot(
      (snap) => {
        let items = snap.docs.map(normalizeProjeto);

        if (!incluirArquivados) {
          items = items.filter((p) => !p.arquivado);
        }

        items.sort(sortProjetos);
        onData(items);
      },
      (err) => onError?.(err)
    );
}
