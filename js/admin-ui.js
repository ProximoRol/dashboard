/* ═══════════════════════════════════════════════
   ADMIN UI — Panel de gestión multi-tenant
   Tabs: Clientes · Consumo · Sistema (developer)
   Depends on: core.js (apiFetch, API_BASE)
   Solo visible si role = 'admin' (MODULE_REGISTRY)
   ═══════════════════════════════════════════════ */

// ── Estado local del panel ───────────────────────────────────
let AD = {
  users:          [],       // lista completa de usuarios
  selectedUser:   null,     // usuario en vista detalle
  currentTab:     'clients', // 'clients' | 'usage' | 'system'
  usageMonth:     new Date().toISOString().slice(0, 7),
  loading:        false
};

const AD_MODULE_KEYS = [
  'analytics', 'audit', 'budget', 'content',
  'copilot', 'intelligence', 'memory', 'prosp', 'review', 'vs'
];

const AD_MODULE_LABELS = {
  analytics:    '📊 Analytics',
  audit:        '🔍 Content Audit',
  budget:       '💶 Budget',
  content:      '✍️ Content Studio',
  copilot:      '🤖 Co-Pilot',
  intelligence: '🌐 Intelligence',
  memory:       '🧠 Memory',
  prosp:        '🤝 Prospecting',
  review:       '📋 Review',
  vs:           '🎨 Visual Studio'
};

const AD_PLAN_LABELS = {
  starter:    { label: 'Starter',    color: '#6B7280', bg: '#F3F4F6' },
  pro:        { label: 'Pro',        color: '#2563EB', bg: '#EFF6FF' },
  enterprise: { label: 'Enterprise', color: '#7C3AED', bg: '#F5F3FF' }
};

// ── Entry point — llamado desde MODULE_REGISTRY ──────────────
async function renderAdminPage() {
  const container = document.getElementById('page-admin');
  if (!container) return;

  container.innerHTML = adSkeleton();
  adBindTabs();
  await adLoadUsers();
  adRenderClients();
}

