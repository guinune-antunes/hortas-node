// ============================================================
// 📄 Login Page — Portal selector + login por perfil
// ============================================================

function renderLogin() {
  // Se há role salva, vai direto pro form daquela role
  const role = Auth.getRole();
  if (role && !Auth.isAuthenticated()) {
    _renderLoginForm(role);
    return;
  }
  _renderPortalSelector();
}

// ── Portal selector ──────────────────────────────────────────
function _renderPortalSelector() {
  const container = document.getElementById('app');
  container.innerHTML = `
    <div class="auth-layout">
      <div class="auth-container" style="max-width:560px;">
        <div class="auth-logo">
          <img src="/img/logo-hortas.jpg" alt="Hortas Logo" style="height: 80px; width: auto; border-radius: var(--radius-sm); margin-bottom: 12px; object-fit: contain;" />
          <p>Marketplace de hortas urbanas</p>
        </div>
        <div class="card" style="padding:32px;">
          <div class="form-section-title" style="justify-content:center;margin-bottom:24px;">Selecione seu perfil</div>
          <div class="portal-grid">
            <button class="portal-card" id="portalProdutor" onclick="_renderLoginForm('produtor')">
              <span class="portal-icon">👨‍🌾</span>
              <span class="portal-label">Produtor</span>
              <span class="portal-desc">Gerencie sua horta e estoque</span>
            </button>
            <button class="portal-card" id="portalCliente" onclick="_renderLoginForm('cliente')">
              <span class="portal-icon">🛒</span>
              <span class="portal-label">Cliente</span>
              <span class="portal-desc">Compre produtos frescos</span>
            </button>
            <button class="portal-card" id="portalEntregador" onclick="_renderLoginForm('entregador')">
              <span class="portal-icon">🚴</span>
              <span class="portal-label">Entregador</span>
              <span class="portal-desc">Gerencie suas entregas</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Form de login por role ────────────────────────────────────
function _renderLoginForm(role) {
  const labels = {
    produtor:   { icon: '👨‍🌾', titulo: 'Produtor',   desc: 'Acesse sua conta de produtor' },
    cliente:    { icon: '🛒',   titulo: 'Cliente',    desc: 'Acesse sua conta de cliente' },
    entregador: { icon: '🚴',   titulo: 'Entregador', desc: 'Acesse sua conta de entregador' },
  };
  const { icon, titulo, desc } = labels[role];

  const hasRegister = role !== 'produtor'; // produtor usa rota própria (/register)

  const container = document.getElementById('app');
  container.innerHTML = `
    <div class="auth-layout">
      <div class="auth-container">
        <div class="auth-logo">
          <img src="/img/logo-hortas.jpg" alt="Hortas Logo" style="height: 60px; width: auto; border-radius: var(--radius-sm); margin-bottom: 12px; object-fit: contain;" />
          <h1>${icon} ${titulo}</h1>
          <p>${desc}</p>
        </div>

        ${hasRegister ? `
        <div style="display:flex;gap:8px;margin-bottom:16px;">
          <button id="tabLoginBtn"    class="btn btn-primary" style="flex:1;" onclick="_switchTab('login')">Entrar</button>
          <button id="tabCadastroBtn" class="btn btn-secondary" style="flex:1;" onclick="_switchTab('cadastro')">Cadastrar</button>
        </div>` : ''}

        <div class="card" id="formLoginCard">
          <form id="loginForm">
            <div class="form-group">
              <label for="lf-email">E-mail <span class="required">*</span></label>
              <input type="email" id="lf-email" class="form-control" placeholder="seu@email.com" required />
            </div>
            <div class="form-group">
              <label for="lf-senha">Senha <span class="required">*</span></label>
              <input type="password" id="lf-senha" class="form-control" placeholder="••••••••" required />
            </div>
            <button type="submit" class="btn btn-primary btn-block btn-lg" id="loginBtn">Entrar</button>
            <div id="loginToast" style="margin-top:14px;"></div>
          </form>
        </div>

        ${hasRegister ? `<div class="card" id="formCadastroCard" style="display:none;">
          ${role === 'cliente' ? _formCadastroCliente() : _formCadastroEntregador()}
          <div id="cadastroToast" style="margin-top:14px;"></div>
        </div>` : ''}

        <div class="auth-footer">
          <a href="#/" onclick="event.preventDefault(); _renderPortalSelector();">← Trocar perfil</a>
          ${role === 'produtor' ? ' &nbsp;·&nbsp; <a href="#/forgot-password">Esqueci minha senha</a> &nbsp;·&nbsp; <a href="#/register">Criar conta</a>' : ''}
        </div>
      </div>
    </div>
  `;

  // Evento de submit do login
  document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    _submitLogin(role);
  });

  // Evento de submit do cadastro (se existir)
  const cadastroForm = document.getElementById('cadastroForm');
  if (cadastroForm) {
    cadastroForm.addEventListener('submit', (e) => {
      e.preventDefault();
      _submitCadastro(role);
    });
  }
}

function _switchTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('formLoginCard').style.display    = isLogin ? 'block' : 'none';
  document.getElementById('formCadastroCard').style.display = isLogin ? 'none' : 'block';
  document.getElementById('tabLoginBtn').className    = isLogin ? 'btn btn-primary' : 'btn btn-secondary';
  document.getElementById('tabCadastroBtn').className = isLogin ? 'btn btn-secondary' : 'btn btn-primary';
  // Ajustar flex:1 perdido ao trocar className
  document.getElementById('tabLoginBtn').style.flex    = '1';
  document.getElementById('tabCadastroBtn').style.flex = '1';
}

function _formCadastroCliente() {
  return `
    <form id="cadastroForm">
      <div class="form-section-title">Criar conta de cliente</div>
      <div class="form-group">
        <label for="cf-nome">Nome completo <span class="required">*</span></label>
        <input type="text" id="cf-nome" class="form-control" placeholder="Maria Silva" required />
      </div>
      <div class="form-group">
        <label for="cf-email">E-mail <span class="required">*</span></label>
        <input type="email" id="cf-email" class="form-control" placeholder="seu@email.com" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="cf-senha">Senha <span class="required">*</span></label>
          <input type="password" id="cf-senha" class="form-control" placeholder="••••••••" required />
        </div>
        <div class="form-group">
          <label for="cf-telefone">Telefone</label>
          <input type="text" id="cf-telefone" class="form-control" placeholder="(47) 99999-9999" />
        </div>
      </div>
      <div class="form-group">
        <label for="cf-endereco">Endereço padrão de entrega</label>
        <input type="text" id="cf-endereco" class="form-control" placeholder="Rua das Flores, 123 – Joinville/SC" />
      </div>
      <button type="submit" class="btn btn-primary btn-block btn-lg" id="cadastroBtn">Criar Conta</button>
    </form>
  `;
}

function _formCadastroEntregador() {
  return `
    <form id="cadastroForm">
      <div class="form-section-title">Criar conta de entregador</div>
      <div class="form-group">
        <label for="ef-nome">Nome completo <span class="required">*</span></label>
        <input type="text" id="ef-nome" class="form-control" placeholder="João Silva" required />
      </div>
      <div class="form-group">
        <label for="ef-email">E-mail <span class="required">*</span></label>
        <input type="email" id="ef-email" class="form-control" placeholder="seu@email.com" required />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label for="ef-senha">Senha <span class="required">*</span></label>
          <input type="password" id="ef-senha" class="form-control" placeholder="••••••••" required />
        </div>
        <div class="form-group">
          <label for="ef-telefone">Telefone</label>
          <input type="text" id="ef-telefone" class="form-control" placeholder="(47) 99999-9999" />
        </div>
      </div>
      <button type="submit" class="btn btn-primary btn-block btn-lg" id="cadastroBtn">Criar Conta</button>
    </form>
  `;
}

// ── Submit login ──────────────────────────────────────────────
async function _submitLogin(role) {
  const btn   = document.getElementById('loginBtn');
  const toast = document.getElementById('loginToast');
  const email = document.getElementById('lf-email').value.trim();
  const senha = document.getElementById('lf-senha').value;

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Entrando...';

  let endpoint, tokenKey;
  if (role === 'produtor')   { endpoint = '/auth/login'; }
  if (role === 'cliente')    { endpoint = '/pedidos/cliente/login'; }
  if (role === 'entregador') { endpoint = '/entregador/login'; }

  const data = await Api.post(endpoint, { email, senha });

  if (data && data._ok && data.status === 'sucesso') {
    if (role === 'produtor') {
      // Busca dados completos do produtor
      Auth.loginAs('produtor', data.token, { id: data.id, nome: data.nome || '' });
      const me = await Api.get('/auth/me');
      if (me && me._ok) Auth.setUser(me.produtor);
      window.location.hash = '#/dashboard';
    } else if (role === 'cliente') {
      Auth.loginAs('cliente', data.token, { id: data.id, nome: data.nome });
      window.location.hash = '#/cliente/hortas';
    } else if (role === 'entregador') {
      Auth.loginAs('entregador', data.token, { id: data.id, nome: data.nome });
      window.location.hash = '#/entregador/entregas';
    }
  } else {
    toast.innerHTML = `<div class="toast toast-error">${data?.mensagem || 'Credenciais inválidas.'}</div>`;
    btn.disabled = false;
    btn.textContent = 'Entrar';
  }
}

// ── Submit cadastro ───────────────────────────────────────────
async function _submitCadastro(role) {
  const btn   = document.getElementById('cadastroBtn');
  const toast = document.getElementById('cadastroToast');

  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Criando...';

  let body, endpoint;

  if (role === 'cliente') {
    endpoint = '/pedidos/cliente/register';
    body = {
      nome:             document.getElementById('cf-nome').value.trim(),
      email:            document.getElementById('cf-email').value.trim(),
      senha:            document.getElementById('cf-senha').value,
      telefone:         document.getElementById('cf-telefone').value.trim() || null,
      endereco_entrega: document.getElementById('cf-endereco').value.trim() || null,
    };
  } else if (role === 'entregador') {
    endpoint = '/entregador/register';
    body = {
      nome:     document.getElementById('ef-nome').value.trim(),
      email:    document.getElementById('ef-email').value.trim(),
      senha:    document.getElementById('ef-senha').value,
      telefone: document.getElementById('ef-telefone').value.trim() || null,
    };
  }

  const data = await Api.post(endpoint, body);

  if (data && data._ok) {
    toast.innerHTML = '<div class="toast toast-success">✅ Conta criada! Faça login.</div>';
    setTimeout(() => _switchTab('login'), 1500);
  } else {
    toast.innerHTML = `<div class="toast toast-error">${data?.mensagem || 'Erro ao cadastrar.'}</div>`;
    btn.disabled = false;
    btn.textContent = 'Criar Conta';
  }
}
