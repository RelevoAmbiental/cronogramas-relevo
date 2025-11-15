const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const { extrairArquivo } = require("./src/ai-extrair");
const { interpretarProposta } = require("./src/ai-interpretar");
const { gerarCronograma } = require("./src/ai-cronograma");

// =======================================================
// 🔥 1. Upload de arquivo > Extrair texto PDF/DOCX
// =======================================================
exports.extrairTexto = functions.https.onRequest(async (req, res) => {
  try {
    const texto = await extrairArquivo(req);
    res.status(200).send({ texto });
  } catch (err) {
    console.error("Erro ao extrair texto:", err);
    res.status(500).send({ error: "erro-extracao" });
  }
});

// =======================================================
// 🔥 2. IA: Interpretar proposta e gerar estrutura JSON
// =======================================================
exports.interpretarProposta = functions.https.onCall(async (data, context) => {
  const { texto } = data;
  return await interpretarProposta(texto);
});

// =======================================================
// 🔥 3. IA: Gerar cronograma estruturado
// =======================================================
exports.gerarCronograma = functions.https.onCall(async (data, context) => {
  const { estrutura } = data;
  return await gerarCronograma(estrutura);
});
