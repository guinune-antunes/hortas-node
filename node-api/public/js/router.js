// ============================================================
// 🛤️ Router — hash-based SPA navigation (multi-role)
// ============================================================

const Router = {
  routes: [],
  container: null,

  init(containerId) {
    this.container = document.getElementById(containerId);
    window.addEventListener('hashchange', () => this.resolve());
    this.resolve();
  },

  add(path, handler, { auth = false, role = null } = {}) {
    this.routes.push({ path, handler, auth, role });
    return this;
  },

  navigate(path) {
    window.location.hash = '#' + path;
  },

  resolve() {
    const hash = window.location.hash.slice(1) || '/';
    let matchedRoute = null;
    let params = {};

    for (const route of this.routes) {
      const pattern = route.path.replace(/:\w+/g, '([^/]+)');
      const regex = new RegExp(`^${pattern}$`);
      const match = hash.match(regex);

      if (match) {
        matchedRoute = route;
        const paramNames = (route.path.match(/:(\w+)/g) || []).map(p => p.slice(1));
        paramNames.forEach((name, i) => { params[name] = match[i + 1]; });
        break;
      }
    }

    // Rota não encontrada → redireciona
    if (!matchedRoute) {
      if (Auth.isAuthenticated()) {
        window.location.hash = Auth.homeRoute();
      } else {
        window.location.hash = '#/';
      }
      return;
    }

    // Guard de autenticação
    if (matchedRoute.auth && !Auth.isAuthenticated()) {
      // Salva o role esperado para pré-selecionar no login
      if (matchedRoute.role) Auth.setRole(matchedRoute.role);
      window.location.hash = '#/login';
      return;
    }

    // Guard de role: se autenticado com role errado → home correta
    // Sessões legadas (sem role definido) são tratadas como produtor
    if (matchedRoute.role && Auth.isAuthenticated()) {
      const currentRole = Auth.getRole();
      if (!currentRole) {
        // Sessão antiga sem role → assume produtor
        Auth.setRole('produtor');
      } else if (currentRole !== matchedRoute.role) {
        window.location.hash = Auth.homeRoute();
        return;
      }
    }

    // Rotas públicas de auth → redireciona para home se já logado
    const publicRoutes = ['/', '/login', '/register', '/forgot-password',
                          '/cliente/login', '/entregador/login'];
    if (publicRoutes.includes(matchedRoute.path) && Auth.isAuthenticated()) {
      // Só redireciona se não for a rota "/" (que já lida com isso no handler)
      if (matchedRoute.path !== '/') {
        window.location.hash = Auth.homeRoute();
        return;
      }
    }

    // Render
    if (this.container) {
      this.container.innerHTML = '<div class="spinner-center"><div class="spinner"></div></div>';
      matchedRoute.handler(params);
    }
  },
};
