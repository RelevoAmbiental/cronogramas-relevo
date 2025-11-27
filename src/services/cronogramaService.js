import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  query,
  where,
} from "firebase/firestore";

import { db } from "./firebase";  // CORRETO

// ============================
//  PROJETOS
// ============================

export async function getProjects(userId) {
  const q = query(collection(db, "projects"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function createProject(data) {
  await addDoc(collection(db, "projects"), data);
}

export async function updateProject(id, data) {
  await updateDoc(doc(db, "projects", id), data);
}

export async function deleteProject(id) {
  await deleteDoc(doc(db, "projects", id));
}