// ── Skeleton HTML del panel ──────────────────────────────────
function adSkeleton() {
  return `
  <div id="ad-root" style="max-width:1100px;margin:0 auto;padding:0 4px">

    <!-- Header -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:20px;font-weight:600;margin:0;color:var(--tx)">Panel Admin</h2>
        <div style="font-size:12px;color:var(--mt);margin-top:2px">Gestión de clientes, consumo y sistema</div>
      </div>
      <button onclick="adOpenInviteModal()" style="display:flex;align-items:center;gap:6px;padding:8px 16px;background:var(--green);color:#fff;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        Nuevo cliente
      </button>
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:2px;border-bottom:1px solid var(--bd2);margin-bottom:24px">
      <button id="ad-tab-clients" class="ad-tab ad-tab-active" onclick="adSwitchTab('clients')">👥 Clientes</button>
      <button id="ad-tab-usage"   class="ad-tab"               onclick="adSwitchTab('usage')">💰 Consumo</button>
      <button id="ad-tab-system"  class="ad-tab"               onclick="adSwitchTab('system')">🔧 Sistema</button>
    </div>

    <!-- Content area -->
    <div id="ad-content"></div>

  </div>

  <!-- Modal Nuevo Cliente -->
  <div id="ad-modal" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;align-items:center;justify-content:center">
    <div style="background:var(--sf);border-radius:12px;padding:28px;width:100%;max-width:440px;box-shadow:0 20px 60px rgba(0,0,0,.2);margin:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="font-size:16px;font-weight:600;color:var(--tx)">Nuevo cliente</div>
        <button onclick="adCloseModal()" style="background:none;border:none;cursor:pointer;color:var(--mt);padding:4px">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>
          <label style="font-size:12px;font-weight:500;color:var(--tx);display:block;margin-bottom:4px">Email *</label>
          <input id="ad-inv-email" type="email" placeholder="cliente@empresa.com"
            style="width:100%;padding:8px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx);box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:500;color:var(--tx);display:block;margin-bottom:4px">Empresa</label>
          <input id="ad-inv-company" type="text" placeholder="Nombre de la empresa"
            style="width:100%;padding:8px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx);box-sizing:border-box"/>
        </div>
        <div>
          <label style="font-size:12px;font-weight:500;color:var(--tx);display:block;margin-bottom:4px">Plan *</label>
          <select id="ad-inv-plan"
            style="width:100%;padding:8px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx);box-sizing:border-box">
            <option value="starter">Starter — Content, Audit, Review</option>
            <option value="pro" selected>Pro — + Visual, Prospecting, Intelligence</option>
            <option value="enterprise">Enterprise — Todos los módulos</option>
          </select>
        </div>
        <div>
          <label style="font-size:12px;font-weight:500;color:var(--tx);display:block;margin-bottom:4px">Contraseña temporal (opcional)</label>
          <input id="ad-inv-password" type="text" placeholder="Se genera automáticamente si se deja vacío"
            style="width:100%;padding:8px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx);box-sizing:border-box"/>
        </div>
        <div id="ad-inv-result" style="display:none"></div>
        <div style="display:flex;gap:8px;margin-top:4px">
          <button onclick="adCloseModal()" style="flex:1;padding:9px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">Cancelar</button>
          <button id="ad-inv-btn" onclick="adInviteUser()" style="flex:2;padding:9px;background:var(--green);color:#fff;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">Crear cliente →</button>
        </div>
      </div>
    </div>
  </div>

  <style>
    .ad-tab {
      padding: 8px 16px;
      border: none;
      background: none;
      font-size: 13px;
      font-weight: 500;
      color: var(--mt);
      cursor: pointer;
      border-bottom: 2px solid transparent;
      font-family: 'DM Sans', sans-serif;
      transition: all .15s;
      margin-bottom: -1px;
    }
    .ad-tab:hover { color: var(--tx); }
    .ad-tab-active { color: var(--green) !important; border-bottom-color: var(--green) !important; }

    .ad-table { width:100%; border-collapse:collapse; font-size:13px; }
    .ad-table th { padding:8px 12px; text-align:left; font-size:11px; font-weight:600; color:var(--mt); text-transform:uppercase; letter-spacing:.05em; border-bottom:1px solid var(--bd2); }
    .ad-table td { padding:11px 12px; border-bottom:1px solid var(--bd2); color:var(--tx); vertical-align:middle; }
    .ad-table tr:last-child td { border-bottom:none; }
    .ad-table tbody tr:hover { background:var(--bg); cursor:pointer; }

    .ad-badge { display:inline-flex;align-items:center;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600; }
    .ad-toggle { position:relative;display:inline-block;width:34px;height:19px; }
    .ad-toggle input { opacity:0;width:0;height:0; }
    .ad-toggle-slider { position:absolute;cursor:pointer;inset:0;background:#D1D5DB;border-radius:19px;transition:.2s; }
    .ad-toggle-slider:before { position:absolute;content:"";height:13px;width:13px;left:3px;bottom:3px;background:#fff;border-radius:50%;transition:.2s; }
    .ad-toggle input:checked + .ad-toggle-slider { background:var(--green); }
    .ad-toggle input:checked + .ad-toggle-slider:before { transform:translateX(15px); }

    .ad-mod-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:8px;margin-top:12px; }
    .ad-mod-row { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:var(--bg);border-radius:var(--r);border:1px solid var(--bd2); }

    .ad-stat-grid { display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:12px;margin-bottom:20px; }
    .ad-stat { background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:14px 16px; }
    .ad-stat-val { font-size:22px;font-weight:600;color:var(--tx);margin-bottom:2px; }
    .ad-stat-lbl { font-size:11px;color:var(--mt); }

    .ad-env-row { display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid var(--bd2); }
    .ad-env-row:last-child { border-bottom:none; }
  </style>
  `;
}

// ── Tab switching ────────────────────────────────────────────
function adBindTabs() {}

async function adSwitchTab(tab) {
  AD.currentTab = tab;
  AD.selectedUser = null;
  ['clients', 'usage', 'system'].forEach(t => {
    const el = document.getElementById(`ad-tab-${t}`);
    if (el) el.classList.toggle('ad-tab-active', t === tab);
  });
  if (tab === 'clients') adRenderClients();
  else if (tab === 'usage') await adRenderUsage();
  else if (tab === 'system') await adRenderSystem();
}

// ══════════════════════════════════════════════════════════════
//  TAB 1 — CLIENTES
// ══════════════════════════════════════════════════════════════

async function adLoadUsers() {
  try {
    const data = await apiFetch('/api/admin', { method: 'POST', body: { action: 'list-users' } });
    AD.users = data.users || [];
  } catch (e) {
    AD.users = [];
    console.error('[admin] list-users error:', e);
  }
}

