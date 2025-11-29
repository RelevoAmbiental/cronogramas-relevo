const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * IA da Relevo — Conversão de texto (TR, orçamento, escopo)
 * em tarefas estruturadas para o módulo de Cronograma.
 *
 * Retorna uma LISTA de tarefas no formato:
 *
 * [
 *   {
 *     nome: "",
 *     descricao: "",
 *     categoria: "",
 *     produto: "",
 *     responsavel: "",
 *     inicioRelativoDias: 0,
 *     duracaoDias: 0,
 *     status: "pendente"
 *   }
 * ]
 *
 */

exports.interpretarTexto = async function interpretarTexto(texto) {

  const prompt = `
Você é a IA oficial da Relevo Consultoria Ambiental, especializada em transformar escopos, orçamentos e termos de referência em cronogramas executivos.

OBJETIVO:
A partir do texto abaixo, extraia:
- Produtos (entregas principais)
- Atividades necessárias para cada produto
- Sequência lógica das atividades
- Durações estimadas
- Datas relativas ao início (startDate será aplicada fora do modelo)
- Responsáveis (se mencionados; caso contrário deixe vazio)

Retorne APENAS um JSON válido contendo uma LISTA de tarefas no formato:

[
  {
    "nome": "",
    "descricao": "",
    "categoria": "",
    "produto": "",
    "responsavel": "",
    "inicioRelativoDias": 0,
    "duracaoDias": 0,
    "status": "pendente"
  }
]

REGRAS:
1. Identifique produtos/entregas explícitas e implícitas.
2. Gere tarefas completas para cada produto:
   - Planejamento
   - Execução (coleta / campo / análises / processamento)
   - Relatório
   - Revisão interna
   - Entrega final
3. Duracões padrão caso o texto não informe:
   - Planejamento: 2 dias
   - Execução: 5–10 dias (use bom senso)
   - Processamento/análises: 3–7 dias
   - Relatório: 3–5 dias
   - Revisão: 2 dias
4. Use sempre apenas "inicioRelativoDias".
5. Nunca retorne texto fora de JSON.
6. O JSON deve ser totalmente válido e compatível com JSON.parse.

TEXTO:
""" 
${texto}
"""
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: "Você é a IA oficial da Relevo Consultoria Ambiental." },
      { role: "user", content: prompt }
    ],
    temperature: 0.2
  });

  let output = response.choices[0].message.content;

  // Normalização — remove markdown se vier
  output = output.replace(/```json/gi, "").replace(/```/g, "").trim();

  try {
    const json = JSON.parse(output);

    if (!Array.isArray(json)) {
      throw new Error("A IA retornou um JSON que não é uma lista.");
    }

    return json;
  } catch (err) {
    console.error("❌ Erro ao interpretar JSON do modelo:", err);
    console.error("Conteúdo retornado pela IA:", output);

    throw new Error("Falha ao interpretar o JSON retornado pela IA.");
  }
};
