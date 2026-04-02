/* ═══════════════════════════════════════════════
   PROSPECTING — University & Training Center
   Lead Finder para alianzas de empleabilidad
   Depends on: core.js, identity_block.js
   ═══════════════════════════════════════════════ */

const PR_STORE = 'pr_prospecting_v1';

/* ── Base de datos de instituciones ── */
const PR_INSTITUTIONS = [
  // ═══ ESPAÑA — Universidades públicas ═══
  {id:'ucm',   name:'Universidad Complutense de Madrid', domain:'ucm.es',         country:'ES', type:'Universidad', city:'Madrid',     priority:'High'},
  {id:'uam',   name:'Universidad Autónoma de Madrid',    domain:'uam.es',         country:'ES', type:'Universidad', city:'Madrid',     priority:'High'},
  {id:'uc3m',  name:'Universidad Carlos III de Madrid',  domain:'uc3m.es',        country:'ES', type:'Universidad', city:'Madrid',     priority:'High'},
  {id:'urjc',  name:'Universidad Rey Juan Carlos',       domain:'urjc.es',        country:'ES', type:'Universidad', city:'Madrid',     priority:'Med'},
  {id:'upm',   name:'Univ. Politécnica de Madrid',       domain:'upm.es',         country:'ES', type:'Universidad', city:'Madrid',     priority:'Med'},
  {id:'ub',    name:'Universidad de Barcelona',          domain:'ub.edu',         country:'ES', type:'Universidad', city:'Barcelona',  priority:'High'},
  {id:'uab',   name:'Univ. Autónoma de Barcelona',       domain:'uab.cat',        country:'ES', type:'Universidad', city:'Barcelona',  priority:'High'},
  {id:'upf',   name:'Univ. Pompeu Fabra',                domain:'upf.edu',        country:'ES', type:'Universidad', city:'Barcelona',  priority:'High'},
  {id:'upc',   name:'Univ. Politécnica de Cataluña',     domain:'upc.edu',        country:'ES', type:'Universidad', city:'Barcelona',  priority:'Med'},
  {id:'uv',    name:'Universitat de València',           domain:'uv.es',          country:'ES', type:'Universidad', city:'Valencia',   priority:'High'},
  {id:'us',    name:'Universidad de Sevilla',            domain:'us.es',          country:'ES', type:'Universidad', city:'Sevilla',    priority:'High'},
  {id:'ugr',   name:'Universidad de Granada',            domain:'ugr.es',         country:'ES', type:'Universidad', city:'Granada',    priority:'Med'},
  {id:'usc',   name:'Univ. de Santiago de Compostela',   domain:'usc.es',         country:'ES', type:'Universidad', city:'Santiago',   priority:'Med'},
  {id:'uva',   name:'Universidad de Valladolid',         domain:'uva.es',         country:'ES', type:'Universidad', city:'Valladolid', priority:'Low'},
  {id:'unav',  name:'Universidad de Navarra',            domain:'unav.edu',       country:'ES', type:'Universidad', city:'Pamplona',   priority:'High'},
  {id:'uned',  name:'UNED',                              domain:'uned.es',        country:'ES', type:'Online',     city:'Madrid',     priority:'High'},
  // ═══ ESPAÑA — Business Schools ═══
  {id:'esade', name:'ESADE Business School',             domain:'esade.edu',      country:'ES', type:'Business School', city:'Barcelona', priority:'High'},
  {id:'ie',    name:'IE Business School',                domain:'ie.edu',         country:'ES', type:'Business School', city:'Madrid',    priority:'High'},
  {id:'esic',  name:'ESIC Business & Marketing',         domain:'esic.edu',       country:'ES', type:'Business School', city:'Madrid',    priority:'High'},
  {id:'eae',   name:'EAE Business School',               domain:'eae.es',         country:'ES', type:'Business School', city:'Madrid',    priority:'High'},
  {id:'ceu',   name:'CEU Universities',                  domain:'ceu.es',         country:'ES', type:'Universidad', city:'Madrid',    priority:'Med'},
  {id:'comillas', name:'Univ. Pontificia Comillas',      domain:'comillas.edu',   country:'ES', type:'Universidad', city:'Madrid',    priority:'High'},
  {id:'deusto', name:'Universidad de Deusto',            domain:'deusto.es',      country:'ES', type:'Universidad', city:'Bilbao',    priority:'Med'},
  {id:'obs',   name:'OBS Business School',               domain:'obs-edu.com',    country:'ES', type:'Online',     city:'Barcelona', priority:'Med'},
  {id:'inesdi', name:'Inesdi Digital Business School',   domain:'inesdi.com',     country:'ES', type:'Online',     city:'Barcelona', priority:'Med'},
  {id:'imf',   name:'IMF Smart Education',               domain:'imf-formacion.com', country:'ES', type:'Online',  city:'Madrid',    priority:'Med'},
  {id:'unir',  name:'UNIR — La Rioja Online',            domain:'unir.net',       country:'ES', type:'Online',     city:'Online',    priority:'High'},
  {id:'uoc',   name:'Universitat Oberta de Catalunya',   domain:'uoc.edu',        country:'ES', type:'Online',     city:'Barcelona', priority:'High'},
  {id:'viu',   name:'VIU — Univ. Internacional Valencia',domain:'universidadviu.com', country:'ES', type:'Online', city:'Valencia',  priority:'Med'},
  // ═══ MEXICO ═══
  {id:'unam',  name:'UNAM',                              domain:'unam.mx',        country:'MX', type:'Universidad', city:'México DF', priority:'High'},
  {id:'tec',   name:'Tecnológico de Monterrey',          domain:'tec.mx',         country:'MX', type:'Universidad', city:'Monterrey', priority:'High'},
  {id:'itam',  name:'ITAM',                              domain:'itam.mx',        country:'MX', type:'Universidad', city:'México DF', priority:'High'},
  {id:'ibero', name:'Universidad Iberoamericana',        domain:'ibero.mx',       country:'MX', type:'Universidad', city:'México DF', priority:'High'},
  {id:'uia',   name:'UDEM — Univ. de Monterrey',         domain:'udem.edu.mx',    country:'MX', type:'Universidad', city:'Monterrey', priority:'Med'},
  {id:'udg',   name:'Universidad de Guadalajara',        domain:'udg.mx',         country:'MX', type:'Universidad', city:'Guadalajara',priority:'Med'},
  {id:'anahuac', name:'Universidad Anáhuac',             domain:'anahuac.mx',     country:'MX', type:'Universidad', city:'México DF', priority:'Med'},
  // ═══ COLOMBIA ═══
  {id:'uniandes', name:'Universidad de los Andes',       domain:'uniandes.edu.co',country:'CO', type:'Universidad', city:'Bogotá',   priority:'High'},
  {id:'javeriana', name:'Pontificia Univ. Javeriana',    domain:'javeriana.edu.co',country:'CO', type:'Universidad', city:'Bogotá',   priority:'High'},
  {id:'eafit',  name:'Universidad EAFIT',                domain:'eafit.edu.co',   country:'CO', type:'Universidad', city:'Medellín', priority:'High'},
  {id:'unal',   name:'Univ. Nacional de Colombia',       domain:'unal.edu.co',    country:'CO', type:'Universidad', city:'Bogotá',   priority:'Med'},
  {id:'uexternado', name:'Univ. Externado de Colombia',  domain:'uexternado.edu.co',country:'CO', type:'Universidad', city:'Bogotá', priority:'Med'},
  {id:'uninorte', name:'Universidad del Norte',          domain:'uninorte.edu.co',country:'CO', type:'Universidad', city:'Barranquilla',priority:'Med'},
  // ═══ CHILE ═══
  {id:'puc',   name:'Pontificia Univ. Católica de Chile',domain:'uc.cl',          country:'CL', type:'Universidad', city:'Santiago', priority:'High'},
  {id:'uchile', name:'Universidad de Chile',             domain:'uchile.cl',      country:'CL', type:'Universidad', city:'Santiago', priority:'High'},
  {id:'uai',   name:'Universidad Adolfo Ibáñez',         domain:'uai.cl',         country:'CL', type:'Universidad', city:'Santiago', priority:'High'},
  {id:'udp',   name:'Universidad Diego Portales',        domain:'udp.cl',         country:'CL', type:'Universidad', city:'Santiago', priority:'Med'},
  // ═══ ARGENTINA ═══
  {id:'uba',   name:'Universidad de Buenos Aires',       domain:'uba.ar',         country:'AR', type:'Universidad', city:'Buenos Aires',priority:'High'},
  {id:'utdt',  name:'Universidad Torcuato Di Tella',     domain:'utdt.edu',       country:'AR', type:'Universidad', city:'Buenos Aires',priority:'High'},
  {id:'udesa', name:'Universidad de San Andrés',         domain:'udesa.edu.ar',   country:'AR', type:'Universidad', city:'Buenos Aires',priority:'High'},
  {id:'austral', name:'Universidad Austral',             domain:'austral.edu.ar', country:'AR', type:'Universidad', city:'Buenos Aires',priority:'Med'},
  // ═══ PERU ═══
  {id:'pucp',  name:'Pontificia Univ. Católica del Perú',domain:'pucp.edu.pe',    country:'PE', type:'Universidad', city:'Lima',     priority:'High'},
  {id:'esan',  name:'ESAN Graduate School',              domain:'esan.edu.pe',    country:'PE', type:'Business School', city:'Lima', priority:'High'},
  {id:'up',    name:'Universidad del Pacífico',          domain:'up.edu.pe',      country:'PE', type:'Universidad', city:'Lima',     priority:'High'},
  {id:'ulima', name:'Universidad de Lima',               domain:'ulima.edu.pe',   country:'PE', type:'Universidad', city:'Lima',     priority:'Med'},
  // ═══ BRASIL ═══
  {id:'usp',   name:'Universidade de São Paulo (USP)',   domain:'usp.br',         country:'BR', type:'Universidad', city:'São Paulo',priority:'High'},
  {id:'fgv',   name:'FGV — Fundação Getulio Vargas',    domain:'fgv.br',         country:'BR', type:'Business School', city:'São Paulo',priority:'High'},
  {id:'insper', name:'Insper',                           domain:'insper.edu.br',  country:'BR', type:'Business School', city:'São Paulo',priority:'High'},
  // ═══ URUGUAY & OTROS ═══
  {id:'ort',   name:'Universidad ORT Uruguay',           domain:'ort.edu.uy',     country:'UY', type:'Universidad', city:'Montevideo',priority:'Med'},
  {id:'ucu',   name:'Univ. Católica del Uruguay',        domain:'ucu.edu.uy',     country:'UY', type:'Universidad', city:'Montevideo',priority:'Low'},
];

