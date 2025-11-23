// src/utils/resumoExecutivo.js

// Utilidades básicas de data (sem dependências externas)
function parseISO(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function diffDays(d1, d2) {
  if (!d1 || !d2) return 0;
  const ms = d2.getTime() - d1.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

function formatPtBR(d) {
  if (!d) return "-";
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

// Retorna segunda-feira da semana da data
function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 = dom
  const diff = (day === 0 ? -6 : 1) - day; // leva pra segunda
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(date) {
  const d = getWeekStart(date);
  const dia = d.getDate().toString().padStart(2, "0");
  const mes = (d.getMonth() + 1).toString().padStart(2, "0");
  return `${dia}/${mes}`;
}

// Enriquecimento das tarefas com status efetivo
function enriquecerTarefas(tarefas, hoje) {
  const hojeClean = new Date(hoje);
  hojeClean.setHours(0, 0, 0, 0);

  return (tarefas || []).map((t) => {
    const inicioDate = parseISO(t.inicio);
    const fimDate = parseISO(t.fim);

    let statusEfetivo = t.status || "pendente";
    if (fimDate && fimDate < hojeClean && statusEfetivo !== "concluida") {
      statusEfetivo = "atrasada";
    }

    const duracaoDias =
      inicioDate && fimDate ? diffDays(inicioDate, fimDate) + 1 : null;

    return {
      ...t,
      inicioDate,
      fimDate,
      statusEfetivo,
      duracaoDias,
    };
  });
}

// KPIs básicos
function gerarKPIs(tarefasEnriquecidas, projetos) {
  const totalProjetos = (projetos || []).length;
  const totalTarefas = tarefasEnriquecidas.length;

  const concluidas = tarefasEnriquecidas.filter(
    (t) => t.statusEfetivo === "concluida"
  ).length;
  const atrasadas = tarefasEnriquecidas.filter(
    (t) => t.statusEfetivo === "atrasada"
  ).length;
  const andamento = tarefasEnriquecidas.filter(
    (t) => t.statusEfetivo === "andamento"
  ).length;
  const pendentes = tarefasEnriquecidas.filter(
    (t) => t.statusEfetivo === "pendente"
  ).length;

  const percConcluidas =
    totalTarefas > 0 ? Math.round((concluidas / totalTarefas) * 100) : 0;
  const percAtrasadas =
    totalTarefas > 0 ? Math.round((atrasadas / totalTarefas) * 100) : 0;

  return {
    totalProjetos,
    totalTarefas,
    concluidas,
    atrasadas,
    andamento,
    pendentes,
    percConcluidas,
    percAtrasadas,
  };
}

// Headline geral
function gerarHeadline(kpis) {
  if (kpis.totalTarefas === 0) {
    return "Nenhuma tarefa cadastrada por enquanto. Ótima janela para planejar com calma o próximo projeto.";
  }

  if (kpis.atrasadas === 0 && kpis.percConcluidas >= 60) {
    return `Cronograma saudável: ${kpis.percConcluidas}% das tarefas concluídas e nenhuma em atraso.`;
  }

  if (kpis.atrasadas > 0 && kpis.percAtrasadas <= 20) {
    return `Algumas tarefas em atraso (${kpis.atrasadas}), mas o cenário ainda é recuperável com ajustes pontuais.`;
  }

  if (kpis.percAtrasadas > 20) {
    return `Cronograma em risco: ${kpis.percAtrasadas}% das tarefas estão em atraso. Hora de replanejar a linha de base.`;
  }

  return `Execução em andamento: ${kpis.concluidas} concluídas, ${kpis.andamento} em andamento e ${kpis.atrasadas} em atraso.`;
}

// Lista de atrasadas (top 5)
function listarAtrasadas(tarefasEnriquecidas, projetos) {
  const mapaProjetos = Object.fromEntries(
    (projetos || []).map((p) => [p.id, p.nome || p.titulo || p.id])
  );

  return tarefasEnriquecidas
    .filter((t) => t.statusEfetivo === "atrasada")
    .sort((a, b) => (a.fimDate || 0) - (b.fimDate || 0))
    .slice(0, 5)
    .map((t) => ({
      nome: t.nome,
      projeto: mapaProjetos[t.projetoId] || "—",
      fimOriginal: formatPtBR(t.fimDate),
      diasAtraso: diffDays(t.fimDate, new Date()),
    }));
}

// Tarefas em andamento resumidas
function listarAndamento(tarefasEnriquecidas, projetos) {
  const mapaProjetos = Object.fromEntries(
    (projetos || []).map((p) => [p.id, p.nome || p.titulo || p.id])
  );

  return tarefasEnriquecidas
    .filter((t) => t.statusEfetivo === "andamento")
    .sort((a, b) => (a.fimDate || 0) - (b.fimDate || 0))
    .slice(0, 6)
    .map((t) => ({
      nome: t.nome,
      projeto: mapaProjetos[t.projetoId] || "—",
      fimPrevisto: formatPtBR(t.fimDate),
    }));
}

// Heurística simples de "tarefas críticas"
function listarCriticas(tarefasEnriquecidas, projetos) {
  const mapaProjetos = Object.fromEntries(
    (projetos || []).map((p) => [p.id, p.nome || p.titulo || p.id])
  );

  const agora = new Date();
  const limite = new Date();
  limite.setDate(agora.getDate() + 10); // próximos 10 dias

  const candidatas = tarefasEnriquecidas.filter((t) => {
    if (!t.fimDate) return false;
    if (t.statusEfetivo === "concluida") return false;
    const nome = (t.nome || "").toLowerCase();
    const ehEntrega =
      nome.includes("relatório") ||
      nome.includes("relatorio") ||
      nome.includes("entrega") ||
      nome.includes("produto") ||
      nome.includes("pagamento");
    const fimEmBreve = t.fimDate <= limite;
    const longa =
      typeof t.duracaoDias === "number" ? t.duracaoDias >= 7 : false;
    return ehEntrega || fimEmBreve || longa;
  });

  return candidatas
    .sort((a, b) => (a.fimDate || 0) - (b.fimDate || 0))
    .slice(0, 5)
    .map((t) => ({
      nome: t.nome,
      projeto: mapaProjetos[t.projetoId] || "—",
      fimPrevisto: formatPtBR(t.fimDate),
    }));
}

// Projeção de conclusão simples
function projetarConclusao(tarefasEnriquecidas) {
  if (!tarefasEnriquecidas.length) {
    return {
      dataProvavel: null,
      diasPotencialAtraso: 0,
      texto: "Sem tarefas cadastradas, ainda não há projeção de conclusão.",
    };
  }

  const fimPlanejado = tarefasEnriquecidas
    .filter((t) => t.fimDate)
    .map((t) => t.fimDate)
    .sort((a, b) => a - b)[tarefasEnriquecidas.length - 1];

  const atrasadas = tarefasEnriquecidas.filter(
    (t) => t.statusEfetivo === "atrasada"
  );

  const hoje = new Date();
  let diasPotencial = 0;

  if (atrasadas.length > 0) {
    const maxAtraso = Math.max(
      ...atrasadas.map((t) => diffDays(t.fimDate, hoje))
    );
    diasPotencial = Math.max(maxAtraso, 0);
  }

  const dataProvavel = new Date(fimPlanejado);
  dataProvavel.setDate(dataProvavel.getDate() + diasPotencial);

  let texto;
  if (diasPotencial === 0) {
    texto = `Mantida a linha de base, a conclusão geral é esperada em ${formatPtBR(
      dataProvavel
    )}.`;
  } else {
    texto = `Se as pendências atuais não forem replanejadas, a conclusão geral pode escorregar cerca de ${diasPotencial} dia(s), para ${formatPtBR(
      dataProvavel
    )}.`;
  }

  return {
    dataProvavel,
    diasPotencialAtraso: diasPotencial,
    texto,
  };
}

// Sparkline de progresso (últimas 8 semanas)
function gerarSparkline(tarefasEnriquecidas) {
  const hoje = new Date();
  const semanas = [];

  // 8 semanas anteriores (incluindo atual)
  for (let i = 7; i >= 0; i--) {
    const ref = new Date(hoje);
    ref.setDate(ref.getDate() - i * 7);
    const inicioSemana = getWeekStart(ref);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 6);

    const concluidas = tarefasEnriquecidas.filter((t) => {
      if (!t.statusEfetivo === "concluida") return false;
      if (!t.fimDate) return false;
      return t.fimDate >= inicioSemana && t.fimDate <= fimSemana;
    }).length;

    semanas.push({
      label: weekLabel(inicioSemana),
      valor: concluidas,
    });
  }

  const maxValor = Math.max(...semanas.map((s) => s.valor), 1);

  return semanas.map((s) => ({
    ...s,
    percent: Math.round((s.valor / maxValor) * 100),
  }));
}

// Heatmap de entregas (próximas 8 semanas)
function gerarHeatmap(tarefasEnriquecidas) {
  const hoje = new Date();
  const semanas = [];

  for (let i = 0; i < 8; i++) {
    const inicio = getWeekStart(new Date(hoje));
    inicio.setDate(inicio.getDate() + i * 7);
    const fim = new Date(inicio);
    fim.setDate(inicio.getDate() + 6);

    const carga = tarefasEnriquecidas.filter((t) => {
      if (!t.fimDate) return false;
      return t.fimDate >= inicio && t.fimDate <= fim;
    }).length;

    let nivel = 1; // ok
    if (carga >= 8) nivel = 3; // crítico
    else if (carga >= 4) nivel = 2; // atenção

    semanas.push({
      label: weekLabel(inicio),
      carga,
      nivel, // 1 = ok, 2 = atenção, 3 = crítico
    });
  }

  return semanas;
}

// Riscos prováveis (5 riscos que você pediu)
function gerarRiscos(tarefasEnriquecidas) {
  const textoTarefas = tarefasEnriquecidas.map((t) => t.nome + " " + (t.descricao || "")).join(" ").toLowerCase();

  const riscoCampo =
    textoTarefas.includes("campo") ||
    textoTarefas.includes("monitoramento") ||
    textoTarefas.includes("levantamento");

  const riscoAnalise =
    textoTarefas.includes("análise") ||
    textoTarefas.includes("analise") ||
    textoTarefas.includes("tratamento dos dados") ||
    textoTarefas.includes("processamento");

  const riscoExterno =
    textoTarefas.includes("licença") ||
    textoTarefas.includes("licenca") ||
    textoTarefas.includes("ibama") ||
    textoTarefas.includes("dnit") ||
    textoTarefas.includes("parecer") ||
    textoTarefas.includes("cliente");

  const entregasIntermediariasAtrasadas = tarefasEnriquecidas.some((t) => {
    const nome = (t.nome || "").toLowerCase();
    const ehEntrega =
      nome.includes("entrega") ||
      nome.includes("parcial") ||
      nome.includes("produto");
    return ehEntrega && t.statusEfetivo === "atrasada";
  });

  const acumuloRelatorioFinal = tarefasEnriquecidas.filter((t) => {
    const nome = (t.nome || "").toLowerCase();
    return (
      nome.includes("relatório final") ||
      nome.includes("relatorio final") ||
      nome.includes("rima") ||
      nome.includes("relatório técnico")
    );
  }).length;

  const riscos = [
    {
      id: "campo",
      titulo: "Atraso por tempo de campo",
      nivel: riscoCampo ? "alto" : "médio",
      descricao:
        "Atividades de campo sensíveis a clima e logística. Manter plano B para janelas de chuva e imprevistos de acesso.",
    },
    {
      id: "analise",
      titulo: "Sobrecarga de análise",
      nivel: riscoAnalise ? "alto" : "médio",
      descricao:
        "Etapas de tratamento e análise de dados concentradas em poucos profissionais podem criar gargalos.",
    },
    {
      id: "externo",
      titulo: "Dependência externa",
      nivel: riscoExterno ? "alto" : "médio",
      descricao:
        "Dependência de aprovações de órgãos, clientes ou terceiros. Acompanhar de perto prazos de resposta.",
    },
    {
      id: "entregas",
      titulo: "Atraso nas entregas intermediárias",
      nivel: entregasIntermediariasAtrasadas ? "alto" : "médio",
      descricao:
        "Produtos parciais em atraso tendem a empurrar o trabalho para o final do cronograma.",
    },
    {
      id: "relatorio",
      titulo: "Acúmulo de tarefas no relatório final",
      nivel: acumuloRelatorioFinal >= 3 ? "alto" : "médio",
      descricao:
        "Muitas atividades convergindo para o relatório final aumentam o risco de correria na reta final.",
    },
  ];

  return riscos;
}

// Alertas inteligentes ("WhatsApp corporativo")
function gerarAlertas(kpis, atrasadas, criticas, heatmap) {
  const alertas = [];

  if (kpis.atrasadas > 0) {
    alertas.push({
      tipo: "risco",
      mensagem: `Você tem ${kpis.atrasadas} tarefa(s) em atraso. Vale uma reunião rápida de replanejamento antes que isso escale.`,
    });
  }

  const semanaCritica = heatmap.find((s) => s.nivel === 3);
  if (semanaCritica) {
    alertas.push({
      tipo: "risco",
      mensagem: `Semana iniciando em ${semanaCritica.label} está com carga crítica (${semanaCritica.carga} entregas). Recomenda-se redistribuir atividades.`,
    });
  }

  if (criticas.length > 0) {
    const nomes = criticas
      .slice(0, 3)
      .map((c) => c.nome)
      .join(", ");
    alertas.push({
      tipo: "acao",
      mensagem: `Olho no caminho crítico: ${nomes}. Um pequeno atraso aqui derruba a data de conclusão.`,
    });
  }

  if (!alertas.length && kpis.totalTarefas > 0) {
    alertas.push({
      tipo: "info",
      mensagem:
        "Nenhum risco gritante no radar imediato. Boa hora para consolidar documentação e atualizar status no sistema.",
    });
  }

  return alertas;
}

// Texto geral consolidando tudo
function gerarTextoGeral(kpis, atrasadas, andamento, previsao) {
  if (kpis.totalTarefas === 0) {
    return "Ainda não há tarefas cadastradas no cronograma. Assim que o primeiro plano de trabalho for modelado aqui, este painel passa a funcionar como cockpit de execução da Relevo.";
  }

  const partes = [];

  partes.push(
    `Atualmente o portfólio conta com ${kpis.totalProjetos} projeto(s) e ${kpis.totalTarefas} tarefa(s) cadastradas, com ${kpis.percConcluidas}% já concluídas.`
  );

  if (kpis.atrasadas > 0) {
    const nomesAtrasadas = atrasadas
      .slice(0, 3)
      .map((t) => t.nome)
      .join(", ");
    partes.push(
      `Existem ${kpis.atrasadas} tarefa(s) em atraso, com destaque para: ${nomesAtrasadas}.`
    );
  } else {
    partes.push(
      "Não há tarefas em atraso neste momento, o que indica boa aderência à linha de base planejada."
    );
  }

  if (andamento.length > 0) {
    const nomesAndamento = andamento
      .slice(0, 3)
      .map((t) => t.nome)
      .join(", ");
    partes.push(
      `As frentes em execução concentram-se em: ${nomesAndamento}, mantendo o cronograma em movimento.`
    );
  }

  partes.push(previsao.texto);

  return partes.join(" ");
}

// Função principal exportada
export function gerarResumoExecutivo(tarefas, projetos) {
  const hoje = new Date();
  const tarefasEnriquecidas = enriquecerTarefas(tarefas || [], hoje);
  const kpis = gerarKPIs(tarefasEnriquecidas, projetos || []);
  const atrasadas = listarAtrasadas(tarefasEnriquecidas, projetos || []);
  const andamento = listarAndamento(tarefasEnriquecidas, projetos || []);
  const criticas = listarCriticas(tarefasEnriquecidas, projetos || []);
  const previsao = projetarConclusao(tarefasEnriquecidas);
  const sparkline = gerarSparkline(tarefasEnriquecidas);
  const heatmap = gerarHeatmap(tarefasEnriquecidas);
  const riscos = gerarRiscos(tarefasEnriquecidas);
  const alertas = gerarAlertas(kpis, atrasadas, criticas, heatmap);
  const headline = gerarHeadline(kpis);
  const textoGeral = gerarTextoGeral(kpis, atrasadas, andamento, previsao);

  return {
    hoje,
    kpis,
    atrasadas,
    andamento,
    criticas,
    previsao,
    sparkline,
    heatmap,
    riscos,
    alertas,
    headline,
    textoGeral,
  };
}
