/* ═══════════════════════════════════════════════
   CORE — Auth, globals, init, nav, utils, API
   v4.0 — Module Registry
   ═══════════════════════════════════════════════ */

// ── PASSWORD GATE ──
// Password is never stored in plain text — only its SHA-256 hash lives here.
// To change password: compute sha256 of new password and replace PW_HASH.
const PW_HASH = 'bb883758bd3589bd2fcbe86de4f34db5543bc85e7ede7b740ad9a7a91aed57f0';
const PW_KEY  = 'pr_dash_v2';
if(localStorage.getItem(PW_KEY) === PW_HASH){
  const el = document.getElementById('pw-gate');
  if(el) el.style.display = 'none';
}

async function hashStr(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function checkPw(){
  const val = document.getElementById('pw-input').value;
  const hash = await hashStr(val);
  if(hash === PW_HASH){
    localStorage.setItem(PW_KEY, PW_HASH);
    document.getElementById('pw-gate').style.display='none';
  } else {
    const err = document.getElementById('pw-err');
    err.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
    document.getElementById('pw-input').value='';
    document.getElementById('pw-input').focus();
    setTimeout(()=>err.textContent='', 3000);
  }
}


// ── GLOBALS ─────────────────────────────────────────────────
const CK='eco_v3';
const COLORS=['#1D9E75','#2563EB','#D97706','#DC2626','#7C3AED','#0891B2','#059669','#BE185D'];
const TC='#A8A8AC',GC='rgba(0,0,0,0.05)';
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
let CFG={},TOKEN=null;
const CH={};

// Estado de módulos habilitados (se carga desde /api/user-modules en Fase 2)
// Por ahora: todos habilitados (compatibilidad con auth actual)
let ENABLED_MODULES = null;


// ── MODULE REGISTRY ──────────────────────────────────────────
// Fuente de verdad de todos los módulos del dashboard.
// Agregar un módulo nuevo = agregar 1 objeto aquí.
//
// Propiedades:
//   title     — texto en el header y sidebar
//   icon      — emoji del sidebar
//   group     — sección del sidebar ('analytics','content','growth','finance','ai','admin')
//   render    — nombre de la función global que renderiza el módulo
//   protected — true = requiere habilitación explícita (Fase 2)
//   navOrder  — orden dentro del grupo (menor = primero)

const MODULE_REGISTRY = {
  // ── General ────────────────────────────────────────────
  guide: {
    title:    'Guía del dashboard',
    icon:     '🗺️',
    group:    'general',
    render:   'renderGuidePage',
    protected: false,
    navOrder: 0
  },

  // ── Analytics ──────────────────────────────────────────
  ov: {
    title:    'Overview',
    icon:     '📊',
    group:    'analytics',
    render:   'renderOverview',
    protected: false,
    navOrder: 0
  },
  ga4: {
    title:    'Google Analytics 4',
    icon:     '📈',
    group:    'analytics',
    render:   'loadGA4Intelligence',
    protected: false,
    navOrder: 1
  },
  gsc: {
    title:    'Search Console',
    icon:     '🔎',
    group:    'analytics',
    render:   'loadGSC',
    protected: false,
    navOrder: 2
  },
  kwi: {
    title:    'Keyword Intelligence',
    icon:     '🔑',
    group:    'analytics',
    render:   'renderKWIPage',
    protected: false,
    navOrder: 3
  },
  seo: {
    title:    'SEO Intelligence',
    icon:     '🌐',
    group:    'analytics',
    render:   'renderSEOPage',
    protected: false,
    navOrder: 4
  },
  report: {
    title:    'Monthly Report',
    icon:     '📋',
    group:    'analytics',
    render:   'renderReport',
    protected: false,
    navOrder: 5
  },

  // ── Canales ────────────────────────────────────────────
  li: {
    title:    'LinkedIn',
    icon:     '💼',
    group:    'channels',
    render:   'loadLinkedIn',
    protected: false,
    navOrder: 0
  },
  ig: {
    title:    'Instagram / Facebook',
    icon:     '📸',
    group:    'channels',
    render:   'loadInstagram',
    protected: false,
    navOrder: 1
  },
  inst: {
    title:    'Mailing masivo',
    icon:     '📧',
    group:    'channels',
    render:   'loadInstantly',
    protected: false,
    navOrder: 2
  },
  paid: {
    title:    'Paid Media',
    icon:     '💰',
    group:    'channels',
    render:   'renderPaidMediaPage',
    protected: false,
    navOrder: 3
  },

  // ── Content ────────────────────────────────────────────
  content: {
    title:    'Content Studio',
    icon:     '✍️',
    group:    'content',
    render:   'csInitChips',
    protected: true,
    navOrder: 0
  },
  audit: {
    title:    'Content Audit',
    icon:     '🔍',
    group:    'content',
    render:   'renderAuditPage',
    protected: true,
    navOrder: 1
  },
  vs: {
    title:    'Visual Studio',
    icon:     '🎨',
    group:    'content',
    render:   'loadVisualStudio',
    protected: true,
    navOrder: 2
  },

  // ── Growth ─────────────────────────────────────────────
  opps: {
    title:    'Opportunities Pipeline',
    icon:     '🎯',
    group:    'growth',
    render:   'renderOppCharts',
    protected: false,
    navOrder: 0
  },
  prosp: {
    title:    'Prospecting — Alianzas',
    icon:     '🤝',
    group:    'growth',
    render:   'renderProspectingPage',
    protected: true,
    navOrder: 1
  },

  // ── Finance ────────────────────────────────────────────
  budget: {
    title:    'Budget & Costs',
    icon:     '💶',
    group:    'finance',
    render:   'renderBudgetPage',
    protected: false,
    navOrder: 0
  },

  // ── CRM ────────────────────────────────────────────────
  mon: {
    title:    'CRM',
    icon:     '📌',
    group:    'crm',
    render:   'loadMonday',
    protected: false,
    navOrder: 0
  },

  // ── AI ─────────────────────────────────────────────────
  copilot: {
    title:    'Co-Pilot',
    icon:     '🤖',
    group:    'ai',
    render:   'compRender',
    protected: true,
    navOrder: 0
  },

  // ── Herramientas ───────────────────────────────────────
  exp: {
    title:    'Experimentos',
    icon:     '🧪',
    group:    'tools',
    render:   'expRenderPage',
    protected: false,
    navOrder: 0
  },
  settings: {
    title:    'Settings',
    icon:     '⚙️',
    group:    'tools',
    render:   'buildSettings',
    protected: false,
    navOrder: 1
  },

  // ── Admin (visible solo si role = 'admin') ─────────────
  admin: {
    title:    'Panel Admin',
    icon:     '🛡️',
    group:    'admin',
    render:   'renderAdminPage',
    protected: true,
    adminOnly: true,
    navOrder: 0
  }
};

// TITLES — generado automáticamente desde el registry (retrocompatibilidad)
const TITLES = Object.fromEntries(
  Object.entries(MODULE_REGISTRY).map(([id, mod]) => [id, mod.title])
);

// Etiquetas de grupos para el sidebar
const GROUP_LABELS = {
  general:   '',           // sin label (solo la guía)
  analytics: 'Analytics',
  channels:  'Canales',
  content:   'Contenido',
  growth:    'Growth',
  finance:   'Finanzas',
  crm:       'CRM',
  ai:        'IA',
  tools:     'Herramientas',
  admin:     'Admin'
};


// ── ANTHROPIC API HELPER (se mantiene para Fase 1-2) ────────
// ⚠️  DEPRECADO: en Fase 3 todos los módulos migran a /api/claude-proxy
//     Este helper se elimina al final de Fase 3.
async function antFetch(body){
  if(!CFG.ak){
    throw new Error('API Key de Anthropic no configurada.\n→ Ve a ⚙️ Settings → "Anthropic API Key" y pega tu clave sk-ant-...\nPuedes crear una en: console.anthropic.com/settings/keys');
  }
  const resp = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key': CFG.ak,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body: JSON.stringify(body)
  });
  if(!resp.ok){
    let detail = '';
    try { const e=await resp.json(); detail = e?.error?.message||JSON.stringify(e); } catch(_){}
    const hints = {
      401:'API Key inválida o expirada. Verifica tu clave en Settings.',
      403:'Acceso denegado. Verifica que la clave tenga permisos de escritura.',
      429:'Límite de peticiones alcanzado. Espera unos segundos e inténtalo de nuevo.',
      500:'Error interno de Anthropic. Inténtalo de nuevo en unos minutos.',
      529:'Anthropic está sobrecargado. Inténtalo en unos minutos.',
    };
    throw new Error(`HTTP ${resp.status} — ${hints[resp.status]||'Error desconocido'}\nDetalle: ${detail}`);
  }
  return resp.json();
}

