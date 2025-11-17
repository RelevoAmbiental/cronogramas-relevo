<Header />

<Navegacao />

<main className="content">
   <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/projetos" element={<Projetos />} />
      <Route path="/tarefas" element={<Tarefas />} />
      <Route path="/calendario" element={<CalendarView />} />
      <Route path="/importar" element={<ImportadorIA />} />
   </Routes>
</main>

<Footer />
