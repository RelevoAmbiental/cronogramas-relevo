import React, { useState } from "react";
import "./importar.css";
import { useCronograma } from "../../context/CronogramaContext";

import * as pdfjsLib from "pdfjs-dist/build/pdf";
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";

import mammoth from "mammoth";

const IA_ENDPOINT = import.meta.env.VITE_IA_CRONOGRAMA_ENDPOINT || null;

/* ==========================================================
   COMPONENTE PRINCIPAL
   ========================================================== */
export default function ImportarCronograma() {
  const { criarTarefa, projetos = [] } = useCronograma();

  const [texto, setTexto] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState("");
  const [dataBase, setDataBase] = useState("");

  /* ==========================================================
     LEITURA DE ARQUIVOS
     ========================================================== */
  async function lerArquivo(e) {
    const file = e.target.files[0];
    if (!file) return;

    setArquivoNome(file.name);
    const extensao = file.name.toLowerCase().split(".").pop();

    if (extensao === "txt") {
      const reader = new FileReader();
      reader.onload = () => setTexto(reader.result);
      reader.readAsText(file);
      return;
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
      return;
    }

    if (extensao === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      setTexto(result.value);
      return;
    }

    alert("Formato não suportado. Use PDF, DOCX ou TXT.");
  }

  /* ==========================================================
     ↗ PROCESSAMENTO COM IA (OU HEURÍSTICA LOCAL)
     ========================================================== */
  async function processarIA() {
    if (!projetoSelecionado) return alert("Selecione um projeto.");
    if (!dataBase) return alert("Informe a data de início real.");
    if (!texto.trim()) return alert("Cole ou envie um arquivo.");

    setProcessando(true);
    let tarefas = [];

    if (IA_ENDPOINT) {
      try {
        const resp = await fetch(IA_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ texto, projetoId: projetoSelecionado, dataBase }),
        });

        if (!resp.ok) throw new Error("Erro no servidor IA");

        const data = await resp.json();
        if (Array.isArray(data.tarefas) && data.tarefas.length > 0) {
          tarefas = normalizarTarefasDaIA(data.tarefas, dataBase);
        }
      } catch (err) {
        console.error("IA remota falhou, usando heurística local:", err);
      }
    }

    if (!tarefas.length) {
      tarefas = extrairTarefasDoTexto(texto, dataBase);
    }

    if (!tarefas.length) {
      alert("Nenhuma tarefa detectada.");
      setProcessando(false);
      return;
    }

    setTarefasExtraidas(tarefas);
    setProcessando(false);
  }

  /* ==========================================================
     SALVAR NO FIRESTORE
     ========================================================== */
  async function salvarNoFirestore() {
    if (!projetoSelecionado) return alert("Selecione um projeto.");
    if (!tarefasExtraidas.length) return alert("Nenhuma tarefa para salvar.");

    for (const t of tarefasExtraidas) {
      await criarTarefa({
        nome: t.nome || "Tarefa",
        descricao: t.descricao,
        inicio: t.inicio,
        fim: t.fim,
        tipo: t.tipo || "operacional",
        projetoId: projetoSelecionado,
      });
    }

    alert("Tarefas importadas com sucesso!");
  }

  /* ==========================================================
     RENDERIZAÇÃO (LAYOUT PREMIUM)
     ========================================================== */
  return (
    <div className="importar-container">

      <h1 className="import-title">Importar Cronograma</h1>

      {/* LINHA 1: Projeto e Data */}
      <div className="import-row">

        {/* Select de projetos */}
        <div className="import-group">
          <label className="import-label">Projeto</label>
          <select
            className="import-select"
            value={projetoSelecionado}
            onChange={(e) => setProjetoSelecionado(e.target.value)}
          >
            <option value="">Selecione um projeto…</option>
            {projetos.map((p) => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {/* Data */}
        <div className="import-group">
          <label className="import-label">Data real de início</label>
          <input
            type="date"
            className="import-date"
            value={dataBase}
            onChange={(e) => setDataBase(e.target.value)}
          />
        </div>

      </div>

      {/* UPLOAD */}
      <label className="upload-label">
        Selecionar arquivo (.pdf, .docx, .txt)
        <input type="file" accept=".txt,.pdf,.docx" onChange={lerArquivo} />
      </label>

      {arquivoNome && (
        <p className="import-file-name">
          <b>Arquivo:</b> {arquivoNome}
        </p>
      )}

      {/* ÁREA DE TEXTO */}
      <textarea
        className="import-textarea"
        placeholder="Ou cole manualmente o texto do orçamento / metodologia..."
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
      />

      <button
        disabled={processando}
        className="import-generate-btn"
        onClick={processarIA}
      >
        {processando ? "Processando IA..." : "Gerar Cronograma com IA"}
      </button>

      {/* PRÉ-VISUALIZAÇÃO */}
      {tarefasExtraidas.length > 0 && (
        <>
          <h2 className="import-preview-title">Validação das Tarefas</h2>

          <div className="preview-list">
            {tarefasExtraidas.map((t, i) => (
              <div key={i} className="preview-item">

                {/* Tipo */}
                <label>Tipo:</label>
                <select
                  value={t.tipo}
                  onChange={(e) => {
                    const c = [...tarefasExtraidas];
                    c[i].tipo = e.target.value;
                    setTarefasExtraidas(c);
                  }}
                >
                  <option value="operacional">Operacional</option>
                  <option value="entrega">Entrega / Produto</option>
                  <option value="financeiro">Financeiro</option>
                </select>

                {/* Nome */}
                <label>Nome:</label>
                <input
                  type="text"
                  value={t.nome}
                  onChange={(e) => {
                    const c = [...tarefasExtraidas];
                    c[i].nome = e.target.value;
                    setTarefasExtraidas(c);
                  }}
                />

                {/* Descrição */}
                <label>Descrição:</label>
                <textarea
                  value={t.descricao}
                  onChange={(e) => {
                    const c = [...tarefasExtraidas];
                    c[i].descricao = e.target.value;
                    setTarefasExtraidas(c);
                  }}
                />

                {/* Datas */}
                <div className="datas-linha">
                  <label>
                    Início:
                    <input
                      type="date"
                      value={t.inicio}
                      onChange={(e) => {
                        const c = [...tarefasExtraidas];
                        c[i].inicio = e.target.value;
                        setTarefasExtraidas(c);
                      }}
                    />
                  </label>

                  <label>
                    Fim:
                    <input
                      type="date"
                      value={t.fim}
                      onChange={(e) => {
                        const c = [...tarefasExtraidas];
                        c[i].fim = e.target.value;
                        setTarefasExtraidas(c);
                      }}
                    />
                  </label>
                </div>

                <button
                  className="btn-remover"
                  onClick={() => {
                    const novo = tarefasExtraidas.filter((_, x) => x !== i);
                    setTarefasExtraidas(novo);
                  }}
                >
                  Remover tarefa
                </button>
              </div>
            ))}
          </div>

          {/* ADD */}
          <button
            className="btn-add"
            onClick={() =>
              setTarefasExtraidas([
                ...tarefasExtraidas,
                {
                  nome: "",
                  descricao: "",
                  tipo: "operacional",
                  inicio: dataBase,
                  fim: addDiasISO(dataBase, 5),
                },
              ])
            }
          >
            + Adicionar tarefa
          </button>

          {/* SALVAR */}
          <button className="btn-salvar" onClick={salvarNoFirestore}>
            Salvar no Cronograma
          </button>
        </>
      )}
    </div>
  );
}

/* ==========================================================
   FUNÇÕES AUXILIARES
   ========================================================== */
function normalizarTarefasDaIA(lista, dataBase) {
  const base = dataBase;
  return lista.map((t) => ({
    nome: t.nome || "Tarefa",
    descricao: t.descricao || "",
    inicio: t.inicio || base,
    fim: t.fim || addDiasISO(base, 5),
    tipo: t.tipo || "operacional",
  }));
}

function extrairTarefasDoTexto(texto, dataBase) {
  if (!texto) return [];
  return [
    {
      nome: "Execução do serviço",
      descricao: texto.substring(0, 200),
      inicio: dataBase,
      fim: addDiasISO(dataBase, 5),
      tipo: "operacional",
    },
  ];
}

function addDiasISO(iso, dias) {
  const d = new Date(iso);
  d.setDate(d.getDate() + dias);
  return d.toISOString().substring(0, 10);
}