const PR_ROLES = [
  'Director de Empleabilidad', 'Directora de Empleabilidad',
  'Director de Carreras Profesionales', 'Career Services',
  'Responsable de Empleabilidad', 'Coordinador de Prácticas',
  'Head of Careers', 'Director de Relaciones con Empresas',
  'Director de Bolsa de Trabajo', 'Orientación Profesional',
  'Student Affairs', 'Placement', 'Talent', 'Empleabilidad'
];

const PR_COUNTRIES = {ES:'🇪🇸 España', MX:'🇲🇽 México', CO:'🇨🇴 Colombia', CL:'🇨🇱 Chile', AR:'🇦🇷 Argentina', PE:'🇵🇪 Perú', BR:'🇧🇷 Brasil', UY:'🇺🇾 Uruguay'};

let prSelected = new Set();
let prResults  = []; // [{institution, contacts:[{name,email,role,confidence,linkedin,source}], pitch}]
let prRunning  = false;

/* ── RENDER ── */
function renderProspectingPage() {
  const el = document.getElementById('prosp-main');
  if (!el) return;

  // Load saved state
  try {
    const saved = JSON.parse(localStorage.getItem(PR_STORE) || 'null');
    if (saved && saved.results) { prResults = saved.results; prSelected = new Set(saved.selected || []); }
  } catch(e) {}

  el.innerHTML =
    '<div style="display:grid;grid-template-columns:300px 1fr;gap:16px;align-items:start">' +
      '<div>' + prBuildLeftPanel() + '</div>' +
      '<div id="pr-right">' + prBuildRightPanel() + '</div>' +
    '</div>';

  prInitChips();
}

