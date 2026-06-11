// ============================================================
// 🛒 Portal do Cliente — Hortas, Pedido, Pagamento, Meus Pedidos
// ============================================================

// ── Hortas disponíveis ────────────────────────────────────────
async function renderClienteHortas() {
  const container = getPageContainer();
  const user = Auth.getUser();

  container.innerHTML = `
    <div class="page-container">
      <div class="page-header">
        <h2>🏡 Hortas Disponíveis</h2>
        <p>Olá, ${user?.nome || 'Cliente'}! Escolha uma horta para fazer seu pedido.</p>
      </div>
      <div class="table-toolbar">
        <div class="table-search">
          <input type="text" id="clienteSearch" placeholder="Buscar horta ou cidade..." />
        </div>
      </div>
      <div class="cards-grid" id="clienteHortasGrid">
        <div class="spinner-center"><div class="spinner"></div></div>
      </div>
    </div>
  `;

  const data = await Api.get('/hortas');
  const hortas = data?.hortas || [];

  _renderHortasCliente(hortas);

  document.getElementById('clienteSearch').addEventListener('input', (e) => {
    const q = e.target.value.toLowerCase();
    _renderHortasCliente(hortas.filter(h =>
      (h.nome || '').toLowerCase().includes(q) ||
      (h.nm_cidade || '').toLowerCase().includes(q) ||
      (h.nm_bairro || '').toLowerCase().includes(q)
    ));
  });
}

