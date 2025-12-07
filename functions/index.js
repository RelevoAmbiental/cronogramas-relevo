const functions = require("firebase-functions");
const cors = require("cors")({ origin: true });
const busboy = require("busboy");

// ===== Importações internas =====
const { interpretarTexto } = require("./src/ai-interpretar");
const { extrairArquivo } = require("./src/ai-extrair");
const { gerarCronograma } = require("./src/ai-cronograma");

// ======================================================
// Wrapper CORS
// ======================================================
function withCors(handler) {
  return (req, res) => {
    cors(req, res, () => handler(req, res));
  };
}

// ======================================================
// 1) Endpoint: extrairTexto (LEGADO) — mantido para compatibilidade
// ======================================================
exports.extrairTexto = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      res.json({ ok: true });
    })
  );

// ======================================================
// 2) Endpoint: processarProposta (LEGADO/EXEMPLO)
// ======================================================
exports.processarProposta = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      res.json({ ok: true });
    })
  );

// ======================================================
// 3) Endpoint: gerarCronograma (usa arquivo ai-cronograma.js)
// ======================================================
exports.gerarCronograma = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      try {
        const estrutura = req.body;
        const resultado = await gerarCronograma(estrutura);
        res.json(resultado);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    })
  );

// ======================================================
// 4) NOVO ENDPOINT — interpretarArquivo (UPLOAD + IA)
// ======================================================
exports.interpretarArquivo = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
      }

      try {
        // Extrair texto via PDF/DOCX/TXT usando ai-extrair.js
        const textoExtraido = await extrairArquivo(req);

        if (!textoExtraido || textoExtraido.trim() === "") {
          return res.status(400).json({ error: "Nenhum texto extraído" });
        }

        // Interpretar texto com IA inteligente
        const tarefas = await interpretarTexto(textoExtraido);

        return res.json({
          texto: textoExtraido,
          tarefas,
        });
      } catch (err) {
        console.error("Erro interpretarArquivo:", err);
        return res.status(500).json({ error: err.message });
      }
    })
  );
