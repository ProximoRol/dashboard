/* ═══════════════════════════════════════════════
   PAID MEDIA — Google Ads + Meta Ads + Futuros
   Absorbe page-ads (Google Ads), añade Meta Ads.
   Depends on: core.js, analytics.js (loadAds)
   ═══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   ENTRY POINT — llamado desde MODULE_REGISTRY render
   ══════════════════════════════════════════════════════ */
function renderPaidMediaPage() {
  const el = document.getElementById('paid-main');
  if (!el) return;

  el.innerHTML = `
    <!-- KPIs cross-platform -->
    <div id="paid-kpis-row" class="kr" style="margin-bottom:16px">
      ${_paidKpi('💸', 'Gasto total', '—', 'Todos los canales', 'var(--amber)')}
      ${_paidKpi('🖱', 'Clicks totales', '—', 'Cross-platform', 'var(--blue)')}
      ${_paidKpi('💡', 'CPL medio', '—', 'Coste por lead', 'var(--purple)')}
      ${_paidKpi('📈', 'ROAS estimado', '—', 'Return on ad spend', 'var(--green)')}
    </div>

    <!-- Tabs -->
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:16px;border-bottom:1px solid var(--bd);padding-bottom:0">
      ${['platforms','google','meta','linkedin','tiktok','ai'].map((t,i) => `
        <button
          class="paid-tab${i===0?' active':''}"
          data-tab="${t}"
          onclick="paidSwitchTab('${t}')"
          style="padding:8px 14px;font-size:12px;font-weight:500;border:none;background:none;cursor:pointer;border-bottom:2px solid ${i===0?'var(--green)':'transparent'};color:${i===0?'var(--green)':'var(--mt)'};font-family:'DM Sans',sans-serif;transition:all .15s;margin-bottom:-1px">
          ${{platforms:'Por plataforma',google:'Google Ads',meta:'Meta Ads',linkedin:'LinkedIn Ads',tiktok:'TikTok Ads',ai:'Recomendaciones IA'}[t]}
          ${t==='linkedin'||t==='tiktok'?'<span style="font-size:9px;background:var(--sf2);color:var(--ht);padding:1px 5px;border-radius:8px;margin-left:4px">Próximo</span>':''}
        </button>`).join('')}
    </div>

    <!-- Panel: Por plataforma -->
    <div id="paid-panel-platforms" class="paid-panel">
      <div class="cd">
        <div class="ch"><span class="ct">Comparativa de canales</span><span class="bg bg-g">Últimos 30d</span></div>
        <div style="overflow-x:auto;margin-top:8px">
          <table class="dt" id="paid-platforms-table">
            <thead>
              <tr>
                <th>Canal</th><th>Estado</th><th>Gasto</th><th>Clicks</th>
                <th>CTR</th><th>CPL</th><th>Conv.</th><th>ROAS</th>
              </tr>
            </thead>
            <tbody id="paid-platforms-body">
              <tr><td colspan="8" style="text-align:center;padding:24px;color:var(--ht);font-size:12px">Cargando datos…</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px;margin-top:12px">
        <div class="cd">
          <div class="ch"><span class="ct">Distribución del gasto</span></div>
          <div style="height:200px;position:relative;margin-top:8px"><canvas id="paid-spend-chart"></canvas></div>
          <div id="paid-spend-legend" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;justify-content:center"></div>
        </div>
        <div class="cd">
          <div class="ch"><span class="ct">Clicks por canal</span></div>
          <div style="height:200px;position:relative;margin-top:8px"><canvas id="paid-clicks-chart"></canvas></div>
          <div id="paid-clicks-legend" style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;justify-content:center"></div>
        </div>
      </div>
    </div>

    <!-- Panel: Google Ads -->
    <div id="paid-panel-google" class="paid-panel" style="display:none">
      <div id="paid-google-kpis" class="kr" style="margin-bottom:12px"></div>
      <div class="cd">
        <div class="ch">
          <span class="ct">Campañas Google Ads</span>
          <span class="bg" style="background:var(--bp);color:var(--blue)" id="nb-google-ads-tag">…</span>
        </div>
        <div id="paid-google-campaigns" style="margin-top:8px">
          <div class="ld"><div class="sp2"></div>Cargando campañas de Google Ads…</div>
        </div>
      </div>
    </div>

    <!-- Panel: Meta Ads -->
    <div id="paid-panel-meta" class="paid-panel" style="display:none">
      <div id="paid-meta-content">
        <div class="ld"><div class="sp2"></div>Cargando Meta Ads…</div>
      </div>
    </div>

    <!-- Panel: LinkedIn Ads (placeholder) -->
    <div id="paid-panel-linkedin" class="paid-panel" style="display:none">
      ${_paidPlaceholder('LinkedIn Ads', '💼', 'Conecta tu cuenta de LinkedIn Campaign Manager para ver métricas de campañas, leads y coste por lead para el mercado B2C de habla hispana.', 'LinkedIn Campaign Manager')}
    </div>

    <!-- Panel: TikTok Ads (placeholder) -->
    <div id="paid-panel-tiktok" class="paid-panel" style="display:none">
      ${_paidPlaceholder('TikTok Ads', '🎵', 'Conecta tu cuenta de TikTok Ads Manager para trackear campañas de vídeo, engagement y conversiones desde la plataforma de mayor crecimiento en LATAM y España.', 'TikTok Ads Manager')}
    </div>

    <!-- Panel: Recomendaciones IA -->
    <div id="paid-panel-ai" class="paid-panel" style="display:none">
      <div class="cd">
        <div class="ch">
          <span class="ct">Recomendaciones IA — Paid Media</span>
          <span class="bg" style="background:var(--pp);color:var(--purple)">Claude AI · Cross-platform</span>
          <button id="paid-ai-btn" onclick="runPaidMediaAI()"
            style="margin-left:auto;padding:6px 14px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:11px;font-weight:500;cursor:pointer;display:flex;align-items:center;gap:6px;font-family:'DM Sans',sans-serif">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg>
            Analizar todo
          </button>
        </div>
        <div style="font-size:12px;color:var(--mt);margin:10px 0">
          Claude analiza el rendimiento conjunto de Google Ads y Meta Ads y genera recomendaciones cross-platform con contexto de Próximo Rol.
        </div>
        <div id="paid-ai-out" style="min-height:80px">
          <div style="text-align:center;padding:32px;color:var(--ht)">
            <div style="font-size:28px;margin-bottom:8px">🧠</div>
            <div style="font-size:13px">Pulsa <strong>Analizar todo</strong> para obtener recomendaciones cross-platform basadas en datos reales.</div>
          </div>
        </div>
      </div>
    </div>
  `;

  // Cargar datos al inicializar
  _paidLoadAll();
}

