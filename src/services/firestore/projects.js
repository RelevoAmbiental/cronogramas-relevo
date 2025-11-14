import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firestore";

const PROJECTS_COLLECTION = "projects";

/**
 * Cria um novo projeto.
 * userId = usuário logado (vai vir do Portal).
 */
export async function createProject(data, userId) {
  const ref = collection(db, PROJECTS_COLLECTION);

  const payload = {
    nome: data.nome || "Novo projeto",
    cliente: data.cliente || "",
    responsavelUserId: data.responsavelUserId || userId || null,
    status: data.status || "planejamento",
    tipo: data.tipo || "geral",
    inicioPrevisto: data.inicioPrevisto || null,
    fimPrevisto: data.fimPrevisto || null,
    propostaFileURL: data.propostaFileURL || null,
    propostaId: data.propostaId || null,
    cronogramaAutoGerado: data.cronogramaAutoGerado || false,
    createdBy: userId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Busca um projeto pelo ID.
 */
export async function getProjectById(projectId) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Lista projetos, opcionalmente filtrando por responsável ou status.
 */
export async function listProjects({ responsavelUserId, status } = {}) {
  let q = collection(db, PROJECTS_COLLECTION);

  const filters = [];
  if (responsavelUserId) {
    filters.push(where("responsavelUserId", "==", responsavelUserId));
  }
  if (status) {
    filters.push(where("status", "==", status));
  }

  if (filters.length > 0) {
    q = query(q, ...filters, orderBy("createdAt", "desc"));
  } else {
    q = query(q, orderBy("createdAt", "desc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Atualiza um projeto.
 */
export async function updateProject(projectId, data) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return true;
}

/**
 * Remove um projeto.
 * (No futuro podemos trocar por "arquivado = true".)
 */
export async function deleteProject(projectId) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId);
  await deleteDoc(ref);
  return true;
}
