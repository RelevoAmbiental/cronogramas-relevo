import React, { useState } from "react";
import "./importar.css";
import { useCronograma } from "../../context/CronogramaContext";

// PDF.js – já instalado no package.json
import * as pdfjsLib from "pdfjs-dist/build/pdf";
// Worker via CDN (compatível com Vite/GitHub Pages)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";

import mammoth from "mammoth";

// Endpoint opcional de IA real (Cloud Functions)
const IA_ENDPOINT = import.meta.env.VITE_IA_CRONOGRAMA_ENDPOINT || null;

export default function ImportarCronograma() {
  const { criarTarefa, projetos } = useCronograma();

  const [texto, setTexto] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState("");

  // -------------------------------
  // 📌 Leitura de arquivos
  // -------------------------------
  async function lerArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;

    setArquivoNome(file.name);

    const extensao = file.name.toLowerCase().split(".").pop();

    // TXT
    if (extensao === "txt") {
      const reader = new FileReader();
      reader.onload = () => setTexto(reader.result);
      reader.readAsText(file);
      return;
    }

    // PDF
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
      return;
    }

    // DOCX
    if (extensao === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setTexto(result.value);
      return;
    }

    alert("Formato de arquivo não suportado. Use .pdf, .docx ou .txt.");
  }

  // -------------------------------
  // 📌 Processamento com IA (Cloud + heurística)
  // -------------------------------
  async function processarIA() {
    if (!projetoSelecionado) {
      alert("Selecione um projeto para associar as tarefas.");
      return;
    }

    if (!texto.trim()) {
      alert("Cole um texto ou anexe um arquivo antes de processar.");
      return;
    }

    setProcessando(true);
    let tarefas = [];

    // 1) Tenta IA remota (Cloud Function)
    if (IA_ENDPOINT) {
      try {
        const resp = await fetch(IA_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            texto,
            projetoId: projetoSelecionado,
          }),
        });

        if (!resp.ok) {
          throw new Error("Erro HTTP na IA remota");
        }

        const data = await resp.json();
        if (Array.isArray(data.tarefas) && data.tarefas.length > 0) {
          tarefas = normalizarTarefasDaIA(data.tarefas);
          console.log("Tarefas da IA remota:", tarefas);
        }
      } catch (err) {
        console.error("Falha na IA remota, usando heurística local:", err);
      }
    }

    // 2) Se não vier nada da IA real, usa heurística local
    if (!tarefas.length) {
      tarefas = extrairTarefasDoTexto(texto);
      console.log("Tarefas geradas pela heurística local:", tarefas);
    }

    if (!tarefas.length) {
      alert("Nenhuma tarefa relevante foi identificada no texto.");
      setProcessando(false);
      return;
    }

    setTarefasExtraidas(tarefas);
    setProcessando(false);
  }

  // -------------------------------
  // 📌 Salvar no Firestore
  // -------------------------------
  async function salvarNoFirestore() {
    if (!projetoSelecionado) {
      alert("Selecione um projeto antes de salvar.");
      return;
    }

    if (!tarefasExtraidas.length) {
      alert("Nenhuma tarefa para salvar.");
      return;
    }

    for (const tarefa of tarefasExtraidas) {
      await criarTarefa({
        nome: tarefa.nome || "Tarefa sem nome",
        inicio: tarefa.inicio,
        fim: tarefa.fim,
        descricao: tarefa.descricao,
        projetoId: projetoSelecionado, // 🔥 todas associadas ao mesmo projeto
      });
    }

    alert("Tarefas importadas e salvas no cronograma com sucesso!");
  }

  return (
    <div className="importar-container">
      <h1>Importar Cronograma</h1>

      {/* Seleção de Projeto */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Projeto:
          <select
            value={projetoSelecionado}
            onChange={(e) => setProjetoSelecionado(e.target.value)}
            style={{ marginLeft: "8px" }}
          >
            <option value="">Selecione um projeto…</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome || p.titulo || p.id}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ANEXAR ARQUIVO */}
      <label className="upload-label">
        <input type="file" accept=".txt, .pdf, .docx" onChange={lerArquivo} />
        Selecionar arquivo (.pdf, .docx, .txt)
      </label>

      {arquivoNome && (
        <p>
          <b>Arquivo:</b> {arquivoNome}
        </p>
      )}

      {/* ÁREA DE TEXTO */}
      <textarea
        placeholder="Ou cole manualmente o texto do orçamento / metodologia..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      <button onClick={processarIA} disabled={processando}>
        {processando ? "Processando IA..." : "Gerar Cronograma com IA"}
      </button>

      {/* VALIDAÇÃO DAS TAREFAS */}
      {tarefasExtraidas.length > 0 && (
        <>
          <h2>Validação do Cronograma</h2>
          <p>Ajuste as tarefas antes de salvar definitivamente.</p>

          <div className="preview-list">
            {tarefasExtraidas.map((t, i) => (
              <div key={i} className="preview-item">
                {/* Nome */}
                <label>
                  Nome:
                  <input
                    type="text"
                    value={t.nome}
                    onChange={(e) => {
                      const clone = [...tarefasExtraidas];
                      clone[i].nome = e.target.value;
                      setTarefasExtraidas(clone);
                    }}
                  />
                </label>

                {/* Descrição */}
                <label>
                  Descrição:
                  <textarea
                    value={t.descricao}
                    onChange={(e) => {
                      const clone = [...tarefasExtraidas];
                      clone[i].descricao = e.target.value;
                      setTarefasExtraidas(clone);
                    }}
                  />
                </label>

                {/* Datas */}
                <div className="datas-linha">
                  <label>
                    Início:
                    <input
                      type="date"
                      value={t.inicio}
                      onChange={(e) => {
                        const clone = [...tarefasExtraidas];
                        clone[i].inicio = e.target.value;
                        setTarefasExtraidas(clone);
                      }}
                    />
                  </label>

                  <label>
                    Fim:
                    <input
                      type="date"
                      value={t.fim}
                      onChange={(e) => {
                        const clone = [...tarefasExtraidas];
                        clone[i].fim = e.target.value;
                        setTarefasExtraidas(clone);
                      }}
                    />
                  </label>
                </div>

                <button
                  className="btn-remover"
                  onClick={() => {
                    const filtrado = tarefasExtraidas.filter(
                      (_, idx) => idx !== i
                    );
                    setTarefasExtraidas(filtrado);
                  }}
                >
                  Remover tarefa
                </button>
              </div>
            ))}
          </div>

          <button
            className="btn-add"
            onClick={() =>
              setTarefasExtraidas([
                ...tarefasExtraidas,
                {
                  nome: "",
                  descricao: "",
                  inicio: hojeISO(),
                  fim: hojeISO(),
                },
              ])
            }
          >
            + Adicionar tarefa
          </button>

          <button onClick={salvarNoFirestore} className="btn-salvar">
            Salvar no Cronograma
          </button>
        </>
      )}
    </div>
  );
}

