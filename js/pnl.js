/* ═══════════════════════════════════════════════════════════════════
   P&L — Profit & Loss · Revenue Intelligence
   Transforma el Budget en un P&L real con: Revenue, COGS,
   Gross Margin, OpEx por canal, Net Profit, CAC, LTV/CAC
   ═══════════════════════════════════════════════════════════════════ */

const PNL_KEY = 'pr_pnl_v1';

const PNL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Revenue por tipo de servicio ── */
const PNL_SERVICES = {
  sesion_unica       : { label:'Sesión única',         price: 97,  color:'#1D9E75' },
  pack_completo      : { label:'Pack Completo',         price: 297, color:'#2563EB' },
  acompanamiento     : { label:'Acompañamiento Total',  price: 497, color:'#7C3AED' },
  b2b_universidad    : { label:'B2B / Universidad',     price: 800, color:'#D97706' },
};

/* ── Cargar / guardar datos ── */
function pnlLoad() {
  try { return JSON.parse(localStorage.getItem(PNL_KEY) || 'null') || pnlDefault(); }
  catch (_) { return pnlDefault(); }
}
function pnlSave(d) {
  try { localStorage.setItem(PNL_KEY, JSON.stringify(d)); } catch (_) {}
}
function pnlDefault() {
  return {
    revenueByMonth: Array(12).fill(null).map(() => ({
      sesion_unica      : 0,
      pack_completo     : 0,
      acompanamiento    : 0,
      b2b_universidad   : 0,
    })),
    cogs_pct  : 5,    /* % ingresos destinado a entrega (herramientas, tiempo directo) */
    notes     : Array(12).fill(''),
  };
}

/* ── Helpers de cálculo ── */
function pnlGetActualCosts() {
  /* Lee los costes reales subidos al módulo de Budget */
  try {
    const BGT_AK = 'eco_actual_v2';
    return JSON.parse(localStorage.getItem(BGT_AK) || '{}');
  } catch (_) { return {}; }
}

function pnlComputeMonth(m, data) {
  const rev = data.revenueByMonth[m];

  /* Revenue */
  const gross_revenue = Object.keys(PNL_SERVICES).reduce((s, k) => {
    return s + (rev[k] || 0) * PNL_SERVICES[k].price;
  }, 0);
  const total_clients = Object.keys(PNL_SERVICES).reduce((s, k) => s + (rev[k] || 0), 0);

  /* COGS */
  const cogs = Math.round(gross_revenue * (data.cogs_pct / 100));

  /* Gross profit */
  const gross_profit = gross_revenue - cogs;
  const gross_margin = gross_revenue > 0 ? (gross_profit / gross_revenue * 100) : 0;

  /* Budget / OpEx */
  const actual = pnlGetActualCosts();
  let opex_actual = 0;
  if (typeof BGT_DATA !== 'undefined') {
    BGT_DATA.rows.forEach(row => {
      const actualKey = `${row.cat}|${row.name}|${m}`;
      const actualVal = parseFloat(actual[actualKey] || 0);
      opex_actual += actualVal; /* Solo gastos reales — no usar presupuesto como fallback */
    });
  }

  /* Net profit */
  const ebitda      = gross_profit - opex_actual;
  const net_margin  = gross_revenue > 0 ? (ebitda / gross_revenue * 100) : 0;

  /* CAC */
  const marketing_spend = opex_actual; /* Simplificado — todo opex es marketing */
  const cac = total_clients > 0 ? Math.round(marketing_spend / total_clients) : null;

  /* LTV (simplificado: ticket medio × 1.3 upsell factor) */
  const avg_ticket = total_clients > 0
    ? gross_revenue / total_clients
    : Object.values(PNL_SERVICES)[0].price;
  const ltv = Math.round(avg_ticket * 1.3);

  return {
    gross_revenue, total_clients, cogs, gross_profit, gross_margin,
    opex_actual, ebitda, net_margin, cac, ltv,
    ltv_cac_ratio: cac ? (ltv / cac).toFixed(1) : null,
  };
}

function pnlComputeYTD(data) {
  const NOW = new Date();
  const months = Array.from({ length: NOW.getMonth() + 1 }, (_, i) => i);
  return months.reduce((acc, m) => {
    const mc = pnlComputeMonth(m, data);
    acc.gross_revenue  += mc.gross_revenue;
    acc.total_clients  += mc.total_clients;
    acc.cogs           += mc.cogs;
    acc.gross_profit   += mc.gross_profit;
    acc.opex_actual    += mc.opex_actual;
    acc.ebitda         += mc.ebitda;
    return acc;
  }, { gross_revenue:0, total_clients:0, cogs:0, gross_profit:0, opex_actual:0, ebitda:0 });
}

