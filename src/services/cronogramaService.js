import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs,
  query,
  where 
} from "firebase/firestore";

import { db } from "./firebase/firestore";

// ==========================
// PROJETOS
// ==========================

// Listar todos os projetos
export async function listarProjetos(uid) {
  const q = query(collection(db, "projetos"), where("uid", "==", uid));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Criar novo projeto
export async function criarProjeto(uid, dados) {
  return await addDoc(collection(db, "projetos"), {
    uid,
    nome: dados.nome,
    descricao: dados.descricao || "",
    criadoEm: new Date(),
  });
}

// Editar projeto
export async function editarProjeto(id, dados) {
  const ref = doc(db, "projetos", id);
  return await updateDoc(ref, dados);
}

// Remover projeto
export async function removerProjeto(id) {
  const ref = doc(db, "projetos", id);
  return await deleteDoc(ref);
}

// ==========================
// TAREFAS
// ==========================

export async function listarTarefas(uid) {
  const q = query(collection(db, "tarefas"), where("uid", "==", uid));
  const snap = await getDocs(q);

  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function criarTarefa(uid, dados) {
  return await addDoc(collection(db, "tarefas"), {
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
  const ref = doc(db, "tarefas", id);
  return await updateDoc(ref, dados);
}

export async function removerTarefa(id) {
  const ref = doc(db, "tarefas", id);
  return await deleteDoc(ref);
}
