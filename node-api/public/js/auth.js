// ============================================================
// 🔐 Auth — Token & session management (multi-role)
// Roles: 'produtor' | 'cliente' | 'entregador'
// ============================================================

const Auth = {
  TOKEN_KEY: 'hortas_token',
  USER_KEY:  'hortas_user',
  ROLE_KEY:  'hortas_role',

  // ── Token ──
  getToken()        { return localStorage.getItem(this.TOKEN_KEY); },
  setToken(token)   { localStorage.setItem(this.TOKEN_KEY, token); },

  // ── Role ──
  getRole()         { return localStorage.getItem(this.ROLE_KEY) || null; },
  setRole(role)     { localStorage.setItem(this.ROLE_KEY, role); },
  isRole(role)      { return this.getRole() === role; },

  // ── User ──
  getUser() {
    try { return JSON.parse(localStorage.getItem(this.USER_KEY)); }
    catch { return null; }
  },
  setUser(user) { localStorage.setItem(this.USER_KEY, JSON.stringify(user)); },

  // ── Session ──
  isAuthenticated() { return !!this.getToken(); },

  removeToken() {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.ROLE_KEY);
  },

  logout() {
    this.removeToken();
    window.location.hash = '#/';
  },

  // ── Helpers por role ──
  loginAs(role, token, user) {
    this.setRole(role);
    this.setToken(token);
    this.setUser(user);
  },

  // Retorna a rota home de cada perfil
  homeRoute() {
    const role = this.getRole();
    if (role === 'cliente')     return '#/cliente/hortas';
    if (role === 'entregador')  return '#/entregador/entregas';
    return '#/dashboard'; // produtor (default)
  },
};
