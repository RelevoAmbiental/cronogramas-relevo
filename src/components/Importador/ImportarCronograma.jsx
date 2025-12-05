import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import "./importar.css";

// util para converter dias relativos em datas reais
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

  function handleProjetoChange(e) {
    setProjetoSelecionado(e.target.value);
    setErro("");
    setMensagem("");
  }

  function handleLimpar() {
    setArquivo(null);
    setTextoExtraido("");
    setTarefasExtraidas([]);
    setProjetoSelecionado("");
    setErro("");
    setMensagem("");
    setCarregandoIA(false);
    setSalvando(false);

    const input = document.getElementById("importar-arquivo");
    if (input) input.value = "";
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

      if (!response.ok) {
        console.error("[ImportarCronograma] Erro HTTP:", response.status);
        throw new Error(`Falha na requisição: ${response.status}`);
      }

      const resultado = await response.json();

      if (!Array.isArray(resultado)) {
        console.error("[ImportarCronograma] Formato inesperado:", resultado);
        setErro("A IA retornou um formato inesperado. Veja o console para detalhes.");
        setCarregandoIA(false);
        return;
      }

      // garante campos editáveis
      const tarefasNormalizadas = resultado.map((t, idx) => ({
        idLocal: `${Date.now()}-${idx}`,
        nome: t.nome || "",
        descricao: t.descricao || "",
        produto: t.produto || "",
        categoria: t.categoria || "",
        responsavel: t.responsavel || "",
        inicioRelativoDias:
          typeof t.inicioRelativoDias === "number"
            ? t.inicioRelativoDias
            : Number(t.inicioRelativoDias) || 0,
        duracaoDias:
          typeof t.duracaoDias === "number"
            ? t.duracaoDias
            : Number(t.duracaoDias) || 1,
      }));

      setTarefasExtraidas(tarefasNormalizadas);
      // texto simples do resultado para visualização (texto extraído da IA)
      setTextoExtraido(JSON.stringify(resultado, null, 2));
      setMensagem("Tarefas geradas com sucesso pela IA. Revise antes de salvar.");
    } catch (err) {
      console.error("Erro ao enviar para IA:", err);
      setErro("Erro ao gerar tarefas com IA. Verifique o console para detalhes.");
    } finally {
      setCarregandoIA(false);
    }
  }

  function handleChangeTarefa(index, campo, valor) {
    setTarefasExtraidas((prev) =>
      prev.map((t, i) =>
        i === index
          ? {
              ...t,
              [campo]:
                campo === "inicioRelativoDias" || campo === "duracaoDias"
                  ? Number(valor) || 0
                  : valor,
            }
          : t
      )
    );
  }

  function handleRemoverTarefa(index) {
    setTarefasExtraidas((prev) => prev.filter((_, i) => i !== index));
  }

  function handleDuplicarTarefa(index) {
    setTarefasExtraidas((prev) => {
      const copia = { ...prev[index], idLocal: `${Date.now()}-copy-${index}` };
      return [...prev.slice(0, index + 1), copia, ...prev.slice(index + 1)];
    });
  }

  async function salvarTarefas() {
    setErro("");
    setMensagem("");

    if (tarefasExtraidas.length === 0) {
      setErro("Nenhuma tarefa para salvar.");
      return;
    }
    if (!projetoSelecionado) {
      setErro("Selecione um projeto para salvar as tarefas.");
      return;
    }

    setSalvando(true);

    const startDate = new Date().toISOString().slice(0, 10);

    try {
      for (const t of tarefasExtraidas) {
        const inicio = addDays(
          startDate,
          t.inicioRelativoDias != null ? t.inicioRelativoDias : 0
        );
        const fim = addDays(
          inicio,
          t.duracaoDias != null ? t.duracaoDias - 1 : 0
        );

        await criarTarefa({
          nome: t.nome || "Tarefa sem nome",
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

      setMensagem("Tarefas salvas com sucesso no Firestore.");
      // se quiser limpar após salvar:
      // setTarefasExtraidas([]);
      // setTextoExtraido("");
    } catch (err) {
      console.error("[ImportarCronograma] Erro ao salvar tarefas:", err);
      setErro("Falha ao salvar tarefas. Verifique o console para detalhes.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="importar-wrapper">
      <div className="importar-header">
        <h1>Importar Cronograma via IA</h1>
        <p>
          Selecione um projeto, envie um arquivo (PDF, DOCX ou TXT) e use a IA
          para extrair tarefas. Revise, ajuste e salve diretamente no
          cronograma.
        </p>
      </div>

      <div className="importar-card importar-card-top">
        <div className="importar-row importar-row-top">
          <div className="importar-field">
            <label>Projeto</label>
            <select
              value={projetoSelecionado}
              onChange={handleProjetoChange}
              disabled={loading}
              className="importar-select"
            >
              <option value="">-- Selecione um projeto --</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome || "Projeto sem nome"}
                </option>
              ))}
            </select>
          </div>

          <div className="importar-field importar-field-file">
            <label>Arquivo (PDF, DOCX ou TXT)</label>
            <input
              id="importar-arquivo"
              type="file"
              accept=".pdf,.txt,.doc,.docx"
              onChange={handleArquivo}
              disabled={carregandoIA || salvando}
            />
          </div>

          <div className="importar-actions-top">
            <button
              type="button"
              className="btn-relevo primario"
              onClick={gerarComIA}
              disabled={
                !arquivo || !projetoSelecionado || carregandoIA || loading
              }
            >
              {carregandoIA ? "Processando arquivo..." : "Extrair tarefas com IA"}
            </button>
          </div>
        </div>

        {(erro || mensagem) && (
          <div className="importar-feedback">
            {erro && <div className="importar-alert erro">{erro}</div>}
            {mensagem && (
              <div className="importar-alert sucesso">{mensagem}</div>
            )}
          </div>
        )}
      </div>

      <div className="importar-main-grid">
        <div className="importar-card importar-preview">
          <div className="importar-card-header">
            <h2>Texto extraído</h2>
            <span className="importar-subtitle">
              Visualização simples do retorno da IA
            </span>
          </div>
          <div className="importar-preview-content">
            {textoExtraido ? (
              <pre>{textoExtraido}</pre>
            ) : (
              <p className="importar-placeholder">
                Ainda não há texto extraído. Após enviar o arquivo para a IA,
                o conteúdo retornado será mostrado aqui em formato textual.
              </p>
            )}
          </div>
        </div>

        <div className="importar-card importar-tarefas">
          <div className="importar-card-header">
            <h2>Tarefas extraídas</h2>
            <span className="importar-subtitle">
              Revise os campos, ajuste dias relativos e organize antes de salvar.
            </span>
          </div>

          <div className="importar-tarefas-lista">
            {tarefasExtraidas.length === 0 && (
              <p className="importar-placeholder">
                Nenhuma tarefa extraída ainda. Envie o arquivo para a IA para
                gerar uma lista de tarefas editáveis.
              </p>
            )}

            {tarefasExtraidas.map((tarefa, index) => (
              <div key={tarefa.idLocal || index} className="importar-tarefa-card">
                <div className="importar-tarefa-header">
                  <span className="importar-tarefa-titulo">
                    Tarefa #{index + 1}
                  </span>
                  <div className="importar-tarefa-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Duplicar tarefa"
                      onClick={() => handleDuplicarTarefa(index)}
                    >
                      ⧉
                    </button>
                    <button
                      type="button"
                      className="btn-icon remover"
                      title="Remover tarefa"
                      onClick={() => handleRemoverTarefa(index)}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="importar-tarefa-grid">
                  <div className="importar-field">
                    <label>Nome da tarefa</label>
                    <input
                      type="text"
                      value={tarefa.nome}
                      onChange={(e) =>
                        handleChangeTarefa(index, "nome", e.target.value)
                      }
                      placeholder="Ex.: Levantamento de campo - Trecho 1"
                    />
                  </div>

                  <div className="importar-field">
                    <label>Descrição</label>
                    <textarea
                      rows={2}
                      value={tarefa.descricao}
                      onChange={(e) =>
                        handleChangeTarefa(index, "descricao", e.target.value)
                      }
                      placeholder="Descrição resumida da atividade, entregas, condicionantes, etc."
                    />
                  </div>

                  <div className="importar-field">
                    <label>Produto</label>
                    <input
                      type="text"
                      value={tarefa.produto}
                      onChange={(e) =>
                        handleChangeTarefa(index, "produto", e.target.value)
                      }
                      placeholder="Ex.: Relatório técnico, mapa temático, banco de dados..."
                    />
                  </div>

                  <div className="importar-field">
                    <label>Categoria</label>
                    <input
                      type="text"
                      value={tarefa.categoria}
                      onChange={(e) =>
                        handleChangeTarefa(index, "categoria", e.target.value)
                      }
                      placeholder="Ex.: Campo, gabinete, modelagem, oficinas..."
                    />
                  </div>

                  <div className="importar-field">
                    <label>Responsável</label>
                    <input
                      type="text"
                      value={tarefa.responsavel}
                      onChange={(e) =>
                        handleChangeTarefa(index, "responsavel", e.target.value)
                      }
                      placeholder="Ex.: Geólogo, Coordenador, Equipe de campo..."
                    />
                  </div>

                  <div className="importar-field importar-field-inline">
                    <div>
                      <label>Início relativo (dias)</label>
                      <input
                        type="number"
                        value={tarefa.inicioRelativoDias}
                        onChange={(e) =>
                          handleChangeTarefa(
                            index,
                            "inicioRelativoDias",
                            e.target.value
                          )
                        }
                      />
                    </div>
                    <div>
                      <label>Duração (dias)</label>
                      <input
                        type="number"
                        value={tarefa.duracaoDias}
                        onChange={(e) =>
                          handleChangeTarefa(
                            index,
                            "duracaoDias",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>

                  <div className="importar-field">
                    <label>Resumo da relação temporal</label>
                    <div className="importar-tempo-resumo">
                      Inicia{" "}
                      <strong>
                        +{tarefa.inicioRelativoDias || 0} dia
                        {Math.abs(tarefa.inicioRelativoDias || 0) === 1
                          ? ""
                          : "s"}
                      </strong>{" "}
                      após a data base, com duração de{" "}
                      <strong>
                        {tarefa.duracaoDias || 1} dia
                        {Math.abs(tarefa.duracaoDias || 1) === 1 ? "" : "s"}
                      </strong>
                      .
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="importar-footer-actions">
        <button
          type="button"
          className="btn-relevo fantasma"
          onClick={handleLimpar}
          disabled={carregandoIA || salvando || loading}
        >
          Limpar tudo
        </button>

        <div className="importar-footer-right">
          <button
            type="button"
            className="btn-relevo primario"
            onClick={salvarTarefas}
            disabled={
              salvando || carregandoIA || loading || tarefasExtraidas.length === 0
            }
          >
            {salvando ? "Salvando tarefas..." : "Salvar tarefas no projeto"}
          </button>
        </div>
      </div>
    </div>
  );
}
