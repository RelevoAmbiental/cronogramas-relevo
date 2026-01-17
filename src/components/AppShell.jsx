import React, { useMemo, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useUser } from "../context/UserContext";

function cls(...parts) {
  return parts.filter(Boolean).join(" ");
}

const NAV = [
  { to: "/", label: "Dashboard", icon: "📊" },
  { to: "/projetos", label: "Projetos", icon: "🗂️" },
  { to: "/tarefas", label: "Tarefas", icon: "✅" },
  { to: "/calendario", label: "Calendário", icon: "📅" },
  { to: "/importar", label: "Importar (IA)", icon: "✨" },
];

export default function AppShell({ children }) {
  const { user } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const pageTitle = useMemo(() => {
    const hit = NAV.find((n) => n.to === location.pathname);
    return hit?.label || "Cronograma";
  }, [location.pathname]);

  return (
    <div className="crono-scope">
      <div className="crono-bg" aria-hidden="true" />

      <header className="crono-topbar">
        <div className="crono-topbar-left">
          <button
            className="crono-iconbtn crono-only-mobile"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
          >
            ☰
          </button>
          <Link to="/" className="crono-brand">
            <span className="crono-brand-badge">R</span>
            <span className="crono-brand-text">Cronogramas</span>
          </Link>
          <span className="crono-page-title">{pageTitle}</span>
        </div>

        <div className="crono-topbar-right">
          <div className="crono-user">
            <div className="crono-user-name">
              {user?.displayName || user?.email || "Usuário"}
            </div>
            <div className="crono-user-sub">Portal Relevo</div>
          </div>
        </div>
      </header>

      <div className="crono-layout">
        <aside className={cls("crono-sidenav", mobileOpen && "open")}
          onClick={() => setMobileOpen(false)}
        >
          <nav className="crono-nav" onClick={(e) => e.stopPropagation()}>
            {NAV.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cls("crono-navitem", isActive && "active")
                }
              >
                <span className="crono-navicon" aria-hidden="true">
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </NavLink>
            ))}

            <div className="crono-navhint">
              Dica: se alguma tela ficar “clara em claro” ou “escura em escuro”,
              a culpa é do CSS — e a gente demite o CSS.
            </div>
          </nav>
        </aside>

        <main className="crono-main">{children}</main>
      </div>

      <footer className="crono-footer">
        <span>Relevo Consultoria Ambiental • Cronograma</span>
        <span className="crono-footer-dot">•</span>
        <span>{new Date().getFullYear()}</span>
      </footer>
    </div>
  );
}
