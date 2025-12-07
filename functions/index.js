const functions = require("firebase-functions");
const admin = require("firebase-admin");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");
const OpenAI = require("openai");
const cors = require("cors")({ origin: true });

admin.initializeApp();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// =======================================================
// WRAPPER PARA HABILITAR CORS EM TODAS AS ROTAS
// =======================================================
function withCors(handler) {
  return (req, res) => {
    cors(req, res, async () => {
      try {
        await handler(req, res);
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
      }
    });
  };
}

// =======================================================
// 1. extrairTexto
// =======================================================
exports.extrairTexto = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      if (req.method !== "POST") {
        return res.status(405).json({ error: "Método não permitido" });
      }

      const { base64, tipo } = req.body;

      if (!base64 || !tipo) {
        return res.status(400).json({ error: "Parâmetros inválidos" });
      }

      const buffer = Buffer.from(base64, "base64");

      let texto = "";

      if (tipo === "pdf") {
        const data = await pdfParse(buffer);
        texto = data.text;
      } else if (tipo === "docx") {
        const result = await mammoth.extractRawText({ buffer });
        texto = result.value;
      } else {
        return res.status(400).json({ error: "Formato não suportado" });
      }

      res.json({ texto });
    })
  );

// =======================================================
// 2. processarProposta
// =======================================================
exports.processarProposta = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      const { texto } = req.body;

      if (!texto) {
        return res.status(400).json({ error: "Nenhum texto enviado" });
      }

      const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "Extraia a estrutura da proposta em formato JSON válido."
          },
          {
            role: "user",
            content: texto
          }
        ]
      });

      res.json({ estrutura: resposta.choices[0].message.content });
    })
  );

// =======================================================
// 3. gerarCronograma
// =======================================================
exports.gerarCronograma = functions
  .region("us-central1")
  .https.onRequest(
    withCors(async (req, res) => {
      const { estrutura } = req.body;

      if (!estrutura) {
        return res.status(400).json({ error: "Nenhuma estrutura enviada" });
      }

      const resposta = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "Gere um cronograma detalhado com base no JSON fornecido. Use formato organizado, prático e com marcos claros."
          },
          {
            role: "user",
            content: estrutura
          }
        ]
      });

      res.json({ cronograma: resposta.choices[0].message.content });
    })
  );
  // =======================================================
  // 4. interpretarArquivo — upload + extração + IA
  // =======================================================
  
  const { interpretarTexto } = require("./src/ai-interpretar");
  const { extrairArquivo } = require("./src/ai-extrair");
  
  exports.interpretarArquivo = functions
    .region("us-central1")
    .https.onRequest(
      withCors(async (req, res) => {
        if (req.method !== "POST") {
          return res.status(405).json({ error: "Método não permitido" });
        }
  
        try {
          // 1) Extrair texto do arquivo (PDF/DOCX/TXT)
          const textoExtraido = await extrairArquivo(req);
  
          if (!textoExtraido || textoExtraido.trim().length === 0) {
            return res.status(400).json({ error: "Nenhum texto extraído" });
          }
  
          // 2) Interpretar texto com IA Relevo
          const tarefas = await interpretarTexto(textoExtraido);
  
          // 3) Retornar resultado
          res.json({ texto: textoExtraido, tarefas });
        } catch (err) {
          console.error("Erro em interpretarArquivo:", err);
          res.status(500).json({ error: err.message });
        }
      })
    );
