import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/firestore";

const PROPOSTAS_COLLECTION = "propostas";

/**
 * Registra uma proposta aprovada (arquivo já enviado para o Storage).
 */
export async function createPropostaAprovada(data, userId) {
  const ref = collection(db, PROPOSTAS_COLLECTION);

  const payload = {
    cliente: data.cliente || "",
    projetoId: data.projetoId || null,
    arquivoURL: data.arquivoURL || "",
    nomeArquivo: data.nomeArquivo || "",
    textoExtraido: data.textoExtraido || null, // futuro: IA
    statusIA: data.statusIA || "pendente", // pendente | processado | erro
    createdBy: userId || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(ref, payload);
  return { id: docRef.id, ...payload };
}

/**
 * Listagem de propostas aprovadas.
 */
export async function listPropostas() {
  const ref = collection(db, PROPOSTAS_COLLECTION);
  const snap = await getDocs(orderBy(ref, "createdAt", "desc"));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Busca uma proposta específica.
 */
export async function getPropostaById(propostaId) {
  const ref = doc(db, PROPOSTAS_COLLECTION, propostaId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

/**
 * Atualiza status IA ou vínculo com projeto.
 */
export async function updateProposta(propostaId, data) {
  const ref = doc(db, PROPOSTAS_COLLECTION, propostaId);
  const payload = {
    ...data,
    updatedAt: serverTimestamp(),
  };
  await updateDoc(ref, payload);
  return true;
}