function adRenderClients() {
  const el = document.getElementById('ad-content');
  if (!el) return;

  if (!AD.users.length) {
    el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--mt);font-size:13px">
      No hay usuarios aún. <button onclick="adOpenInviteModal()" style="color:var(--green);background:none;border:none;cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif">Crea el primero →</button>
    </div>`;
    return;
  }

  const rows = AD.users.map(u => {
    const plan = AD_PLAN_LABELS[u.plan] || AD_PLAN_LABELS.starter;
    const modCount = u.modules_enabled?.length || 0;
    const tokens = u.usage_this_month?.claude_tokens || 0;
    const cost = u.usage_this_month?.total_cost_usd || 0;
    const activeColor = u.active ? '#10B981' : '#EF4444';
    const activeBg    = u.active ? '#D1FAE5' : '#FEE2E2';
    const activeLabel = u.active ? 'Activo' : 'Inactivo';

    return `
    <tr onclick="adOpenUser('${u.id}')">
      <td>
        <div style="font-weight:500;color:var(--tx)">${u.email}</div>
        ${u.company ? `<div style="font-size:11px;color:var(--mt)">${u.company}</div>` : ''}
      </td>
      <td>
        <span class="ad-badge" style="color:${plan.color};background:${plan.bg}">${plan.label}</span>
      </td>
      <td>
        <span class="ad-badge" style="color:${activeColor};background:${activeBg}">${activeLabel}</span>
      </td>
      <td style="font-variant-numeric:tabular-nums">${modCount} / ${AD_MODULE_KEYS.length}</td>
      <td style="font-variant-numeric:tabular-nums">${tokens.toLocaleString()}</td>
      <td style="font-variant-numeric:tabular-nums;color:${cost > 50 ? '#EF4444' : 'var(--tx)'}">$${cost.toFixed(2)}</td>
      <td>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--mt)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
      </td>
    </tr>`;
  }).join('');

  el.innerHTML = `
    <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;overflow:hidden">
      <table class="ad-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Plan</th>
            <th>Estado</th>
            <th>Módulos</th>
            <th>Tokens (mes)</th>
            <th>Coste (mes)</th>
            <th></th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div style="font-size:11px;color:var(--mt);margin-top:8px">${AD.users.length} usuario${AD.users.length !== 1 ? 's' : ''} · Click en una fila para ver detalles y editar</div>
  `;
}

// ── Vista detalle de un usuario ──────────────────────────────
async function adOpenUser(userId) {
  const el = document.getElementById('ad-content');
  if (!el) return;

  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--mt);font-size:13px">Cargando…</div>`;

  try {
    const data = await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'get-user', payload: { user_id: userId } }
    });

    AD.selectedUser = { ...data, user_id: userId };
    adRenderUserDetail(data);
  } catch (e) {
    el.innerHTML = `<div style="color:#EF4444;padding:20px">Error: ${e.message}</div>`;
  }
}

