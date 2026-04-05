/* ═══════════════════════════════════════════════════════════════════
   P&L — Profit & Loss · Revenue Intelligence
   Transforma el Budget en un P&L real con: Revenue, COGS,
   Gross Margin, OpEx por canal, Net Profit, CAC, LTV/CAC
   ═══════════════════════════════════════════════════════════════════ */

const PNL_KEY = 'pr_pnl_v1';

const PNL_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ── Servicios por grupo ── */
const PNL_SERVICES = {
  /* Coaching */
  sesion_unica    : { label:'Sesión única',           price: 97,   color:'#1D9E75', group:'coaching' },
  pack_completo   : { label:'Pack Completo',           price: 297,  color:'#2563EB', group:'coaching' },
  acompanamiento  : { label:'Acompañamiento Total',    price: 497,  color:'#7C3AED', group:'coaching' },
  protocolo_1690  : { label:'Protocolo 1690',          price: 1690, color:'#DC2626', group:'coaching' },
  b2b_universidad : { label:'B2B / Universidad',       price: 800,  color:'#D97706', group:'coaching' },
  /* Scanner de CV */
  scanner_starter : { label:'Scanner Starter (3 cr)',  price: 3.90, color:'#0891B2', group:'scanner' },
  scanner_pro     : { label:'Scanner Pro (5 cr)',       price: 5.90, color:'#BE185D', group:'scanner' },
  scanner_premium : { label:'Scanner Premium (10 cr)', price: 9.90, color:'#65A30D', group:'scanner' },
};

const PNL_COACHING_KEYS = ['sesion_unica','pack_completo','acompanamiento','protocolo_1690','b2b_universidad'];
const PNL_SCANNER_KEYS  = ['scanner_starter','scanner_pro','scanner_premium'];

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
      sesion_unica:0, pack_completo:0, acompanamiento:0,
      protocolo_1690:0, b2b_universidad:0,
      scanner_starter:0, scanner_pro:0, scanner_premium:0,
    })),
    cogs_pct    : 5,
    cogs_manual : [],   /* [{id, name, amount}] */
    prices      : {},   /* {serviceKey: overridePrice} */
    notes       : Array(12).fill(''),
  };
}

/* ── Precio efectivo (override o default) ── */
function pnlPrice(key, data) {
  return (data.prices && data.prices[key] != null) ? data.prices[key] : PNL_SERVICES[key].price;
}

/* ── Leer costes reales del Budget ── */
function pnlGetActualCosts() {
  try { return JSON.parse(localStorage.getItem('eco_actual_v2') || '{}'); }
  catch (_) { return {}; }
}

/* ── Calcular un mes ── */
function pnlComputeMonth(m, data) {
  const rev = data.revenueByMonth[m] || {};

  const coaching_revenue = PNL_COACHING_KEYS.reduce((s,k) => s + (rev[k]||0) * pnlPrice(k,data), 0);
  const scanner_revenue  = PNL_SCANNER_KEYS.reduce((s,k)  => s + (rev[k]||0) * pnlPrice(k,data), 0);
  const gross_revenue    = coaching_revenue + scanner_revenue;

  const total_clients = PNL_COACHING_KEYS.reduce((s,k) => s + (rev[k]||0), 0);
  const scanner_packs = PNL_SCANNER_KEYS.reduce((s,k)  => s + (rev[k]||0), 0);

  const cogs_pct_amt    = Math.round(gross_revenue * (data.cogs_pct / 100));
  const cogs_manual_amt = (data.cogs_manual||[]).reduce((s,c) => s + (c.amount||0), 0);
  const cogs            = cogs_pct_amt + cogs_manual_amt;

  const gross_profit = gross_revenue - cogs;
  const gross_margin = gross_revenue > 0 ? (gross_profit / gross_revenue * 100) : 0;

  const actual = pnlGetActualCosts();
  let opex_actual = 0;
  if (typeof BGT_DATA !== 'undefined') {
    BGT_DATA.rows.forEach(row => {
      opex_actual += parseFloat(actual[`${row.cat}|${row.name}|${m}`] || 0);
    });
  }
  Object.entries(actual).forEach(([k,v]) => {
    if (k.startsWith('_libre|') && k.endsWith(`|${m}`)) opex_actual += parseFloat(v)||0;
  });

  const ebitda     = gross_profit - opex_actual;
  const net_margin = gross_revenue > 0 ? (ebitda / gross_revenue * 100) : 0;
  const cac        = total_clients > 0 ? Math.round(opex_actual / total_clients) : null;
  const avg_ticket = total_clients > 0 ? coaching_revenue / total_clients : PNL_SERVICES.sesion_unica.price;
  const ltv        = Math.round(avg_ticket * 1.3);

  return {
    gross_revenue, coaching_revenue, scanner_revenue,
    total_clients, scanner_packs,
    cogs, cogs_pct_amt, cogs_manual_amt,
    gross_profit, gross_margin,
    opex_actual, ebitda, net_margin, cac, ltv,
    ltv_cac_ratio: cac ? (ltv/cac).toFixed(1) : null,
  };
}