/* ══════════════════════════════════════════════════════
   TAB NAVIGATION
   ══════════════════════════════════════════════════════ */
function paidSwitchTab(tab) {
  // Ocultar todos los paneles
  document.querySelectorAll('.paid-panel').forEach(p => p.style.display = 'none');
  // Desactivar todos los tabs
  document.querySelectorAll('.paid-tab').forEach(btn => {
    btn.style.borderBottomColor = 'transparent';
    btn.style.color = 'var(--mt)';
    btn.classList.remove('active');
  });
  // Activar el tab seleccionado
  const activeBtn = document.querySelector(`.paid-tab[data-tab="${tab}"]`);
  if (activeBtn) {
    activeBtn.style.borderBottomColor = 'var(--green)';
    activeBtn.style.color = 'var(--green)';
    activeBtn.classList.add('active');
  }
  // Mostrar el panel
  const panel = document.getElementById(`paid-panel-${tab}`);
  if (panel) panel.style.display = 'block';

  // Lazy-load según tab
  if (tab === 'google') _paidLoadGoogle();
  if (tab === 'meta')   _paidLoadMeta();
}

/* ══════════════════════════════════════════════════════
   LOAD ALL — KPIs cross-platform + gráficos comparativa
   ══════════════════════════════════════════════════════ */