function adRenderUserDetail(data) {
  const el = document.getElementById('ad-content');
  const p  = data.profile;
  if (!el || !p) return;

  const plan    = AD_PLAN_LABELS[p.plan] || AD_PLAN_LABELS.starter;
  const createdAt = p.created_at ? new Date(p.created_at).toLocaleDateString('es-ES') : '—';

  // Módulos toggles
  const modToggles = AD_MODULE_KEYS.map(key => {
    const enabled = data.module_status?.[key] ?? false;
    const label   = AD_MODULE_LABELS[key] || key;
    return `
    <div class="ad-mod-row">
      <span style="font-size:13px;color:var(--tx)">${label}</span>
      <label class="ad-toggle">
        <input type="checkbox" id="ad-mod-${key}" ${enabled ? 'checked' : ''}
          onchange="adToggleModule('${p.id}', '${key}', this.checked)">
        <span class="ad-toggle-slider"></span>
      </label>
    </div>`;
  }).join('');

  // Historial de uso
  const usageRows = (data.usage_history || []).map(u => `
    <tr>
      <td>${u.month}</td>
      <td style="font-variant-numeric:tabular-nums">${(u.claude_tokens||0).toLocaleString()}</td>
      <td style="font-variant-numeric:tabular-nums">${u.dalle_images||0}</td>
      <td style="font-variant-numeric:tabular-nums">${u.hunter_requests||0}</td>
      <td style="font-variant-numeric:tabular-nums">$${(u.total_cost_usd||0).toFixed(2)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--mt);padding:16px">Sin uso registrado</td></tr>`;

  // Últimos logs
  const logRows = (data.recent_logs || []).slice(0, 10).map(l => `
    <tr>
      <td style="font-size:11px">${new Date(l.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
      <td>${l.module || '—'}</td>
      <td style="font-size:11px;color:var(--mt)">${l.model || '—'}</td>
      <td style="font-variant-numeric:tabular-nums">${((l.tokens_in||0)+(l.tokens_out||0)).toLocaleString()}</td>
      <td style="font-variant-numeric:tabular-nums">$${(l.cost_usd||0).toFixed(4)}</td>
    </tr>
  `).join('') || `<tr><td colspan="5" style="text-align:center;color:var(--mt);padding:16px">Sin actividad reciente</td></tr>`;

  el.innerHTML = `
    <!-- Back -->
    <button onclick="adSwitchTab('clients')" style="display:flex;align-items:center;gap:6px;background:none;border:none;color:var(--mt);cursor:pointer;font-size:13px;font-family:'DM Sans',sans-serif;padding:0;margin-bottom:20px">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      Volver a clientes
    </button>

    <!-- User header -->
    <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px;margin-bottom:16px">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:12px">
        <div>
          <div style="font-size:17px;font-weight:600;color:var(--tx)">${p.email}</div>
          ${p.company ? `<div style="font-size:12px;color:var(--mt);margin-top:2px">${p.company}</div>` : ''}
          <div style="font-size:11px;color:var(--mt);margin-top:4px">Creado el ${createdAt} · ID: ${p.id.slice(0,8)}…</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          <!-- Selector de plan -->
          <select id="ad-plan-sel" onchange="adSetPlan('${p.id}', this.value)"
            style="padding:6px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx)">
            <option value="starter"    ${p.plan==='starter'?'selected':''}>Starter</option>
            <option value="pro"        ${p.plan==='pro'?'selected':''}>Pro</option>
            <option value="enterprise" ${p.plan==='enterprise'?'selected':''}>Enterprise</option>
          </select>
          <!-- Toggle activo -->
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:12px;color:var(--mt)">Activo</span>
            <label class="ad-toggle">
              <input type="checkbox" id="ad-active-toggle" ${p.active?'checked':''}
                onchange="adToggleActive('${p.id}', this.checked)">
              <span class="ad-toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <!-- Acciones de cuenta -->
      <div style="display:flex;gap:8px;margin-top:16px;padding-top:16px;border-top:1px solid var(--bd2);flex-wrap:wrap">
        <button onclick="adImpersonate('${p.id}', '${p.email}')"
          style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Entrar como este usuario
        </button>
        <button onclick="adResetPassword('${p.id}', '${p.email}')"
          style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          Enviar reset de contraseña
        </button>
        <button onclick="adDeleteUser('${p.id}', '${p.email}')"
          style="display:flex;align-items:center;gap:5px;padding:7px 12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;color:#DC2626">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          Borrar cuenta
        </button>
      </div>
    </div>

    <!-- Grid: módulos + uso -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

      <!-- Módulos -->
      <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
          <div style="font-size:14px;font-weight:600;color:var(--tx)">Módulos</div>
          <button onclick="adApplyPlanDefaults('${p.id}','${p.plan}')"
            style="font-size:11px;color:var(--green);background:none;border:none;cursor:pointer;font-family:'DM Sans',sans-serif">
            Aplicar defaults del plan
          </button>
        </div>
        <div style="font-size:11px;color:var(--mt);margin-bottom:12px">Cambios se guardan automáticamente</div>
        <div class="ad-mod-grid">${modToggles}</div>
      </div>

      <!-- Historial de uso -->
      <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px">
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:12px">Uso por mes</div>
        <table class="ad-table">
          <thead><tr><th>Mes</th><th>Tokens</th><th>DALL-E</th><th>Hunter</th><th>Coste</th></tr></thead>
          <tbody>${usageRows}</tbody>
        </table>
      </div>
    </div>

    <!-- Actividad reciente -->
    <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px">
      <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:12px">Actividad reciente (últimas 10 llamadas)</div>
      <table class="ad-table">
        <thead><tr><th>Fecha</th><th>Módulo</th><th>Modelo</th><th>Tokens</th><th>Coste</th></tr></thead>
        <tbody>${logRows}</tbody>
      </table>
    </div>
  `;
}

// ── Acciones desde vista detalle ─────────────────────────────
async function adToggleModule(userId, moduleKey, enabled) {
  try {
    await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'set-modules', payload: { user_id: userId, modules: { [moduleKey]: enabled } } }
    });
    // Actualizar estado local silenciosamente
    const user = AD.users.find(u => u.id === userId);
    if (user) {
      if (enabled && !user.modules_enabled.includes(moduleKey)) user.modules_enabled.push(moduleKey);
      if (!enabled) user.modules_enabled = user.modules_enabled.filter(k => k !== moduleKey);
    }
  } catch (e) {
    alert('Error al actualizar módulo: ' + e.message);
    // Revertir el toggle en la UI
    const chk = document.getElementById(`ad-mod-${moduleKey}`);
    if (chk) chk.checked = !enabled;
  }
}

async function adSetPlan(userId, plan) {
  try {
    await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'set-plan', payload: { user_id: userId, plan } }
    });
    const user = AD.users.find(u => u.id === userId);
    if (user) user.plan = plan;
    adShowToast('Plan actualizado a ' + plan);
  } catch (e) {
    alert('Error al cambiar plan: ' + e.message);
  }
}

