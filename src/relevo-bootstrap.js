export function bootRelevo() {
  // O Portal inicializa Firebase e expõe sessão (guard + expose-session).
  // Aqui a gente só confirma que herdou e marca versão.

  const user = window.__RELEVO_USER__ || null;

  if (user?.email) {
    console.log("✅ Sessão herdada do Portal:", user.email);
  } else {
    console.log("ℹ️ Sem sessão exposta ainda (ok durante reset).");
  }

  // marcador para você bater o olho e saber que está carregando o v2
  window.__CRONOGRAMA_V2__ = {
    bootedAt: new Date().toISOString(),
    version: "v2-reset",
  };
}