function prBuildLeftPanel() {
  const byCountry = {};
  PR_INSTITUTIONS.forEach(function(inst) {
    if (!byCountry[inst.country]) byCountry[inst.country] = [];
    byCountry[inst.country].push(inst);
  });

  let chips = '';
  Object.keys(PR_COUNTRIES).forEach(function(cc) {
    if (!byCountry[cc]) return;
    chips += '<div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 5px">' + PR_COUNTRIES[cc] + '</div>';
    byCountry[cc].forEach(function(inst) {
      const sel = prSelected.has(inst.id);
      const prioColor = inst.priority==='High' ? '#1D9E75' : inst.priority==='Med' ? '#2563EB' : '#888';
      chips += '<div id="pr-chip-' + inst.id + '" onclick="prToggle(\'' + inst.id + '\')" ' +
        'style="display:flex;align-items:center;gap:6px;padding:6px 9px;border-radius:var(--r);border:.5px solid ' +
        (sel ? prioColor : 'var(--bd)') + ';background:' + (sel ? prioColor+'15' : 'var(--sf)') +
        ';cursor:pointer;margin-bottom:4px;transition:all .15s;font-size:11px">' +
        '<span style="width:6px;height:6px;border-radius:50%;background:' + prioColor + ';flex-shrink:0"></span>' +
        '<span style="flex:1;color:var(--tx);line-height:1.3">' + inst.name + '</span>' +
        '<span style="font-size:9px;color:var(--ht)">' + inst.type.split(' ')[0] + '</span>' +
        '</div>';
    });
  });

  const total = PR_INSTITUTIONS.length;
  const selCount = prSelected.size;

  return '<div class="cd">' +
    '<div class="ch">' +
      '<span class="ct">Instituciones</span>' +
      '<span class="bg bg-b" id="pr-sel-badge">' + selCount + ' / ' + total + '</span>' +
    '</div>' +
    '<div style="display:flex;gap:5px;flex-wrap:wrap;margin-bottom:10px">' +
      '<button onclick="prSelectAll()" style="padding:3px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Todas</button>' +
      '<button onclick="prSelectHigh()" style="padding:3px 10px;border:1px solid #1D9E75;border-radius:var(--r);font-size:10px;cursor:pointer;background:#E1F5EE;color:#085041;font-family:\'DM Sans\',sans-serif">Solo High</button>' +
      '<button onclick="prSelectNone()" style="padding:3px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Limpiar</button>' +
    '</div>' +
    '<div style="max-height:420px;overflow-y:auto;padding-right:2px" id="pr-chips">' + chips + '</div>' +
    '<div style="margin-top:12px">' +
      '<label style="font-size:11px;font-weight:600;color:var(--ht);display:block;margin-bottom:5px">Hunter.io API Key</label>' +
      '<input id="pr-hunter-key" class="fi" placeholder="Pega tu API key de Hunter.io" style="width:100%;font-size:12px" value="' + (prGetHunterKey()) + '">' +
      '<div style="font-size:10px;color:var(--ht);margin-top:3px"><a href="https://hunter.io/api-keys" target="_blank" style="color:var(--green)">hunter.io/api-keys</a> — plan gratuito: 50 búsquedas/mes</div>' +
    '</div>' +
    '<button onclick="prRunSearch()" id="pr-run-btn" style="width:100%;margin-top:12px;padding:10px;background:var(--green);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' +
      '🔍 Buscar contactos' +
    '</button>' +
    '<div id="pr-progress" style="display:none;margin-top:10px;font-size:11px;color:var(--mt);line-height:1.6"></div>' +
  '</div>';
}

