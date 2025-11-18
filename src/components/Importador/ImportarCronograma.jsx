import React, { useState } from "react";
import "./importar.css";
import { useCronograma } from "../../context/CronogramaContext";
import * as pdfjsLib from "pdfjs-dist/webpack";
import mammoth from "mammoth";

export default function ImportarCronograma() {
  const { criarTarefa } = useCronograma();

  const [texto, setTexto] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");

  // -------------------------------
  // 📌 Função para ler arquivos
  // -------------------------------
  async function lerArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;

    setArquivoNome(file.name);

    const extensao = file.name.toLowerCase().split(".").pop();

    if (extensao === "txt") {
      const reader = new FileReader();
      reader.onload = () => setTexto(reader.result);
      reader.readAsText(file);
    }

    if (extensao === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

      let textoProcessado = "";
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const strings = content.items.map((item) => item.str).join(" ");
        textoProcessado += strings + "\n";
      }

      setTexto(textoProcessado);
    }

    if (extensao === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setTexto(result.value);
    }
  }

  // -------------------------------
  // 📌 Processamento com IA (simulado)
  // -------------------------------
  async function processarIA() {
    setProcessando(true);

    const simulacaoIA = extrairTarefasDoTexto(texto);

    setTarefasExtraidas(simulacaoIA);
    setProcessando(false);
  }

  // -------------------------------
  // 📌 Salvar no Firestore
  // -------------------------------
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

      {/* ANEXAR ARQUIVO */}
      <label className="upload-label">
        <input type="file" accept=".txt, .pdf, .docx" onChange={lerArquivo} />
        Selecionar arquivo (.pdf, .docx, .txt)
      </label>

      {arquivoNome && <p><b>Arquivo:</b> {arquivoNome}</p>}

      {/* ÁREA DE TEXTO */}
      <textarea
        placeholder="Ou cole manualmente o texto do orçamento / metodologia..."
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

// -------------------------------------
// 🧠 Função de IA (simulada)
// -------------------------------------
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