function pnlComputeYTD(data) {
  return Array.from({length: new Date().getMonth()+1}, (_,i)=>i)
    .reduce((acc,m) => {
      const mc = pnlComputeMonth(m,data);
      acc.gross_revenue += mc.gross_revenue; acc.total_clients += mc.total_clients;
      acc.cogs += mc.cogs; acc.gross_profit += mc.gross_profit;
      acc.opex_actual += mc.opex_actual; acc.ebitda += mc.ebitda;
      return acc;
    }, {gross_revenue:0,total_clients:0,cogs:0,gross_profit:0,opex_actual:0,ebitda:0});
}

/* ══════════════════════════════════════════
   RENDER PRINCIPAL
══════════════════════════════════════════ */

let PNL_ACTIVE_MONTH = new Date().getMonth();

function renderPNLPage() {
  const data = pnlLoad();
  const ytd  = pnlComputeYTD(data);
  const mc   = pnlComputeMonth(PNL_ACTIVE_MONTH, data);
  const pageEl = document.getElementById('page-pnl');
  if (!pageEl) return;

  /* KPIs */
  document.getElementById('pnl-kpis').innerHTML = [
    { label:'Revenue YTD',    val:'£'+Math.round(ytd.gross_revenue).toLocaleString(), sub:'Ingresos brutos',           color:'var(--green)' },
    { label:'Clientes YTD',   val:ytd.total_clients.toString(),                        sub:'Coaching (excl. scanner)', color:'var(--blue)'  },
    { label:'Gross Margin',   val:ytd.gross_revenue>0 ? ((ytd.gross_profit/ytd.gross_revenue)*100).toFixed(0)+'%':'—', sub:'Margen bruto', color:'var(--teal)' },
    { label:'EBITDA YTD',     val:'£'+Math.round(ytd.ebitda).toLocaleString(),         sub:ytd.ebitda>=0?'Beneficio':'Pérdida', color:ytd.ebitda>=0?'var(--green)':'var(--red)' },
    { label:'OpEx YTD',       val:'£'+Math.round(ytd.opex_actual).toLocaleString(),    sub:'Gasto total',               color:'var(--amber)' },
    { label:'CAC mes actual', val:mc.cac?'£'+mc.cac:'—',                               sub:'Sólo coaching',             color:'var(--purple)' },
    { label:'LTV/CAC',        val:mc.ltv_cac_ratio?mc.ltv_cac_ratio+'x':'—',          sub:'Objetivo >3x',              color:parseFloat(mc.ltv_cac_ratio)>=3?'var(--green)':parseFloat(mc.ltv_cac_ratio)>=1?'var(--amber)':'var(--red)' },
  ].map(k=>`<div class="kpi"><div class="kl">${k.label}</div><div class="kv" style="color:${k.color}">${k.val}</div><div class="ks">${k.sub}</div></div>`).join('');

  /* Mes tabs + actualizar títulos de tarjetas */
  const activeMonthName = PNL_MONTHS[PNL_ACTIVE_MONTH];
  document.getElementById('pnl-month-tabs').innerHTML = PNL_MONTHS.map((m,i)=>
    `<div class="dp ${i===PNL_ACTIVE_MONTH?'active':''}" onclick="pnlSelectMonth(${i})">${m}</div>`).join('');
  const rt = document.getElementById('pnl-revenue-title');
  if (rt) rt.textContent = `Revenue — ${activeMonthName} ${new Date().getFullYear()}`;
  const wt = document.getElementById('pnl-waterfall-title');
  if (wt) wt.textContent = `P&L — ${activeMonthName}`;

  /* Revenue table */
  const rev = data.revenueByMonth[PNL_ACTIVE_MONTH] || {};

  function svcRow(k) {
    const svc   = PNL_SERVICES[k];
    const units = rev[k] || 0;
    const price = pnlPrice(k, data);
    const hasOvr = data.prices && data.prices[k] != null;
    const fmtP  = price % 1 === 0 ? price : price.toFixed(2);
    return `<tr>
      <td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${svc.color};margin-right:6px"></span>${svc.label}</td>
      <td>
        <span id="pnl-price-${k}" style="display:inline-flex;align-items:center;gap:4px">
          <span style="color:${hasOvr?'var(--amber)':'var(--mt)'}">£${fmtP}</span>
          <button onclick="pnlTogglePriceEdit('${k}',${price})" style="padding:1px 5px;border:1px solid var(--bd2);border-radius:4px;font-size:10px;cursor:pointer;background:var(--sf2);color:var(--ht);font-family:inherit" title="Editar precio">✏️</button>
          ${hasOvr?`<button onclick="pnlResetPrice('${k}')" style="padding:1px 5px;border:1px solid #FECACA;border-radius:4px;font-size:10px;cursor:pointer;background:none;color:var(--red);font-family:inherit" title="Restaurar precio original">↺</button>`:''}
        </span>
      </td>
      <td>
        <div style="display:flex;align-items:center;gap:6px">
          <button onclick="pnlUpdateUnits('${k}',${units-1})" style="width:22px;height:22px;border:1px solid var(--bd2);border-radius:5px;background:var(--sf2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--mt)">−</button>
          <input type="number" min="0" value="${units}" onchange="pnlUpdateUnits('${k}',+this.value)" style="width:50px;text-align:center;padding:4px;border:1px solid var(--bd2);border-radius:var(--r);background:var(--sf2);color:var(--tx);font-size:13px;font-family:inherit"/>
          <button onclick="pnlUpdateUnits('${k}',${units+1})" style="width:22px;height:22px;border:1px solid var(--bd2);border-radius:5px;background:var(--sf2);cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center;color:var(--mt)">+</button>
        </div>
      </td>
      <td><strong style="color:${svc.color}">£${(units*price).toLocaleString(undefined,{maximumFractionDigits:2})}</strong></td>
    </tr>`;
  }

  document.getElementById('pnl-revenue-table').innerHTML = `
    <table class="dt" style="width:100%">
      <thead><tr><th>Servicio</th><th>Precio unit.</th><th>Unidades</th><th>Revenue</th></tr></thead>
      <tbody>
        <tr style="background:var(--sf2)"><td colspan="4" style="padding:5px 10px;font-size:10px;font-weight:700;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Coaching</td></tr>
        ${PNL_COACHING_KEYS.map(svcRow).join('')}
        <tr style="background:var(--sf2)"><td colspan="4" style="padding:5px 10px;font-size:10px;font-weight:700;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Scanner de CV</td></tr>
        ${PNL_SCANNER_KEYS.map(svcRow).join('')}
        <tr style="border-top:2px solid var(--bd)">
          <td colspan="2"><strong>Total</strong></td>
          <td style="font-size:12px"><strong>${mc.total_clients} clientes coaching${mc.scanner_packs>0?' · '+mc.scanner_packs+' packs scanner':''}</strong></td>
          <td><strong style="color:var(--green);font-size:16px">£${mc.gross_revenue.toLocaleString(undefined,{maximumFractionDigits:2})}</strong></td>
        </tr>
      </tbody>
    </table>`;

  /* Waterfall */
  const cogsLabel = mc.cogs_manual_amt > 0
    ? `COGS (${data.cogs_pct}% + £${mc.cogs_manual_amt.toLocaleString()} fijos)`
    : `COGS (${data.cogs_pct}%)`;
  const wfRows = [
    {label:'Revenue bruto',            val:mc.gross_revenue, type:'revenue'},
    {label:cogsLabel,                  val:-mc.cogs,         type:'cost'},
    {label:'Gross Profit',             val:mc.gross_profit,  type:'subtotal', pct:mc.gross_margin.toFixed(0)+'%'},
    {label:'OpEx (marketing + tools)', val:-mc.opex_actual,  type:'cost'},
    {label:'EBITDA',                   val:mc.ebitda,        type:'final',    pct:mc.net_margin.toFixed(0)+'%'},
  ];
  const maxAbs = Math.max(...wfRows.map(r=>Math.abs(r.val)),1);
  document.getElementById('pnl-waterfall').innerHTML = wfRows.map(r=>{
    const bw=Math.round((Math.abs(r.val)/maxAbs)*100);
    const col=r.type==='revenue'?'var(--green)':r.type==='cost'?'var(--red)':r.type==='subtotal'?'var(--teal)':r.val>=0?'var(--green)':'var(--red)';
    const lbl=r.val>=0?'+£'+Math.abs(r.val).toLocaleString():'−£'+Math.abs(r.val).toLocaleString();
    return `<div style="display:grid;grid-template-columns:190px 1fr 120px;gap:10px;align-items:center;padding:7px 0;border-bottom:1px solid var(--bd)">
      <div style="font-size:12px;${r.type==='subtotal'||r.type==='final'?'font-weight:600;color:var(--tx)':'color:var(--mt)'}">${r.label}</div>
      <div style="background:var(--sf2);border-radius:3px;height:8px;overflow:hidden"><div style="width:${bw}%;height:100%;background:${col};border-radius:3px;transition:width .4s"></div></div>
      <div style="text-align:right;font-size:13px;font-weight:${r.type==='final'?'700':'500'};color:${col}">${lbl}${r.pct?`<span style="font-size:10px;color:var(--ht);margin-left:5px">${r.pct}</span>`:''}</div>
    </div>`;
  }).join('');

  /* COGS slider */
  document.getElementById('pnl-cogs-val').textContent = data.cogs_pct + '%';
  const sl = document.getElementById('pnl-cogs-slider');
  if (sl) sl.value = data.cogs_pct;

  /* COGS manuales */
  const cm = data.cogs_manual || [];
  document.getElementById('pnl-cogs-manual').innerHTML =
    cm.map(c=>`
      <div style="display:flex;gap:6px;align-items:center;padding:5px 0;border-bottom:1px solid var(--bd)">
        <input value="${c.name}" placeholder="Descripción (ej: Anthropic API, Stripe fees...)"
          style="flex:1;padding:4px 8px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf2);color:var(--tx);font-family:inherit"
          oninput="pnlUpdateCOGSItem('${c.id}','name',this.value)"/>
        <input type="number" value="${c.amount||''}" placeholder="£/mes" min="0"
          style="width:80px;padding:4px 8px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf2);color:var(--tx);font-family:inherit;text-align:right"
          onchange="pnlUpdateCOGSItem('${c.id}','amount',this.value)"/>
        <button onclick="pnlRemoveCOGSItem('${c.id}')" style="padding:3px 8px;background:none;border:1px solid #FECACA;border-radius:var(--r);color:var(--red);cursor:pointer;font-size:13px">×</button>
      </div>`).join('') +
    `<button onclick="pnlAddCOGSItem()" style="width:100%;padding:6px;margin-top:6px;border:1.5px dashed var(--bd2);border-radius:var(--r);background:none;color:var(--mt);cursor:pointer;font-size:12px;font-family:inherit">+ Añadir COGS fijo</button>` +
    (cm.length>0?`<div style="margin-top:8px;font-size:11px;color:var(--ht)">Total COGS fijos: <strong style="color:var(--tx)">£${mc.cogs_manual_amt.toLocaleString()}</strong>/mes</div>`:'');

  /* Unit Economics */
  document.getElementById('pnl-unit-economics').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:10px">
      ${[
        {label:'Clientes coaching', val:mc.total_clients||'0',  icon:'👥', good:true},
        {label:'Packs scanner',     val:mc.scanner_packs||'0',  icon:'📄', good:true},
        {label:'Revenue/cliente',   val:mc.total_clients>0?'£'+Math.round(mc.coaching_revenue/mc.total_clients):'—', icon:'💰', good:true},
        {label:'CAC',               val:mc.cac?'£'+mc.cac:'—',  icon:'🎯', good:mc.cac&&mc.cac<150},
        {label:'LTV estimado',      val:'£'+mc.ltv,             icon:'♻️', good:true},
        {label:'LTV/CAC ratio',     val:mc.ltv_cac_ratio?mc.ltv_cac_ratio+'x':'—', icon:'📊', good:parseFloat(mc.ltv_cac_ratio)>=3},
      ].map(e=>`<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:12px 14px">
        <div style="font-size:11px;color:var(--mt);margin-bottom:5px">${e.icon} ${e.label}</div>
        <div style="font-size:20px;font-weight:600;color:${e.good!==undefined?(e.good?'var(--green)':'var(--amber)'):'var(--tx)'}">${e.val}</div>
      </div>`).join('')}
    </div>`;

  pnlRenderMonthlyChart(data);
  window._PNL_CONTEXT = { ytd, mc, data, activeMonth: PNL_MONTHS[PNL_ACTIVE_MONTH] };
}

/* ── Helpers de navegación y edición ── */
function pnlSelectMonth(m) { PNL_ACTIVE_MONTH = m; renderPNLPage(); }

function pnlUpdateUnits(service, units) {
  const data = pnlLoad();
  if (!data.revenueByMonth[PNL_ACTIVE_MONTH]) data.revenueByMonth[PNL_ACTIVE_MONTH] = {};
  data.revenueByMonth[PNL_ACTIVE_MONTH][service] = Math.max(0, units);
  pnlSave(data);
  renderPNLPage();
  const mc = pnlComputeMonth(PNL_ACTIVE_MONTH, data);
  if (mc.total_clients > 0 && typeof memUpdateProfile === 'function') {
    memUpdateProfile({ currentMRR: mc.gross_revenue, avgTicket: Math.round(mc.coaching_revenue/mc.total_clients) });
  }
}

function pnlUpdateCOGS(pct) {
  const data = pnlLoad(); data.cogs_pct = parseInt(pct)||0; pnlSave(data); renderPNLPage();
}

/* ── Editar precios ── */
function pnlTogglePriceEdit(key, currentPrice) {
  const span = document.getElementById('pnl-price-'+key);
  if (!span) return;
  if (span.querySelector('input')) { renderPNLPage(); return; }
  const fmt = currentPrice % 1 === 0 ? currentPrice : currentPrice.toFixed(2);
  span.innerHTML = `<input type="number" value="${fmt}" min="0" step="0.01"
    style="width:80px;padding:2px 6px;border:1.5px solid var(--green);border-radius:4px;font-size:12px;font-family:inherit;color:var(--tx);background:var(--sf2)"
    onkeydown="if(event.key==='Enter'){event.preventDefault();pnlSavePrice('${key}',+this.value);}if(event.key==='Escape')renderPNLPage()"/>
    <button onclick="pnlSavePrice('${key}',+this.previousElementSibling.value)"
      style="padding:2px 7px;background:var(--green);color:white;border:none;border-radius:4px;font-size:11px;cursor:pointer">✓</button>`;
  setTimeout(()=>{const i=span.querySelector('input');if(i){i.focus();i.select();}},0);
}

function pnlSavePrice(key, price) {
  if (isNaN(price)||price<0) return;
  const data = pnlLoad();
  if (!data.prices) data.prices = {};
  if (price === PNL_SERVICES[key]?.price) delete data.prices[key];
  else data.prices[key] = price;
  pnlSave(data); renderPNLPage();
}

function pnlResetPrice(key) {
  const data = pnlLoad();
  if (data.prices) delete data.prices[key];
  pnlSave(data); renderPNLPage();
}

/* ── COGS manuales ── */
function pnlAddCOGSItem() {
  const data = pnlLoad();
  if (!data.cogs_manual) data.cogs_manual = [];
  data.cogs_manual.push({id:'cogs_'+Date.now(), name:'', amount:0});
  pnlSave(data); renderPNLPage();
  setTimeout(()=>{
    const inputs=document.querySelectorAll('#pnl-cogs-manual input[placeholder]');
    if(inputs.length>=2)inputs[inputs.length-2].focus();
  },50);
}

function pnlUpdateCOGSItem(id, field, value) {
  const data = pnlLoad();
  const item = (data.cogs_manual||[]).find(c=>c.id===id);
  if (!item) return;
  item[field] = field==='amount' ? (parseFloat(value)||0) : value;
  pnlSave(data);
  if (field==='amount') renderPNLPage();
}

function pnlRemoveCOGSItem(id) {
  const data = pnlLoad();
  data.cogs_manual = (data.cogs_manual||[]).filter(c=>c.id!==id);
  pnlSave(data); renderPNLPage();
}

/* ── Chart mensual ── */
function pnlRenderMonthlyChart(data) {
  const canvas = document.getElementById('pnl-chart');
  if (!canvas || typeof Chart==='undefined') return;
  if (window._PNL_CH) { try{window._PNL_CH.destroy();}catch(_){} }
  const revenues = PNL_MONTHS.map((_,m)=>pnlComputeMonth(m,data).gross_revenue);
  const ebitdas  = PNL_MONTHS.map((_,m)=>pnlComputeMonth(m,data).ebitda);
  const opexes   = PNL_MONTHS.map((_,m)=>pnlComputeMonth(m,data).opex_actual);
  window._PNL_CH = new Chart(canvas, {
    type:'bar',
    data:{labels:PNL_MONTHS, datasets:[
      {label:'Revenue',   data:revenues,          backgroundColor:'rgba(29,158,117,.65)', borderRadius:4},
      {label:'OpEx',      data:opexes.map(v=>-v), backgroundColor:'rgba(220,38,38,.45)',  borderRadius:4},
      {type:'line',label:'EBITDA',data:ebitdas,borderColor:'#7C3AED',backgroundColor:'transparent',tension:.4,borderWidth:2,pointRadius:3},
    ]},
    options:{responsive:true,maintainAspectRatio:false,animation:{duration:400},
      plugins:{legend:{display:true,labels:{font:{size:11},color:'#888'}},
               tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: £${Math.abs(ctx.raw).toLocaleString()}`}}},
      scales:{x:{ticks:{color:'#A8A8AC',font:{size:10}},grid:{display:false}},
              y:{ticks:{color:'#A8A8AC',font:{size:10},callback:v=>'£'+Math.abs(v/1000).toFixed(0)+'k'},grid:{color:'rgba(0,0,0,.04)'}}}}
  });
}

