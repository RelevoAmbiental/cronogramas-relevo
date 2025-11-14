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
 * Cria uma tarefa dentro de um projeto.
 */
export async function createTask(projectId, data, userId) {
  const ref = collection(db, PROJECTS_COLLECTION, projectId, "tasks");

  const payload = {
    titulo: data.titulo || "Nova tarefa",
    descricao: data.descricao || "",
    responsavelUserId: data.responsavelUserId || userId || null,
    dataInicio: data.dataInicio || null,
    dataFim: data.dataFim || null,
    status: data.status || "pendente",
    prioridade: data.prioridade || "media",
    createdBy: userId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Lista tarefas de um projeto.
 * Opcionalmente filtra por status ou responsável.
 */
export async function listTasksByProject(projectId, { status, responsavelUserId } = {}) {
  let q = collection(db, PROJECTS_COLLECTION, projectId, "tasks");

  const filters = [];
  if (status) filters.push(where("status", "==", status));
  if (responsavelUserId) filters.push(where("responsavelUserId", "==", responsavelUserId));

  if (filters.length > 0) {
    q = query(q, ...filters, orderBy("dataInicio", "asc"));
  } else {
    q = query(q, orderBy("dataInicio", "asc"));
  }

  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Busca uma tarefa específica.
 */
export async function getTask(projectId, taskId) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "tasks", taskId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Atualiza uma tarefa.
 */
export async function updateTask(projectId, taskId, data) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "tasks", taskId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return true;
}

/**
 * Remove uma tarefa.
 */
export async function deleteTask(projectId, taskId) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "tasks", taskId);
  await deleteDoc(ref);
  return true;
}