// ── BACKEND FETCH HELPER (para Fase 3+) ─────────────────────
// Helper para llamar al backend con JWT automático.
// Uso: await apiFetch('/api/claude-proxy', { method:'POST', body: {...} })
const API_BASE = 'https://pulso-api-seven.vercel.app';

async function apiFetch(path, options = {}) {
  // En Fase 2, SUPABASE_JWT se obtiene de Supabase Auth
  // Por ahora, placeholder para cuando esté implementado
  const jwt = window.__SUPABASE_JWT__ || null;

  const headers = {
    'Content-Type': 'application/json',
    ...(jwt && { 'Authorization': `Bearer ${jwt}` }),
    ...(options.headers || {})
  };

  const resp = await fetch(API_BASE + path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  if (!resp.ok) {
    let detail = '';
    try { const e = await resp.json(); detail = e?.error || JSON.stringify(e); } catch(_) {}
    throw new Error(`HTTP ${resp.status} — ${detail}`);
  }

  return resp.json();
}


// ── NAV — buildSidebar ───────────────────────────────────────
// Genera la sidebar dinámicamente desde el registry.
// enabledModules: array de module keys habilitados ['content','audit',...]
// userRole: 'admin' | 'client'
function buildSidebar(enabledModules, userRole) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  // Por compatibilidad: si no se pasan args, mostrar todos los no-protected
  const enabled = enabledModules || Object.keys(MODULE_REGISTRY);
  const role    = userRole || 'client';

  const groups = {};

  Object.entries(MODULE_REGISTRY).forEach(([id, mod]) => {
    // Filtro admin
    if (mod.adminOnly && role !== 'admin') return;

    // Si el módulo NO es protected → mostrarlo siempre
    // Si el módulo ES protected → solo mostrarlo si está en la lista de enabled
    if (mod.protected) {
      if (!enabled || !enabled.includes(id)) return;
    }

    if (!groups[mod.group]) groups[mod.group] = [];
    groups[mod.group].push({ id, ...mod });
  });

  // Ordenar módulos dentro de cada grupo
  Object.values(groups).forEach(arr =>
    arr.sort((a, b) => (a.navOrder || 0) - (b.navOrder || 0))
  );

  // Renderizar — mismo orden que GROUP_LABELS
  let html = '';
  Object.entries(GROUP_LABELS).forEach(([group, label]) => {
    if (!groups[group] || groups[group].length === 0) return;

    if (label) {
      html += `<div class="nav-group-label">${label}</div>`;
    }

    groups[group].forEach(m => {
      html += `<div class="ni" onclick="showP('${m.id}',this)">${m.icon} ${m.title}</div>`;
    });
  });

  nav.innerHTML = html;
}