function _renderHortasCliente(hortas) {
  const grid = document.getElementById('clienteHortasGrid');
  if (!hortas.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🌿</div>
        <h3>Nenhuma horta encontrada</h3>
        <p>Tente ajustar a busca.</p>
      </div>`;
    return;
  }

  grid.innerHTML = hortas.map(h => `
    <div class="horta-card" onclick="window.location.hash='#/cliente/pedido/${h.id_hortas}'">
      <div class="horta-card-title">
        <span>🌱</span>
        <span>${h.nome || 'Sem nome'}</span>
      </div>
      <div class="horta-card-desc">${h.descricao || 'Horta sem descrição.'}</div>
      <div class="horta-card-meta">
        ${h.nm_bairro ? `<span class="meta-tag">📍 ${h.nm_bairro}${h.nm_cidade ? ', ' + h.nm_cidade : ''}</span>` : ''}
        ${h.nome_produtor ? `<span class="meta-tag">👤 ${h.nome_produtor}</span>` : ''}
        <span class="meta-tag green">🛒 Ver produtos</span>
      </div>
    </div>
  `).join('');
}

// ── Fazer Pedido ──────────────────────────────────────────────
let _carrinho = [];
let _pedidoState = { hortaId: null, endereco: '', obs: null };

async function renderClientePedido(params) {
  const hortaId = params?.id;
  const container = getPageContainer();
  _carrinho = [];

  container.innerHTML = `
    <div class="page-container">
      <div class="page-header" style="display:flex;align-items:center;gap:16px;">
        <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/cliente/hortas'">← Voltar</button>
        <div>
          <h2 id="pedidoHortaNome">Carregando...</h2>
          <p>Adicione produtos ao carrinho e finalize o pedido</p>
        </div>
      </div>

      <div id="produtosGrid" class="cards-grid">
        <div class="spinner-center"><div class="spinner"></div></div>
      </div>

      <div id="carrinhoArea" style="display:none; margin-top:24px;">
        <div class="card" style="border-color:var(--primary);margin-bottom:16px;">
          <div class="form-section-title">🛒 Carrinho</div>
          <div id="carrinhoItens"></div>
          <div style="text-align:right;font-size:1.2rem;font-weight:700;color:var(--primary);margin-top:12px;" id="carrinhoTotal">Total: R$ 0,00</div>
        </div>
        <div class="card">
          <div class="form-section-title">Dados da entrega</div>
          <div class="form-group">
            <label for="enderecoEntrega">Endereço de entrega <span class="required">*</span></label>
            <input type="text" id="enderecoEntrega" class="form-control" placeholder="Rua das Flores, 123 – Joinville/SC" />
          </div>
          <div class="form-group">
            <label for="pedidoObs">Observação (opcional)</label>
            <input type="text" id="pedidoObs" class="form-control" placeholder="Ex: Deixar na portaria..." />
          </div>
          <button class="btn btn-primary btn-block btn-lg" onclick="_irParaPagamento(${hortaId})">
            Ir para Pagamento →
          </button>
        </div>
      </div>
    </div>
  `;

  // Busca dados da horta
  const hortaRes = await Api.get(`/hortas/${hortaId}`);
  if (hortaRes?.horta) {
    document.getElementById('pedidoHortaNome').textContent = '🌱 ' + (hortaRes.horta.nome || 'Horta');
  }

  // Busca estoques
  const estRes = await Api.get(`/estoques/horta/${hortaId}`);
  const estoques = estRes?.estoques || [];
  const grid = document.getElementById('produtosGrid');

  if (!estoques.length) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <div class="empty-icon">🥬</div>
        <h3>Sem produtos em estoque</h3>
        <p>Esta horta não tem produtos disponíveis no momento.</p>
      </div>`;
    return;
  }

  grid.innerHTML = estoques.map(e => {
    const base = 6 + (e.produto_id_produto || e.id_produto || 1) % 12;
    const preco = parseFloat(base).toFixed(2);
    const qtdMax = parseFloat(e.ds_quantidade);
    return `
      <div class="card produto-mkt-card" id="pcard-${e.id_estoques}">
        <div style="font-size:0.7rem;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:var(--text-muted);margin-bottom:6px;">${e.unidade_medida_padrao || 'unidade'}</div>
        <div style="font-size:1rem;font-weight:700;margin-bottom:4px;">${e.nm_produto || 'Produto'}</div>
        <div style="font-size:0.8rem;color:var(--text-secondary);margin-bottom:10px;">Disponível: ${qtdMax} ${e.unidade_medida_padrao || 'un'}</div>
        <div style="font-size:1.3rem;font-weight:700;color:var(--primary);margin-bottom:14px;">R$ ${preco}<span style="font-size:0.7rem;font-weight:400;color:var(--text-muted);">/${e.unidade_medida_padrao || 'un'}</span></div>
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn btn-secondary btn-sm" style="width:32px;height:32px;padding:0;font-size:1.1rem;"
            onclick="_alterarQty(${e.id_estoques}, -1, ${qtdMax}, '${(e.nm_produto||'').replace(/'/g,"\\'")}', ${preco}, '${e.unidade_medida_padrao||'un'}')">−</button>
          <span style="font-weight:700;min-width:24px;text-align:center;" id="qty-${e.id_estoques}">0</span>
          <button class="btn btn-secondary btn-sm" style="width:32px;height:32px;padding:0;font-size:1.1rem;"
            onclick="_alterarQty(${e.id_estoques}, 1, ${qtdMax}, '${(e.nm_produto||'').replace(/'/g,"\\'")}', ${preco}, '${e.unidade_medida_padrao||'un'}')">+</button>
        </div>
      </div>`;
  }).join('');
}

function _alterarQty(estoqueId, delta, max, nome, preco, unidade) {
  const el = document.getElementById(`qty-${estoqueId}`);
  let qty = parseInt(el.textContent) + delta;
  qty = Math.max(0, Math.min(qty, max));
  el.textContent = qty;

  // Destaque visual no card
  const card = document.getElementById(`pcard-${estoqueId}`);
  card.style.borderColor = qty > 0 ? 'var(--primary)' : 'var(--border)';

  // Atualiza carrinho
  const idx = _carrinho.findIndex(i => i.estoque_id === estoqueId);
  if (qty === 0 && idx !== -1)      _carrinho.splice(idx, 1);
  else if (qty > 0 && idx === -1)   _carrinho.push({ estoque_id: estoqueId, nm_produto: nome, quantidade: qty, preco_unitario: parseFloat(preco), unidade });
  else if (qty > 0 && idx !== -1)   _carrinho[idx].quantidade = qty;

  _atualizarCarrinhoUI();
}

