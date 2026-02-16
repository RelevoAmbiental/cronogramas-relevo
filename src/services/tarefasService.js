// src/services/tarefasService.js
import { getFirestore, getCurrentUser } from "../firebase-adapter";

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user;
}

const nowTs = () => window.firebase.firestore.FieldValue.serverTimestamp();

export const STATUS_TAREFA = ["A_FAZER", "FAZENDO", "ACOMPANHANDO", "ARQUIVADA"];
export const PRIORIDADE_TAREFA = ["BAIXA", "MEDIA", "ALTA", "URGENTE"];
export const RECORRENCIA_TIPO = ["SEM_RECORRENCIA", "DIARIO", "SEMANAL", "MENSAL"];

function mapStatusAntigo(s) {
  if (!s) return "A_FAZER";
  const v = String(s).trim();

  // já no novo padrão
  if (STATUS_TAREFA.includes(v)) return v;

  // legado
  if (v.toLowerCase() === "todo" || v === "A fazer") return "A_FAZER";
  if (v.toLowerCase() === "doing" || v === "Fazendo") return "FAZENDO";
  if (v.toLowerCase() === "done" || v === "Concluida" || v === "Concluída" || v === "Concluida") return "ARQUIVADA";

  return "A_FAZER";
}

function mapPrioridadeAntiga(p) {
  if (!p) return "MEDIA";
  const v = String(p).trim().toUpperCase();
  if (PRIORIDADE_TAREFA.includes(v)) return v;
  // compat comum
  if (v === "MÉDIA") return "MEDIA";
  return "MEDIA";
}

function normalizeTags(tags) {
  if (!tags) return [];
  if (Array.isArray(tags)) {
    return tags.map((t) => String(t).trim()).filter(Boolean);
  }
  // string separada por vírgula
  return String(tags)
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function normalizeSubtarefas(subtarefas) {
  if (!subtarefas) return [];
  if (Array.isArray(subtarefas)) {
    return subtarefas
      .map((s) => ({
        id: String(s?.id || cryptoRandomId()),
        texto: String(s?.texto || s?.text || "").trim(),
        done: Boolean(s?.done),
        ordem: Number.isFinite(s?.ordem) ? s.ordem : 0,
      }))
      .filter((s) => s.texto);
  }
  // legado: string (1 por linha)
  const linhas = String(subtarefas)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return linhas.map((texto, i) => ({ id: cryptoRandomId(), texto, done: false, ordem: i }));
}

function cryptoRandomId() {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(16).slice(2);
  }
}

function normalizeRecorrencia(recorrencia) {
  if (!recorrencia) return { tipo: "SEM_RECORRENCIA" };

  const tipo = String(recorrencia?.tipo || "SEM_RECORRENCIA").toUpperCase();
  if (!RECORRENCIA_TIPO.includes(tipo)) return { tipo: "SEM_RECORRENCIA" };

  const out = { tipo };

  if (tipo === "SEMANAL") {
    const diaSemana = String(recorrencia?.diaSemana || "").toUpperCase();
    // aceita SEG, TER, QUA, QUI, SEX, SAB, DOM
    if (["SEG", "TER", "QUA", "QUI", "SEX", "SAB", "DOM"].includes(diaSemana)) out.diaSemana = diaSemana;
  }

  if (tipo === "MENSAL") {
    const diaMes = Number(recorrencia?.diaMes);
    if (Number.isFinite(diaMes) && diaMes >= 1 && diaMes <= 31) out.diaMes = diaMes;
  }

  return out;
}

function normalizeTarefa(doc) {
  const t = { id: doc.id, ...doc.data() };

  // compat
  if (typeof t.arquivado !== "boolean") t.arquivado = false;

  // status (novo)
  t.status = mapStatusAntigo(t.status);

  // regra do produto: concluída = arquivada (não existe status "CONCLUIDA" separado)
  if (t.arquivado) t.status = "ARQUIVADA";

  // texto principal
  t.titulo = (t.titulo || t.nome || "").trim() || "(sem título)";
  t.descricao = (t.descricao || "").trim();

  // prioridade
  t.prioridade = mapPrioridadeAntiga(t.prioridade);

  // responsável (string simples por enquanto)
  t.responsavel = (t.responsavel || "").trim();

  // tags
  t.tags = normalizeTags(t.tags);

  // subtarefas
  t.subtarefas = normalizeSubtarefas(t.subtarefas);

  // recorrência
  t.recorrencia = normalizeRecorrencia(t.recorrencia);

  // datas
  t.dataInicio = t.dataInicio || t.inicio || null;
  t.dataVencimento = t.dataVencimento || t.fim || null;

  // ordem
  if (!Number.isFinite(t.ordem)) t.ordem = 0;

  return t;
}