// ── NAV — showP ──────────────────────────────────────────────
// Navegación genérica — dispatch desde MODULE_REGISTRY.
// Reemplaza el if/else chain original.
function showP(id, el) {
  // 1. Ocultar todas las páginas y nav items
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));

  // 2. Mostrar página target
  const page = document.getElementById('page-' + id);
  if (page) page.classList.add('active');
  if (el)   el.classList.add('active');

  // 3. Actualizar título del header
  const mod = MODULE_REGISTRY[id];
  document.getElementById('top-t').textContent = mod?.title || TITLES[id] || id;

  // 4. Ocultar date picker
  hideDatePicker();

  // 5. Marcar módulos que tienen badge 'live'
  if (id === 'report')  setNB('rep', 'live');
  if (id === 'content') setNB('content', 'live');

  // 6. Renderizar el módulo via MODULE_REGISTRY
  if (!mod) return;

  const renderFn = mod.render;
  if (!renderFn) return;

  // Double rAF para garantizar que el browser pintó antes de renderizar charts
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (typeof window[renderFn] === 'function') {
        window[renderFn]();
      }

      // Acciones extra por módulo que necesitan lógica adicional
      if (id === 'exp'  && typeof expUpdateBadge  === 'function') expUpdateBadge();
      if (id === 'opps' && _OPP_DATA && _OPP_DATA.length === 0)  return; // no renderizar si no hay datos

      // Resize charts después de render
      setTimeout(() => Object.values(CH).forEach(c => { try { c.resize(); } catch(e) {} }), 100);
    });
  });
}


