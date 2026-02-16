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

  // Compat: migração de status antigos
  // antigo: ativo/concluido
  if (!p.status) p.status = p.arquivado ? "arquivado" : "planejado";
  if (p.status === "ativo") p.status = "planejado";
  if (p.status === "concluido") p.status = "arquivado";

  // Compat: garantir campos padrão
  if (!p.nome) p.nome = p.titulo || "(sem nome)";
  if (!p.cliente) p.cliente = "Relevo Consultoria";
  if (!p.cor) p.cor = "#0a4723";

  return p;
}

function sortProjetos(a, b) {
  const aT = a.updatedAt?.toMillis?.() ?? a.criadoEm?.toMillis?.() ?? 0;
  const bT = b.updatedAt?.toMillis?.() ?? b.criadoEm?.toMillis?.() ?? 0;
  return bT - aT;
}

export async function criarProjeto({
  nome,
  descricao = "",
  status = "planejado",
  cliente = "Relevo Consultoria",
  numeroProposta = "",
  cor = "#0a4723",
  prazoExecucao = "",
}) {
  const db = getFirestore();
  const user = requireUser();

  const ref = await db.collection("projetos").add({
    nome: (nome || "").trim(),
    descricao: (descricao || "").trim(),
    status,
    cliente: (cliente || "").trim(),
    numeroProposta: (numeroProposta || "").trim(),
    cor: (cor || "").trim(),
    // string YYYY-MM-DD (input type=date) ou texto livre curto
    prazoExecucao: (prazoExecucao || "").trim(),

    uid: user.uid,
    ownerEmail: user.email || "",

    arquivado: status === "arquivado",

    criadoEm: nowTs(),
    updatedAt: nowTs(),
  });

  return ref.id;
}

export async function atualizarProjeto(projetoId, patch) {
  const db = getFirestore();
  requireUser();

  const safePatch = { ...patch };

  // mantém consistência entre status e booleano arquivado
  if (safePatch.status === "arquivado") safePatch.arquivado = true;
  if (safePatch.status && safePatch.status !== "arquivado") safePatch.arquivado = false;

  safePatch.updatedAt = nowTs();

  await db.collection("projetos").doc(projetoId).update(safePatch);
}

export async function arquivarProjeto(projetoId) {
  return atualizarProjeto(projetoId, { status: "arquivado", arquivado: true });
}

export async function desarquivarProjeto(projetoId) {
  return atualizarProjeto(projetoId, { status: "planejado", arquivado: false });
}

export async function apagarProjeto(projetoId) {
  const db = getFirestore();
  requireUser();
  await db.collection("projetos").doc(projetoId).delete();
}

export function listenProjetos({ incluirArquivados = false, onData, onError }) {
  const db = getFirestore();
  const user = requireUser();

  // Query mínima SEM index composto:
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