async function _paidLoadAll() {
  // Carga en paralelo: Google Ads + Meta Ads
  const [gData, mData] = await Promise.allSettled([
    _paidFetchGoogleData(),
    _paidFetchMetaData(),
  ]);

  const google = gData.status === 'fulfilled' ? gData.value : null;
  const meta   = mData.status === 'fulfilled' ? mData.value : null;

  // ── KPIs cross-platform ──
  const totalSpend   = (google?.totalCost  || 0) + (meta?.totalSpend || 0);
  const totalClicks  = (google?.totalClicks || 0) + (meta?.totalClicks || 0);
  const totalConv    = (google?.totalConv   || 0) + (meta?.totalConv  || 0);
  const cpl          = totalConv > 0 ? totalSpend / totalConv : 0;
  const roas         = totalSpend > 0 ? (totalConv * 97) / totalSpend : 0; // precio medio sesión única 97€

  const kpisRow = document.getElementById('paid-kpis-row');
  if (kpisRow) {
    kpisRow.innerHTML = `
      ${_paidKpi('💸', 'Gasto total', totalSpend > 0 ? fmtCurrency(totalSpend) : '—', 'Todos los canales', 'var(--amber)')}
      ${_paidKpi('🖱', 'Clicks totales', totalClicks > 0 ? totalClicks.toLocaleString() : '—', 'Cross-platform', 'var(--blue)')}
      ${_paidKpi('💡', 'CPL medio', cpl > 0 ? fmtCurrency(cpl) : '—', 'Coste por lead', 'var(--purple)')}
      ${_paidKpi('📈', 'ROAS estimado', roas > 0 ? roas.toFixed(2) + 'x' : '—', 'Return on ad spend', 'var(--green)')}
    `;
  }

  // ── Tabla comparativa por plataforma ──
  const rows = [];
  if (google) {
    rows.push({
      name: '🔵 Google Ads',
      status: google.hasToken ? 'Activo' : 'Sin token',
      statusColor: google.hasToken ? 'var(--green)' : 'var(--ht)',
      spend: google.totalCost > 0 ? fmtCurrency(google.totalCost) : '—',
      clicks: google.totalClicks > 0 ? google.totalClicks.toLocaleString() : '—',
      ctr: google.avgCTR > 0 ? google.avgCTR.toFixed(2) + '%' : '—',
      cpl: google.totalConv > 0 ? fmtCurrency(google.totalCost / google.totalConv) : '—',
      conv: google.totalConv > 0 ? google.totalConv.toFixed(0) : '—',
      roas: google.totalCost > 0 && google.totalConv > 0 ? ((google.totalConv * 97) / google.totalCost).toFixed(2) + 'x' : '—',
      spend_val: google.totalCost,
      clicks_val: google.totalClicks,
    });
  }
  if (meta) {
    rows.push({
      name: '🟣 Meta Ads',
      status: meta.connected ? 'Activo' : 'Sin conectar',
      statusColor: meta.connected ? 'var(--purple)' : 'var(--ht)',
      spend: meta.totalSpend > 0 ? fmtCurrency(meta.totalSpend) : '—',
      clicks: meta.totalClicks > 0 ? meta.totalClicks.toLocaleString() : '—',
      ctr: meta.avgCTR > 0 ? meta.avgCTR.toFixed(2) + '%' : '—',
      cpl: meta.totalConv > 0 ? fmtCurrency(meta.totalSpend / meta.totalConv) : '—',
      conv: meta.totalConv > 0 ? meta.totalConv.toFixed(0) : '—',
      roas: meta.totalSpend > 0 && meta.totalConv > 0 ? ((meta.totalConv * 97) / meta.totalSpend).toFixed(2) + 'x' : '—',
      spend_val: meta.totalSpend,
      clicks_val: meta.totalClicks,
    });
  }
  // Placeholders LinkedIn y TikTok
  rows.push(
    { name: '💼 LinkedIn Ads', status: 'Próximo', statusColor: 'var(--ht)', spend: '—', clicks: '—', ctr: '—', cpl: '—', conv: '—', roas: '—', spend_val: 0, clicks_val: 0 },
    { name: '🎵 TikTok Ads',   status: 'Próximo', statusColor: 'var(--ht)', spend: '—', clicks: '—', ctr: '—', cpl: '—', conv: '—', roas: '—', spend_val: 0, clicks_val: 0 }
  );

  const tbody = document.getElementById('paid-platforms-body');
  if (tbody) {
    tbody.innerHTML = rows.map(r => `
      <tr>
        <td><span class="tm" style="font-weight:600">${r.name}</span></td>
        <td><span style="color:${r.statusColor};font-weight:500;font-size:11px">${r.status}</span></td>
        <td style="font-family:'DM Mono',monospace;font-size:12px">${r.spend}</td>
        <td>${r.clicks}</td>
        <td>${r.ctr}</td>
        <td style="font-family:'DM Mono',monospace;font-size:12px">${r.cpl}</td>
        <td>${r.conv}</td>
        <td style="color:var(--green);font-weight:600">${r.roas}</td>
      </tr>`).join('');
  }

  // ── Gráficos ──
  const activeRows = rows.filter(r => r.spend_val > 0 || r.clicks_val > 0);
  if (activeRows.length > 0) {
    const chartColors = ['#D97706','#7C3AED','#2563EB','#059669'];

    // Gasto
    mkC('paid-spend-chart', 'doughnut', {
      labels: rows.map(r => r.name.replace(/[^\w\s]/gi, '').trim()),
      datasets: [{ data: rows.map(r => r.spend_val || 0), backgroundColor: chartColors, borderWidth: 2, borderColor: '#fff', hoverOffset: 5 }]
    }, { cutout: '60%', plugins: { legend: { display: false }, tooltip: { callbacks: { label: ctx => `${ctx.label}: £${ctx.raw.toFixed(2)}` } } } });

    const spendLeg = document.getElementById('paid-spend-legend');
    if (spendLeg) spendLeg.innerHTML = rows.map((r,i) =>
      `<span style="display:flex;align-items:center;gap:4px;font-size:10px;color:var(--mt)"><span style="width:8px;height:8px;border-radius:50%;background:${chartColors[i%chartColors.length]};flex-shrink:0"></span>${r.name.replace(/[^\w\s]/gi,'').trim()}</span>`).join('');

    // Clicks
    mkC('paid-clicks-chart', 'bar', {
      labels: rows.map(r => r.name.replace(/[^\w\s]/gi, '').trim()),
      datasets: [{ data: rows.map(r => r.clicks_val || 0), backgroundColor: chartColors, borderRadius: 4, borderSkipped: false }]
    }, { scales: { x: { ticks: { color: TC, font: { size: 10 } }, grid: { display: false } }, y: { ticks: { color: TC, font: { size: 10 } }, grid: { color: GC } } } });
  }
}

