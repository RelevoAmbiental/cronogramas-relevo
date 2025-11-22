{/* LISTA PRINCIPAL */}
{loading ? (
  <p>Carregando tarefas...</p>
) : (
  <TarefaLista
    tarefas={tarefasFiltradas}
    projetos={projetos}
    onEditar={handleEditar}
    onExcluir={handleExcluir}
  />
)}

{/* GANTT */}
{!loading && tarefasFiltradas.length > 0 && (
  <>
    <hr style={{ margin: "40px 0", opacity: 0.3 }} />
    <h2>Gantt Simplificado</h2>
    <Gantt tarefas={tarefasFiltradas} projetos={projetos} />
  </>
)}

{/* TIMELINE */}
{!loading && tarefasFiltradas.length > 0 && (
  <>
    <hr style={{ margin: "40px 0", opacity: 0.3 }} />
    <h2>Linha do Tempo</h2>
    <TimelineVertical tarefas={tarefasFiltradas} projetos={projetos} />
  </>
)}
