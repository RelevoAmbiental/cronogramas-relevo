import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

const PROJECTS_COLLECTION = "projects";

/**
 * Cria um entregável vinculado a um projeto.
 */
export async function createDeliverable(projectId, data, userId) {
  const ref = collection(db, PROJECTS_COLLECTION, projectId, "deliverables");

  const payload = {
    titulo: data.titulo || "Novo entregável",
    descricao: data.descricao || "",
    dataEntregaPrevista: data.dataEntregaPrevista || null,
    dataEntregaReal: data.dataEntregaReal || null,
    status: data.status || "aguardando",
    arquivoURL: data.arquivoURL || null,
    createdBy: userId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Lista entregáveis de um projeto.
 */
export async function listDeliverables(projectId) {
  const ref = collection(db, PROJECTS_COLLECTION, projectId, "deliverables");
  const snap = await getDocs(orderBy(ref, "dataEntregaPrevista", "asc"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Atualiza um entregável.
 */
export async function updateDeliverable(projectId, deliverableId, data) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "deliverables", deliverableId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return true;
}

/**
 * Remove um entregável.
 */
export async function deleteDeliverable(projectId, deliverableId) {
  const ref = doc(db, PROJECTS_COLLECTION, projectId, "deliverables", deliverableId);
  await deleteDoc(ref);
  return true;
}
