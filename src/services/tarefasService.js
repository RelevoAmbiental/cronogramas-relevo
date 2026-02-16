// src/services/tarefasService.js
// =======================================================
// Tarefas (v2) — Portal Relevo / Cronograma
// - Dados em PT-BR (status/recorrência/prioridade)
// - Datas no Firestore: Timestamp
// - UI pode exibir DD/MM/AAAA
// - Query mínima: filtra por uid e pós-filtra no front (evita índice composto)
// =======================================================
import { getFirestore, getCurrentUser } from "../firebase-adapter";

function requireUser() {
  const user = getCurrentUser();
  if (!user) throw new Error("Usuário não autenticado.");
  return user;
}

const nowTs = () => window.firebase.firestore.FieldValue.serverTimestamp();
const Ts = () => window.firebase.firestore.Timestamp;

export const STATUS = {
  A_FAZER: "A_FAZER",
  FAZENDO: "FAZENDO",
  ACOMPANHANDO: "ACOMPANHANDO",
  CONCLUIDA: "CONCLUIDA",
  ARQUIVADA: "ARQUIVADA",
};

export const PRIORIDADE = {
  BAIXA: "BAIXA",
  MEDIA: "MEDIA",
  ALTA: "ALTA",
  URGENTE: "URGENTE",
};

export const RECORRENCIA_FREQ = {
  DIARIO: "DIARIO",
  SEMANAL: "SEMANAL",
  MENSAL: "MENSAL",
};

const STATUS_VALIDO = Object.values(STATUS);
const PRIORIDADE_VALIDA = Object.values(PRIORIDADE);
const FREQ_VALIDA = Object.values(RECORRENCIA_FREQ);

function mapStatusAntigo(s) {
  if (!s) return STATUS.A_FAZER;
  // antigo (tela antiga)
  if (s === "A fazer") return STATUS.A_FAZER;
  if (s === "Fazendo") return STATUS.FAZENDO;
  if (s === "Concluida" || s === "Concluída") return STATUS.CONCLUIDA;

  // antigo (todo/doing/done)
  if (s === "todo") return STATUS.A_FAZER;
  if (s === "doing") return STATUS.FAZENDO;
  if (s === "done") return STATUS.CONCLUIDA;

  // já novo
  if (STATUS_VALIDO.includes(s)) return s;

  return STATUS.A_FAZER;
}

function normalizeTags(tags) {
  if (!Array.isArray(tags)) return [];
  return tags
    .map((x) => String(x || "").trim())
    .filter(Boolean)
    .slice(0, 25);
}

function normalizeSubtarefas(subtarefas) {
  if (!Array.isArray(subtarefas)) return [];
  return subtarefas
    .map((st, i) => ({
      id: String(st?.id || `st_${i + 1}`),
      texto: String(st?.texto || "").trim(),
      done: Boolean(st?.done),
      ordem: Number.isFinite(st?.ordem) ? st.ordem : i,
    }))
    .filter((st) => st.texto)
    .slice(0, 50);
}

function normalizeRecorrencia(rec) {
  if (!rec) return null;
  const freq = rec.freq || rec.frequencia;
  if (!FREQ_VALIDA.includes(freq)) return null;

  const interval = Number.isFinite(rec.interval) ? rec.interval : 1;

  const byWeekday = Array.isArray(rec.byWeekday)
    ? rec.byWeekday.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 0 && n <= 6)
    : [];

  const byMonthday = Array.isArray(rec.byMonthday)
    ? rec.byMonthday.map((n) => Number(n)).filter((n) => Number.isFinite(n) && n >= 1 && n <= 31)
    : [];

  const timezone = String(rec.timezone || "America/Sao_Paulo");

  return {
    freq,
    interval,
    byWeekday,
    byMonthday,
    timezone,
  };
}

function normalizeTarefa(doc) {
  const t = { id: doc.id, ...doc.data() };

  // Compat: nome -> titulo
  if (!t.titulo) t.titulo = t.nome || "(sem título)";

  // Compat: arquivado boolean antigo
  const arquivadoBool =
    typeof t.arquivado === "boolean"
      ? t.arquivado
      : typeof t.arquivada === "boolean"
        ? t.arquivada
        : false;

  // Status
  t.status = mapStatusAntigo(t.status);
  if (arquivadoBool && t.status !== STATUS.ARQUIVADA && t.status !== STATUS.CONCLUIDA) {
    // se o doc antigo marcou arquivado, assume concluída
    t.status = STATUS.CONCLUIDA;
  }

  // Prioridade
  if (!PRIORIDADE_VALIDA.includes(t.prioridade)) t.prioridade = PRIORIDADE.MEDIA;

  // Tags / subtarefas
  t.tags = normalizeTags(t.tags);
  t.subtarefas = normalizeSubtarefas(t.subtarefas);

  // Recorrência (quando vier no doc)
  t.recorrencia = normalizeRecorrencia(t.recorrencia);

  // Responsável (texto simples no MVP)
  if (!t.responsavel) t.responsavel = "";

  // Projeto
  if (!t.projetoId) t.projetoId = null;

  // Datas: mantém Timestamp (se vier string antiga, mantém como string; UI vai lidar)
  return t;
}