function prBuildRightPanel() {
  if (!prResults.length) {
    return '<div class="cd" style="text-align:center;padding:40px 20px">' +
      '<div style="font-size:32px;margin-bottom:12px">🎓</div>' +
      '<div style="font-size:14px;font-weight:500;color:var(--tx);margin-bottom:8px">Buscador de contactos universitarios</div>' +
      '<div style="font-size:12px;color:var(--mt);line-height:1.7;max-width:400px;margin:0 auto">' +
        'Selecciona instituciones a la izquierda y haz clic en "Buscar contactos".<br><br>' +
        '<strong>Flujo:</strong> Hunter.io busca emails por dominio → Claude IA enriquece los registros vacíos con web search → Genera pitch personalizado por institución.' +
      '</div>' +
    '</div>';
  }

  const totalContacts = prResults.reduce(function(a,r){ return a + r.contacts.length; }, 0);
  const withEmail = prResults.reduce(function(a,r){ return a + r.contacts.filter(function(c){ return c.email; }).length; }, 0);
  const withPitch = prResults.filter(function(r){ return r.pitch; }).length;

  let rows = '';
  prResults.forEach(function(r) {
    const inst = PR_INSTITUTIONS.find(function(i){ return i.id === r.instId; });
    if (!inst) return;
    const flag = PR_COUNTRIES[inst.country] ? PR_COUNTRIES[inst.country].split(' ')[0] : '';

    if (!r.contacts.length) {
      rows += '<tr style="background:var(--rp)">' +
        '<td style="padding:10px 12px;font-size:12px;color:var(--tx)">' + flag + ' ' + inst.name + '</td>' +
        '<td colspan="4" style="padding:10px 12px;font-size:11px;color:var(--ht)">Sin contactos encontrados</td>' +
        '<td style="padding:10px 12px"><button onclick="prEnrich(\'' + inst.id + '\')" style="padding:3px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Enriquecer IA →</button></td>' +
      '</tr>';
      return;
    }

    r.contacts.forEach(function(c, ci) {
      const confColor = c.confidence >= 80 ? 'var(--green)' : c.confidence >= 50 ? 'var(--amber)' : 'var(--ht)';
      rows += '<tr' + (ci > 0 ? ' style="background:var(--sf2)"' : '') + '>' +
        '<td style="padding:10px 12px;font-size:12px;color:var(--tx)">' + (ci===0 ? flag + ' ' + inst.name : '') + '</td>' +
        '<td style="padding:10px 12px;font-size:11px;color:var(--tx)">' + (c.name||'—') + '</td>' +
        '<td style="padding:10px 12px;font-size:11px;color:var(--mt)">' + (c.role||'—') + '</td>' +
        '<td style="padding:10px 12px;font-size:11px">' +
          (c.email ? '<span style="font-family:\'DM Mono\',monospace;font-size:10px">' + c.email + '</span>' : '<span style="color:var(--ht)">—</span>') +
          (c.confidence ? ' <span style="font-size:10px;color:' + confColor + '">' + c.confidence + '%</span>' : '') +
        '</td>' +
        '<td style="padding:10px 12px;font-size:11px">' +
          (c.linkedin ? '<a href="' + c.linkedin + '" target="_blank" style="color:var(--green);font-size:10px">LinkedIn →</a>' : '<span style="color:var(--ht)">—</span>') +
        '</td>' +
        '<td style="padding:10px 12px;font-size:10px;color:var(--ht)">' + (c.source||'Hunter') + '</td>' +
      '</tr>';
    });

    // Pitch row
    if (r.pitch) {
      rows += '<tr style="background:var(--gp)">' +
        '<td colspan="6" style="padding:10px 12px">' +
          '<div style="font-size:10px;font-weight:600;color:var(--green2);margin-bottom:4px">✉ PITCH GENERADO POR IA</div>' +
          '<div style="font-size:11px;color:var(--tx);white-space:pre-wrap;line-height:1.6">' + r.pitch + '</div>' +
        '</td>' +
      '</tr>';
    } else {
      rows += '<tr><td colspan="6" style="padding:6px 12px;text-align:right">' +
        '<button onclick="prGeneratePitch(\'' + inst.id + '\')" style="padding:3px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">✉ Generar pitch IA</button>' +
      '</td></tr>';
    }
  });

  return '<div class="cd">' +
    '<div class="ch">' +
      '<span class="ct">Resultados</span>' +
      '<div style="display:flex;gap:6px;align-items:center">' +
        '<span style="font-size:11px;color:var(--mt)">' + totalContacts + ' contactos · ' + withEmail + ' con email · ' + withPitch + ' con pitch</span>' +
        '<button onclick="prExportXlsx()" style="padding:4px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">↓ Exportar Excel</button>' +
        '<button onclick="prClearResults()" style="padding:4px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Limpiar</button>' +
      '</div>' +
    '</div>' +
    '<div style="overflow-x:auto">' +
    '<table style="width:100%;border-collapse:collapse">' +
      '<thead><tr style="background:var(--sf2)">' +
        '<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Institución</th>' +
        '<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Nombre</th>' +
        '<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Cargo</th>' +
        '<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Email</th>' +
        '<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">LinkedIn</th>' +
        '<th style="text-align:left;padding:8px 12px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">Fuente</th>' +
      '</tr></thead>' +
      '<tbody id="pr-tbody">' + rows + '</tbody>' +
    '</table></div></div>';
}

