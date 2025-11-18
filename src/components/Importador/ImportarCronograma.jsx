import React, { useState } from "react";
import "./importar.css";
import { useCronograma } from "../../context/CronogramaContext";

// PDF.js – já instalado no package.json
import * as pdfjsLib from "pdfjs-dist/build/pdf";
// Worker via CDN (compatível com Vite/GitHub Pages)
pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.2.67/pdf.worker.min.js";

import mammoth from "mammoth";

// Endpoint opcional de IA real (Cloud Functions / HTTP)
const IA_ENDPOINT = import.meta.env.VITE_IA_CRONOGRAMA_ENDPOINT || null;

export default function ImportarCronograma() {
  const { criarTarefa, projetos = [] } = useCronograma();

  const [texto, setTexto] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [processando, setProcessando] = useState(false);
  const [arquivoNome, setArquivoNome] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState("");
  const [dataBase, setDataBase] = useState(""); // 🔥 data real de início

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
  // 📌 Processamento com IA (Cloud + heurística local)
  // -------------------------------
  async function processarIA() {
    if (!projetoSelecionado) {
      alert("Selecione um projeto para associar as tarefas.");
      return;
    }

    if (!dataBase) {
      alert("Informe a data de início real do projeto.");
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
            dataBase,
          }),
        });

        if (!resp.ok) {
          throw new Error("Erro HTTP na IA remota");
        }

        const data = await resp.json();
        if (Array.isArray(data.tarefas) && data.tarefas.length > 0) {
          tarefas = normalizarTarefasDaIA(data.tarefas, dataBase);
          console.log("Tarefas da IA remota:", tarefas);
        }
      } catch (err) {
        console.error("Falha na IA remota, usando heurística local:", err);
      }
    }

    // 2) Se não vier nada da IA real, usa heurística local (playbook Relevo)
    if (!tarefas.length) {
      tarefas = extrairTarefasDoTexto(texto, dataBase);
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
        tipo: tarefa.tipo || "operacional", // operacional | entrega | financeiro
        projetoId: projetoSelecionado,
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

      {/* Data base do cronograma */}
      <div style={{ marginBottom: "1rem" }}>
        <label>
          Data de início real do projeto:
          <input
            type="date"
            value={dataBase}
            onChange={(e) => setDataBase(e.target.value)}
            style={{ marginLeft: "8px" }}
          />
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
                {/* Tipo da tarefa */}
                <label>
                  Tipo:
                  <select
                    value={t.tipo || "operacional"}
                    onChange={(e) => {
                      const clone = [...tarefasExtraidas];
                      clone[i].tipo = e.target.value;
                      setTarefasExtraidas(clone);
                    }}
                  >
                    <option value="operacional">Operacional</option>
                    <option value="entrega">Entrega / Produto</option>
                    <option value="financeiro">Financeiro</option>
                  </select>
                </label>

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
                  tipo: "operacional",
                  inicio: dataBase || hojeISO(),
                  fim: addDiasISO(dataBase || hojeISO(), 4), // 5 dias padrão
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
function normalizarTarefasDaIA(lista, dataBase) {
  const base = dataBase || hojeISO();

  return lista
    .map((t) => {
      const inicio = t.inicio || base;
      const fim = t.fim || addDiasISO(inicio, 4); // 5 dias padrão

      return {
        nome: t.nome || t.titulo || gerarNomeTarefa(t.descricao || ""),
        descricao: t.descricao || t.obs || "",
        inicio,
        fim,
        tipo: t.tipo || "operacional",
      };
    })
    .filter((t) => t.nome || t.descricao);
}

/* -------------------------------------
 * 🧠 Heurística local de extração (Opção A Premium)
 * ----------------------------------- */

function extrairTarefasDoTexto(texto, dataBase) {
  if (!texto) return [];

  const base = dataBase || hojeISO();

  const bruto = texto.replace(/\r/g, "\n");
  const linhas = bruto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  // 1) FASES OPERACIONAIS EM ORDEM LÓGICA
  const fases = extrairFasesOperacionais(linhas, base);

  // 2) PRODUTOS / ENTREGAS
  const entregas = extrairProdutos(linhas, fases, base);

  // 3) DESEMBOLSOS (D+30)
  const financeiros = extrairPagamentos(fases, entregas, base);

  return [...fases, ...entregas, ...financeiros];
}

/* -------------------------------------
 * Fases operacionais
 * ----------------------------------- */

function extrairFasesOperacionais(linhas, dataBase) {
  const base = dataBase || hojeISO();
  const fasesDef = [
    {
      id: "tramites",
      label: "Trâmites comerciais e contratação",
      regex: /(trâmites|tramites|contrataç|negociaç|proposta)/i,
    },
    {
      id: "plano",
      label: "Elaboração do Plano de Trabalho",
      regex: /(plano de trabalho|plano de atividades|plano de amostragem)/i,
    },
    {
      id: "campo",
      label: "Atividades de campo",
      regex:
        /(trabalho de campo|atividades de campo|campanha de campo|levantamento em campo|prospecç|monitoramento em campo)/i,
    },
    {
      id: "analise",
      label: "Tratamento e análise dos dados",
      regex:
        /(tratamento dos dados|anális[ea] dos dados|processamento dos dados|interpretaç)/i,
    },
    {
      id: "relatorio",
      label: "Elaboração do Relatório Final",
      regex:
        /(relatóri[oa] final|relatório técnico final|relatório conclusivo)/i,
    },
    {
      id: "entrega",
      label: "Entrega dos produtos finais",
      regex: /(entrega final|entrega dos produtos|protocolo final)/i,
    },
  ];

  let cursor = 0;
  const fases = [];

  for (const def of fasesDef) {
    const linha = linhas.find((l) => def.regex.test(l));
    if (!linha) continue;

    const dur = extrairDuracaoDias(linha) || 5; // 5 dias padrão
    const inicio = addDiasISO(base, cursor);
    const fim = addDiasISO(base, cursor + dur - 1);

    fases.push({
      id: def.id,
      tipo: "operacional",
      nome: def.label,
      descricao: linha,
      inicio,
      fim,
    });

    cursor += dur;
  }

  // Se nenhuma fase detectada, tentar pelo menos criar uma fase genérica
  if (!fases.length) {
    const dur = 5;
    fases.push({
      id: "fase-unica",
      tipo: "operacional",
      nome: "Execução do serviço",
      descricao: "Fase operacional principal (heurística padrão).",
      inicio: base,
      fim: addDiasISO(base, dur - 1),
    });
  }

  return fases;
}

/* -------------------------------------
 * Produtos / Entregas
 * ----------------------------------- */

function extrairProdutos(linhas, fases, dataBase) {
  const base = dataBase || hojeISO();
  const produtos = [];

  const regexProdutos = [
    {
      label: "Entrega de dados brutos de campo",
      regex: /(dados brutos|dados de campo|base de dados de campo)/i,
      fasePreferencial: "campo",
    },
    {
      label: "Mapas espeleotopográficos digitalizados",
      regex: /(mapas espeleotopogr|mapas digitalizados|cartografia)/i,
      fasePreferencial: "analise",
    },
    {
      label: "Banco de dados geoespeleológico",
      regex: /(banco de dados|geoespeleológico|geoespeleologico)/i,
      fasePreferencial: "analise",
    },
    {
      label: "Registro fotográfico",
      regex: /(registro fotogr|fotos|fotográfico)/i,
      fasePreferencial: "campo",
    },
    {
      label: "Arquivos georreferenciados (.gpx/.kmz)",
      regex: /(gpx|kmz|arquivos georreferenciados)/i,
      fasePreferencial: "analise",
    },
    {
      label: "Relatório Técnico Final",
      regex: /(relatóri[oa] final|relatório técnico final)/i,
      fasePreferencial: "relatorio",
    },
  ];

  for (const def of regexProdutos) {
    const linha = linhas.find((l) => def.regex.test(l));
    if (!linha) continue;

    const faseRef =
      fases.find((f) => f.id === def.fasePreferencial) ||
      fases[fases.length - 1];

    const dataEntrega = faseRef ? faseRef.fim : base;

    produtos.push({
      tipo: "entrega",
      nome: def.label,
      descricao: linha,
      inicio: dataEntrega,
      fim: dataEntrega,
    });
  }

  return produtos;
}

/* -------------------------------------
 * Desembolsos (financeiro)
 * ----------------------------------- */

function extrairPagamentos(fases, entregas, dataBase) {
  const base = dataBase || hojeISO();
  const financeiros = [];

  const faseCampo = fases.find((f) => f.id === "campo");
  const faseRelatorio = fases.find((f) => f.id === "relatorio");
  const ultimaFase = fases[fases.length - 1];

  // Pagamento 1 – Assinatura (D+30 da dataBase)
  financeiros.push({
    tipo: "financeiro",
    nome: "Pagamento 1 – Assinatura do contrato (25%)",
    descricao:
      "Primeira parcela, vinculada à assinatura da contratação / aceite da proposta.",
    inicio: addDiasISO(base, 30),
    fim: addDiasISO(base, 30),
  });

  // Pagamento 2 – Dados brutos (D+30 depois do fim do campo)
  if (faseCampo) {
    const d = addDiasISO(faseCampo.fim, 30);
    financeiros.push({
      tipo: "financeiro",
      nome: "Pagamento 2 – Entrega de dados de campo (25%)",
      descricao:
        "Segunda parcela, vinculada à entrega dos dados brutos e documentação de campo.",
      inicio: d,
      fim: d,
    });
  }

  // Pagamento 3 – Relatório final (D+30 depois do fim do relatório ou última fase)
  const baseRel =
    (faseRelatorio && faseRelatorio.fim) || (ultimaFase && ultimaFase.fim) || base;
  const d3 = addDiasISO(baseRel, 30);
  financeiros.push({
    tipo: "financeiro",
    nome: "Pagamento 3 – Entrega do Relatório Final (50%)",
    descricao:
      "Parcela final, vinculada à entrega do Relatório Técnico Final e produtos consolidados.",
    inicio: d3,
    fim: d3,
  });

  return financeiros;
}

/* -------------------------------------
 * Utilitários de datas e parsing
 * ----------------------------------- */

function hojeISO() {
  const d = new Date();
  return d.toISOString().substring(0, 10);
}

function addDiasISO(iso, dias) {
  const base = iso || hojeISO();
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString().substring(0, 10);
}

function extrairDuracaoDias(texto) {
  const m = texto.match(/(\d{1,3})\s*dias?\b/i);
  if (!m) return null;
  return parseInt(m[1], 10);
}

function gerarNomeTarefa(linha) {
  const limpo = (linha || "").replace(/\s+/g, " ").trim();
  if (!limpo) return "Tarefa";
  if (limpo.length <= 60) return limpo;
  return limpo.substring(0, 57) + "...";
}
