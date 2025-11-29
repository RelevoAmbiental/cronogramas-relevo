const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.interpretarProposta = async (texto) => {
  const prompt = `
Você é uma IA especialista em análise ambiental e espeleológica da Relevo Consultoria.

Analise o texto do orçamento e extraia informações que permitam gerar tarefas automáticas para o cronograma. Considere a data real de início como "dia 0" (caso o texto traga datas absolutas, converta-as para dias relativos a esse início).

Retorne SOMENTE um JSON válido seguindo a estrutura abaixo. Não inclua comentários ou texto fora do JSON.

{
  "objetivo": "",
  "etapas": [
    {
      "nome": "",
      "atividades": [],
      "duracaoDias": 0,
      "dependencias": [],
      "tarefasGeradas": [
        {
          "nome": "",
          "descricao": "",
          "tipo": "operacional",
          "inicioRelativoDias": 0,
          "duracaoDias": 0
        }
      ]
    }
  ],
  "entregaveis": [
    {
      "descricao": "",
      "relacionadoAEtapa": "",
      "relativoDias": 0,
      "tarefas": [
        {
          "nome": "Entrega do produto ou relatório",
          "tipo": "entrega",
          "inicioRelativoDias": 0,
          "duracaoDias": 0
        }
      ]
    }
  ],
  "pagamentos": [
    {
      "descricao": "",
      "gatilho": "Descrição do evento que libera o pagamento",
      "valor": "",
      "relativoDias": 0,
      "tarefasFinanceiras": [
        {
          "nome": "Enviar nota fiscal referente ao evento de pagamento",
          "tipo": "financeiro",
          "inicioRelativoDias": 0,
          "duracaoDias": 0
        },
        {
          "nome": "Recebimento previsto da nota (30 dias após envio)",
          "tipo": "financeiro",
          "inicioRelativoDias": 30,
          "duracaoDias": 0
        }
      ]
    }
  ],
  "observacoes": ""
}

Regras obrigatórias:
- Preencha "tarefasGeradas" em cada etapa usando atividades e prazos mencionados. Se não houver duração exata, use 5 dias por padrão.
- Para cada evento de pagamento identificado, sempre crie as duas tarefas financeiras: enviar nota (no dia do gatilho identificado) e recebimento (30 dias após o envio).
- Sempre crie tarefas de entrega para cada produto/entregável identificado, mesmo que o prazo não esteja explícito (use 0 dias relativos quando não houver indicação).
- Mantenha datas como valores inteiros em dias relativos; não use datas absolutas.
- Garanta que o JSON esteja bem formatado e possa ser convertido diretamente com JSON.parse.

Texto da proposta:
${texto}
`;

  const response = await client.chat.completions.create({
    model: "gpt-4.1",
    messages: [
      { role: "system", content: "Você é uma IA Relevo." },
      { role: "user", content: prompt }
    ]
  });

  return JSON.parse(response.choices[0].message.content);
};