async function adToggleActive(userId, active) {
  try {
    await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'toggle-active', payload: { user_id: userId, active } }
    });
    const user = AD.users.find(u => u.id === userId);
    if (user) user.active = active;
    adShowToast(active ? 'Usuario activado' : 'Usuario desactivado');
  } catch (e) {
    alert('Error al cambiar estado: ' + e.message);
    const chk = document.getElementById('ad-active-toggle');
    if (chk) chk.checked = !active;
  }
}

async function adApplyPlanDefaults(userId, plan) {
  const PLAN_MODULES = {
    starter:    ['content', 'audit', 'review'],
    pro:        ['content', 'audit', 'review', 'vs', 'prosp', 'intelligence'],
    enterprise: [...AD_MODULE_KEYS]
  };
  const defaults = PLAN_MODULES[plan] || PLAN_MODULES.starter;
  const modules = {};
  AD_MODULE_KEYS.forEach(k => { modules[k] = defaults.includes(k); });

  try {
    await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'set-modules', payload: { user_id: userId, modules } }
    });
    // Actualizar toggles en UI
    AD_MODULE_KEYS.forEach(k => {
      const chk = document.getElementById(`ad-mod-${k}`);
      if (chk) chk.checked = modules[k];
    });
    adShowToast('Módulos actualizados según plan ' + plan);
  } catch (e) {
    alert('Error: ' + e.message);
  }
}

// ══════════════════════════════════════════════════════════════
//  TAB 2 — CONSUMO
// ══════════════════════════════════════════════════════════════

