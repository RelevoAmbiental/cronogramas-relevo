export function expandTarefasPorDia(tarefas) {
  const mapa = {};

  tarefas.forEach((t) => {
    if (!t.inicio || !t.fim) return;

    const inicio = new Date(t.inicio);
    const fim = new Date(t.fim);

    const atual = new Date(inicio);

    while (atual <= fim) {
      const chave = atual.toISOString().substring(0, 10);

      if (!mapa[chave]) mapa[chave] = [];
      mapa[chave].push(t);

      atual.setDate(atual.getDate() + 1);
    }
  });

  return mapa;
}
