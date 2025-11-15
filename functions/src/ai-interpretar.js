const OpenAI = require("openai");
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.interpretarProposta = async (texto) => {
  const prompt = `
Você é uma IA especialista em análise ambiental e espeleológica da Relevo Consultoria.

Extraia da proposta:

- Objetivo do projeto
- Etapas
- Atividades
- Entregáveis
- Datas importantes
- Marco inicial e final
- Agenda de pagamentos (se existir)
- Prazos de elaboração
- Equipe envolvida

Retorne tudo em JSON com esta estrutura:

{
  "objetivo": "",
  "etapas": [
    {
      "nome": "",
      "atividades": [],
      "duracaoDias": 0,
      "dependencias": []
    }
  ],
  "entregaveis": [],
  "pagamentos": [],
  "observacoes": ""
}

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