async function adRenderUsage() {
  const el = document.getElementById('ad-content');
  if (!el) return;

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">
      <label style="font-size:13px;color:var(--mt)">Mes:</label>
      <input type="month" id="ad-usage-month" value="${AD.usageMonth}"
        onchange="AD.usageMonth=this.value;adRenderUsage()"
        style="padding:6px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;font-family:'DM Sans',sans-serif;background:var(--bg);color:var(--tx)"/>
    </div>
    <div id="ad-usage-content"><div style="text-align:center;padding:40px;color:var(--mt)">Cargando…</div></div>
  `;

  try {
    const data = await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'usage-summary', payload: { month: AD.usageMonth } }
    });

    const { summary, totals, month } = data;

    // Stats KPIs
    const kpis = `
      <div class="ad-stat-grid">
        <div class="ad-stat">
          <div class="ad-stat-val">${(totals.claude_tokens||0).toLocaleString()}</div>
          <div class="ad-stat-lbl">Tokens Claude (${month})</div>
        </div>
        <div class="ad-stat">
          <div class="ad-stat-val">${totals.dalle_images||0}</div>
          <div class="ad-stat-lbl">Imágenes DALL-E</div>
        </div>
        <div class="ad-stat">
          <div class="ad-stat-val">${totals.hunter_requests||0}</div>
          <div class="ad-stat-lbl">Requests Hunter.io</div>
        </div>
        <div class="ad-stat">
          <div class="ad-stat-val" style="color:${totals.total_cost_usd>200?'#EF4444':'var(--tx)'}">$${(totals.total_cost_usd||0).toFixed(2)}</div>
          <div class="ad-stat-lbl">Coste total USD</div>
        </div>
      </div>`;

    // Tabla por usuario
    const rows = (summary || [])
      .sort((a, b) => (b.total_cost_usd||0) - (a.total_cost_usd||0))
      .map(u => {
        const plan = AD_PLAN_LABELS[u.plan] || AD_PLAN_LABELS.starter;
        return `
        <tr>
          <td>
            <div style="font-weight:500">${u.email}</div>
          </td>
          <td><span class="ad-badge" style="color:${plan.color};background:${plan.bg}">${plan.label}</span></td>
          <td style="font-variant-numeric:tabular-nums">${(u.claude_tokens||0).toLocaleString()}</td>
          <td style="font-variant-numeric:tabular-nums">${u.dalle_images||0}</td>
          <td style="font-variant-numeric:tabular-nums">${u.hunter_requests||0}</td>
          <td style="font-variant-numeric:tabular-nums;font-weight:500;color:${(u.total_cost_usd||0)>50?'#EF4444':'var(--tx)'}"
            >$${(u.total_cost_usd||0).toFixed(2)}</td>
        </tr>`;
      }).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--mt);padding:20px">Sin datos de consumo para ${month}</td></tr>`;

    const usageEl = document.getElementById('ad-usage-content');
    if (!usageEl) return;
    usageEl.innerHTML = `
      ${kpis}
      <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;overflow:hidden">
        <table class="ad-table">
          <thead><tr><th>Usuario</th><th>Plan</th><th>Tokens Claude</th><th>DALL-E</th><th>Hunter</th><th>Coste USD</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  } catch (e) {
    const usageElErr = document.getElementById('ad-usage-content');
    if (usageElErr) usageElErr.innerHTML =
      `<div style="color:#EF4444;padding:20px">Error: ${e.message}</div>`;
  }
}

// ══════════════════════════════════════════════════════════════
//  TAB 3 — SISTEMA (developer only)
// ══════════════════════════════════════════════════════════════

async function adRenderSystem() {
  const el = document.getElementById('ad-content');
  if (!el) return;

  el.innerHTML = `<div style="text-align:center;padding:40px;color:var(--mt)">Cargando estado del sistema…</div>`;

  try {
    const data = await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'system-status' }
    });

    const { env_vars, recent_activity, global_totals, user_stats, month, timestamp } = data;

    // Env vars
    const envRows = Object.entries(env_vars || {}).map(([k, v]) => {
      const ok = v === 'SET';
      return `
        <div class="ad-env-row">
          <span style="font-size:13px;font-family:'DM Mono',monospace;color:var(--tx)">${k}</span>
          <span style="font-size:11px;font-weight:600;color:${ok?'#10B981':'#EF4444'};background:${ok?'#D1FAE5':'#FEE2E2'};padding:2px 8px;border-radius:20px">${v}</span>
        </div>`;
    }).join('');

    // Stats usuarios
    const statCards = `
      <div class="ad-stat-grid">
        <div class="ad-stat">
          <div class="ad-stat-val">${user_stats?.total_users||0}</div>
          <div class="ad-stat-lbl">Usuarios totales</div>
        </div>
        <div class="ad-stat">
          <div class="ad-stat-val" style="color:#10B981">${user_stats?.active_users||0}</div>
          <div class="ad-stat-lbl">Usuarios activos</div>
        </div>
        <div class="ad-stat">
          <div class="ad-stat-val">${user_stats?.by_plan?.starter||0} / ${user_stats?.by_plan?.pro||0} / ${user_stats?.by_plan?.enterprise||0}</div>
          <div class="ad-stat-lbl">Starter / Pro / Enterprise</div>
        </div>
        <div class="ad-stat">
          <div class="ad-stat-val">$${(global_totals?.total_cost_usd||0).toFixed(2)}</div>
          <div class="ad-stat-lbl">Gasto total API (${month})</div>
        </div>
      </div>`;

    // Actividad reciente
    const actRows = (recent_activity || []).map(a => `
      <tr>
        <td style="font-size:11px">${new Date(a.created_at).toLocaleString('es-ES',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}</td>
        <td style="font-size:11px;font-family:'DM Mono',monospace;color:var(--mt)">${a.user_id?.slice(0,8)}…</td>
        <td>${a.module||'—'}</td>
        <td style="font-size:11px;color:var(--mt)">${a.model||'—'}</td>
        <td style="font-variant-numeric:tabular-nums">${((a.tokens_in||0)+(a.tokens_out||0)).toLocaleString()}</td>
        <td style="font-variant-numeric:tabular-nums">$${(a.cost_usd||0).toFixed(4)}</td>
      </tr>
    `).join('') || `<tr><td colspan="6" style="text-align:center;color:var(--mt);padding:20px">Sin actividad reciente</td></tr>`;

    el.innerHTML = `
      <div style="font-size:11px;color:var(--mt);margin-bottom:16px">
        🔧 Sección solo accesible para el admin developer · Actualizado: ${new Date(timestamp).toLocaleString('es-ES')}
      </div>

      ${statCards}

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px">

        <!-- Env vars -->
        <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px">
          <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:12px">Variables de entorno</div>
          <div style="font-size:11px;color:var(--mt);margin-bottom:10px">Solo se muestra si están SET o MISSING — nunca el valor</div>
          ${envRows}
        </div>

        <!-- Actividad reciente -->
        <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px;overflow:hidden">
          <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:12px">Actividad reciente (global)</div>
          <div style="overflow-x:auto">
            <table class="ad-table" style="min-width:400px">
              <thead><tr><th>Hora</th><th>User ID</th><th>Módulo</th><th>Modelo</th><th>Tokens</th><th>Coste</th></tr></thead>
              <tbody>${actRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Gasto del mes desglosado -->
      <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px">
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:12px">Gasto API mes actual (${month})</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
          <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px">
            <div style="font-size:18px;font-weight:600;color:var(--tx)">${(global_totals?.claude_tokens||0).toLocaleString()}</div>
            <div style="font-size:11px;color:var(--mt)">Tokens Claude</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px">
            <div style="font-size:18px;font-weight:600;color:var(--tx)">${global_totals?.dalle_images||0}</div>
            <div style="font-size:11px;color:var(--mt)">Imágenes DALL-E</div>
          </div>
          <div style="text-align:center;padding:12px;background:var(--bg);border-radius:8px">
            <div style="font-size:18px;font-weight:600;color:var(--tx)">${global_totals?.hunter_requests||0}</div>
            <div style="font-size:11px;color:var(--mt)">Requests Hunter</div>
          </div>
        </div>
      </div>

      <!-- Acciones rápidas -->
      <div style="background:var(--sf);border:1px solid var(--bd2);border-radius:10px;padding:20px;margin-top:16px">
        <div style="font-size:14px;font-weight:600;color:var(--tx);margin-bottom:12px">Acciones rápidas</div>
        <div style="display:flex;gap:10px;flex-wrap:wrap">
          <button onclick="adRefreshAll()" style="padding:8px 14px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">
            🔄 Refrescar estado
          </button>
          <button onclick="adSwitchTab('clients');adLoadUsers().then(adRenderClients)" style="padding:8px 14px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">
            👥 Reload lista usuarios
          </button>
          <a href="https://supabase.com/dashboard/project/zsidhtxkrsrkujxdbvle" target="_blank"
            style="padding:8px 14px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx);text-decoration:none">
            🗄️ Abrir Supabase →
          </a>
          <a href="https://vercel.com/dashboard" target="_blank"
            style="padding:8px 14px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx);text-decoration:none">
            ▲ Abrir Vercel →
          </a>
        </div>
      </div>
    `;
  } catch (e) {
    el.innerHTML = `<div style="color:#EF4444;padding:20px">Error al cargar estado del sistema: ${e.message}</div>`;
  }
}

async function adRefreshAll() {
  await adRenderSystem();
}

// ══════════════════════════════════════════════════════════════
//  MODAL — Nuevo Cliente
// ══════════════════════════════════════════════════════════════

function adOpenInviteModal() {
  const modal = document.getElementById('ad-modal');
  if (modal) {
    modal.style.display = 'flex';
    document.getElementById('ad-inv-email').value    = '';
    document.getElementById('ad-inv-company').value  = '';
    document.getElementById('ad-inv-password').value = '';
    document.getElementById('ad-inv-plan').value     = 'pro';
    document.getElementById('ad-inv-result').style.display = 'none';
    document.getElementById('ad-inv-btn').disabled   = false;
    document.getElementById('ad-inv-btn').textContent = 'Crear cliente →';
  }
}

function adCloseModal() {
  const modal = document.getElementById('ad-modal');
  if (modal) modal.style.display = 'none';
}

async function adInviteUser() {
  const email    = document.getElementById('ad-inv-email')?.value?.trim();
  const company  = document.getElementById('ad-inv-company')?.value?.trim();
  const plan     = document.getElementById('ad-inv-plan')?.value;
  const password = document.getElementById('ad-inv-password')?.value?.trim();
  const resultEl = document.getElementById('ad-inv-result');
  const btn      = document.getElementById('ad-inv-btn');

  if (!email) { alert('El email es obligatorio'); return; }
  if (!email.includes('@')) { alert('Email inválido'); return; }

  btn.disabled = true;
  btn.textContent = 'Creando…';
  resultEl.style.display = 'none';

  try {
    const data = await apiFetch('/api/admin', {
      method: 'POST',
      body: {
        action: 'invite-user',
        payload: { email, company: company || undefined, plan, password: password || undefined }
      }
    });

    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div style="background:#D1FAE5;border:1px solid #6EE7B7;border-radius:var(--r);padding:12px;font-size:12px;color:#065F46">
        <div style="font-weight:600;margin-bottom:6px">✅ Cliente creado correctamente</div>
        <div><strong>Email:</strong> ${data.email}</div>
        <div><strong>Plan:</strong> ${data.plan}</div>
        <div><strong>Módulos:</strong> ${data.modules_enabled?.join(', ')}</div>
        <div style="margin-top:8px;padding:6px 8px;background:rgba(0,0,0,.06);border-radius:4px;font-family:'DM Mono',monospace">
          <strong>Contraseña temporal:</strong> ${data.temp_password}
        </div>
        <div style="font-size:11px;margin-top:6px;color:#047857">Guarda esta contraseña — no se puede recuperar después</div>
      </div>`;

    btn.textContent = 'Crear otro';
    btn.disabled = false;

    // Refrescar lista de usuarios en background
    adLoadUsers().then(() => {
      if (AD.currentTab === 'clients') adRenderClients();
    });

  } catch (e) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `
      <div style="background:#FEE2E2;border:1px solid #FECACA;border-radius:var(--r);padding:10px;font-size:12px;color:#991B1B">
        ❌ Error: ${e.message}
      </div>`;
    btn.disabled = false;
    btn.textContent = 'Reintentar';
  }
}