function _atualizarCarrinhoUI() {
  const area = document.getElementById('carrinhoArea');
  if (!_carrinho.length) { area.style.display = 'none'; return; }
  area.style.display = 'block';

  const total = _carrinho.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
  document.getElementById('carrinhoItens').innerHTML = _carrinho.map(i => `
    <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:0.85rem;">
      <span style="color:var(--text-secondary);">${i.nm_produto} × ${i.quantidade} ${i.unidade}</span>
      <span style="font-weight:600;">R$ ${(i.quantidade * i.preco_unitario).toFixed(2)}</span>
    </div>`).join('');
  document.getElementById('carrinhoTotal').textContent = `Total: R$ ${total.toFixed(2)}`;
}

function _irParaPagamento(hortaId) {
  const endereco = document.getElementById('enderecoEntrega').value.trim();
  const obs = document.getElementById('pedidoObs')?.value.trim() || null;
  if (!endereco) { showToast('Informe o endereço de entrega!', 'error'); return; }
  if (!_carrinho.length) { showToast('Adicione produtos ao carrinho!', 'error'); return; }
  _pedidoState = { hortaId, endereco, obs };
  renderClientePagamento();
}

// ── Pagamento ─────────────────────────────────────────────────
function renderClientePagamento() {
  const { hortaId, endereco } = _pedidoState;
  const total = _carrinho.reduce((s, i) => s + i.quantidade * i.preco_unitario, 0);
  const container = getPageContainer();

  container.innerHTML = `
    <div class="page-container">
      <div class="page-header" style="display:flex;align-items:center;gap:16px;">
        <button class="btn btn-ghost btn-sm" onclick="window.location.hash='#/cliente/pedido/${hortaId}'">← Voltar ao Carrinho</button>
        <div>
          <h2>💳 Pagamento Simulado</h2>
          <p>Dados fictícios para demonstração</p>
        </div>
      </div>

      <div style="max-width:480px;margin:0 auto;">
        <div class="card" style="margin-bottom:16px;border-color:var(--primary);">
          <div class="form-section-title">Resumo do Pedido</div>
          ${_carrinho.map(i => `
            <div style="display:flex;justify-content:space-between;font-size:0.85rem;padding:6px 0;border-bottom:1px solid var(--border);color:var(--text-secondary);">
              <span>${i.nm_produto} × ${i.quantidade} ${i.unidade}</span>
              <span style="font-weight:600;color:var(--text);">R$ ${(i.quantidade * i.preco_unitario).toFixed(2)}</span>
            </div>`).join('')}
          <div style="text-align:right;font-size:1.3rem;font-weight:700;color:var(--primary);margin-top:12px;">Total: R$ ${total.toFixed(2)}</div>
        </div>

        <div class="card">
          <div class="form-section-title">Dados do Cartão (Fictício)</div>
          <div class="form-group">
            <label for="pgCartao">Número do Cartão</label>
            <input type="text" id="pgCartao" class="form-control" placeholder="0000 0000 0000 0000" maxlength="19" />
          </div>
          <div class="form-group">
            <label for="pgNome">Nome no Cartão</label>
            <input type="text" id="pgNome" class="form-control" placeholder="NOME IMPRESSO" style="text-transform:uppercase;" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="pgValidade">Validade</label>
              <input type="text" id="pgValidade" class="form-control" placeholder="MM/AA" maxlength="5" />
            </div>
            <div class="form-group">
              <label for="pgCvv">CVV</label>
              <input type="text" id="pgCvv" class="form-control" placeholder="123" maxlength="4" />
            </div>
          </div>
          <button class="btn btn-primary btn-block btn-lg" id="btnConfirmarPag" onclick="_confirmarPagamento()">
            ✓ Confirmar Pagamento • R$ ${total.toFixed(2)}
          </button>
          <div id="pagToast" style="margin-top:14px;"></div>
        </div>
      </div>
    </div>
  `;
}