/* ══════════════════════════════════════════════════════
   GOOGLE ADS — reutiliza loadAds() de analytics.js
   ══════════════════════════════════════════════════════ */
async function _paidLoadGoogle() {
  const container = document.getElementById('paid-google-campaigns');
  if (!container) return;

  if (!TOKEN) {
    container.innerHTML = `<div class="notice"><strong>Google no conectado</strong> — Configura OAuth en <button class="cbtn" onclick="showP('settings',null)">Settings →</button></div>`;
    return;
  }
  if (!CFG.ads) {
    container.innerHTML = `<div class="notice"><strong>Google Ads no configurado</strong> — Añade tu Customer ID en <button class="cbtn" onclick="showP('settings',null)">Settings →</button></div>`;
    return;
  }

  container.innerHTML = `<div class="ld"><div class="sp2"></div>Cargando campañas de Google Ads…</div>`;

  const custId   = (CFG.ads || '').replace(/[^0-9]/g, '');
  const devToken = CFG.adsToken || '';

  if (!devToken) {
    container.innerHTML = `
      <div class="notice" style="background:#FFFBEB;border-color:#FDE68A;color:#92400E;padding:16px">
        <strong>Developer token requerido</strong><br>
        Ve a <a href="https://ads.google.com/aw/apicenter" target="_blank" style="color:#D97706">Google Ads → Tools → API Center</a>,
        copia tu <strong>Developer token</strong> y pégalo en Settings → Google.<br><br>
        Tu Customer ID <strong>${CFG.ads}</strong> ya está guardado.
      </div>`;
    document.getElementById('paid-google-kpis').innerHTML = '';
    return;
  }

  try {
    const query = `SELECT campaign.id, campaign.name, campaign.status,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 20`;

    const r = await fetch(`https://googleads.googleapis.com/v17/customers/${custId}/googleAds:search`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'developer-token': devToken,
        'Content-Type': 'application/json',
        'login-customer-id': custId,
      },
      body: JSON.stringify({ query })
    });

    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err?.error?.details?.[0]?.errors?.[0]?.message || err?.error?.message || r.statusText);
    }

    const data = await r.json();
    const rows = data.results || [];

    let totalImpressions = 0, totalClicks = 0, totalCost = 0, totalConv = 0;
    rows.forEach(row => {
      totalImpressions += parseInt(row.metrics?.impressions || 0);
      totalClicks      += parseInt(row.metrics?.clicks || 0);
      totalCost        += parseInt(row.metrics?.costMicros || 0);
      totalConv        += parseFloat(row.metrics?.conversions || 0);
    });
    const totalCostGBP = totalCost / 1_000_000;
    const avgCTR       = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const avgCPC       = totalClicks > 0 ? (totalCostGBP / totalClicks) : 0;
    const convRate     = totalClicks > 0 ? (totalConv / totalClicks * 100) : 0;

    const kpisEl = document.getElementById('paid-google-kpis');
    if (kpisEl) {
      kpisEl.innerHTML = [
        { l: 'Impresiones', v: totalImpressions.toLocaleString(), sub: 'Últimos 30 días' },
        { l: 'Clicks', v: totalClicks.toLocaleString(), sub: 'CTR: ' + avgCTR.toFixed(2) + '%', col: avgCTR >= 2 ? 'var(--green)' : avgCTR >= 0.5 ? 'var(--amber)' : 'var(--red)' },
        { l: 'Gasto', v: fmtCurrency(totalCostGBP), sub: 'CPC medio: ' + fmtCurrency(avgCPC) },
        { l: 'Conversiones', v: totalConv.toFixed(0), sub: 'Conv. rate: ' + convRate.toFixed(2) + '%', col: convRate >= 2 ? 'var(--green)' : 'var(--mt)' },
      ].map(k => `<div class="kpi"><div class="kl">${k.l}</div><div class="kv">${k.v}</div><div class="ks" style="color:${k.col || 'var(--ht)'}">${k.sub}</div></div>`).join('');
    }

    const tagEl = document.getElementById('nb-google-ads-tag');
    if (tagEl) { tagEl.textContent = 'Live'; tagEl.style.background = 'var(--gp)'; tagEl.style.color = 'var(--green)'; }

    container.innerHTML = rows.length === 0
      ? '<div class="notice">No se encontraron campañas en los últimos 30 días.</div>'
      : `<table class="dt"><thead><tr>
          <th>Campaña</th><th>Estado</th><th>Impresiones</th><th>Clicks</th>
          <th>CTR</th><th>Gasto</th><th>Conv.</th>
        </tr></thead><tbody>`
        + rows.map(row => {
          const m = row.metrics || {}, c = row.campaign || {};
          const imp  = parseInt(m.impressions || 0);
          const clk  = parseInt(m.clicks || 0);
          const cst  = (parseInt(m.costMicros || 0) / 1_000_000).toFixed(2);
          const ctr  = imp > 0 ? (clk / imp * 100).toFixed(2) + '%' : '—';
          const conv = parseFloat(m.conversions || 0).toFixed(0);
          const stCol = c.status === 'ENABLED' ? 'var(--green)' : c.status === 'PAUSED' ? 'var(--amber)' : 'var(--ht)';
          return `<tr>
            <td><span class="tm">${c.name || '—'}</span></td>
            <td><span style="color:${stCol};font-weight:500">${(c.status || '').charAt(0) + (c.status || '').slice(1).toLowerCase()}</span></td>
            <td>${imp.toLocaleString()}</td><td>${clk.toLocaleString()}</td>
            <td>${ctr}</td><td>£${cst}</td><td>${conv}</td>
          </tr>`;
        }).join('')
        + '</tbody></table>';

  } catch (e) {
    container.innerHTML = `<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B;padding:14px">
      <strong>Google Ads error:</strong> ${e.message}
      <br><small style="opacity:.8">Verifica que el Developer token esté aprobado y el Customer ID sea correcto.</small>
    </div>`;
  }
}

