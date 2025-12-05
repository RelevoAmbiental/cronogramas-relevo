import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";

// *** SEM CSS neste modo ***
// import "./importar-scope.css";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + (Number(days) || 0));
  return d.toISOString().slice(0, 10);
}

export default function ImportarCronograma() {
  const { projetos, loading, criarTarefa } = useCronograma();

  const [arquivo, setArquivo] = useState(null);
  const [textoExtraido, setTextoExtraido] = useState("");
  const [tarefasExtraidas, setTarefasExtraidas] = useState([]);
  const [projetoSelecionado, setProjetoSelecionado] = useState("");
  const [carregandoIA, setCarregandoIA] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  function handleArquivo(e) {
    const file = e.target.files?.[0] || null;
    setArquivo(file);
    setTextoExtraido("");
    setTarefasExtraidas([]);
    setErro("");
    setMensagem("");
  }

  async function gerarComIA() {
    setErro("");
    setMensagem("");

    if (!arquivo) {
      setErro("Envie um arquivo primeiro.");
      return;
    }
    if (!projetoSelecionado) {
      setErro("Selecione um projeto antes de gerar as tarefas.");
      return;
    }

    setCarregandoIA(true);
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
        setErro("Formato inesperado.");
        setCarregandoIA(false);
        return;
      }

      const tarefasNormalizadas = resultado.map((t, idx) => ({
        idLocal: `${Date.now()}-${idx}`,
        nome: t.nome || "",
        descricao: t.descricao || "",
        produto: t.produto || "",
        categoria: t.categoria || "",
        responsavel: t.responsavel || "",
        inicioRelativoDias: Number(t.inicioRelativoDias) || 0,
        duracaoDias: Number(t.duracaoDias) || 1,
      }));

      setTarefasExtraidas(tarefasNormalizadas);
      setTextoExtraido(JSON.stringify(resultado, null, 2));
      setMensagem("Tarefas geradas com sucesso!");
    } catch (err) {
      console.error("Erro ao enviar para IA:", err);
      setErro("Falha ao processar arquivo.");
    } finally {
      setCarregandoIA(false);
    }
  }

  async function salvarTarefas() {
    if (tarefasExtraidas.length === 0) {
      setErro("Nenhuma tarefa para salvar.");
      return;
    }
    if (!projetoSelecionado) {
      setErro("Selecione um projeto para salvar.");
      return;
    }

    setSalvando(true);
    const startDate = new Date().toISOString().slice(0, 10);

    try {
      for (const t of tarefasExtraidas) {
        const inicio = addDays(startDate, t.inicioRelativoDias);
        const fim = addDays(inicio, t.duracaoDias - 1);

        await criarTarefa({
          nome: t.nome || "Sem nome",
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

      setMensagem("Tarefas salvas no Firestore.");
    } catch (err) {
      console.error(err);
      setErro("Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  // 🔥🔥🔥 AQUI COMEÇA O TESTE DE DIAGNÓSTICO 🔥🔥🔥
  return (
    <div
      style={{
        border: "6px solid red",
        padding: "20px",
        background: "#fff0f0",
      }}
    >
      <h1 style={{ color: "red", fontSize: "28px" }}>
        🔎 TESTE: ESTE É O IMPORTADOR REACT ATUAL
      </h1>

      <p style={{ fontSize: "18px", marginTop: "10px" }}>
        Se você está vendo este bloco vermelho com este texto, ENTÃO o React está
        carregando o componente correto.
      </p>

      <hr style={{ margin: "20px 0" }} />

      <p style={{ fontSize: "20px", color: "#333" }}>
        ✔ Projetos carregados: {projetos.length}
      </p>

      <p style={{ fontSize: "16px", marginTop: "20px" }}>
        <strong>Selecione um projeto:</strong>
      </p>

      <select
        value={projetoSelecionado}
        onChange={(e) => setProjetoSelecionado(e.target.value)}
        style={{ padding: "6px", fontSize: "16px" }}
      >
        <option value="">-- selecione --</option>
        {projetos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.nome}
          </option>
        ))}
      </select>

      <p style={{ marginTop: "20px", fontSize: "16px" }}>
        <strong>Arquivo:</strong>
      </p>

      <input
        type="file"
        onChange={handleArquivo}
        style={{ padding: "6px", fontSize: "16px" }}
      />

      <button
        onClick={gerarComIA}
        style={{
          padding: "10px 18px",
          marginTop: "20px",
          background: "red",
          color: "white",
          border: "none",
          cursor: "pointer",
          fontSize: "16px",
        }}
      >
        TESTE — Extrair Tarefas
      </button>

      <hr style={{ margin: "20px 0" }} />

      <pre style={{ fontSize: "14px", background: "#fff", padding: "10px" }}>
        {textoExtraido || "Nenhum texto extraído ainda."}
      </pre>

      <p style={{ marginTop: "20px", fontSize: "18px" }}>
        Tarefas extraídas: {tarefasExtraidas.length}
      </p>
    </div>
  );
}