// ── INIT ─────────────────────────────────────────────────────
function init(){
  const s=localStorage.getItem(CK);
  if(s)CFG=JSON.parse(s);
  const m={clientId:'i-cid',ga4:'i-ga4',gsc:'i-gsc',ads:'i-ads',adsToken:'i-adstoken',liId:'i-liid',liOrg:'i-liorg',instantly:'i-inst',monday:'i-mon',hunter:'i-hunter',metaToken:'i-metatoken',metaIgId:'i-metaigid',metaPageId:'i-metapageid',metaAdAccountId:'i-metaadaccountid'};
  Object.entries(m).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&CFG[k])el.value=CFG[k];});
  if(location.search.includes('code=')&&location.search.includes('state=')){
    const s2=localStorage.getItem(CK);if(s2)CFG=JSON.parse(s2);
    if(CFG.clientId&&CFG.ga4){showScreen('app');buildSettings();}
    liHandleOAuthCallback();
  }
  updOB();
  // Solo abrir el panel de Google si el onboarding está visible
  // (evita que se dispare cuando un cliente entra directo al app)
  if(!CFG.clientId||!CFG.ga4) {
    setTimeout(() => {
      const obEl = document.getElementById('ob');
      if (obEl && obEl.style.display !== 'none') tpf('g');
    }, 500);
  }
  setTimeout(compLoadSuggestions, 200);

  // Fase 2: iniciar Supabase Auth
  if(typeof authInit === 'function') authInit();
}


// ── ONBOARDING ───────────────────────────────────────────────
function tpf(id){document.getElementById('pb-'+id).classList.toggle('op');document.getElementById('cv-'+id).classList.toggle('op');}
function saveG(){
  const cid=document.getElementById('i-cid').value.trim();
  const ga4=document.getElementById('i-ga4').value.trim();
  if(!cid||!ga4){document.getElementById('ob-err').textContent='Client ID and GA4 Property ID are required.';document.getElementById('ob-err').style.display='block';return;}
  CFG.clientId=cid;CFG.ga4=ga4.startsWith('properties/')?ga4:'properties/'+ga4;
  CFG.gsc=document.getElementById('i-gsc').value.trim();CFG.ads=document.getElementById('i-ads').value.trim();
  sv();tpf('g');
}
function savePF(id){
  const m={li:['liId','i-liid','liOrg','i-liorg'],inst:['instantly','i-inst'],mon:['monday','i-mon'],hunter:['hunter','i-hunter']};
  const f=m[id];if(f.length===4){CFG[f[0]]=document.getElementById(f[1]).value.trim();CFG[f[2]]=document.getElementById(f[3]).value.trim();}
  else CFG[f[0]]=document.getElementById(f[1]).value.trim();
  sv();tpf(id);
}
function clearPF(id){const m={li:['liId','liOrg'],inst:['instantly'],mon:['monday']};(m[id]||[]).forEach(k=>CFG[k]='');sv();}
function saveMeta(){CFG.metaToken=document.getElementById('i-metatoken')?.value.trim()||'';CFG.metaIgId=document.getElementById('i-metaigid')?.value.trim()||'';CFG.metaPageId=document.getElementById('i-metapageid')?.value.trim()||'';sv();tpf('meta');}
function clearMeta(){CFG.metaToken='';CFG.metaIgId='';CFG.metaPageId='';sv();}
function sv(){localStorage.setItem(CK,JSON.stringify(CFG));updOB();}
function updOB(){
  const pfs=[{id:'g',ok:!!(CFG.clientId&&CFG.ga4),lbl:CFG.clientId?'Configured':'Not set'},{id:'li',ok:!!(CFG.liId&&CFG.liOrg),lbl:CFG.liId?'Configured':'Optional'},{id:'inst',ok:!!CFG.instantly,lbl:CFG.instantly?'Configured':'Optional'},{id:'mon',ok:!!CFG.monday,lbl:CFG.monday?'Configured':'Optional'},{id:'meta',ok:!!(CFG.metaToken&&CFG.metaIgId),lbl:(CFG.metaToken&&CFG.metaIgId)?'Configured':'Optional'}];
  let c=0;pfs.forEach(p=>{const pill=document.getElementById('pp-'+p.id);const card=document.getElementById('pc-'+p.id);if(pill){pill.textContent=p.lbl;pill.className='sp '+(p.ok?'sp-ok':'sp-sk');}if(card)card.classList.toggle('ok',p.ok);if(p.ok)c++;});
  document.getElementById('ob-cnt').textContent=c;const btn=document.getElementById('btn-l');const ok=c>0||(CFG.clientId&&CFG.ga4);btn.disabled=!ok;
}