/* ── CHIP INTERACTIONS ── */
function prInitChips() {}

function prToggle(id) {
  if (prSelected.has(id)) prSelected.delete(id);
  else prSelected.add(id);
  prUpdateChip(id);
  prUpdateBadge();
}
function prSelectAll()  { PR_INSTITUTIONS.forEach(function(i){ prSelected.add(i.id); prUpdateChip(i.id); }); prUpdateBadge(); }
function prSelectHigh() { PR_INSTITUTIONS.forEach(function(i){ if(i.priority==='High'){prSelected.add(i.id);}else{prSelected.delete(i.id);} prUpdateChip(i.id); }); prUpdateBadge(); }
function prSelectNone() { PR_INSTITUTIONS.forEach(function(i){ prSelected.delete(i.id); prUpdateChip(i.id); }); prUpdateBadge(); }

function prUpdateChip(id) {
  const el = document.getElementById('pr-chip-' + id);
  if (!el) return;
  const inst = PR_INSTITUTIONS.find(function(i){ return i.id===id; });
  if (!inst) return;
  const sel = prSelected.has(id);
  const prioColor = inst.priority==='High' ? '#1D9E75' : inst.priority==='Med' ? '#2563EB' : '#888';
  el.style.borderColor = sel ? prioColor : 'var(--bd)';
  el.style.background  = sel ? prioColor+'15' : 'var(--sf)';
}
function prUpdateBadge() {
  const b = document.getElementById('pr-sel-badge');
  if (b) b.textContent = prSelected.size + ' / ' + PR_INSTITUTIONS.length;
}