// ── Toast de confirmación ────────────────────────────────────
function adShowToast(msg) {
  let toast = document.getElementById('ad-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'ad-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;right:24px;background:#1F2937;color:#fff;padding:10px 16px;border-radius:8px;font-size:13px;font-family:"DM Sans",sans-serif;z-index:99999;opacity:0;transition:opacity .2s;pointer-events:none';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 2500);
}

// ── Borrar cuenta ────────────────────────────────────────────
async function adDeleteUser(userId, email) {
  const confirmed = confirm(
    `⚠️ BORRAR CUENTA\n\n` +
    `Usuario: ${email}\n\n` +
    `Esto eliminará permanentemente:\n` +
    `• Su cuenta de acceso\n` +
    `• Su perfil y módulos\n` +
    `• Todo su historial de uso\n` +
    `• Todos sus datos guardados\n\n` +
    `Esta acción NO se puede deshacer.\n\n` +
    `¿Confirmas?`
  );
  if (!confirmed) return;

  try {
    await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'delete-user', payload: { user_id: userId } }
    });
    adShowToast('Cuenta eliminada correctamente');
    // Volver a la lista y refrescar
    await adLoadUsers();
    adSwitchTab('clients');
  } catch (e) {
    alert('Error al borrar cuenta: ' + e.message);
  }
}

