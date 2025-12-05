import { useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import "./importar-scope.css"; // isolador visual

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

  function resetar() {
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

  function handleArquivo(e) {
    const file = e.target.files?.[0] || null;
    setArquivo(file);
    setErro("");
    setMensagem("");
    setTextoExtraido("");
    setTarefasExtraidas([]);
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
        throw new Error(`Erro HTTP: ${response.status}`);
      }

      const resultado = await response.json();

      if (!Array.isArray(resultado)) {
        setErro("A IA retornou um formato inesperado.");
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

      setTextoExtraido(JSON.stringify(resultado, null, 2));
      setTarefasExtraidas(tarefasNormalizadas);
      setMensagem("Tarefas geradas com sucesso pela IA.");
    } catch (err) {
      console.error(err);
      setErro("Falha ao processar arquivo. Verifique o console.");
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

  function duplicarTarefa(index) {
    setTarefasExtraidas((prev) => {
      const copia = { ...prev[index], idLocal: `${Date.now()}-copy-${index}` };
      return [...prev.slice(0, index + 1), copia, ...prev.slice(index + 1)];
    });
  }

  function removerTarefa(index) {
    setTarefasExtraidas((prev) => prev.filter((_, i) => i !== index));
  }

  async function salvarTarefas() {
    setErro("");
    setMensagem("");

    if (!tarefasExtraidas.length) {
      setErro("Nenhuma tarefa para salvar.");
      return;
    }
    if (!projetoSelecionado) {
      setErro("Selecione um projeto.");
      return;
    }

    setSalvando(true);

    const dataBase = new Date().toISOString().slice(0, 10);

    try {
      for (const t of tarefasExtraidas) {
        const inicio = addDays(
          dataBase,
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

      setMensagem("Tarefas salvas com sucesso no projeto.");
    } catch (err) {
      console.error(err);
      setErro("Falha ao salvar tarefas.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="importar-wrapper">
      <div className="importar-header">
        <h1>Importar Cronograma via IA</h1>
        <p>
          Envie um arquivo, gere tarefas automaticamente e revise antes de
          salvar no cronograma.
        </p>
      </div>

      <div className="importar-card importar-card-top">
        <div className="importar-row importar-row-top">
          <div className="importar-field">
            <label>Projeto</label>
            <select
              value={projetoSelecionado}
              onChange={(e) => setProjetoSelecionado(e.target.value)}
              disabled={loading}
              className="importar-select"
            >
              <option value="">-- Selecione um projeto --</option>
              {projetos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome}
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
              {carregandoIA ? "Processando..." : "Extrair tarefas com IA"}
            </button>
          </div>
        </div>

        {(erro || mensagem) && (
          <div className="importar-feedback">
            {erro && <div className="importar-alert erro">{erro}</div>}
            {mensagem && <div className="importar-alert sucesso">{mensagem}</div>}
          </div>
        )}
      </div>

      <div className="importar-main-grid">
        <div className="importar-card importar-preview">
          <div className="importar-card-header">
            <h2>Texto extraído</h2>
            <span className="importar-subtitle">
              Visualização do retorno bruto da IA
            </span>
          </div>

          <div className="importar-preview-content">
            {textoExtraido ? (
              <pre>{textoExtraido}</pre>
            ) : (
              <p className="importar-placeholder">
                Nenhum conteúdo extraído ainda.
              </p>
            )}
          </div>
        </div>

        <div className="importar-card importar-tarefas">
          <div className="importar-card-header">
            <h2>Tarefas extraídas</h2>
            <span className="importar-subtitle">
              Revise, edite e ajuste antes de salvar.
            </span>
          </div>

          <div className="importar-tarefas-lista">
            {tarefasExtraidas.length === 0 && (
              <p className="importar-placeholder">
                Nenhuma tarefa extraída ainda.
              </p>
            )}

            {tarefasExtraidas.map((t, idx) => (
              <div key={t.idLocal} className="importar-tarefa-card">
                <div className="importar-tarefa-header">
                  <span className="importar-tarefa-titulo">
                    Tarefa #{idx + 1}
                  </span>

                  <div className="importar-tarefa-actions">
                    <button
                      type="button"
                      className="btn-icon"
                      title="Duplicar tarefa"
                      onClick={() => duplicarTarefa(idx)}
                    >
                      ⧉
                    </button>

                    <button
                      type="button"
                      className="btn-icon remover"
                      title="Remover tarefa"
                      onClick={() => removerTarefa(idx)}
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
                      value={t.nome}
                      onChange={(e) =>
                        handleChangeTarefa(idx, "nome", e.target.value)
                      }
                    />
                  </div>

                  <div className="importar-field">
                    <label>Descrição</label>
                    <textarea
                      rows={2}
                      value={t.descricao}
                      onChange={(e) =>
                        handleChangeTarefa(idx, "descricao", e.target.value)
                      }
                    />
                  </div>

                  <div className="importar-field">
                    <label>Produto</label>
                    <input
                      type="text"
                      value={t.produto}
                      onChange={(e) =>
                        handleChangeTarefa(idx, "produto", e.target.value)
                      }
                    />
                  </div>

                  <div className="importar-field">
                    <label>Categoria</label>
                    <input
                      type="text"
                      value={t.categoria}
                      onChange={(e) =>
                        handleChangeTarefa(idx, "categoria", e.target.value)
                      }
                    />
                  </div>

                  <div className="importar-field">
                    <label>Responsável</label>
                    <input
                      type="text"
                      value={t.responsavel}
                      onChange={(e) =>
                        handleChangeTarefa(idx, "responsavel", e.target.value)
                      }
                    />
                  </div>

                  <div className="importar-field importar-field-inline">
                    <div>
                      <label>Início relativo (dias)</label>
                      <input
                        type="number"
                        value={t.inicioRelativoDias}
                        onChange={(e) =>
                          handleChangeTarefa(
                            idx,
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
                        value={t.duracaoDias}
                        onChange={(e) =>
                          handleChangeTarefa(idx, "duracaoDias", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  <div className="importar-field">
                    <label>Resumo da relação temporal</label>
                    <div className="importar-tempo-resumo">
                      Inicia <strong>+{t.inicioRelativoDias} dias</strong> após a
                      data base, com duração de{" "}
                      <strong>{t.duracaoDias} dias</strong>.
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
          onClick={resetar}
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
              salvando ||
              carregandoIA ||
              loading ||
              tarefasExtraidas.length === 0
            }
          >
            {salvando ? "Salvando..." : "Salvar tarefas no projeto"}
          </button>
        </div>
      </div>
    </div>
  );
}
