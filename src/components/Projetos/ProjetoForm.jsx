import { useEffect, useState } from "react";
import { useCronograma } from "../../context/CronogramaContext";
import "../Tarefas/tarefaform.css"; // reutiliza estilo base do form
import "./projetos.css";

const PALETA_CORES = [
  "#0a4723", // verde Relevo
  "#0b6e3f",
  "#0aa3e8",
  "#c9c900",
  "#e59313",
  "#6b3fa0",
  "#b83280",
];

export default function ProjetoForm({ projetoInicial, fechar }) {
  const { criarProjeto, editarProjeto } = useCronograma();

  const [nome, setNome] = useState("");
  const [cliente, setCliente] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [status, setStatus] = useState("ativo");
  const [cor, setCor] = useState("#0a4723");
  const [descricao, setDescricao] = useState("");

  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (projetoInicial) {
      setNome(projetoInicial.nome || "");
      setCliente(projetoInicial.cliente || "");
      setDataInicio(
        projetoInicial.dataInicio
          ? String(projetoInicial.dataInicio).slice(0, 10)
          : ""
      );
      setStatus(projetoInicial.status || "ativo");
      setCor(projetoInicial.cor || "#0a4723");
      setDescricao(projetoInicial.descricao || "");
    } else {
      setNome("");
      setCliente("");
      setDataInicio("");
      setStatus("ativo");
      setCor("#0a4723");
      setDescricao("");
    }
  }, [projetoInicial]);

  async function salvar(e) {
    e.preventDefault();
    setSalvando(true);

    const dados = {
      nome,
      cliente,
      dataInicio,
      status,
      cor,
      descricao,
    };

    if (projetoInicial) {
      await editarProjeto(projetoInicial.id, dados);
    } else {
      await criarProjeto(dados);
    }

    setSalvando(false);
    fechar();
  }

  return (
    <form className="relevo-form projeto-form" onSubmit={salvar}>
      <div className="relevo-grid">
        <div>
          <label>Nome do Projeto</label>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />
        </div>

        <div>
          <label>Cliente</label>
          <input
            type="text"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />
        </div>

        <div>
          <label>Data de Início</label>
          <input
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
          />
        </div>

        <div>
          <label>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="ativo">Ativo</option>
            <option value="concluido">Concluído</option>
            <option value="arquivado">Arquivado</option>
          </select>
        </div>

        <div className="full">
          <label>Cor do Projeto</label>

          <div className="projeto-cor-linha">
            <div className="projeto-cor-opcoes">
              {PALETA_CORES.map((c) => (
                <button
                  key={c}
                  type="button"
                  className={
                    "projeto-cor-opcao" +
                    (c === cor ? " ativa" : "")
                  }
                  style={{ backgroundColor: c }}
                  onClick={() => setCor(c)}
                />
              ))}
            </div>

            <div className="projeto-cor-input-wrapper">
              <input
                type="color"
                value={cor}
                onChange={(e) => setCor(e.target.value)}
              />
              <span className="projeto-cor-hex">{cor}</span>
            </div>
          </div>
        </div>

        <div className="full">
          <label>Descrição</label>
          <textarea
            rows={3}
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            placeholder="Descrição resumida do escopo, área, cliente, etc."
          />
        </div>
      </div>

      <div className="relevo-actions">
        <button
          type="submit"
          className="save"
          disabled={salvando}
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>

        <button
          type="button"
          className="cancel"
          onClick={fechar}
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