/* ══════════════════════════════════════════════════════
   META ADS — Meta Ads Manager API (v25)
   ══════════════════════════════════════════════════════ */
async function _paidLoadMeta() {
  const container = document.getElementById('paid-meta-content');
  if (!container) return;

  if (!CFG.metaToken || !CFG.metaAdAccountId) {
    container.innerHTML = `
      <div class="notice" style="padding:16px">
        <strong>Meta Ads no configurado</strong><br>
        Añade tu <strong>Meta Access Token</strong> y tu <strong>Ad Account ID</strong> en 
        <button class="cbtn" onclick="showP('settings',null)">Settings →</button>
        <br><small style="opacity:.8;margin-top:6px;display:block">
          Ad Account ID: ve a <a href="https://business.facebook.com/adsmanager" target="_blank">Ads Manager</a> 
          → el número en la URL (act_XXXXXXXXX). El mismo token de Instagram sirve si tiene el permiso <code>ads_read</code>.
        </small>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="ld"><div class="sp2"></div>Cargando campañas de Meta Ads…</div>`;

  try {
    const actId  = CFG.metaAdAccountId.replace(/^act_/, '');
    const token  = CFG.metaToken;
    const fields = 'campaign_name,status,impressions,clicks,spend,cpc,ctr,actions';
    const since  = Math.floor((Date.now() - 30 * 86400000) / 1000);
    const until  = Math.floor(Date.now() / 1000);

    const url = `https://graph.facebook.com/v25.0/act_${actId}/insights?fields=${fields}&time_range={"since":"${_unixToDate(since)}","until":"${_unixToDate(until)}"}&level=campaign&limit=20&access_token=${token}`;

    const resp = await fetch(url);
    const json = await resp.json();
    if (json.error) throw new Error(json.error.message);

    const rows = json.data || [];

    // Aggregados
    let totalSpend = 0, totalClicks = 0, totalImpressions = 0, totalConv = 0;
    rows.forEach(r => {
      totalSpend       += parseFloat(r.spend || 0);
      totalClicks      += parseInt(r.clicks || 0);
      totalImpressions += parseInt(r.impressions || 0);
      const conv = (r.actions || []).find(a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead');
      totalConv += conv ? parseFloat(conv.value || 0) : 0;
    });
    const avgCTR  = totalImpressions > 0 ? (totalClicks / totalImpressions * 100) : 0;
    const avgCPC  = totalClicks > 0 ? (totalSpend / totalClicks) : 0;
    const convRate = totalClicks > 0 ? (totalConv / totalClicks * 100) : 0;

    container.innerHTML = `
      <!-- KPIs Meta Ads -->
      <div class="kr" style="margin-bottom:12px">
        ${_paidKpi('💜', 'Gasto Meta', totalSpend > 0 ? fmtCurrency(totalSpend) : '—', 'Últimos 30d', 'var(--purple)')}
        ${_paidKpi('🖱', 'Clicks', totalClicks > 0 ? totalClicks.toLocaleString() : '—', 'CTR: ' + avgCTR.toFixed(2) + '%', 'var(--blue)')}
        ${_paidKpi('👁', 'Impresiones', totalImpressions > 0 ? _paidFmtK(totalImpressions) : '—', 'Alcance pagado', 'var(--amber)')}
        ${_paidKpi('🎯', 'Conv. (leads)', totalConv > 0 ? totalConv.toFixed(0) : '—', 'Conv. rate: ' + convRate.toFixed(2) + '%', 'var(--green)')}
      </div>

      <!-- Tabla de campañas -->
      <div class="cd">
        <div class="ch">
          <span class="ct">Campañas Meta Ads</span>
          <span class="bg" style="background:var(--pp);color:var(--purple)">Live</span>
        </div>
        <div style="overflow-x:auto;margin-top:8px">
          ${rows.length === 0
            ? '<div class="notice">No se encontraron campañas en los últimos 30 días.</div>'
            : `<table class="dt"><thead><tr>
                <th>Campaña</th><th>Estado</th><th>Impresiones</th><th>Clicks</th>
                <th>CTR</th><th>CPC</th><th>Gasto</th><th>Conv.</th>
              </tr></thead><tbody>
              ${rows.map(r => {
                const conv = (r.actions || []).find(a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead');
                const convVal = conv ? parseFloat(conv.value || 0).toFixed(0) : '—';
                const stCol = r.status === 'ACTIVE' ? 'var(--purple)' : r.status === 'PAUSED' ? 'var(--amber)' : 'var(--ht)';
                const statusLabel = r.status === 'ACTIVE' ? 'Activa' : r.status === 'PAUSED' ? 'Pausada' : r.status || '—';
                return `<tr>
                  <td><span class="tm">${r.campaign_name || '—'}</span></td>
                  <td><span style="color:${stCol};font-weight:500">${statusLabel}</span></td>
                  <td>${parseInt(r.impressions || 0).toLocaleString()}</td>
                  <td>${parseInt(r.clicks || 0).toLocaleString()}</td>
                  <td>${parseFloat(r.ctr || 0).toFixed(2)}%</td>
                  <td style="font-family:'DM Mono',monospace;font-size:12px">£${parseFloat(r.cpc || 0).toFixed(2)}</td>
                  <td style="font-family:'DM Mono',monospace;font-size:12px">£${parseFloat(r.spend || 0).toFixed(2)}</td>
                  <td>${convVal}</td>
                </tr>`;
              }).join('')}
              </tbody></table>`
          }
        </div>
      </div>
    `;

  } catch (e) {
    container.innerHTML = `<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B;padding:14px">
      <strong>Meta Ads error:</strong> ${e.message}
      <br><small style="opacity:.8">Verifica que el token tenga el permiso <code>ads_read</code> y el Ad Account ID sea correcto.</small>
      <br><button class="cbtn" onclick="showP('settings',null)" style="margin-top:8px">Abrir Settings →</button>
    </div>`;
  }
}

/* ══════════════════════════════════════════════════════
   FETCH DATA HELPERS (para KPIs cross-platform)
   ══════════════════════════════════════════════════════ */
async function _paidFetchGoogleData() {
  if (!TOKEN || !CFG.ads || !CFG.adsToken) return { hasToken: false, totalCost: 0, totalClicks: 0, totalConv: 0, avgCTR: 0 };

  const custId   = (CFG.ads || '').replace(/[^0-9]/g, '');
  const devToken = CFG.adsToken;
  const query = `SELECT metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.impressions
    FROM campaign WHERE segments.date DURING LAST_30_DAYS`;

  const r = await fetch(`https://googleads.googleapis.com/v17/customers/${custId}/googleAds:search`, {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + TOKEN, 'developer-token': devToken, 'Content-Type': 'application/json', 'login-customer-id': custId },
    body: JSON.stringify({ query })
  });
  if (!r.ok) return { hasToken: true, totalCost: 0, totalClicks: 0, totalConv: 0, avgCTR: 0 };

  const data  = await r.json();
  const rows  = data.results || [];
  let totalClicks = 0, totalCost = 0, totalConv = 0, totalImpressions = 0;
  rows.forEach(row => {
    totalClicks      += parseInt(row.metrics?.clicks || 0);
    totalCost        += parseInt(row.metrics?.costMicros || 0);
    totalConv        += parseFloat(row.metrics?.conversions || 0);
    totalImpressions += parseInt(row.metrics?.impressions || 0);
  });
  return {
    hasToken: true,
    totalCost: totalCost / 1_000_000,
    totalClicks,
    totalConv,
    avgCTR: totalImpressions > 0 ? totalClicks / totalImpressions * 100 : 0
  };
}

async function _paidFetchMetaData() {
  if (!CFG.metaToken || !CFG.metaAdAccountId) return { connected: false, totalSpend: 0, totalClicks: 0, totalConv: 0, avgCTR: 0 };

  try {
    const actId = CFG.metaAdAccountId.replace(/^act_/, '');
    const since = _unixToDate(Math.floor((Date.now() - 30 * 86400000) / 1000));
    const until = _unixToDate(Math.floor(Date.now() / 1000));
    const url   = `https://graph.facebook.com/v25.0/act_${actId}/insights?fields=spend,clicks,impressions,actions&time_range={"since":"${since}","until":"${until}"}&level=account&limit=1&access_token=${CFG.metaToken}`;

    const resp = await fetch(url);
    const json = await resp.json();
    if (json.error) return { connected: false, totalSpend: 0, totalClicks: 0, totalConv: 0, avgCTR: 0 };

    const d   = json.data?.[0] || {};
    const imp = parseInt(d.impressions || 0);
    const clk = parseInt(d.clicks || 0);
    const spd = parseFloat(d.spend || 0);
    const conv = ((d.actions || []).find(a => a.action_type === 'lead' || a.action_type === 'offsite_conversion.fb_pixel_lead')?.value) || 0;
    return { connected: true, totalSpend: spd, totalClicks: clk, totalConv: parseFloat(conv), avgCTR: imp > 0 ? clk / imp * 100 : 0 };
  } catch {
    return { connected: false, totalSpend: 0, totalClicks: 0, totalConv: 0, avgCTR: 0 };
  }
}

/* ══════════════════════════════════════════════════════
   IA RECOMMENDATIONS — Cross-platform
   ══════════════════════════════════════════════════════ */
async function runPaidMediaAI() {
  const btn = document.getElementById('paid-ai-btn');
  const out = document.getElementById('paid-ai-out');
  if (!btn || !out) return;

  btn.disabled = true;
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Analizando…`;
  out.innerHTML = `<div style="padding:24px;text-align:center;color:var(--ht);font-size:13px">🧠 Recopilando datos de Google Ads + Meta Ads…</div>`;

  try {
    // Obtener datos reales directamente — no depende de que el usuario
    // haya visitado los tabs de Google o Meta antes de pulsar este botón.
    const [gResult, mResult] = await Promise.allSettled([
      _paidFetchGoogleData(),
      _paidFetchMetaData(),
    ]);

    const g = gResult.status === 'fulfilled' ? gResult.value : null;
    const m = mResult.status === 'fulfilled' ? mResult.value : null;

    // Construir strings descriptivos para el engine (mismo formato que espera)
    const googleConfigured = g?.hasToken && (g.totalCost > 0 || g.totalClicks > 0);
    const metaConfigured   = m?.connected && (m.totalSpend > 0 || m.totalClicks > 0);

    const kpiText = [
      googleConfigured
        ? `Google Ads (últimos 30d): Gasto £${g.totalCost.toFixed(2)} | Clicks ${g.totalClicks.toLocaleString()} | Conversiones ${g.totalConv.toFixed(0)} | CTR ${g.avgCTR.toFixed(2)}%`
        : 'Google Ads: no configurado o sin datos en los últimos 30 días',
      metaConfigured
        ? `Meta Ads (últimos 30d): Gasto £${m.totalSpend.toFixed(2)} | Clicks ${m.totalClicks.toLocaleString()} | Conversiones ${m.totalConv.toFixed(0)} | CTR ${m.avgCTR.toFixed(2)}%`
        : 'Meta Ads: no configurado o sin datos en los últimos 30 días',
    ].join('\n');

    // campText vacío cuando no hay datos de campañas individuales disponibles
    // (los fetch helpers devuelven solo agregados; los detalles de campaña
    //  están disponibles si el usuario visita los tabs, pero no son requeridos
    //  para un análisis cross-platform de alto nivel)
    const campText = '';

    out.innerHTML = `<div style="padding:24px;text-align:center;color:var(--ht);font-size:13px">🧠 Claude está analizando Google Ads + Meta Ads de forma conjunta…</div>`;

    const r = await apiFetch('/api/claude-proxy', {
      method: 'POST',
      body: {
        module: 'intelligence',
        action: 'ads-recommendations',
        payload: { kpiText, campText, userCurrency: getUserCurrency() }
      }
    });

    const tipoColor = { 'Nueva campaña': 'var(--green)', 'Optimización': 'var(--blue)', 'Pausa': 'var(--red)', 'Presupuesto': 'var(--amber)', 'Audiencia': 'var(--purple)', 'Copys': 'var(--teal)' };
    const tipoBg    = { 'Nueva campaña': 'var(--gp)', 'Optimización': 'var(--bp)', 'Pausa': 'var(--rp)', 'Presupuesto': 'var(--ap)', 'Audiencia': 'var(--pp)', 'Copys': 'var(--tp)' };
    const prioColor = { alta: '#DC2626', media: '#D97706', baja: '#059669' };
    const estadoIcon = { bueno: '✅', regular: '⚠️', malo: '🔴' };

    out.innerHTML = `
      <div style="padding:12px 14px;background:var(--sf2);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--tx)">${r.diagnostico || ''}</div>

      ${(r.kpis_clave || []).length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:16px">
        ${(r.kpis_clave || []).map(k => `
        <div style="background:var(--sf2);border-radius:var(--r);padding:10px 12px">
          <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${estadoIcon[k.estado] || '•'} ${k.metrica}</div>
          <div style="font-size:11px;color:var(--mt)">${k.comentario}</div>
        </div>`).join('')}
      </div>` : ''}

      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Recomendaciones cross-platform</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${(r.recomendaciones_campañas || []).map(rec => `
        <div style="border:1px solid var(--bd);border-radius:var(--r);padding:12px 14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:${tipoBg[rec.tipo] || 'var(--sf2)'};color:${tipoColor[rec.tipo] || 'var(--mt)'}">${rec.tipo}</span>
            <span style="font-size:12px;font-weight:500;color:var(--tx)">${rec.titulo}</span>
            <span style="font-size:9px;font-weight:700;color:${prioColor[rec.prioridad] || 'var(--mt)'};text-transform:uppercase;margin-left:auto">${rec.prioridad}</span>
            <span style="font-size:10px;color:var(--ht)">${rec.mercado || ''}</span>
          </div>
          <div style="font-size:11px;color:var(--mt);margin-bottom:6px">${rec.descripcion}</div>
          ${rec.keywords_sugeridas?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">${rec.keywords_sugeridas.map(k => `<span style="padding:2px 8px;background:var(--bp);color:var(--blue);border-radius:20px;font-size:10px">${k}</span>`).join('')}</div>` : ''}
          ${rec.presupuesto_sugerido ? `<div style="font-size:10px;color:var(--teal)">💰 ${rec.presupuesto_sugerido}</div>` : ''}
        </div>`).join('')}
      </div>

      ${(r.estructura_campañas_recomendada || []).length ? `
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Estructura recomendada</div>
      <div style="overflow-x:auto;margin-bottom:16px">
        <table class="dt"><thead><tr><th>Campaña</th><th>Tipo</th><th>Canal</th><th>Mercado</th><th>Objetivo</th><th style="text-align:right">Budget/mes</th></tr></thead>
        <tbody>${(r.estructura_campañas_recomendada || []).map(c => `
        <tr>
          <td><span class="tm">${c.campaña}</span></td>
          <td><span style="font-size:10px;background:var(--bp);color:var(--blue);padding:2px 6px;border-radius:10px">${c.tipo}</span></td>
          <td style="font-size:11px">${c.canal || 'Google'}</td>
          <td style="font-size:11px">${c.mercado}</td>
          <td style="font-size:11px;color:var(--mt)">${c.objetivo}</td>
          <td style="text-align:right;font-family:'DM Mono',monospace;font-size:11px">${c.budget_mensual}</td>
        </tr>`).join('')}</tbody></table>
      </div>` : ''}

      ${(r.quick_wins || []).length ? `
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">⚡ Quick Wins</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
        ${(r.quick_wins || []).map(q => `
        <div style="background:var(--gp);border:1px solid #9FE1CB;border-radius:var(--r);padding:12px 14px">
          <div style="font-size:11px;font-weight:600;color:var(--green2);margin-bottom:3px">${q.accion}</div>
          <div style="font-size:11px;color:var(--mt);margin-bottom:5px">${q.impacto}</div>
          <div style="font-size:10px;color:var(--ht)">⏱ ${q.tiempo}</div>
        </div>`).join('')}
      </div>` : ''}

      <div style="margin-top:12px;font-size:10px;color:var(--ht);text-align:right">Generado por Claude AI · Paid Media · ${new Date().toLocaleDateString('es-ES')}</div>
    `;

  } catch (e) {
    out.innerHTML = `<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B">
      <strong>⚠ Error en análisis</strong><br>${e.message}
    </div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg> Analizar todo`;
  }
}

/* ══════════════════════════════════════════════════════
   UTILS / HELPERS locales
   ══════════════════════════════════════════════════════ */
function _paidKpi(icon, label, value, sub, color) {
  return `<div class="kc" style="border-left:3px solid ${color}">
    <div style="font-size:18px;margin-bottom:4px">${icon}</div>
    <div class="kv">${value}</div>
    <div class="kl">${label}</div>
    <div style="font-size:10px;color:var(--ht);margin-top:2px">${sub}</div>
  </div>`;
}

function _paidPlaceholder(title, icon, desc, link) {
  return `<div class="cd" style="text-align:center;padding:48px 24px">
    <div style="font-size:40px;margin-bottom:12px">${icon}</div>
    <div style="font-size:15px;font-weight:600;color:var(--tx);margin-bottom:8px">${title}</div>
    <div style="font-size:13px;color:var(--mt);max-width:480px;margin:0 auto 16px;line-height:1.6">${desc}</div>
    <span style="display:inline-block;padding:6px 16px;background:var(--sf2);border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;color:var(--ht)">
      🔜 Próximamente — integración con ${link}
    </span>
  </div>`;
}

function _paidFmtK(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
  return n.toLocaleString();
}

function _unixToDate(ts) {
  return new Date(ts * 1000).toISOString().split('T')[0];
}
