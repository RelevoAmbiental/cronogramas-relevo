import { useState, useEffect } from "react";
import { listarProjetos } from "../../services/cronogramaService";
import { criarTarefa } from "../../services/cronogramaService";
import "./importar.css";

// util para converter dias relativos em datas reais
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function ImportarCronograma() {
  const [arquivo, setArquivo] = useState(null);
  const [textoExtraido, setTextoExtraido] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [projetos, setProjetos] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState("");
  const [carregando, setCarregando] = useState(false);

  // ===============================================
  //  CARREGAR PROJETOS AO ABRIR A PÁGINA
  // ===============================================
  useEffect(() => {
    async function carregar() {
      const lista = await listarProjetos();
      setProjetos(lista);
    }
    carregar();
  }, []);

  // ===============================================
  //  UPLOAD DO ARQUIVO
  // ===============================================
  function handleArquivo(e) {
    setArquivo(e.target.files[0]);
  }

  // ===============================================
  //  ENVIAR PARA IA
  // ===============================================
  async function gerarComIA() {
    if (!arquivo) {
      alert("Envie um arquivo primeiro.");
      return;
    }
    if (!projetoSelecionado) {
      alert("Selecione um projeto antes de gerar as tarefas.");
      return;
    }

    setCarregando(true);

    const formData = new FormData();
    formData.append("file", arquivo);

    try {
      const response = await fetch(
        "https://us-central1-relevo-cronograma.cloudfunctions.net/interpretarArquivo",
        {
          method: "POST",
          body: formData,
        }
      );

      const resultado = await response.json();

      if (!Array.isArray(resultado)) {
        alert("A IA retornou um formato inesperado.");
        console.error(resultado);
        setCarregando(false);
        return;
      }

      // Salvar lista de tarefas extraídas
      setTarefasExtraidas(resultado);
      setTextoExtraido("Tarefas extraídas com sucesso.");

      setCarregando(false);

    } catch (err) {
      console.error("Erro ao enviar para IA:", err);
      alert("Erro ao gerar tarefas com IA.");
      setCarregando(false);
    }
  }

  // ===============================================
  //  SALVAR TODAS AS TAREFAS NO FIRESTORE
  // ===============================================
  async function salvarTarefas() {
    if (tarefasExtraidas.length === 0) {
      alert("Nenhuma tarefa para salvar.");
      return;
    }

    const startDate = new Date().toISOString().slice(0, 10);

    for (const t of tarefasExtraidas) {
      const inicio = addDays(startDate, t.inicioRelativoDias || 0);
      const fim = addDays(inicio, t.duracaoDias || 1);

      await criarTarefa({
        nome: t.nome,
        descricao: t.descricao || "",
        produto: t.produto || "",
        categoria: t.categoria || "",
        responsavel: t.responsavel || "",
        status: "pendente",
        inicio,
        fim,
        projetoId: projetoSelecionado,
      });
    }

    alert("Tarefas salvas com sucesso!");
  }

  // ===============================================
  //  INTERFACE
  // ===============================================
  return (
    <div className="importar-container">
      <h2>Importar Cronograma via IA</h2>

      <label>Selecionar Projeto:</label>
      <select
        value={projetoSelecionado}
        onChange={(e) => setProjetoSelecionado(e.target.value)}
      >
        <option value="">-- Selecione --</option>
        {projetos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <label>Arquivo (PDF, DOCX ou TXT):</label>
      <input type="file" accept=".pdf,.txt,.docx" onChange={handleArquivo} />

      <button onClick={gerarComIA} disabled={carregando}>
        {carregando ? "Processando..." : "Gerar Tarefas com IA"}
      </button>

      <hr />

      <h3>Tarefas extraídas:</h3>

      {tarefasExtraidas.length === 0 && <p>Nenhuma tarefa extraída ainda.</p>}

      <ul>
        {tarefasExtraidas.map((t, i) => (
          <li key={i}>
            <strong>{t.nome}</strong> — {t.descricao}
            <br />
            <em>
              (Relativo: início +{t.inicioRelativoDias} dias, duração{" "}
              {t.duracaoDias} dias)
            </em>
          </li>
        ))}
      </ul>

      {tarefasExtraidas.length > 0 && (
        <button onClick={salvarTarefas}>Salvar no Firestore</button>
      )}
    </div>
  );
}