function sortTarefas(a, b) {
  // 1) vencimento asc
  const aV = a.dataVencimento?.toMillis?.() ?? 0;
  const bV = b.dataVencimento?.toMillis?.() ?? 0;
  if (aV !== bV) return aV - bV;

  // 2) prioridade (URGENTE > ALTA > MEDIA > BAIXA)
  const pr = { URGENTE: 4, ALTA: 3, MEDIA: 2, BAIXA: 1 };
  const p = (pr[b.prioridade] ?? 2) - (pr[a.prioridade] ?? 2);
  if (p !== 0) return p;

  // 3) updatedAt desc
  const aU = a.updatedAt?.toMillis?.() ?? a.criadoEm?.toMillis?.() ?? 0;
  const bU = b.updatedAt?.toMillis?.() ?? b.criadoEm?.toMillis?.() ?? 0;
  return bU - aU;
}

function toTimestampFromYMD(ymd) {
  // ymd: "YYYY-MM-DD" (input date)
  if (!ymd) return null;
  const [y, m, d] = String(ymd).split("-").map((x) => Number(x));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  const dt = new Date(y, m - 1, d, 12, 0, 0, 0); // meio-dia reduz risco de timezone
  return Ts().fromDate(dt);
}

function stripUndefined(obj) {
  const out = {};
  Object.entries(obj || {}).forEach(([k, v]) => {
    if (v !== undefined) out[k] = v;
  });
  return out;
}

// =======================================================
// CRUD — TAREFAS (instâncias e tarefas únicas)
// =======================================================

export async function criarTarefa(payload) {
  const db = getFirestore();
  const user = requireUser();

  const {
    titulo,
    descricao = "",
    projetoId = null,
    responsavel = "",
    prioridade = PRIORIDADE.MEDIA,
    tags = [],
    subtarefas = [],
    status = STATUS.A_FAZER,
    dataVencimento = null, // "YYYY-MM-DD" ou Timestamp
    dataInicio = null, // "YYYY-MM-DD" ou Timestamp
    esforcoHoras = null,
    dependsOn = [],
    recorrencia = null, // se vier, cria modelo + primeira instância
  } = payload || {};

  if (!String(titulo || "").trim()) throw new Error("Título/Nome da tarefa é obrigatório.");
  if (!STATUS_VALIDO.includes(status)) throw new Error("Status inválido.");
  if (!PRIORIDADE_VALIDA.includes(prioridade)) throw new Error("Prioridade inválida.");

  const recNorm = normalizeRecorrencia(recorrencia);

  // Datas
  const vencTs =
    typeof dataVencimento === "string" ? toTimestampFromYMD(dataVencimento) : dataVencimento || null;
  const iniTs =
    typeof dataInicio === "string" ? toTimestampFromYMD(dataInicio) : dataInicio || null;

  // Se tiver recorrência: cria modelo e uma instância inicial (proxima ocorrência)
  if (recNorm) {
    const modeloRef = await db.collection("tarefas_modelos").add({
      tipo: "MODELO_RECORRENTE",
      titulo: String(titulo).trim(),
      descricao: String(descricao || "").trim(),
      projetoId: projetoId || null,
      responsavel: String(responsavel || "").trim(),
      prioridade,
      tags: normalizeTags(tags),
      subtarefas: normalizeSubtarefas(subtarefas),

      recorrencia: recNorm,
      ativo: true,
      timezone: recNorm.timezone || "America/Sao_Paulo",

      janelaGeracaoDias: 90,
      criadoEm: nowTs(),
      updatedAt: nowTs(),
      uid: user.uid,
      ownerEmail: user.email || "",
      createdByUid: user.uid,
      updatedByUid: user.uid,
    });

    // Primeira ocorrência: se o usuário informou vencimento, usa; senão calcula o próximo ciclo.
    const ocorrenciaEm = vencTs || Ts().fromDate(new Date());
    const instRef = await db.collection("tarefas").add({
      tipo: "INSTANCIA_RECORRENTE",
      modeloId: modeloRef.id,
      ocorrenciaEm,

      titulo: String(titulo).trim(),
      descricao: String(descricao || "").trim(),
      projetoId: projetoId || null,
      responsavel: String(responsavel || "").trim(),
      prioridade,
      tags: normalizeTags(tags),
      subtarefas: normalizeSubtarefas(subtarefas),

      status,
      dataInicio: iniTs,
      dataVencimento: ocorrenciaEm,
      esforcoHoras: Number.isFinite(esforcoHoras) ? esforcoHoras : null,
      dependsOn: Array.isArray(dependsOn) ? dependsOn : [],

      uid: user.uid,
      ownerEmail: user.email || "",

      criadoEm: nowTs(),
      updatedAt: nowTs(),
      createdByUid: user.uid,
      updatedByUid: user.uid,
    });

    return { tarefaId: instRef.id, modeloId: modeloRef.id };
  }

  const ref = await db.collection("tarefas").add({
    tipo: "TAREFA_UNICA",
    titulo: String(titulo).trim(),
    descricao: String(descricao || "").trim(),
    projetoId: projetoId || null,
    responsavel: String(responsavel || "").trim(),
    prioridade,
    tags: normalizeTags(tags),
    subtarefas: normalizeSubtarefas(subtarefas),

    status,
    dataInicio: iniTs,
    dataVencimento: vencTs,
    esforcoHoras: Number.isFinite(esforcoHoras) ? esforcoHoras : null,
    dependsOn: Array.isArray(dependsOn) ? dependsOn : [],

    uid: user.uid,
    ownerEmail: user.email || "",

    criadoEm: nowTs(),
    updatedAt: nowTs(),
    createdByUid: user.uid,
    updatedByUid: user.uid,
  });

  return { tarefaId: ref.id, modeloId: null };
}