// ── LAUNCH ───────────────────────────────────────────────────
function launch(){
  const sc='https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.profile';
  google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:sc,callback:async r=>{
    if(r.error){const e=document.getElementById('ob-err');e.textContent='OAuth error: '+r.error;e.style.display='block';return;}
    TOKEN=r.access_token;
    try{const u=await gF('https://www.googleapis.com/oauth2/v3/userinfo');const n=(u.name||'User').split(' ')[0];document.getElementById('sb-nm').textContent=n;document.getElementById('sb-av').textContent=n.charAt(0);}catch(e){}

    // Fase 2: usar módulos reales del usuario desde Supabase
    const modules = window.__USER_MODULES__ || null;
    const role    = window.__USER_ROLE__    || 'client';
    buildSidebar(modules, role);

    showScreen('app');
    buildSettings();
    loadAll();

    // Mostrar Guide como página de entrada
    setTimeout(()=>{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
      const guidePage = document.getElementById('page-guide');
      if(guidePage) guidePage.classList.add('active');
      const guideNav = document.querySelector('.ni[onclick*="\'guide\'"]');
      if(guideNav) guideNav.classList.add('active');
      document.getElementById('top-t').textContent = MODULE_REGISTRY.guide.title;
      if(typeof renderGuidePage === 'function') renderGuidePage();
    }, 300);
  }}).requestAccessToken();
}


// ── LAUNCH GOOGLE OAUTH (standalone — para Settings) ─────────
// Permite conectar Google desde dentro del app, sin pasar por onboarding.
// Lo llama settings.js cuando el cliente quiere activar GA4/GSC.
function launchGoogleOAuth() {
  if (!CFG.clientId) {
    alert('Primero guarda tu OAuth Client ID en Settings → Google');
    return;
  }
  const sc = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.profile';
  google.accounts.oauth2.initTokenClient({
    client_id: CFG.clientId,
    scope: sc,
    callback: async r => {
      if (r.error) { alert('Error OAuth: ' + r.error); return; }
      TOKEN = r.access_token;
      // Actualizar nombre en sidebar con el de Google
      try {
        const u = await gF('https://www.googleapis.com/oauth2/v3/userinfo');
        const n = (u.name || 'User').split(' ')[0];
        document.getElementById('sb-nm').textContent = n;
        document.getElementById('sb-av').textContent = n.charAt(0);
      } catch(e) {}
      // Recargar datos de analytics
      loadAll();
      // Toast de confirmación
      const t = document.createElement('div');
      t.className = 'toast';
      t.textContent = '✓ Google conectado — cargando datos';
      document.body.appendChild(t);
      setTimeout(() => t.remove(), 2500);
    }
  }).requestAccessToken();
}
function setNB(id,st){const el=document.getElementById('nb-'+id);if(!el)return;el.textContent=st==='live'?'Live':st==='pend'?'Soon':st==='man'?'Manual':st==='err'?'Error':'—';el.className='nb '+(st==='live'?'nb-live':st==='pend'?'nb-pend':st==='man'?'nb-pend':'nb-off');}
function nc(nm,id){const el=document.getElementById(id);if(el)el.innerHTML=`<div class="notice"><strong>${nm} not connected</strong>Add credentials in Settings.<button class="cbtn" onclick="showP('settings',null)">Open Settings →</button></div>`;}