/* ── AI Commentary ── */
async function pnlAIAnalysis() {
  if (!CFG.ak) { alert('Añade tu Anthropic API key en Settings'); return; }
  const btn = document.getElementById('pnl-ai-btn');
  if (btn) { btn.disabled=true; btn.textContent='⟳ Analizando…'; }
  const ctx = window._PNL_CONTEXT; if (!ctx) return;
  const {ytd, mc} = ctx;
  const prompt = `Eres un CFO-advisor de Próximo Rol (coaching de entrevistas + Scanner de CV IA, España/LATAM).
P&L actual:
- Revenue YTD: £${Math.round(ytd.gross_revenue).toLocaleString()} | ${ytd.total_clients} clientes coaching
- OpEx YTD: £${Math.round(ytd.opex_actual).toLocaleString()}
- EBITDA YTD: £${Math.round(ytd.ebitda).toLocaleString()} (${ytd.gross_revenue>0?((ytd.ebitda/ytd.gross_revenue)*100).toFixed(0):'?'}% margen)
- CAC este mes: ${mc.cac?'£'+mc.cac:'no calculable'} | LTV/CAC: ${mc.ltv_cac_ratio||'N/A'}
Etapa: lanzamiento temprano.
Análisis en 3 párrafos (max 180 palabras): 1) Situación actual 2) Métrica más preocupante 3) Palanca de mayor impacto en 60 días. Directo, español, sin introducción.`;
  try {
    const d = await antFetch({model:'claude-sonnet-4-20250514',max_tokens:400,messages:[{role:'user',content:prompt}]});
    const text = (d.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
    const box = document.getElementById('pnl-ai-box');
    if (box) { box.style.display='block'; box.innerHTML=`<div style="display:flex;align-items:center;gap:7px;margin-bottom:8px"><span style="color:var(--purple);font-size:13px">✦</span><span style="font-size:11px;font-weight:600;color:var(--purple);text-transform:uppercase;letter-spacing:.05em">Análisis CFO — IA</span></div><div style="font-size:12px;color:var(--tx);line-height:1.7">${text.replace(/\n/g,'<br>')}</div>`; }
  } catch(err) {
    const box=document.getElementById('pnl-ai-box');
    if(box){box.style.display='block';box.textContent='Error: '+err.message;}
  } finally {
    if(btn){btn.disabled=false;btn.textContent='✦ Análisis IA';}
  }
}

/* ══════════════════════════════════════════
   IIFE — Inyecta página (usa div estático si existe)
══════════════════════════════════════════ */
(function pnlInit() {
  function injectPNLPage() {
    /* 1. Nav — solo si no está ya en el HTML */
    const nav = document.querySelector('.sb-nav');
    const hasNav = nav && Array.from(nav.querySelectorAll('.ni'))
      .some(el => el.getAttribute('onclick')?.includes("'pnl'"));
    if (!hasNav && nav) {
      const planningSection = Array.from(nav.querySelectorAll('.ns'))
        .find(el => el.textContent.includes('Planning'));
      if (planningSection) {
        const pnlNav = document.createElement('div');
        pnlNav.className = 'ni';
        pnlNav.setAttribute('onclick', "showP('pnl',this)");
        pnlNav.innerHTML = `<div class="nico">💹</div>P&L · Revenue<span class="nb nb-live">P&L</span>`;
        planningSection.insertAdjacentElement('afterend', pnlNav);
      }
    }

    /* 2. Página — rellenar existente o crear */
    const main = document.querySelector('.main'); if (!main) return;
    let page = document.getElementById('page-pnl');
    if (!page) {
      page = document.createElement('div'); page.className='page'; page.id='page-pnl';
      const last = main.querySelector('.page:last-of-type');
      if (last) last.insertAdjacentElement('afterend', page);
      else main.appendChild(page);
    }

    page.innerHTML = `
      <div class="sh">
        <span class="sl">P&amp;L — Profit &amp; Loss</span>
        <div class="sln"></div>
        <button id="pnl-ai-btn" onclick="pnlAIAnalysis()" style="padding:5px 14px;background:var(--pp);color:var(--purple);border:1px solid #DDD6FE;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit">✦ Análisis IA</button>
      </div>
      <div id="pnl-ai-box" style="display:none;background:var(--pp);border:1px solid #DDD6FE;border-radius:var(--r);padding:14px 16px;margin-bottom:14px"></div>
      <div class="kr" id="pnl-kpis" style="margin-bottom:16px"></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap">
        <span style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em">Mes:</span>
        <div class="dps" id="pnl-month-tabs"></div>
        <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
          <label style="font-size:11px;color:var(--ht)">COGS %</label>
          <input id="pnl-cogs-slider" type="range" min="0" max="40" value="5"
            oninput="document.getElementById('pnl-cogs-val').textContent=this.value+'%';pnlUpdateCOGS(this.value)" style="width:80px"/>
          <span id="pnl-cogs-val" style="font-size:12px;font-weight:600;color:var(--tx);min-width:28px">5%</span>
        </div>
      </div>
      <div class="g2" style="margin-bottom:14px">
        <div class="cd">
          <div class="ch"><span class="ct" id="pnl-revenue-title">Revenue — ventas del mes</span><span class="bg bg-g">Manual · editable</span></div>
          <div id="pnl-revenue-table" style="overflow-x:auto"></div>
        </div>
        <div class="cd">
          <div class="ch"><span class="ct" id="pnl-waterfall-title">P&amp;L del mes</span><span class="bg bg-g">Cascada</span></div>
          <div id="pnl-waterfall" style="padding:4px 0"></div>
        </div>
      </div>
      <div class="cd" style="margin-bottom:14px">
        <div class="ch"><span class="ct">COGS — Costes directos fijos</span><span class="bg" style="background:var(--sf2);color:var(--ht)">Mensual · por línea</span></div>
        <div style="font-size:11px;color:var(--mt);margin-bottom:8px">Costes directos no porcentuales: API de IA del scanner, Stripe, costes de entrega. Se suman al COGS% del slider.</div>
        <div id="pnl-cogs-manual"></div>
      </div>
      <div class="cd" style="margin-bottom:14px">
        <div class="ch"><span class="ct">Unit Economics</span><span class="bg bg-p">CAC · LTV · Payback</span></div>
        <div id="pnl-unit-economics"></div>
      </div>
      <div class="cd">
        <div class="ch"><span class="ct">Revenue vs OpEx vs EBITDA — 2026</span><span class="bg bg-g">Todos los meses</span></div>
        <div style="position:relative;height:240px"><canvas id="pnl-chart"></canvas></div>
      </div>`;

    if (typeof TITLES !== 'undefined') TITLES['pnl'] = 'P&L — Profit & Loss';
    const origShowP = window.showP;
    window.showP = function(id, el) {
      origShowP.apply(this, arguments);
      if (id==='pnl') requestAnimationFrame(()=>requestAnimationFrame(()=>renderPNLPage()));
    };
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', injectPNLPage);
  else setTimeout(injectPNLPage, 200);
})();