/* -------------------------------------
 * 🧠 Normalização de retorno da IA real
 * ----------------------------------- */
function normalizarTarefasDaIA(lista) {
  return lista
    .map((t) => ({
      nome: t.nome || t.titulo || "",
      descricao: t.descricao || t.obs || "",
      inicio: t.inicio || hojeISO(),
      fim: t.fim || t.termino || t.fimPrevisto || hojeISO(),
    }))
    .filter((t) => t.nome || t.descricao);
}

/* -------------------------------------
 * 🧠 Heurística local de extração
 * ----------------------------------- */

function extrairTarefasDoTexto(texto) {
  if (!texto) return [];

  const bruto = texto.replace(/\r/g, "\n");
  const blocos = bruto
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const candidatos =
    blocos.length >= 3 ? blocos : bruto.split("\n").map((l) => l.trim());

  const tarefas = [];
  let cursorData = inferirDataBase(texto) || hojeISO();

  for (const linha of candidatos) {
    if (!linha) continue;

    // Filtro de linhas relevantes
    if (
      !linha.match(
        /(campo|relatóri|entrega|produto|etapa|atividade|mobilizaç|visita|prospecç|monitoramento|anális)/i
      ) &&
      !linha.match(/\b\d+\s*dias?\b/i)
    ) {
      continue;
    }

    // Tenta achar intervalo de datas "12 a 16 de março"
    const range = extrairRangeDatas(linha);
    let inicio, fim;

    if (range) {
      inicio = range.inicio;
      fim = range.fim;
      cursorData = addDiasISO(fim, 1);
    } else {
      const dias = extrairDuracaoDias(linha);
      if (dias && dias > 0) {
        inicio = cursorData;
        const fimDate = addDiasISO(inicio, dias - 1);
        fim = fimDate;
        cursorData = addDiasISO(fim, 1);
      } else {
        // fallback: 1 dia
        inicio = cursorData;
        fim = cursorData;
        cursorData = addDiasISO(cursorData, 1);
      }
    }

    tarefas.push({
      nome: gerarNomeTarefa(linha),
      descricao: linha,
      inicio,
      fim,
    });
  }

  return tarefas;
}

/* -------------------------------------
 * Utilitários de datas e parsing
 * ----------------------------------- */

const MESES_PT = {
  janeiro: 1,
  fevereiro: 2,
  marco: 3,
  março: 3,
  abril: 4,
  maio: 5,
  junho: 6,
  julho: 7,
  agosto: 8,
  setembro: 9,
  outubro: 10,
  novembro: 11,
  dezembro: 12,
};

function hojeISO() {
  const d = new Date();
  return d.toISOString().substring(0, 10);
}

function addDiasISO(iso, dias) {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d.toISOString().substring(0, 10);
}

function extrairDuracaoDias(texto) {
  const m = texto.match(/(\d{1,3})\s*dias?\b/i);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function extrairRangeDatas(texto) {
  // Exemplos capturados:
  // "de 12 a 16 de março de 2026"
  // "12 a 16 de março"
  const regex =
    /(?:de\s+)?(\d{1,2})\s*(?:a|até|-)\s*(\d{1,2})\s*(?:de\s+)?([a-zç]+)(?:\s+de\s+(\d{4}))?/i;

  const m = texto.match(regex);
  if (!m) return null;

  const diaIni = parseInt(m[1], 10);
  const diaFim = parseInt(m[2], 10);
  const mesNome = m[3].toLowerCase();
  const ano = m[4] ? parseInt(m[4], 10) : new Date().getFullYear();

  const mes = MESES_PT[mesNome];
  if (!mes) return null;

  const inicio = new Date(ano, mes - 1, diaIni);
  const fim = new Date(ano, mes - 1, diaFim);

  return {
    inicio: inicio.toISOString().substring(0, 10),
    fim: fim.toISOString().substring(0, 10),
  };
}

function inferirDataBase(texto) {
  // Poderíamos ficar mais sofisticados aqui:
  // procurar por "em março de 2026", etc. Por enquanto, retorna hoje.
  return hojeISO();
}

function gerarNomeTarefa(linha) {
  // Pega o início da frase e corta em ~60 caracteres
  const limpo = linha.replace(/\s+/g, " ").trim();
  if (limpo.length <= 60) return limpo;
  return limpo.substring(0, 57) + "...";
}