// ── DATE RANGE ───────────────────────────────────────────────
function fD(d){return d.toISOString().split('T')[0];}
let DAYS = 28;
let DATE_FROM = null;
let DATE_TO   = null;

function sD(){
  if(DATE_FROM) return DATE_FROM;
  const d=new Date(); d.setDate(d.getDate()-DAYS); return fD(d);
}
function eD(){
  return DATE_TO || fD(new Date());
}

function setPreset(days, btnEl){
  DAYS=days; DATE_FROM=null; DATE_TO=null;
  document.querySelectorAll('.dp').forEach(b=>b.classList.remove('active'));
  if(btnEl) btnEl.classList.add('active');
  const cBtn=document.getElementById('dp-custom');
  if(cBtn) cBtn.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Custom';
  hideDatePicker();
  loadAll();
}

function toggleDatePicker(){
  const p=document.getElementById('date-picker-popup');
  if(!p) return;
  const isHidden = p.style.display==='none'||!p.style.display;
  p.style.display = isHidden ? 'block' : 'none';
  if(isHidden){
    document.getElementById('date-from').value = sD();
    document.getElementById('date-to').value   = eD();
  }
}
function hideDatePicker(){
  const p=document.getElementById('date-picker-popup');
  if(p) p.style.display='none';
}

function setQuickRange(type){
  const now=new Date(); const yr=now.getFullYear();
  let from, to=fD(now);
  if(type==='ytd') from=yr+'-01-01';
  else if(type==='q1'){from=yr+'-01-01';to=yr+'-03-31';}
  else if(type==='q2'){from=yr+'-04-01';to=yr+'-06-30';}
  else if(type==='last30'){const d=new Date();d.setDate(d.getDate()-30);from=fD(d);}
  else if(type==='last90'){const d=new Date();d.setDate(d.getDate()-90);from=fD(d);}
  const df=document.getElementById('date-from');
  const dt=document.getElementById('date-to');
  if(df) df.value=from;
  if(dt) dt.value=to;
}

function applyCustomRange(){
  const from=document.getElementById('date-from')?.value;
  const to=document.getElementById('date-to')?.value;
  if(!from||!to){alert('Please select both dates.');return;}
  DATE_FROM=from; DATE_TO=to;
  document.querySelectorAll('.dp').forEach(b=>b.classList.remove('active'));
  const cBtn=document.getElementById('dp-custom');
  if(cBtn){cBtn.classList.add('active');cBtn.textContent=from.slice(5)+' to '+to.slice(5);}
  hideDatePicker();
  loadAll();
}


