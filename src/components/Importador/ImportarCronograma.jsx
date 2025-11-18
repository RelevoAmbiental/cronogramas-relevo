import React, { useState } from "react";
import "./importar.css";
import { useCronograma } from "../../context/CronogramaContext";

export default function ImportarCronograma() {
  const { criarTarefa } = useCronograma();

  const [texto, setTexto] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [processando, setProcessando] = useState(false);

  async function processarIA() {
    setProcessando(true);

    // 🔥 IA SIMULADA – depois substituímos por Cloud Function com ChatGPT
    const simulacaoIA = extrairTarefasDoTexto(texto);

    setTarefasExtraidas(simulacaoIA);
    setProcessando(false);
  }

  async function salvarNoFirestore() {
    for (const tarefa of tarefasExtraidas) {
      await criarTarefa({
        nome: tarefa.nome,
        inicio: tarefa.inicio,
        fim: tarefa.fim,
        descricao: tarefa.descricao,
      });
    }

    alert("Tarefas importadas com sucesso!");
  }

  return (
    <div className="importar-container">
      <h1>Importar Cronograma</h1>

      <textarea
        placeholder="Cole aqui o texto do orçamento / metodologia..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      <button onClick={processarIA} disabled={processando || !texto.trim()}>
        {processando ? "Processando IA..." : "Gerar Cronograma com IA"}
      </button>

      {tarefasExtraidas.length > 0 && (
        <>
          <h2>Pré-visualização do Cronograma</h2>

          <div className="preview-list">
            {tarefasExtraidas.map((t, i) => (
              <div key={i} className="preview-item">
                <strong>{t.nome}</strong>
                <p>{t.descricao}</p>
                <p>
                  <b>Início:</b> {t.inicio} • <b>Fim:</b> {t.fim}
                </p>
              </div>
            ))}
          </div>

          <button onClick={salvarNoFirestore} className="btn-salvar">
            Salvar no Cronograma
          </button>
        </>
      )}
    </div>
  );
}

/**
 * 🧠 SIMULAÇÃO DE IA
 * 
 * Depois substituímos isso por uma Cloud Function com ChatGPT.
 */
function extrairTarefasDoTexto(texto) {
  const linhas = texto.split("\n").map((l) => l.trim());
  const tarefas = [];

  linhas.forEach((linha) => {
    if (linha.match(/dias|dia|entrega|relatório|campo/i)) {
      tarefas.push({
        nome: linha.substring(0, 40),
        descricao: linha,
        inicio: "2025-01-10",
        fim: "2025-01-15",
      });
    }
  });

  return tarefas;
}