/* ── HUNTER.IO ── */
function prGetHunterKey() {
  try { return JSON.parse(localStorage.getItem(PR_STORE)||'{}').hunterKey || ''; } catch(e){ return ''; }
}
function prSaveHunterKey(key) {
  try { const d = JSON.parse(localStorage.getItem(PR_STORE)||'{}'); d.hunterKey=key; localStorage.setItem(PR_STORE,JSON.stringify(d)); } catch(e){}
}

async function prHunterSearch(domain, key) {
  const url = 'https://api.hunter.io/v2/domain-search?domain=' + encodeURIComponent(domain) + '&api_key=' + encodeURIComponent(key) + '&limit=10&type=personal';
  const r = await fetch(url);
  const data = await r.json();
  if (!data.data) return [];
  const emails = data.data.emails || [];
  return emails
    .filter(function(e) {
      if (!e.value) return false;
      const pos = (e.position||'').toLowerCase();
      return PR_ROLES.some(function(role){ return pos.includes(role.toLowerCase().split(' ').slice(-1)[0]); }) ||
             pos.includes('employ') || pos.includes('career') || pos.includes('talent') ||
             pos.includes('practic') || pos.includes('bolsa') || pos.includes('orientacion') ||
             pos.includes('placement') || pos.includes('student');
    })
    .map(function(e) {
      return { name: (e.first_name||'') + ' ' + (e.last_name||''), role: e.position||'', email: e.value, confidence: e.confidence||0, linkedin: e.linkedin||'', source: 'Hunter.io' };
    })
    .slice(0, 5);
}

/* ── CLAUDE ENRICHMENT ── */
async function prEnrichWithClaude(inst) {
  if (!CFG.ak) return [];
  const prompt = 'Busca en internet quién es el responsable de empleabilidad, career services, o bolsa de trabajo de la siguiente institución:\n\n' +
    'Institución: ' + inst.name + '\nPaís: ' + inst.country + '\nDominio: ' + inst.domain + '\n\n' +
    'Responde en formato JSON con este esquema exacto (sin markdown, solo JSON):\n' +
    '{"contacts": [{"name": "Nombre Apellido", "role": "Cargo exacto", "email": "email si encontraste", "linkedin": "URL LinkedIn si encontraste", "confidence": 0-100}]}\n\n' +
    'Si no encuentras información, devuelve {"contacts": []}. Máximo 3 contactos. Solo personas reales con cargo relacionado a empleabilidad, carreras profesionales o relaciones con empresas.';

  try {
    const data = await antFetch({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }]
    });
    const text = (data.content||[]).filter(function(b){ return b.type==='text'; }).map(function(b){ return b.text; }).join('');
    const json = JSON.parse(text.replace(/```json|```/g,'').trim());
    return (json.contacts||[]).map(function(c){ return Object.assign(c, {source:'Claude IA'}); });
  } catch(e) { return []; }
}

