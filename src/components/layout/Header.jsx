import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./header.css";

export default function Header() {
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path || location.pathname.startsWith(path)
      ? "nav-btn active"
      : "nav-btn";

  return (
    <header className="topbar">
      <div className="topbar-left">
        <img
          src="https://raw.githubusercontent.com/RelevoAmbiental/relevo-site/refs/heads/main/assets/icons/Logo_atualizada_horizontal.png"
          alt="Relevo Consultoria Ambiental"
          className="topbar-logo"
        />

        <span className="topbar-title">Cronograma</span>
      </div>

      <nav className="topbar-nav">
        <Link to="/" className={isActive("/")}>Dashboard</Link>
        <Link to="/projetos" className={isActive("/projetos")}>Projetos</Link>
        <Link to="/tarefas" className={isActive("/tarefas")}>Tarefas</Link>
        <Link to="/calendario" className={isActive("/calendario")}>Calendário</Link>
        <Link to="/importar" className={isActive("/importar")}>Importar (IA)</Link>
      </nav>
    </header>
  );
}
