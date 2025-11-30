import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const PROJECTS_COLLECTION = "projects";

/**
 * Cria um item de cronograma (marco, etapa, etc).
 */
export async function createScheduleItem(projectId, data, userId) {
  const ref = collection(db, PROJECTS_COLLECTION, projectId, "schedule");

  const payload = {
    tipo: data.tipo || "etapa",
    titulo: data.titulo || "Item de cronograma",
    descricao: data.descricao || "",
    dataInicio: data.dataInicio || null,
    dataFim: data.dataFim || null,
    fonte: data.fonte || "manual", // manual | ia | extraido
    createdBy: userId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Lista todos os itens de cronograma de um projeto.
 */
export async function listSchedule(projectId) {
  const ref = collection(db, PROJECTS_COLLECTION, projectId, "schedule");
  const snap = await getDocs(orderBy(ref, "dataInicio", "asc"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Atualiza um item do cronograma.
 */
export async function updateScheduleItem(projectId, itemId, data) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "schedule", itemId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return true;
}

/**
 * Remove um item de cronograma.
 */
export async function deleteScheduleItem(projectId, itemId) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "schedule", itemId);
  await deleteDoc(ref);
  return true;
}