/* ── PITCH GENERATOR ── */
async function prGeneratePitch(instId) {
  const inst = PR_INSTITUTIONS.find(function(i){ return i.id===instId; });
  if (!inst || !CFG.ak) return;

  const btn = document.querySelector('[onclick="prGeneratePitch(\'' + instId + '\')"]');
  if (btn) { btn.disabled=true; btn.textContent='Generando…'; }

  const identity = (typeof biGetContext === 'function') ? biGetContext() : '';
  const result = prResults.find(function(r){ return r.instId===instId; });
  const contactName = result && result.contacts.length ? result.contacts[0].name : 'responsable de empleabilidad';

  const prompt = identity + '\n\nEscribe un email de outreach profesional en español para contactar a ' + contactName + ' de ' + inst.name + ' (' + inst.country + ').\n\n' +
    'OBJETIVO: Proponer una alianza estratégica donde ' + inst.name + ' recomiende Próximo Rol a sus alumnos como servicio de preparación de entrevistas para mejorar su empleabilidad.\n\n' +
    'El email debe:\n- Asunto: máx 60 chars, específico y no genérico\n- Cuerpo: 120-180 palabras, tono profesional pero cercano\n- Mencionar algo específico de ' + inst.name + ' que conecte con la propuesta\n- Proponer una llamada de 20 minutos como siguiente paso\n- Firmar como equipo de Próximo Rol\n\n' +
    'Formato de salida:\nASUNTO: ...\n\n[cuerpo del email]\n\nSin markdown. Listo para copiar y enviar.';

  try {
    const data = await antFetch({ model: 'claude-sonnet-4-20250514', max_tokens: 400, messages: [{ role:'user', content: prompt }] });
    const pitch = (data.content||[]).filter(function(b){ return b.type==='text'; }).map(function(b){ return b.text; }).join('');
    const idx = prResults.findIndex(function(r){ return r.instId===instId; });
    if (idx>=0) { prResults[idx].pitch = pitch; prSaveResults(); }
    const right = document.getElementById('pr-right');
    if (right) right.innerHTML = prBuildRightPanel();
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='✉ Generar pitch IA'; }
  }
}

async function prEnrich(instId) {
  const inst = PR_INSTITUTIONS.find(function(i){ return i.id===instId; });
  if (!inst) return;
  const btn = document.querySelector('[onclick="prEnrich(\'' + instId + '\')"]');
  if (btn) { btn.disabled=true; btn.textContent='Buscando…'; }
  const contacts = await prEnrichWithClaude(inst);
  const idx = prResults.findIndex(function(r){ return r.instId===instId; });
  if (idx>=0) { prResults[idx].contacts = contacts; prSaveResults(); }
  else prResults.push({ instId: instId, contacts: contacts, pitch: '' });
  const right = document.getElementById('pr-right');
  if (right) right.innerHTML = prBuildRightPanel();
}

