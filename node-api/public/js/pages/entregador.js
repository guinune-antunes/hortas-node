// ============================================================
// 🚴 Portal do Entregador — Entregas disponíveis e histórico
// ============================================================

// ── Entregas disponíveis + entrega atual ──────────────────────
async function renderEntregas() {
  const container = getPageContainer();
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2>🚴 Suas Entregas</h2>
          <p>Gerencie suas entregas em tempo real</p>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <div class="status-indicator" id="statusIndicator">
            <span class="status-dot" id="statusDot"></span>
            <span id="statusTexto" style="font-size:0.82rem;color:var(--text-secondary);">Verificando...</span>
          </div>
          <button class="btn btn-secondary btn-sm" onclick="renderEntregas()">↻ Atualizar</button>
        </div>
      </div>
      <div id="entregasConteudo"><div class="spinner-center"><div class="spinner"></div></div></div>
    </div>
  `;

  await _carregarEntregas();
}

async function _carregarEntregas() {
  const conteudo = document.getElementById('entregasConteudo');
  conteudo.innerHTML = '<div class="spinner-center"><div class="spinner"></div></div>';

  let html = '';

  // Verifica entrega em andamento
  const atual = await Api.get('/entregador/minha-entrega-atual');
  if (atual?.dados) {
    _atualizarStatusBar(true);
    html += `<div style="margin-bottom:8px;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--primary);">Em andamento</div>`;
    html += _renderCardEntrega(atual.dados, true);
  } else {
    _atualizarStatusBar(false);
  }

  // Busca pendentes
  const pendentes = await Api.get('/entregador/pendentes');
  const lista = pendentes?.dados || [];

  if (lista.length) {
    html += `<div style="margin:${atual?.dados ? '24px' : '0'} 0 8px;font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);">Pedidos disponíveis (${lista.length})</div>`;
    html += lista.map(p => _renderCardEntrega(p, false)).join('');
  }

  if (!html) {
    html = `
      <div class="empty-state">
        <div class="empty-icon">🌿</div>
        <h3>Nenhuma entrega disponível</h3>
        <p>Não há pedidos pendentes no momento. Aguarde novos pedidos.</p>
        <button class="btn btn-secondary btn-sm" onclick="renderEntregas()" style="margin-top:8px;">↻ Verificar novamente</button>
      </div>`;
  }

  conteudo.innerHTML = html;
}

function _atualizarStatusBar(ocupado) {
  const dot   = document.getElementById('statusDot');
  const texto = document.getElementById('statusTexto');
  if (!dot || !texto) return;
  if (ocupado) {
    dot.classList.add('ocupado');
    texto.textContent = 'Em entrega';
    texto.style.color = 'var(--warning)';
  } else {
    dot.classList.remove('ocupado');
    texto.textContent = 'Disponível';
    texto.style.color = 'var(--primary)';
  }
}

function _renderCardEntrega(p, isAndamento = false, isHistorico = false) {
  const statusLabel = { pendente: 'Pendente', aceito: 'Aceito', a_caminho: 'A caminho', entregue: 'Entregue', cancelado: 'Cancelado' };
  const statusBadge = { pendente: 'badge-yellow', aceito: 'badge-blue', a_caminho: 'badge-blue', entregue: 'badge-green', cancelado: 'badge-red' };

  const endCodificado = p.endereco_entrega ? encodeURIComponent(p.endereco_entrega + (p.nm_cidade ? `, ${p.nm_cidade}` : '')) : '';
  const mapsBtn = `<a href="https://www.google.com/maps/search/?api=1&query=${endCodificado}" target="_blank" class="btn btn-secondary btn-sm">🗺️ Ver Rota</a>`;

  let acoesHtml = '';
  if (!isHistorico) {
    if (p.status === 'pendente') {
      acoesHtml = `<div style="display:flex;gap:8px;margin-top:16px;">
        <button class="btn btn-primary" style="flex:1;" onclick="_aceitarPedido(${p.id_pedido})">✓ Aceitar entrega</button>
      </div>`;
    } else if (p.status === 'aceito') {
      acoesHtml = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
        ${mapsBtn}
        <button class="btn btn-primary" style="flex:1;" onclick="_atualizarStatusEntrega(${p.id_pedido}, 'a_caminho')">🚴 Saí para entregar</button>
      </div>`;
    } else if (p.status === 'a_caminho') {
      acoesHtml = `<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:16px;">
        ${mapsBtn}
        <button class="btn btn-primary" style="flex:1;background:var(--primary);" onclick="_atualizarStatusEntrega(${p.id_pedido}, 'entregue')">✓ Confirmar entrega</button>
      </div>`;
    }
  }

  // Borda lateral por status
  const borderColor = isAndamento
    ? 'var(--warning)'
    : p.status === 'entregue' ? 'var(--primary)' : p.status === 'cancelado' ? 'var(--danger)' : 'var(--border)';

  return `
    <div class="card" style="border-left:4px solid ${borderColor};margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
        <span style="font-size:1.1rem;font-weight:700;">Pedido #${p.id_pedido}</span>
        <span class="badge ${statusBadge[p.status] || 'badge-blue'}">${statusLabel[p.status] || p.status}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Cliente</div>
          <div style="font-size:0.9rem;font-weight:500;">${p.nome_cliente || '—'}</div>
          ${p.telefone_cliente ? `<div style="font-size:0.78rem;color:var(--text-secondary);">${p.telefone_cliente}</div>` : ''}
        </div>
        <div>
          <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Horta</div>
          <div style="font-size:0.9rem;font-weight:500;">${p.nome_horta || '—'}</div>
        </div>
        <div>
          <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Entregar em</div>
          <div style="font-size:0.9rem;">${p.endereco_entrega || '—'}</div>
        </div>
        <div>
          <div style="font-size:0.7rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:2px;">Valor</div>
          <div style="font-size:1rem;font-weight:700;color:var(--primary);">R$ ${parseFloat(p.valor_total || 0).toFixed(2)}</div>
        </div>
      </div>
      ${p.itens && p.itens.length ? `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:12px;margin-bottom:4px;">
          <div style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:8px;">Itens</div>
          ${p.itens.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:0.82rem;padding:4px 0;border-bottom:1px solid var(--border);">
              <span style="color:var(--text-secondary);">${i.nm_produto} — ${parseFloat(i.quantidade)} ${i.unidade_medida_padrao || 'un'}</span>
              <span style="font-weight:600;">R$ ${(i.quantidade * i.preco_unitario).toFixed(2)}</span>
            </div>`).join('')}
        </div>` : ''}
      ${acoesHtml}
    </div>`;
}

async function _aceitarPedido(id) {
  const res = await Api.request(`/entregador/aceitar/${id}`, { method: 'POST', body: '{}' });
  showToast(res?.mensagem || 'Pedido aceito!', res?._ok ? 'success' : 'error');
  setTimeout(() => _carregarEntregas(), 800);
}

async function _atualizarStatusEntrega(id, status) {
  const res = await Api.request(`/entregador/status/${id}`, {
    method: 'PATCH', body: JSON.stringify({ status }),
  });
  showToast(res?.mensagem || 'Status atualizado!', res?._ok ? 'success' : 'error');
  setTimeout(() => _carregarEntregas(), 800);
}

// ── Histórico ─────────────────────────────────────────────────
async function renderHistoricoEntregas() {
  const container = getPageContainer();
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2>📦 Histórico de Entregas</h2>
          <p>Todas as suas entregas finalizadas</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderHistoricoEntregas()">↻ Atualizar</button>
      </div>
      <div id="historicoConteudo"><div class="spinner-center"><div class="spinner"></div></div></div>
    </div>
  `;

  const data = await Api.get('/entregador/historico');
  const conteudo = document.getElementById('historicoConteudo');
  const pedidos  = data?.dados || [];

  if (!pedidos.length) {
    conteudo.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Nenhuma entrega realizada</h3>
        <p>Você ainda não completou nenhuma entrega.</p>
      </div>`;
    return;
  }

  conteudo.innerHTML = pedidos.map(p => _renderCardEntrega(p, false, true)).join('');
}