/* ══════════════════════════════════════════
   RENDERIZADO
══════════════════════════════════════════ */

let PNL_ACTIVE_MONTH = new Date().getMonth();

function renderPNLPage() {
  const data = pnlLoad();
  const ytd  = pnlComputeYTD(data);
  const mc   = pnlComputeMonth(PNL_ACTIVE_MONTH, data);
  const NOW  = new Date();

  const pageEl = document.getElementById('page-pnl');
  if (!pageEl) return;

  /* ── KPI Cards YTD ── */
  const kpiCards = [
    { label:'Revenue YTD',    val:'£' + Math.round(ytd.gross_revenue).toLocaleString(), sub:'Ingresos brutos', color:'var(--green)' },
    { label:'Clientes YTD',   val:ytd.total_clients.toString(),                          sub:'Total pagantes', color:'var(--blue)' },
    { label:'Gross Margin',   val:ytd.gross_revenue > 0 ? ((ytd.gross_profit / ytd.gross_revenue)*100).toFixed(0)+'%' : '—', sub:'Margen bruto', color:'var(--teal)' },
    { label:'EBITDA YTD',     val:'£' + Math.round(ytd.ebitda).toLocaleString(),         sub:ytd.ebitda >= 0 ? 'Beneficio' : 'Pérdida', color: ytd.ebitda >= 0 ? 'var(--green)' : 'var(--red)' },
    { label:'OpEx YTD',       val:'£' + Math.round(ytd.opex_actual).toLocaleString(),    sub:'Gasto total', color:'var(--amber)' },
    { label:'CAC mes actual', val: mc.cac ? '£' + mc.cac : '—',                          sub:'Coste/cliente', color:'var(--purple)' },
    { label:'LTV/CAC',        val: mc.ltv_cac_ratio ? mc.ltv_cac_ratio + 'x' : '—',     sub:'Objetivo >3x', color: mc.ltv_cac_ratio >= 3 ? 'var(--green)' : mc.ltv_cac_ratio >= 1 ? 'var(--amber)' : 'var(--red)' },
  ];

  document.getElementById('pnl-kpis').innerHTML = kpiCards.map(k => `
    <div class="kpi">
      <div class="kl">${k.label}</div>
      <div class="kv" style="color:${k.color}">${k.val}</div>
      <div class="ks">${k.sub}</div>
    </div>`).join('');

  /* ── Selector de mes ── */
  document.getElementById('pnl-month-tabs').innerHTML = PNL_MONTHS.map((m, i) => `
    <div class="dp ${i === PNL_ACTIVE_MONTH ? 'active' : ''}" onclick="pnlSelectMonth(${i})">${m}</div>`
  ).join('');

  /* ── Tabla de revenue del mes ── */
  const rev = data.revenueByMonth[PNL_ACTIVE_MONTH];
  document.getElementById('pnl-revenue-table').innerHTML = `
    <table class="dt" style="width:100%">
      <thead><tr>
        <th>Servicio</th>
        <th>Precio unitario</th>
        <th>Unidades vendidas</th>
        <th>Revenue</th>
      </tr></thead>
      <tbody>
        ${Object.entries(PNL_SERVICES).map(([k, svc]) => {
          const units = rev[k] || 0;
          const revenue = units * svc.price;
          return `<tr>
            <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${svc.color};margin-right:6px"></span>${svc.label}</td>
            <td style="color:var(--mt)">£${svc.price}</td>
            <td>
              <div style="display:flex;align-items:center;gap:6px">
                <button onclick="pnlUpdateUnits('${k}',${units - 1})" style="width:22px;height:22px;border:1px solid var(--bd2);border-radius:5px;background:var(--sf2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--mt)">−</button>
                <input type="number" min="0" value="${units}" onchange="pnlUpdateUnits('${k}',+this.value)"
                  style="width:50px;text-align:center;padding:4px;border:1px solid var(--bd2);border-radius:var(--r);background:var(--sf2);color:var(--tx);font-size:13px;font-family:inherit"/>
                <button onclick="pnlUpdateUnits('${k}',${units + 1})" style="width:22px;height:22px;border:1px solid var(--bd2);border-radius:5px;background:var(--sf2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--mt)">+</button>
              </div>
            </td>
            <td><strong style="color:${svc.color}">£${revenue.toLocaleString()}</strong></td>
          </tr>`;
        }).join('')}
        <tr style="border-top:2px solid var(--bd)">
          <td><strong>Total</strong></td>
          <td></td>
          <td><strong>${mc.total_clients} clientes</strong></td>
          <td><strong style="color:var(--green);font-size:16px">£${mc.gross_revenue.toLocaleString()}</strong></td>
        </tr>
      </tbody>
    </table>`;

  /* ── P&L Waterfall del mes ── */
  const rows = [
    { label:'Revenue bruto',  val: mc.gross_revenue,   type:'revenue' },
    { label:`COGS (${data.cogs_pct}%)`, val: -mc.cogs, type:'cost' },
    { label:'Gross Profit',   val: mc.gross_profit,    type:'subtotal', pct: mc.gross_margin.toFixed(0) + '%' },
    { label:'OpEx (marketing + tools)', val: -mc.opex_actual, type:'cost' },
    { label:'EBITDA',         val: mc.ebitda,           type:'final', pct: mc.net_margin.toFixed(0) + '%' },
  ];

  const maxAbs = Math.max(...rows.map(r => Math.abs(r.val)), 1);
  document.getElementById('pnl-waterfall').innerHTML = rows.map(r => {
    const barW = Math.round((Math.abs(r.val) / maxAbs) * 100);
    const color = r.type === 'revenue' ? 'var(--green)'
                : r.type === 'cost'    ? 'var(--red)'
                : r.type === 'subtotal'? 'var(--teal)'
                : r.val >= 0           ? 'var(--green)' : 'var(--red)';
    const label = r.val >= 0 ? '+£' + Math.abs(r.val).toLocaleString() : '−£' + Math.abs(r.val).toLocaleString();
    return `
      <div style="display:grid;grid-template-columns:180px 1fr 110px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd)">
        <div style="font-size:12px;${r.type==='subtotal'||r.type==='final'?'font-weight:600;color:var(--tx)':'color:var(--mt)'}">${r.label}</div>
        <div style="background:var(--sf2);border-radius:3px;height:8px;overflow:hidden">
          <div style="width:${barW}%;height:100%;background:${color};border-radius:3px;transition:width .4s"></div>
        </div>
        <div style="text-align:right;font-size:13px;font-weight:${r.type==='final'?'700':'500'};color:${color}">
          ${label}${r.pct ? `<span style="font-size:10px;color:var(--ht);margin-left:5px">${r.pct}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  /* ── CAC / LTV analysis ── */
  document.getElementById('pnl-unit-economics').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">
      ${[
        { label:'Clientes este mes', val: mc.total_clients || '0', icon:'👥', good: true },
        { label:'Revenue por cliente', val: mc.total_clients > 0 ? '£' + Math.round(mc.gross_revenue / mc.total_clients) : '—', icon:'💰', good: true },
        { label:'CAC (OpEx ÷ Clientes)', val: mc.cac ? '£' + mc.cac : '—', icon:'🎯', good: mc.cac && mc.cac < 150 },
        { label:'LTV estimado', val: '£' + mc.ltv, icon:'♻️', good: true },
        { label:'LTV/CAC ratio', val: mc.ltv_cac_ratio ? mc.ltv_cac_ratio + 'x' : '—', icon:'📊', good: parseFloat(mc.ltv_cac_ratio) >= 3 },
        { label:'Payback (meses)', val: mc.cac && mc.avg_ticket ? Math.ceil(mc.cac / (mc.gross_revenue / (mc.total_clients || 1))).toString() : '—', icon:'⏱', good: true },
      ].map(e => `
        <div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:12px 14px">
          <div style="font-size:11px;color:var(--mt);margin-bottom:5px">${e.icon} ${e.label}</div>
          <div style="font-size:20px;font-weight:600;color:${e.good !== undefined ? (e.good ? 'var(--green)' : 'var(--amber)') : 'var(--tx)'}">${e.val}</div>
        </div>`).join('')}
    </div>`;

  /* ── Monthly revenue chart ── */
  pnlRenderMonthlyChart(data);

  /* ── COGS slider ── */
  document.getElementById('pnl-cogs-val').textContent = data.cogs_pct + '%';
  const cogsSlider = document.getElementById('pnl-cogs-slider');
  if (cogsSlider) cogsSlider.value = data.cogs_pct;

  /* ── AI Analysis button context ── */
  window._PNL_CONTEXT = { ytd, mc, data, activeMonth: PNL_MONTHS[PNL_ACTIVE_MONTH] };
}

function pnlSelectMonth(m) {
  PNL_ACTIVE_MONTH = m;
  renderPNLPage();
}

function pnlUpdateUnits(service, units) {
  const data = pnlLoad();
  data.revenueByMonth[PNL_ACTIVE_MONTH][service] = Math.max(0, units);
  pnlSave(data);
  renderPNLPage();
  /* Actualizar memoria con revenue actual */
  const mc = pnlComputeMonth(PNL_ACTIVE_MONTH, data);
  if (mc.total_clients > 0) {
    memUpdateProfile({
      currentMRR : mc.gross_revenue,
      avgTicket  : Math.round(mc.gross_revenue / mc.total_clients),
    });
  }
}

function pnlUpdateCOGS(pct) {
  const data = pnlLoad();
  data.cogs_pct = parseInt(pct) || 5;
  pnlSave(data);
  renderPNLPage();
}

function pnlRenderMonthlyChart(data) {
  const canvas = document.getElementById('pnl-chart');
  if (!canvas || typeof Chart === 'undefined') return;
  if (window._PNL_CH) { try { window._PNL_CH.destroy(); } catch (_) {} }

  const labels = PNL_MONTHS;
  const revenues = PNL_MONTHS.map((_, m) => pnlComputeMonth(m, data).gross_revenue);
  const ebitdas  = PNL_MONTHS.map((_, m) => pnlComputeMonth(m, data).ebitda);
  const opexes   = PNL_MONTHS.map((_, m) => pnlComputeMonth(m, data).opex_actual);

  window._PNL_CH = new Chart(canvas, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        { label:'Revenue', data:revenues, backgroundColor:'rgba(29,158,117,.65)', borderRadius:4 },
        { label:'OpEx',    data:opexes.map(v => -v), backgroundColor:'rgba(220,38,38,.45)', borderRadius:4 },
        { type:'line', label:'EBITDA', data:ebitdas, borderColor:'#7C3AED', backgroundColor:'transparent', tension:.4, borderWidth:2, pointRadius:3 },
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false,
      animation:{ duration:400 },
      plugins:{ legend:{ display:true, labels:{ font:{size:11}, color:'#888' } },
                tooltip:{ callbacks:{ label: ctx => `${ctx.dataset.label}: £${Math.abs(ctx.raw).toLocaleString()}` } } },
      scales:{
        x:{ ticks:{color:'#A8A8AC',font:{size:10}}, grid:{display:false} },
        y:{ ticks:{color:'#A8A8AC',font:{size:10}, callback: v => '£'+Math.abs(v/1000).toFixed(0)+'k'}, grid:{color:'rgba(0,0,0,.04)'} }
      }
    }
  });
}

/* ── AI Commentary on P&L ── */
async function pnlAIAnalysis() {
  if (!CFG.ak) { alert('Añade tu Anthropic API key en Settings'); return; }
  const btn = document.getElementById('pnl-ai-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Analizando…'; }

  const ctx   = window._PNL_CONTEXT;
  if (!ctx) return;
  const data  = pnlLoad();
  const { ytd, mc } = ctx;

  const prompt = `Eres un CFO-advisor de Próximo Rol (coaching de entrevistas, España/LATAM, ticket €97-497).

P&L actual:
- Revenue YTD: £${Math.round(ytd.gross_revenue).toLocaleString()} | ${ytd.total_clients} clientes
- OpEx YTD: £${Math.round(ytd.opex_actual).toLocaleString()}
- EBITDA YTD: £${Math.round(ytd.ebitda).toLocaleString()} (${ytd.gross_revenue > 0 ? ((ytd.ebitda/ytd.gross_revenue)*100).toFixed(0) : '?'}% margen)
- CAC este mes: ${mc.cac ? '£' + mc.cac : 'no calculable (sin clientes)'}
- LTV/CAC: ${mc.ltv_cac_ratio || 'N/A'}

Etapa del negocio: lanzamiento temprano.
Presupuesto anual marketing: ~£${typeof BGT_DATA !== 'undefined' ? BGT_DATA.annualTotal.toLocaleString() : '74,420'}

Da un análisis P&L en 3 párrafos breves (max 180 palabras total):
1. Situación actual en 1 frase
2. La métrica más preocupante y por qué
3. La palanca de mayor impacto para mejorar la rentabilidad en los próximos 60 días

Sé directo. En español. Sin introducción.`;

  try {
    const data2 = await antFetch({ model:'claude-sonnet-4-20250514', max_tokens:400, messages:[{role:'user',content:prompt}] });
    const text = (data2.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
    const box = document.getElementById('pnl-ai-box');
    if (box) {
      box.style.display = 'block';
      box.innerHTML = `
        <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
          <span style="color:var(--purple);font-size:13px">✦</span>
          <span style="font-size:11px;font-weight:600;color:var(--purple);text-transform:uppercase;letter-spacing:.05em">Análisis CFO — IA</span>
        </div>
        <div style="font-size:12px;color:var(--tx);line-height:1.7">${text.replace(/\n/g,'<br>')}</div>`;
    }
  } catch (err) {
    const box = document.getElementById('pnl-ai-box');
    if (box) { box.style.display='block'; box.textContent='Error: ' + err.message; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✦ Análisis IA'; }
  }
}

/* ══════════════════════════════════════════
   INYECTA LA PÁGINA EN EL HTML
══════════════════════════════════════════ */

(function pnlInit() {
  function injectPNLPage() {
    /* 1. Añadir nav item */
    const nav = document.querySelector('.sb-nav');
    if (nav) {
      const planningSection = Array.from(nav.querySelectorAll('.ns')).find(el => el.textContent.includes('Planning'));
      if (planningSection) {
        const pnlNav = document.createElement('div');
        pnlNav.className = 'ni';
        pnlNav.setAttribute('onclick', "showP('pnl', this)");
        pnlNav.innerHTML = `<div class="nico">💹</div>P&L · Revenue<span class="nb nb-live">P&L</span>`;
        planningSection.insertAdjacentElement('afterend', pnlNav);
      }
    }

    /* 2. Añadir página */
    const main = document.querySelector('.main');
    if (!main) return;

    const page = document.createElement('div');
    page.className = 'page';
    page.id = 'page-pnl';
    page.innerHTML = `
      <div class="sh">
        <span class="sl">P&amp;L — Profit &amp; Loss</span>
        <div class="sln"></div>
        <button id="pnl-ai-btn" onclick="pnlAIAnalysis()" style="padding:5px 14px;background:var(--pp);color:var(--purple);border:1px solid #DDD6FE;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">✦ Análisis IA</button>
      </div>

      <!-- AI commentary -->
      <div id="pnl-ai-box" style="display:none;background:var(--pp);border:1px solid #DDD6FE;border-radius:var(--r);padding:14px 16px;margin-bottom:14px"></div>

      <!-- KPIs YTD -->
      <div class="kr" id="pnl-kpis" style="margin-bottom:16px"></div>

      <!-- Month selector -->
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em">Mes:</span>
        <div class="dps" id="pnl-month-tabs"></div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          <label style="font-size:11px;color:var(--ht)">COGS %</label>
          <input id="pnl-cogs-slider" type="range" min="0" max="30" value="5"
            oninput="document.getElementById('pnl-cogs-val').textContent=this.value+'%';pnlUpdateCOGS(this.value)"
            style="width:80px"/>
          <span id="pnl-cogs-val" style="font-size:12px;font-weight:600;color:var(--tx);min-width:28px">5%</span>
        </div>
      </div>

      <!-- Revenue input + P&L waterfall -->
      <div class="g2" style="margin-bottom:14px">
        <div class="cd">
          <div class="ch"><span class="ct">Revenue — ventas del mes</span><span class="bg bg-g">Manual · editable</span></div>
          <div id="pnl-revenue-table" style="overflow-x:auto"></div>
        </div>
        <div class="cd">
          <div class="ch"><span class="ct">P&amp;L del mes</span><span class="bg bg-g">Cascada</span></div>
          <div id="pnl-waterfall" style="padding:4px 0"></div>
        </div>
      </div>

      <!-- Unit Economics -->
      <div class="cd" style="margin-bottom:14px">
        <div class="ch"><span class="ct">Unit Economics</span><span class="bg bg-p">CAC · LTV · Payback</span></div>
        <div id="pnl-unit-economics"></div>
      </div>

      <!-- Monthly chart -->
      <div class="cd">
        <div class="ch"><span class="ct">Revenue vs OpEx vs EBITDA — mensual 2026</span><span class="bg bg-g">Todos los meses</span></div>
        <div style="position:relative;height:240px"><canvas id="pnl-chart"></canvas></div>
      </div>`;

    /* Insertar antes del cierre del .main */
    const mainContent = main.querySelector('.page:last-of-type');
    if (mainContent) mainContent.insertAdjacentElement('afterend', page);
    else main.appendChild(page);

    /* 3. Registrar en TITLES */
    if (typeof TITLES !== 'undefined') TITLES['pnl'] = 'P&L — Profit & Loss';

    /* 4. Registrar en showP para que renderice al navegar */
    const origShowP = window.showP;
    window.showP = function(id, el) {
      origShowP.apply(this, arguments);
      if (id === 'pnl') {
        requestAnimationFrame(() => requestAnimationFrame(() => renderPNLPage()));
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectPNLPage);
  } else {
    setTimeout(injectPNLPage, 200);
  }
})();