function sortTarefas(a, b) {
  // 1) vencimento asc (se existir)
  const aV = a.dataVencimento?.toMillis?.() ?? 0;
  const bV = b.dataVencimento?.toMillis?.() ?? 0;
  if (aV && bV && aV !== bV) return aV - bV;
  if (aV && !bV) return -1;
  if (!aV && bV) return 1;

  // 2) prioridade (URGENTE > ALTA > MEDIA > BAIXA)
  const peso = { URGENTE: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
  const p = (peso[b.prioridade] ?? 0) - (peso[a.prioridade] ?? 0);
  if (p !== 0) return p;

  // 3) ordem
  const o = (a.ordem ?? 0) - (b.ordem ?? 0);
  if (o !== 0) return o;

  // 4) updatedAt/criadoEm
  const aT = a.updatedAt?.toMillis?.() ?? a.criadoEm?.toMillis?.() ?? 0;
  const bT = b.updatedAt?.toMillis?.() ?? b.criadoEm?.toMillis?.() ?? 0;
  return bT - aT;
}

export async function criarTarefa(payload) {
  const db = getFirestore();
  const user = requireUser();

  const {
    projetoId,
    titulo,
    descricao = "",
    responsavel = "",
    prioridade = "MEDIA",
    status = "A_FAZER",
    dataInicio = null,
    dataVencimento = null,
    tags = [],
    subtarefas = [],
    recorrencia = { tipo: "SEM_RECORRENCIA" },
    ordem = 0,
  } = payload || {};

  if (!projetoId) throw new Error("projetoId é obrigatório.");
  if (!titulo || !String(titulo).trim()) throw new Error("Título é obrigatório.");

  const st = mapStatusAntigo(status);
  if (!STATUS_TAREFA.includes(st)) throw new Error("Status inválido.");

  const pr = mapPrioridadeAntiga(prioridade);
  const tg = normalizeTags(tags);
  const sb = normalizeSubtarefas(subtarefas);
  const rc = normalizeRecorrencia(recorrencia);

  const arquivado = st === "ARQUIVADA";
  const arquivadaMotivo = arquivado ? "MANUAL" : null;

  const ref = await db.collection("tarefas").add({
    projetoId,
    uid: user.uid,

    titulo: String(titulo).trim(),
    descricao: String(descricao || "").trim(),
    responsavel: String(responsavel || "").trim(),

    prioridade: pr,
    status: st,

    tags: tg,
    subtarefas: sb,

    recorrencia: rc,

    dataInicio: dataInicio || null,
    dataVencimento: dataVencimento || null,

    arquivado,
    arquivadaMotivo,
    concluidaEm: null,

    ordem: Number.isFinite(ordem) ? ordem : 0,

    criadoEm: nowTs(),
    updatedAt: nowTs(),
    createdByUid: user.uid,
    updatedByUid: user.uid,
  });

  return ref.id;
}

export async function atualizarTarefa(tarefaId, patch) {
  const db = getFirestore();
  const user = requireUser();

  const safePatch = { ...(patch || {}) };

  if (safePatch.status) {
    safePatch.status = mapStatusAntigo(safePatch.status);
    if (!STATUS_TAREFA.includes(safePatch.status)) throw new Error("Status inválido.");
  }

  if (safePatch.prioridade) safePatch.prioridade = mapPrioridadeAntiga(safePatch.prioridade);
  if ("tags" in safePatch) safePatch.tags = normalizeTags(safePatch.tags);
  if ("subtarefas" in safePatch) safePatch.subtarefas = normalizeSubtarefas(safePatch.subtarefas);
  if ("recorrencia" in safePatch) safePatch.recorrencia = normalizeRecorrencia(safePatch.recorrencia);

  // coerência: arquivado => status ARQUIVADA
  if (safePatch.arquivado === true) safePatch.status = "ARQUIVADA";
  if (safePatch.status === "ARQUIVADA") safePatch.arquivado = true;
  if (safePatch.status && safePatch.status !== "ARQUIVADA") safePatch.arquivado = false;

  safePatch.updatedAt = nowTs();
  safePatch.updatedByUid = user.uid;

  await db.collection("tarefas").doc(tarefaId).update(safePatch);
}

export async function concluirTarefa(tarefaId) {
  // Concluir = arquivar + concluidaEm
  return atualizarTarefa(tarefaId, {
    status: "ARQUIVADA",
    arquivado: true,
    arquivadaMotivo: "CONCLUIDA",
    concluidaEm: nowTs(),
  });
}

export async function arquivarTarefa(tarefaId) {
  // Arquivar manual (sem concluir)
  return atualizarTarefa(tarefaId, {
    status: "ARQUIVADA",
    arquivado: true,
    arquivadaMotivo: "MANUAL",
  });
}

export async function desarquivarTarefa(tarefaId) {
  // Reabrir
  return atualizarTarefa(tarefaId, {
    status: "A_FAZER",
    arquivado: false,
    arquivadaMotivo: null,
    concluidaEm: null,
  });
}

export async function apagarTarefa(tarefaId) {
  const db = getFirestore();
  requireUser();
  await db.collection("tarefas").doc(tarefaId).delete();
}

export function listenTarefas({ projetoId = null, incluirArquivadas = false, onData, onError }) {
  const db = getFirestore();
  const user = requireUser();

  // ✅ Query mínima SEM index composto:
  // pega tudo do usuário e filtra no front.
  return db
    .collection("tarefas")
    .where("uid", "==", user.uid)
    .onSnapshot(
      (snap) => {
        let items = snap.docs.map(normalizeTarefa);

        if (projetoId) items = items.filter((t) => t.projetoId === projetoId);

        if (!incluirArquivadas) items = items.filter((t) => !t.arquivado);

        items.sort(sortTarefas);
        onData(items);
      },
      (err) => onError?.(err)
    );
}