// ── Impersonar usuario ───────────────────────────────────────
async function adImpersonate(userId, email) {
  const btn = event?.target?.closest('button');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando link…'; }

  try {
    const data = await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'impersonate', payload: { user_id: userId } }
    });

    // Mostrar modal con el magic link
    adShowImpersonateModal(email, data.magic_link);
  } catch (e) {
    alert('Error al generar link: ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> Entrar como este usuario`;
    }
  }
}

function adShowImpersonateModal(email, link) {
  // Reutilizar el modal existente o crear uno temporal
  let modal = document.getElementById('ad-impersonate-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'ad-impersonate-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center';
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:var(--sf);border-radius:12px;padding:28px;width:100%;max-width:480px;box-shadow:0 20px 60px rgba(0,0,0,.2);margin:16px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
        <div style="font-size:15px;font-weight:600;color:var(--tx)">🔗 Magic Link generado</div>
        <button onclick="document.getElementById('ad-impersonate-modal').remove()"
          style="background:none;border:none;cursor:pointer;color:var(--mt);padding:4px;font-size:18px">✕</button>
      </div>

      <div style="font-size:13px;color:var(--mt);margin-bottom:16px">
        Para entrar como <strong style="color:var(--tx)">${email}</strong>:
      </div>

      <ol style="font-size:13px;color:var(--tx);line-height:1.8;margin:0 0 16px 0;padding-left:18px">
        <li>Copia el link de abajo</li>
        <li>Abre una <strong>ventana incógnito</strong> (Ctrl+Shift+N / Cmd+Shift+N)</li>
        <li>Pega el link y pulsa Enter</li>
      </ol>

      <div style="position:relative;margin-bottom:12px">
        <div id="ad-magic-link-box" style="padding:10px 12px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;font-family:'DM Mono',monospace;color:var(--mt);word-break:break-all;line-height:1.5;max-height:80px;overflow:auto">${link}</div>
      </div>

      <div style="display:flex;gap:8px">
        <button onclick="navigator.clipboard.writeText('${link.replace(/'/g, "\\'")}').then(()=>adShowToast('Link copiado ✓'))"
          style="flex:1;padding:9px;background:var(--green);color:#fff;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">
          📋 Copiar link
        </button>
        <button onclick="document.getElementById('ad-impersonate-modal').remove()"
          style="padding:9px 16px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">
          Cerrar
        </button>
      </div>

      <div style="font-size:11px;color:var(--mt);margin-top:10px;text-align:center">
        ⏱ Este link expira en 1 hora · Úsalo solo una vez
      </div>
    </div>
  `;
}

// ── Reset de contraseña ──────────────────────────────────────
async function adResetPassword(userId, email) {
  const confirmed = confirm(
    `Enviar email de reset de contraseña a:\n${email}\n\n¿Confirmas?`
  );
  if (!confirmed) return;

  const btn = event?.target?.closest('button');
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

  try {
    await apiFetch('/api/admin', {
      method: 'POST',
      body: { action: 'reset-password', payload: { user_id: userId } }
    });
    adShowToast(`✉️ Email enviado a ${email}`);
  } catch (e) {
    alert('Error al enviar email: ' + e.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Enviar reset de contraseña`;
    }
  }
}
