import { NavLink } from "react-router-dom";
import "./nav.css";

export default function Navegacao() {
  return (
    <nav className="nav-cronograma">
      <NavLink to="/" end>📊 Dashboard</NavLink>
      <NavLink to="/projetos">📁 Projetos</NavLink>
      <NavLink to="/tarefas">📝 Tarefas</NavLink>
      <NavLink to="/calendario">🗓️ Calendário</NavLink>
      <NavLink to="/importar">🤖 Importar (IA)</NavLink>
    </nav>
  );
}