/* ── MAIN SEARCH ── */
async function prRunSearch() {
  if (prRunning) return;
  if (!prSelected.size) { alert('Selecciona al menos una institución.'); return; }

  const keyInput = document.getElementById('pr-hunter-key');
  const hunterKey = keyInput ? keyInput.value.trim() : prGetHunterKey();
  if (hunterKey) prSaveHunterKey(hunterKey);

  prRunning = true;
  const btn = document.getElementById('pr-run-btn');
  if (btn) { btn.disabled=true; btn.textContent='Buscando…'; }

  const progress = document.getElementById('pr-progress');
  if (progress) progress.style.display = 'block';

  const institutions = PR_INSTITUTIONS.filter(function(i){ return prSelected.has(i.id); });
  prResults = [];

  for (let i = 0; i < institutions.length; i++) {
    const inst = institutions[i];
    if (progress) progress.innerHTML = '<strong>' + (i+1) + ' / ' + institutions.length + '</strong> — Buscando en ' + inst.name + '…';

    let contacts = [];

    // Try Hunter.io first
    if (hunterKey) {
      try { contacts = await prHunterSearch(inst.domain, hunterKey); } catch(e) {}
    }

    // Fall back to Claude if no results and API key available
    if (!contacts.length && CFG.ak) {
      if (progress) progress.innerHTML += '<br><span style="color:var(--mt)">→ Sin resultados en Hunter — enriqueciendo con Claude IA…</span>';
      try { contacts = await prEnrichWithClaude(inst); } catch(e) {}
    }

    prResults.push({ instId: inst.id, contacts: contacts, pitch: '' });

    // Small pause to avoid rate limits
    if (i < institutions.length - 1) await new Promise(function(res){ setTimeout(res, 800); });
  }

  prSaveResults();
  prRunning = false;
  if (btn) { btn.disabled=false; btn.textContent='🔍 Buscar contactos'; }
  if (progress) progress.style.display = 'none';

  const right = document.getElementById('pr-right');
  if (right) right.innerHTML = prBuildRightPanel();
}

/* ── SAVE / CLEAR ── */
function prSaveResults() {
  try {
    const d = JSON.parse(localStorage.getItem(PR_STORE)||'{}');
    d.results = prResults;
    d.selected = Array.from(prSelected);
    localStorage.setItem(PR_STORE, JSON.stringify(d));
  } catch(e) {}
}

function prClearResults() {
  if (!confirm('¿Limpiar todos los resultados?')) return;
  prResults = [];
  prSaveResults();
  const right = document.getElementById('pr-right');
  if (right) right.innerHTML = prBuildRightPanel();
}

/* ── EXPORT EXCEL ── */
function prExportXlsx() {
  if (!prResults.length) { alert('No hay resultados para exportar.'); return; }

  if (typeof XLSX === 'undefined') {
    alert('Cargando librería de Excel… por favor inténtalo de nuevo en un segundo.');
    var s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    document.head.appendChild(s);
    return;
  }

  var rows = [['Institución', 'País', 'Tipo', 'Ciudad', 'Prioridad', 'Nombre', 'Cargo', 'Email', 'Confianza %', 'LinkedIn', 'Fuente', 'Pitch']];

  prResults.forEach(function(r) {
    var inst = PR_INSTITUTIONS.find(function(i){ return i.id===r.instId; });
    if (!inst) return;
    var flag = PR_COUNTRIES[inst.country] ? PR_COUNTRIES[inst.country].split(' ')[0] : inst.country;
    if (!r.contacts.length) {
      rows.push([inst.name, flag, inst.type, inst.city, inst.priority, '—', '—', '—', '—', '—', '—', r.pitch||'']);
    } else {
      r.contacts.forEach(function(c, ci) {
        rows.push([inst.name, flag, inst.type, inst.city, inst.priority, c.name||'', c.role||'', c.email||'', c.confidence||'', c.linkedin||'', c.source||'', ci===0 ? (r.pitch||'') : '']);
      });
    }
  });

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:35},{wch:8},{wch:15},{wch:15},{wch:8},{wch:25},{wch:35},{wch:35},{wch:10},{wch:40},{wch:10},{wch:80}];

  // Style header row
  var range = XLSX.utils.decode_range(ws['!ref']);
  for (var c = range.s.c; c <= range.e.c; c++) {
    var addr = XLSX.utils.encode_cell({r:0, c:c});
    if (!ws[addr]) continue;
    ws[addr].s = { font:{bold:true}, fill:{fgColor:{rgb:'1D9E75'}}, font:{bold:true,color:{rgb:'FFFFFF'}} };
  }

  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contactos');

  // Pitches sheet
  var pitchRows = [['Institución', 'Pitch Email']];
  prResults.filter(function(r){ return r.pitch; }).forEach(function(r) {
    var inst = PR_INSTITUTIONS.find(function(i){ return i.id===r.instId; });
    if (inst) pitchRows.push([inst.name, r.pitch]);
  });
  if (pitchRows.length > 1) {
    var ws2 = XLSX.utils.aoa_to_sheet(pitchRows);
    ws2['!cols'] = [{wch:35},{wch:100}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Pitches');
  }

  var date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, 'PR_Prospecting_' + date + '.xlsx');
}