async function _confirmarPagamento() {
  const { hortaId, endereco, obs } = _pedidoState;
  const cartao   = document.getElementById('pgCartao').value.trim();
  const validade = document.getElementById('pgValidade').value.trim();
  const cvv      = document.getElementById('pgCvv').value.trim();

  if (!cartao || !validade || !cvv) {
    document.getElementById('pagToast').innerHTML = '<div class="toast toast-error">Preencha os dados do cartão!</div>';
    return;
  }

  const btn = document.getElementById('btnConfirmarPag');
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Processando...';

  const payload = {
    horta_id:         parseInt(hortaId),
    endereco_entrega: endereco,
    observacao:       obs || null,
    itens: _carrinho.map(i => ({
      estoque_id:     i.estoque_id,
      quantidade:     i.quantidade,
      preco_unitario: i.preco_unitario,
    })),
  };

  console.log('[Pagamento] payload:', payload);

  const res = await Api.post('/pedidos', payload);

  console.log('[Pagamento] resposta:', res);

  if (res && res._ok && res.status === 'sucesso') {
    showToast(`🎉 Pagamento aprovado! Pedido #${res.id_pedido} criado!`, 'success');
    _carrinho = [];
    _pedidoState = { hortaId: null, endereco: '', obs: null };
    setTimeout(() => { window.location.hash = '#/cliente/meus-pedidos'; }, 1500);
  } else {
    const errMsg = res?.mensagem || res?.message || `Erro HTTP ${res?._status || '?'}`;
    document.getElementById('pagToast').innerHTML = `<div class="toast toast-error">❌ ${errMsg}</div>`;
    console.error('[Pagamento] erro:', res);
    btn.disabled = false;
    btn.textContent = '✓ Confirmar Pagamento';
  }
}

// ── Meus Pedidos ──────────────────────────────────────────────
async function renderMeusPedidos() {
  const container = getPageContainer();
  container.innerHTML = `
    <div class="page-container">
      <div class="page-header" style="display:flex;justify-content:space-between;align-items:center;">
        <div>
          <h2>📦 Meus Pedidos</h2>
          <p>Acompanhe o status das suas entregas</p>
        </div>
        <button class="btn btn-secondary btn-sm" onclick="renderMeusPedidos()">↻ Atualizar</button>
      </div>
      <div id="pedidosLista"><div class="spinner-center"><div class="spinner"></div></div></div>
    </div>
  `;

  const data = await Api.get('/pedidos/meus');
  const lista = document.getElementById('pedidosLista');
  const pedidos = data?.dados || [];

  if (!pedidos.length) {
    lista.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📦</div>
        <h3>Nenhum pedido ainda</h3>
        <p>Explore as hortas e faça seu primeiro pedido!</p>
        <a href="#/cliente/hortas" class="btn btn-primary btn-sm" style="display:inline-flex;margin-top:8px;">Ver Hortas</a>
      </div>`;
    return;
  }

  const statusLabel = { pendente: 'Pendente', aceito: 'Aceito', a_caminho: 'A caminho', entregue: 'Entregue', cancelado: 'Cancelado' };
  const statusBadge = { pendente: 'badge-yellow', aceito: 'badge-blue', a_caminho: 'badge-blue', entregue: 'badge-green', cancelado: 'badge-red' };

  lista.innerHTML = pedidos.map(p => `
    <div class="card" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
        <span style="font-weight:700;">Pedido #${p.id_pedido}</span>
        <span class="badge ${statusBadge[p.status] || 'badge-blue'}">${statusLabel[p.status] || p.status}</span>
      </div>
      <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:4px;">🌱 ${p.nome_horta} &nbsp;·&nbsp; ${_fmtData(p.dt_pedido)}</div>
      <div style="font-size:0.82rem;color:var(--text-secondary);margin-bottom:10px;">📍 ${p.endereco_entrega}</div>
      ${p.nome_entregador ? `
        <div style="background:var(--bg);border:1px solid var(--border);border-radius:var(--radius-sm);padding:8px 12px;font-size:0.82rem;margin-bottom:10px;">
          🚴 <strong>${p.nome_entregador}</strong>${p.telefone_entregador ? ' · ' + p.telefone_entregador : ''}
        </div>` : ''}
      <div style="font-size:1.1rem;font-weight:700;color:var(--primary);">R$ ${parseFloat(p.valor_total).toFixed(2)}</div>
    </div>`).join('');
}

function _fmtData(str) {
  if (!str) return '—';
  return new Date(str).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}
