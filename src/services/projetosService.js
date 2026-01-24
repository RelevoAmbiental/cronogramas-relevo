// src/services/projetosService.js
import { getFirestore, getCurrentUser } from "../firebase-adapter";

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user;
}

const nowTs = () => window.firebase.firestore.FieldValue.serverTimestamp();

export async function criarProjeto({
  nome,
  descricao = "",
  status = "ativo", // "ativo" | "pausado" | "concluido"
  cliente = "Relevo Consultoria",
  cor = "#0a4723",
  dataInicio = null, // opcional (string ou timestamp, conforme você decidir depois)
}) {
  const db = getFirestore();
  const user = requireUser();

  const ref = await db.collection("projetos").add({
    nome: (nome || "").trim(),
    descricao: (descricao || "").trim(),
    status,
    cliente: (cliente || "").trim(),
    cor: (cor || "").trim(),
    dataInicio: dataInicio || null,

    uid: user.uid, // compat com seu padrão atual
    ownerEmail: user.email || "",

    arquivado: status === "concluido",

    criadoEm: nowTs(),   // compat com seu padrão atual
    updatedAt: nowTs(),  // novo (melhora ordenação e tracking)
  });

  return ref.id;
}

export async function atualizarProjeto(projetoId, patch) {
  const db = getFirestore();
  requireUser();

  const safePatch = { ...patch };

  // Se mudar status pra concluído, arquiva automaticamente
  if (safePatch.status === "concluido") safePatch.arquivado = true;
  if (safePatch.arquivado === false && safePatch.status === "concluido") {
    // governança básica: não faz sentido
    safePatch.status = "ativo";
  }

  safePatch.updatedAt = nowTs();

  await db.collection("projetos").doc(projetoId).update(safePatch);
}

export async function arquivarProjeto(projetoId) {
  return atualizarProjeto(projetoId, { arquivado: true, status: "concluido" });
}

export async function desarquivarProjeto(projetoId) {
  return atualizarProjeto(projetoId, { arquivado: false, status: "ativo" });
}

export async function apagarProjeto(projetoId) {
  const db = getFirestore();
  requireUser();

  // Observação: tarefas ligadas continuam existindo (por projetoId).
  // Depois a gente decide se quer delete em cascata via Function.
  await db.collection("projetos").doc(projetoId).delete();
}

export function listenProjetos({ incluirArquivados = false, onData, onError }) {
  const db = getFirestore();
  const user = requireUser();

  let q = db.collection("projetos").where("uid", "==", user.uid);

  if (!incluirArquivados) {
    q = q.where("arquivado", "==", false);
  }

  // Se updatedAt ainda não existir em docs antigos, pode dar erro de ordem.
  // Solução: não ordenar agora, ou ordenar por criadoEm (que já existe).
  q = q.orderBy("criadoEm", "desc");

  return q.onSnapshot(
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => onError?.(err)
  );
}