// ── GOOGLE API HELPERS ───────────────────────────────────────
async function gF(url,body){
  const o={headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'}};
  if(body){o.method='POST';o.body=JSON.stringify(body);}
  const r=await fetch(url,o);
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error((e.error&&e.error.message)||r.statusText);}
  return r.json();
}
async function ga4R(dims,mets,extra){
  return gF(`https://analyticsdata.googleapis.com/v1beta/${CFG.ga4}:runReport`,{dateRanges:[{startDate:sD(),endDate:eD()}],dimensions:dims.map(n=>({name:n})),metrics:mets.map(n=>({name:n})),limit:30,...extra});
}
async function ga4Prv(mets){
  const s=new Date();s.setDate(s.getDate()-DAYS*2);const e=new Date();e.setDate(e.getDate()-DAYS);
  return gF(`https://analyticsdata.googleapis.com/v1beta/${CFG.ga4}:runReport`,{dateRanges:[{startDate:fD(s),endDate:fD(e)}],dimensions:[],metrics:mets.map(n=>({name:n})),limit:1});
}
async function gscQ(b){return gF(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(CFG.gsc)}/searchAnalytics/query`,b);}
async function monQ(q){const r=await fetch('https://api.monday.com/v2',{method:'POST',headers:{'Authorization':CFG.monday,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const d=await r.json();if(d.errors)throw new Error(d.errors[0].message);return d.data;}


// ── CHARTS ───────────────────────────────────────────────────
function mkC(id,type,data,opts){
  const canvas=document.getElementById(id);
  if(!canvas) return;
  if(CH[id]){try{CH[id].destroy();}catch(e){} delete CH[id];}
  const wrapper = canvas.parentElement;
  const wrapperH = wrapper ? parseInt(wrapper.style.height)||220 : 220;
  const wrapperW = wrapper ? wrapper.offsetWidth||600 : 600;
  canvas.width  = wrapperW;
  canvas.height = wrapperH;
  canvas.style.width  = '100%';
  canvas.style.height = wrapperH + 'px';
  const mergedOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: { legend: { display: false } },
    ...opts
  };
  CH[id] = new Chart(canvas, { type, data, options: mergedOpts });
  setTimeout(()=>{ try{ CH[id].resize(); }catch(e){} }, 200);
}

function fmtGBP(n){return'£'+Math.round(n).toLocaleString();}


// ── LOAD ALL ─────────────────────────────────────────────────
function loadAll(){
  Object.values(CH).forEach(c=>{try{c.destroy();}catch(e){}});

  // GA4 y GSC solo si hay TOKEN de Google (admin con OAuth completado)
  if(TOKEN) {
    loadGA4().catch(e=>{
      setNB('ga4','off');
      console.error('GA4:',e);
      const errHtml = `<div style="padding:12px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B;grid-column:1/-1">⚠ GA4 error: ${e.message} — Check that GA4 Property ID is correct and your account has access.</div>`;
      document.getElementById('ga4-kpis').innerHTML = errHtml;
      document.getElementById('ov-kpis').innerHTML = errHtml;
    });
    if(CFG.gsc){
      loadGSC().catch(e=>{
        setNB('gsc','off');
        const errHtml=`<div style="padding:12px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B;grid-column:1/-1">⚠ Search Console error: ${e.message}<br><small>Make sure <strong>${CFG.gsc}</strong> is verified in Search Console with this Google account.</small></div>`;
        document.getElementById('gsc-kpis').innerHTML=errHtml;
      });
    } else {
      setNB('gsc','off');
      nc('Search Console — add URL in Settings','gsc-kpis');
    }
    // Google Ads ahora se carga dentro del módulo Paid Media (paid-media-ui.js)
    setNB('paid','live');
  } else {
    // Sin Google OAuth — mostrar estado "not connected" limpio sin errores
    setNB('ga4','off'); setNB('gsc','off'); setNB('paid','off');
    const noGoogle = `<div class="notice"><strong>Google no conectado</strong> — Configura tu OAuth Client ID en <button class="cbtn" onclick="showP('settings',null)">Settings →</button></div>`;
    const ga4El = document.getElementById('ga4-kpis');   if(ga4El) ga4El.innerHTML = noGoogle;
    const ovEl  = document.getElementById('ov-kpis');    if(ovEl)  ovEl.innerHTML  = noGoogle;
    const gscEl = document.getElementById('gsc-kpis');   if(gscEl) gscEl.innerHTML = noGoogle;
  }

  CFG.instantly?loadInstantly().catch(()=>setNB('inst','off')):(setNB('inst','off'),nc('Instantly','ov-inst'),nc('Instantly','inst-kpis'));
  if(CFG.monday){
    loadMonday().catch(e=>{setNB('mon','off');setNB('opps','off');console.error('Monday:',e);});
  } else {
    setNB('mon','off');setNB('opps','off');
    nc('Monday.com','ov-opps');nc('Monday.com','opps-stages');
  }
  CFG.liId?loadLinkedIn().catch(()=>setNB('li','off')):(setNB('li','off'),nc('LinkedIn','ov-li'),nc('LinkedIn','li-kpis'));
  if(CFG.metaToken&&CFG.metaIgId){
    loadInstagram().catch(()=>setNB('ig','off'));
  } else {
    setNB('ig','off');
  }
  setTimeout(()=>{document.getElementById('upd-t').textContent='Updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});},3000);
}