export async function atualizarTarefa(tarefaId, patch) {
  const db = getFirestore();
  const user = requireUser();

  if (!tarefaId) throw new Error("tarefaId é obrigatório.");
  const safePatch = { ...(patch || {}) };

  if (safePatch.status) safePatch.status = mapStatusAntigo(safePatch.status);
  if (safePatch.status && !STATUS_VALIDO.includes(safePatch.status)) {
    throw new Error("Status inválido.");
  }

  if (safePatch.prioridade && !PRIORIDADE_VALIDA.includes(safePatch.prioridade)) {
    throw new Error("Prioridade inválida.");
  }

  if (safePatch.tags) safePatch.tags = normalizeTags(safePatch.tags);
  if (safePatch.subtarefas) safePatch.subtarefas = normalizeSubtarefas(safePatch.subtarefas);

  // Datas aceitam "YYYY-MM-DD" ou Timestamp
  if (typeof safePatch.dataVencimento === "string") safePatch.dataVencimento = toTimestampFromYMD(safePatch.dataVencimento);
  if (typeof safePatch.dataInicio === "string") safePatch.dataInicio = toTimestampFromYMD(safePatch.dataInicio);

  safePatch.updatedAt = nowTs();
  safePatch.updatedByUid = user.uid;

  await db.collection("tarefas").doc(tarefaId).update(stripUndefined(safePatch));
}

export async function concluirTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { status: STATUS.CONCLUIDA, concluidaEm: nowTs() });
}

export async function reabrirTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { status: STATUS.A_FAZER, concluidaEm: null });
}

export async function arquivarTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { status: STATUS.ARQUIVADA });
}

export async function desarquivarTarefa(tarefaId) {
  return atualizarTarefa(tarefaId, { status: STATUS.A_FAZER });
}

export async function apagarTarefa(tarefaId) {
  const db = getFirestore();
  requireUser();
  await db.collection("tarefas").doc(tarefaId).delete();
}

// =======================================================
// LISTEN — tarefas (instâncias/unicas)
// =======================================================
export function listenTarefas({
  projetoId = null,
  status = null, // string ou array
  incluirConcluidas = false,
  incluirArquivadas = false,
  filtroResponsavel = "",
  filtroTags = [], // array de tags (match any)
  onData,
  onError,
}) {
  const db = getFirestore();
  const user = requireUser();

  const statusList = Array.isArray(status) ? status : status ? [status] : null;
  const resp = String(filtroResponsavel || "").trim().toLowerCase();
  const tags = normalizeTags(filtroTags);

  return db
    .collection("tarefas")
    .where("uid", "==", user.uid)
    .onSnapshot(
      (snap) => {
        let items = snap.docs.map(normalizeTarefa);

        if (projetoId) items = items.filter((t) => t.projetoId === projetoId);

        if (!incluirConcluidas) items = items.filter((t) => t.status !== STATUS.CONCLUIDA);
        if (!incluirArquivadas) items = items.filter((t) => t.status !== STATUS.ARQUIVADA);

        if (statusList && statusList.length) {
          const set = new Set(statusList.map(mapStatusAntigo));
          items = items.filter((t) => set.has(t.status));
        }

        if (resp) {
          items = items.filter((t) => String(t.responsavel || "").toLowerCase().includes(resp));
        }

        if (tags.length) {
          items = items.filter((t) => Array.isArray(t.tags) && t.tags.some((x) => tags.includes(x)));
        }

        items.sort(sortTarefas);
        onData(items);
      },
      (err) => onError?.(err)
    );
}
