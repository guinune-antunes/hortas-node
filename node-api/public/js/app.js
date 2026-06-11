// ============================================================
// 🚀 App — Bootstrapper, Layout & Multi-role Shell
// ============================================================

// ── Toast system ──
function showToast(message, type = 'info') {
  let tc = document.getElementById('toastContainer');
  if (!tc) {
    tc = document.createElement('div');
    tc.id = 'toastContainer';
    tc.className = 'toast-container';
    document.body.appendChild(tc);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = (type === 'success' ? '✅ ' : type === 'error' ? '❌ ' : 'ℹ️ ') + message;
  tc.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(40px)';
    toast.style.transition = '0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ── Get render target ──
function getPageContainer() {
  return document.getElementById('pageContent') || document.getElementById('app');
}

// ── Sidebar config por role ────────────────────────────────────
const SIDEBAR_CONFIG = {
  produtor: {
    brand:   { icon: '🌱', title: 'Hortas', sub: 'Marketplace' },
    roleBadge: { label: '👨‍🌾 Produtor', color: 'var(--primary)' },
    sections: [
      { title: 'Principal', items: [
        { href: '#/dashboard', route: '/dashboard', icon: '📊', label: 'Dashboard' },
      ]},
      { title: 'Gestão', items: [
        { href: '#/hortas', route: '/hortas', icon: '🌱', label: 'Minhas Hortas' },
      ]},
      { title: 'Análise', items: [
        { href: '#/cep', route: '/cep', icon: '📈', label: 'CEP' },
      ]},
      { title: 'Conta', items: [
        { href: '#/profile', route: '/profile', icon: '👤', label: 'Meu Perfil' },
      ]},
    ],
  },
  cliente: {
    brand:   { icon: '🛒', title: 'Hortas', sub: 'Cliente' },
    roleBadge: { label: '🛒 Cliente', color: 'var(--accent)' },
    sections: [
      { title: 'Marketplace', items: [
        { href: '#/cliente/hortas',        route: '/cliente/hortas',        icon: '🏡', label: 'Hortas Disponíveis' },
        { href: '#/cliente/meus-pedidos',  route: '/cliente/meus-pedidos',  icon: '📦', label: 'Meus Pedidos' },
      ]},
    ],
  },
  entregador: {
    brand:   { icon: '🚴', title: 'Hortas', sub: 'Entregador' },
    roleBadge: { label: '🚴 Entregador', color: 'var(--warning)' },
    sections: [
      { title: 'Entregas', items: [
        { href: '#/entregador/entregas',  route: '/entregador/entregas',  icon: '🚴', label: 'Entregas Disponíveis' },
        { href: '#/entregador/historico', route: '/entregador/historico', icon: '📦', label: 'Histórico' },
      ]},
    ],
  },
};

// ── Render App Shell ──────────────────────────────────────────
function renderAppShell() {
  const role   = Auth.getRole() || 'produtor';
  const config = SIDEBAR_CONFIG[role];
  const user   = Auth.getUser();

  const userName  = user?.nome_produtor || user?.nome || 'Usuário';
  const userEmail = user?.email_produtor || user?.email || '';

  const navHTML = config.sections.map(sec => `
    <div class="nav-section-title">${sec.title}</div>
    ${sec.items.map(item => `
      <a href="${item.href}" class="nav-item" data-route="${item.route}">
        <span class="icon">${item.icon}</span> ${item.label}
      </a>`).join('')}
  `).join('');

  const app = document.getElementById('app');
  app.innerHTML = `
    <button class="mobile-toggle" id="mobileToggle" onclick="toggleSidebar()">☰</button>
    <div class="app-layout">
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand" style="display: flex; align-items: center; gap: 12px; padding: 16px 20px;">
          <img src="/img/logo-hortas.jpg" alt="Hortas Logo" style="width: 36px; height: 36px; border-radius: var(--radius-sm); object-fit: cover;" />
          <div>
            <h1 style="font-size: 1.15rem; margin: 0; line-height: 1.2;">Hortas</h1>
            <small style="display: block; font-size: 0.65rem; margin: 0;">${config.brand.sub}</small>
          </div>
        </div>
        <nav class="sidebar-nav">${navHTML}</nav>
        <div class="sidebar-footer">
          <div class="sidebar-user" onclick="${role === 'produtor' ? "window.location.hash='#/profile'" : ''}">
            <div class="sidebar-avatar" id="sidebarAvatar" style="background:linear-gradient(135deg,${config.roleBadge.color},var(--accent));">
              ${userName.charAt(0).toUpperCase()}
            </div>
            <div class="sidebar-user-info">
              <div class="sidebar-user-name" id="sidebarName">${userName}</div>
              <div class="sidebar-user-email" id="sidebarEmail" style="color:${config.roleBadge.color};">${config.roleBadge.label}</div>
            </div>
          </div>
          <button class="btn-logout" onclick="Auth.logout()" style="margin-top:10px;">
            🚪 Sair
          </button>
        </div>
      </aside>
      <main class="main-content">
        <div id="pageContent">
          <div class="spinner-center"><div class="spinner"></div></div>
        </div>
      </main>
    </div>
  `;
}

function updateSidebarUser() {
  const user   = Auth.getUser();
  const role   = Auth.getRole() || 'produtor';
  const config = SIDEBAR_CONFIG[role];
  const userName = user?.nome_produtor || user?.nome || 'Usuário';
  const avatar = document.getElementById('sidebarAvatar');
  const name   = document.getElementById('sidebarName');
  const email  = document.getElementById('sidebarEmail');
  if (avatar) avatar.textContent = userName.charAt(0).toUpperCase();
  if (name)   name.textContent   = userName;
  if (email)  email.textContent  = config?.roleBadge?.label || '';
}

function updateActiveNav() {
  const hash = window.location.hash.slice(1) || '/';
  document.querySelectorAll('.nav-item').forEach(item => {
    const route = item.dataset.route;
    item.classList.toggle('active', !!(route && hash.startsWith(route)));
  });
}

function toggleSidebar() {
  document.getElementById('sidebar')?.classList.toggle('open');
}

function ensureAppShell() {
  if (!document.getElementById('pageContent')) {
    renderAppShell();
  }
  updateActiveNav();
}

// ── Boot ──────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  Router
    // ── Portal selector ──
    .add('/', () => {
      if (Auth.isAuthenticated()) {
        window.location.hash = Auth.homeRoute();
      } else {
        renderLogin();
      }
    })

    // ── Produtor ──
    .add('/login',           () => renderLogin())
    .add('/register',        () => renderRegister())
    .add('/forgot-password', () => renderForgotPassword())
    .add('/dashboard',       () => { ensureAppShell(); renderDashboard(); },             { auth: true, role: 'produtor' })
    .add('/hortas',          () => { ensureAppShell(); renderHortasManage(); },          { auth: true, role: 'produtor' })
    .add('/hortas/estoque/:id', (p) => { ensureAppShell(); renderEstoqueManage(p); },    { auth: true, role: 'produtor' })
    .add('/profile',         () => { ensureAppShell(); renderProfile(); },               { auth: true, role: 'produtor' })
    .add('/cep',             () => { ensureAppShell(); renderCep(); },                   { auth: true, role: 'produtor' })

    // ── Cliente ──
    .add('/cliente/hortas',       () => { ensureAppShell(); renderClienteHortas(); },    { auth: true, role: 'cliente' })
    .add('/cliente/pedido/:id',   (p) => { ensureAppShell(); renderClientePedido(p); },  { auth: true, role: 'cliente' })
    .add('/cliente/meus-pedidos', () => { ensureAppShell(); renderMeusPedidos(); },      { auth: true, role: 'cliente' })

    // ── Entregador ──
    .add('/entregador/entregas',  () => { ensureAppShell(); renderEntregas(); },         { auth: true, role: 'entregador' })
    .add('/entregador/historico', () => { ensureAppShell(); renderHistoricoEntregas(); },{ auth: true, role: 'entregador' });

  Router.init('app');

  // Fecha sidebar no mobile ao navegar
  window.addEventListener('hashchange', () => {
    document.getElementById('sidebar')?.classList.remove('open');
    updateActiveNav();
  });
});
