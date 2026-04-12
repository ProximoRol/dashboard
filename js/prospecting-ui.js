/* ═══════════════════════════════════════════════
   PROSPECTING UI — Solo interfaz
   Claude calls via backend proxy.
   Hunter calls via hunter-proxy.
   Depends on: core.js (apiFetch)
   ═══════════════════════════════════════════════ */

const PR_STORE = 'pr_prospecting_v1';

const PR_INSTITUTIONS = [
  {id:'ucm',   name:'U. Complutense de Madrid',   domain:'ucm.es',              country:'ES', type:'Universidad',    priority:'High'},
  {id:'uam',   name:'U. Autónoma de Madrid',       domain:'uam.es',              country:'ES', type:'Universidad',    priority:'High'},
  {id:'uc3m',  name:'U. Carlos III de Madrid',     domain:'uc3m.es',             country:'ES', type:'Universidad',    priority:'High'},
  {id:'urjc',  name:'U. Rey Juan Carlos',          domain:'urjc.es',             country:'ES', type:'Universidad',    priority:'Med'},
  {id:'ub',    name:'U. de Barcelona',              domain:'ub.edu',              country:'ES', type:'Universidad',    priority:'High'},
  {id:'uab',   name:'U. Autónoma de Barcelona',    domain:'uab.cat',             country:'ES', type:'Universidad',    priority:'High'},
  {id:'upf',   name:'U. Pompeu Fabra',              domain:'upf.edu',             country:'ES', type:'Universidad',    priority:'High'},
  {id:'uv',    name:'Universitat de Valencia',      domain:'uv.es',               country:'ES', type:'Universidad',    priority:'High'},
  {id:'us',    name:'U. de Sevilla',                domain:'us.es',               country:'ES', type:'Universidad',    priority:'High'},
  {id:'ugr',   name:'U. de Granada',                domain:'ugr.es',              country:'ES', type:'Universidad',    priority:'Med'},
  {id:'unav',  name:'U. de Navarra',                domain:'unav.edu',            country:'ES', type:'Universidad',    priority:'High'},
  {id:'uned',  name:'UNED',                         domain:'uned.es',             country:'ES', type:'Online',         priority:'High'},
  {id:'esade', name:'ESADE Business School',        domain:'esade.edu',           country:'ES', type:'Business School', priority:'High'},
  {id:'ie',    name:'IE Business School',           domain:'ie.edu',              country:'ES', type:'Business School', priority:'High'},
  {id:'esic',  name:'ESIC Business & Marketing',   domain:'esic.edu',            country:'ES', type:'Business School', priority:'High'},
  {id:'eae',   name:'EAE Business School',          domain:'eae.es',              country:'ES', type:'Business School', priority:'High'},
  {id:'comillas', name:'U. P. Comillas',            domain:'comillas.edu',        country:'ES', type:'Universidad',    priority:'High'},
  {id:'deusto', name:'U. de Deusto',               domain:'deusto.es',           country:'ES', type:'Universidad',    priority:'Med'},
  {id:'uoc',   name:'UOC — U. Oberta Catalunya',   domain:'uoc.edu',             country:'ES', type:'Online',         priority:'High'},
  {id:'unir',  name:'UNIR — La Rioja Online',       domain:'unir.net',            country:'ES', type:'Online',         priority:'High'},
  {id:'obs',   name:'OBS Business School',          domain:'obs-edu.com',         country:'ES', type:'Online',         priority:'Med'},
  {id:'unam',  name:'UNAM',                         domain:'unam.mx',             country:'MX', type:'Universidad',    priority:'High'},
  {id:'tec',   name:'Tec de Monterrey',             domain:'tec.mx',              country:'MX', type:'Universidad',    priority:'High'},
  {id:'itam',  name:'ITAM',                         domain:'itam.mx',             country:'MX', type:'Universidad',    priority:'High'},
  {id:'ibero', name:'U. Iberoamericana',            domain:'ibero.mx',            country:'MX', type:'Universidad',    priority:'High'},
  {id:'udg',   name:'U. de Guadalajara',            domain:'udg.mx',              country:'MX', type:'Universidad',    priority:'Med'},
  {id:'uniandes', name:'U. de los Andes',          domain:'uniandes.edu.co',     country:'CO', type:'Universidad',    priority:'High'},
  {id:'javeriana', name:'U. Javeriana',             domain:'javeriana.edu.co',    country:'CO', type:'Universidad',    priority:'High'},
  {id:'eafit',  name:'U. EAFIT',                    domain:'eafit.edu.co',        country:'CO', type:'Universidad',    priority:'High'},
  {id:'unal',   name:'U. Nacional de Colombia',     domain:'unal.edu.co',         country:'CO', type:'Universidad',    priority:'Med'},
  {id:'puc',   name:'PUC de Chile',                 domain:'uc.cl',               country:'CL', type:'Universidad',    priority:'High'},
  {id:'uchile', name:'U. de Chile',                 domain:'uchile.cl',           country:'CL', type:'Universidad',    priority:'High'},
  {id:'uai',   name:'U. Adolfo Ibáñez',             domain:'uai.cl',              country:'CL', type:'Universidad',    priority:'High'},
  {id:'uba',   name:'U. de Buenos Aires',           domain:'uba.ar',              country:'AR', type:'Universidad',    priority:'High'},
  {id:'utdt',  name:'U. Torcuato Di Tella',         domain:'utdt.edu',            country:'AR', type:'Universidad',    priority:'High'},
  {id:'udesa', name:'U. de San Andrés',             domain:'udesa.edu.ar',        country:'AR', type:'Universidad',    priority:'High'},
  {id:'pucp',  name:'PUCP Peru',                    domain:'pucp.edu.pe',         country:'PE', type:'Universidad',    priority:'High'},
  {id:'esan',  name:'ESAN Graduate School',         domain:'esan.edu.pe',         country:'PE', type:'Business School', priority:'High'},
  {id:'up',    name:'U. del Pacifico Peru',         domain:'up.edu.pe',           country:'PE', type:'Universidad',    priority:'High'},
  {id:'usp',   name:'USP — São Paulo',              domain:'usp.br',              country:'BR', type:'Universidad',    priority:'High'},
  {id:'fgv',   name:'FGV — Fundação Getulio Vargas',domain:'fgv.br',             country:'BR', type:'Business School', priority:'High'},
];

const PR_FLAGS = {ES:'ES', MX:'MX', CO:'CO', CL:'CL', AR:'AR', PE:'PE', BR:'BR', UY:'UY'};
const PR_COUNTRY_NAMES = {ES:'España', MX:'México', CO:'Colombia', CL:'Chile', AR:'Argentina', PE:'Perú', BR:'Brasil', UY:'Uruguay'};
const PR_ROLES = ['employ','career','careers','practic','placement','talent','bolsa','orientacion','student affairs','outreach','alumni','empleo'];

let prSelected = new Set();
let prResults  = [];
let prRunning  = false;

/* ══════════════════════════════════════════════
   MAIN RENDER
   ══════════════════════════════════════════════ */
function renderProspectingPage() {
  var el = document.getElementById('prosp-main');
  if (!el) { console.error('prosp-main not found'); return; }

  // Restore saved state
  try {
    var saved = JSON.parse(localStorage.getItem(PR_STORE) || 'null');
    if (saved && saved.results) {
      prResults = saved.results;
      prSelected = new Set(saved.selected || []);
    }
  } catch(e) {}

  // Build page with simple flex layout — no grid
  var html = '<div style="display:flex;gap:16px;align-items:flex-start;flex-wrap:wrap">';

  // LEFT PANEL
  html += '<div style="width:280px;flex-shrink:0">' + prBuildLeft() + '</div>';

  // RIGHT PANEL
  html += '<div style="flex:1;min-width:300px">' + prBuildRight() + '</div>';

  html += '</div>';
  el.innerHTML = html;
}

/* ══════════════════════════════════════════════
   LEFT PANEL — institution selector
   ══════════════════════════════════════════════ */
function prBuildLeft() {
  var byCountry = {};
  PR_INSTITUTIONS.forEach(function(inst) {
    if (!byCountry[inst.country]) byCountry[inst.country] = [];
    byCountry[inst.country].push(inst);
  });

  var chips = '';
  ['ES','MX','CO','CL','AR','PE','BR'].forEach(function(cc) {
    if (!byCountry[cc] || !byCountry[cc].length) return;
    chips += '<div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin:10px 0 4px;padding-top:6px;border-top:1px solid var(--bd)">' + PR_COUNTRY_NAMES[cc] + '</div>';
    byCountry[cc].forEach(function(inst) {
      var sel = prSelected.has(inst.id);
      var col = inst.priority === 'High' ? '#1D9E75' : inst.priority === 'Med' ? '#2563EB' : '#999';
      var bg  = sel ? col + '18' : 'transparent';
      var bdr = sel ? col : 'var(--bd)';
      chips += '<div id="prchip-' + inst.id + '" onclick="prToggle(\'' + inst.id + '\')"'
        + ' style="display:flex;align-items:center;gap:6px;padding:5px 8px;border-radius:6px;border:1px solid ' + bdr + ';background:' + bg + ';cursor:pointer;margin-bottom:3px;font-size:11px;line-height:1.3">'
        + '<span style="width:6px;height:6px;border-radius:50%;background:' + col + ';flex-shrink:0"></span>'
        + '<span style="flex:1;color:var(--tx)">' + inst.name + '</span>'
        + '<span style="font-size:9px;color:var(--ht)">' + inst.type.split(' ')[0] + '</span>'
        + '</div>';
    });
  });

  var hunterKey = prGetKey();

  return '<div class="cd">'
    + '<div class="ch"><span class="ct">Instituciones</span>'
    + '<span class="bg bg-b" id="pr-badge">' + prSelected.size + ' / ' + PR_INSTITUTIONS.length + '</span></div>'

    + '<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px">'
    + '<button onclick="prAll()" style="padding:3px 9px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt)">Todas</button>'
    + '<button onclick="prHigh()" style="padding:3px 9px;border:1px solid #1D9E75;border-radius:var(--r);font-size:10px;cursor:pointer;background:#E1F5EE;color:#085041">Solo High</button>'
    + '<button onclick="prNone()" style="padding:3px 9px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt)">Limpiar</button>'
    + '</div>'

    + '<div style="max-height:380px;overflow-y:auto">' + chips + '</div>'

    + '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--bd)">'
    + '<label style="font-size:11px;font-weight:500;color:var(--ht);display:block;margin-bottom:5px">Hunter.io API Key <span style="font-size:10px;font-weight:400">(opcional)</span></label>'
    + '<input id="pr-hkey" class="fi" value="' + prEsc(hunterKey) + '" placeholder="xxxxxxxxxxxx" style="width:100%;font-size:11px;margin-bottom:4px">'
    + '<div style="font-size:10px;color:var(--ht)"><a href="https://hunter.io/api-keys" target="_blank" style="color:var(--green)">hunter.io</a> — 50 búsquedas gratis/mes</div>'
    + '</div>'

    + '<button onclick="prRun()" id="pr-run" style="width:100%;margin-top:12px;padding:10px;background:var(--green);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer">'
    + '&#128269; Buscar contactos</button>'

    + '<div id="pr-prog" style="display:none;margin-top:8px;font-size:11px;color:var(--mt);line-height:1.7"></div>'
    + '</div>';
}

/* ══════════════════════════════════════════════
   RIGHT PANEL — results table
   ══════════════════════════════════════════════ */
function prBuildRight() {
  if (!prResults.length) {
    return '<div class="cd" style="text-align:center;padding:40px 20px">'
      + '<div style="font-size:32px;margin-bottom:10px">&#127891;</div>'
      + '<div style="font-size:14px;font-weight:500;color:var(--tx);margin-bottom:6px">Buscador de alianzas universitarias</div>'
      + '<div style="font-size:12px;color:var(--mt);line-height:1.7;max-width:380px;margin:0 auto">'
      + 'Selecciona instituciones a la izquierda y pulsa <strong>Buscar contactos</strong>.<br><br>'
      + '<strong>Flujo:</strong> Hunter.io busca emails por dominio &rarr; Claude IA busca en la web los que Hunter no encuentra &rarr; genera pitch personalizado por institución.'
      + '</div></div>';
  }

  var total   = prResults.reduce(function(a,r){ return a + r.contacts.length; }, 0);
  var emails  = prResults.reduce(function(a,r){ return a + r.contacts.filter(function(c){ return !!c.email; }).length; }, 0);
  var pitches = prResults.filter(function(r){ return r.pitch; }).length;

  var tbody = '';
  prResults.forEach(function(r) {
    var inst = PR_INSTITUTIONS.find(function(i){ return i.id === r.instId; });
    if (!inst) return;

    if (!r.contacts.length) {
      tbody += '<tr style="background:var(--rp)">'
        + '<td style="padding:8px 10px;font-size:11px;color:var(--tx);font-weight:500">' + inst.name + '</td>'
        + '<td colspan="4" style="padding:8px 10px;font-size:11px;color:var(--ht)">Sin contactos encontrados</td>'
        + '<td style="padding:8px 10px"><button onclick="prEnrich(\'' + inst.id + '\')" style="padding:2px 8px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt)">IA &rarr;</button></td>'
        + '</tr>';
    } else {
      r.contacts.forEach(function(c, ci) {
        var confColor = c.confidence >= 80 ? 'var(--green)' : c.confidence >= 50 ? 'var(--amber)' : 'var(--ht)';
        tbody += '<tr style="' + (ci % 2 === 1 ? 'background:var(--sf2)' : '') + '">'
          + '<td style="padding:8px 10px;font-size:11px;color:var(--tx);font-weight:' + (ci === 0 ? '500' : '400') + '">' + (ci === 0 ? inst.name : '') + '</td>'
          + '<td style="padding:8px 10px;font-size:11px;color:var(--tx)">' + (c.name || '—') + '</td>'
          + '<td style="padding:8px 10px;font-size:11px;color:var(--mt)">' + (c.role || '—') + '</td>'
          + '<td style="padding:8px 10px;font-size:11px">'
          + (c.email ? '<span style="font-family:monospace;font-size:10px">' + c.email + '</span>' : '<span style="color:var(--ht)">—</span>')
          + (c.confidence ? ' <span style="color:' + confColor + ';font-size:10px">' + c.confidence + '%</span>' : '')
          + '</td>'
          + '<td style="padding:8px 10px;font-size:10px">'
          + (c.linkedin ? '<a href="' + c.linkedin + '" target="_blank" style="color:var(--green)">LinkedIn</a>' : '<span style="color:var(--ht)">—</span>')
          + '</td>'
          + '<td style="padding:8px 10px;font-size:10px;color:var(--ht)">' + (c.source || 'Hunter') + '</td>'
          + '</tr>';
      });
    }

    // Pitch row
    if (r.pitch) {
      tbody += '<tr style="background:var(--gp)">'
        + '<td colspan="6" style="padding:10px 12px">'
        + '<div style="font-size:10px;font-weight:600;color:var(--green2);margin-bottom:4px">&#9993; PITCH IA</div>'
        + '<div style="font-size:11px;color:var(--tx);white-space:pre-wrap;line-height:1.6">' + prEsc(r.pitch) + '</div>'
        + '</td></tr>';
    } else {
      tbody += '<tr><td colspan="6" style="padding:4px 10px;text-align:right">'
        + '<button onclick="prPitch(\'' + inst.id + '\')" style="padding:2px 9px;border:1px solid var(--bd2);border-radius:var(--r);font-size:10px;cursor:pointer;background:var(--sf2);color:var(--mt)">&#9993; Generar pitch</button>'
        + '</td></tr>';
    }
  });

  return '<div class="cd">'
    + '<div class="ch"><span class="ct">Resultados</span>'
    + '<div style="display:flex;gap:6px;align-items:center">'
    + '<span style="font-size:11px;color:var(--mt)">' + total + ' contactos &bull; ' + emails + ' emails &bull; ' + pitches + ' pitches</span>'
    + '<button onclick="prExport()" style="padding:3px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt)">&#8595; Excel</button>'
    + '<button onclick="prClear()" style="padding:3px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt)">Limpiar</button>'
    + '</div></div>'
    + '<div style="overflow-x:auto">'
    + '<table style="width:100%;border-collapse:collapse;font-size:12px">'
    + '<thead><tr style="background:var(--sf2)">'
    + '<th style="text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase">Institución</th>'
    + '<th style="text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase">Nombre</th>'
    + '<th style="text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase">Cargo</th>'
    + '<th style="text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase">Email</th>'
    + '<th style="text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase">LinkedIn</th>'
    + '<th style="text-align:left;padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase">Fuente</th>'
    + '</tr></thead>'
    + '<tbody>' + tbody + '</tbody>'
    + '</table></div></div>';
}

/* ══════════════════════════════════════════════
   CHIP INTERACTIONS
   ══════════════════════════════════════════════ */
function prToggle(id) {
  if (prSelected.has(id)) prSelected.delete(id);
  else prSelected.add(id);
  prRefreshChip(id);
  prRefreshBadge();
}
function prAll()  { PR_INSTITUTIONS.forEach(function(i){ prSelected.add(i.id);    prRefreshChip(i.id); }); prRefreshBadge(); }
function prHigh() { PR_INSTITUTIONS.forEach(function(i){ if(i.priority==='High') prSelected.add(i.id); else prSelected.delete(i.id); prRefreshChip(i.id); }); prRefreshBadge(); }
function prNone() { PR_INSTITUTIONS.forEach(function(i){ prSelected.delete(i.id); prRefreshChip(i.id); }); prRefreshBadge(); }

function prRefreshChip(id) {
  var el = document.getElementById('prchip-' + id);
  if (!el) return;
  var inst = PR_INSTITUTIONS.find(function(i){ return i.id === id; });
  if (!inst) return;
  var sel = prSelected.has(id);
  var col = inst.priority === 'High' ? '#1D9E75' : inst.priority === 'Med' ? '#2563EB' : '#999';
  el.style.borderColor = sel ? col : 'var(--bd)';
  el.style.background  = sel ? col + '18' : 'transparent';
}
function prRefreshBadge() {
  var b = document.getElementById('pr-badge');
  if (b) b.textContent = prSelected.size + ' / ' + PR_INSTITUTIONS.length;
}

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */
function prEsc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function prGetKey() {
  var k = (typeof CFG !== 'undefined' && CFG.hunter) ? CFG.hunter : '';
  if (!k) { try { k = JSON.parse(localStorage.getItem(PR_STORE)||'{}').hunterKey||''; } catch(e){} }
  return k;
}
function prSaveKey(key) {
  if (typeof CFG !== 'undefined') CFG.hunter = key;
  try { var d=JSON.parse(localStorage.getItem(PR_STORE)||'{}'); d.hunterKey=key; localStorage.setItem(PR_STORE,JSON.stringify(d)); } catch(e){}
}
function prSave() {
  try { var d=JSON.parse(localStorage.getItem(PR_STORE)||'{}'); d.results=prResults; d.selected=Array.from(prSelected); localStorage.setItem(PR_STORE,JSON.stringify(d)); } catch(e){}
}
function prRefreshRight() {
  var r = document.getElementById('pr-right');
  if (r) r.innerHTML = prBuildRight();
}

/* ══════════════════════════════════════════════
   HUNTER.IO API
   ══════════════════════════════════════════════ */
async function prHunter(domain, key) {
  var url = 'https://api.hunter.io/v2/domain-search?domain=' + encodeURIComponent(domain)
    + '&api_key=' + encodeURIComponent(key) + '&limit=10';
  var resp = await fetch(url);
  var data = await resp.json();
  if (!data.data || !data.data.emails) return [];
  return data.data.emails
    .filter(function(e) {
      var pos = (e.position || '').toLowerCase();
      return PR_ROLES.some(function(r){ return pos.indexOf(r) !== -1; });
    })
    .slice(0, 5)
    .map(function(e) {
      return {
        name: ((e.first_name||'') + ' ' + (e.last_name||'')).trim(),
        role: e.position || '',
        email: e.value || '',
        confidence: e.confidence || 0,
        linkedin: e.linkedin || '',
        source: 'Hunter.io'
      };
    });
}

/* ══════════════════════════════════════════════
   CLAUDE ENRICHMENT
   ══════════════════════════════════════════════ */
async function prEnrichClaude(inst) {
  try {
    var data = await apiFetch('/api/claude-proxy', { method:'POST', body:{ module:'prospecting', action:'enrich', payload:{ instName: inst.name, instCountry: inst.country, instDomain: inst.domain } } });
    return (data.contacts||[]).map(function(c){ c.source='Claude IA'; return c; });
  } catch(e) { return []; }
}

/* ══════════════════════════════════════════════
   PITCH GENERATOR
   ══════════════════════════════════════════════ */
async function prPitch(instId) {
  var inst = PR_INSTITUTIONS.find(function(i){ return i.id===instId; });
  if (!inst) return;
  var btn = document.querySelector('[onclick="prPitch(\'' + instId + '\')"]');
  if (btn) { btn.disabled=true; btn.textContent='Generando…'; }

  var result   = prResults.find(function(r){ return r.instId===instId; });
  var to       = (result && result.contacts.length) ? result.contacts[0].name : 'responsable de empleabilidad';

  try {
    var data = await apiFetch('/api/claude-proxy', { method:'POST', body:{ module:'prospecting', action:'pitch', payload:{ instName: inst.name, contactName: to } } });
    var pitch = data.pitch || '';
    var idx = prResults.findIndex(function(r){ return r.instId===instId; });
    if (idx >= 0) { prResults[idx].pitch = pitch; prSave(); }
    prRefreshRight();
  } catch(e) {
    if (btn) { btn.disabled=false; btn.textContent='&#9993; Generar pitch'; }
  }
}

async function prEnrich(instId) {
  var inst = PR_INSTITUTIONS.find(function(i){ return i.id===instId; });
  if (!inst) return;
  var btn = document.querySelector('[onclick="prEnrich(\'' + instId + '\')"]');
  if (btn) { btn.disabled=true; btn.textContent='Buscando…'; }
  var contacts = await prEnrichClaude(inst);
  var idx = prResults.findIndex(function(r){ return r.instId===instId; });
  if (idx >= 0) prResults[idx].contacts = contacts;
  else prResults.push({ instId:instId, contacts:contacts, pitch:'' });
  prSave();
  prRefreshRight();
}

/* ══════════════════════════════════════════════
   MAIN SEARCH
   ══════════════════════════════════════════════ */
async function prRun() {
  if (prRunning) return;
  if (!prSelected.size) { alert('Selecciona al menos una institución.'); return; }
  var keyEl = document.getElementById('pr-hkey');
  var key   = keyEl ? keyEl.value.trim() : prGetKey();
  if (key) prSaveKey(key);

  prRunning = true;
  var btn  = document.getElementById('pr-run');
  var prog = document.getElementById('pr-prog');
  if (btn)  { btn.disabled=true; btn.textContent='Buscando…'; }
  if (prog) prog.style.display = 'block';

  var insts = PR_INSTITUTIONS.filter(function(i){ return prSelected.has(i.id); });
  prResults = [];

  for (var i=0; i<insts.length; i++) {
    var inst = insts[i];
    if (prog) prog.innerHTML = '<strong>' + (i+1) + ' / ' + insts.length + '</strong> — ' + inst.name + '…';

    var contacts = [];
    if (key) {
      try { contacts = await prHunter(inst.domain, key); } catch(e) {}
    }
    if (!contacts.length) {
      if (prog) prog.innerHTML += '<br><span style="color:var(--ht)">Hunter vacío — probando Claude IA…</span>';
      try { contacts = await prEnrichClaude(inst); } catch(e) {}
    }
    prResults.push({ instId: inst.id, contacts: contacts, pitch: '' });
    if (i < insts.length-1) await new Promise(function(res){ setTimeout(res, 600); });
  }

  prSave();
  prRunning = false;
  if (btn)  { btn.disabled=false; btn.textContent='&#128269; Buscar contactos'; }
  if (prog) prog.style.display = 'none';
  prRefreshRight();
}

function prClear() {
  if (!confirm('¿Limpiar todos los resultados?')) return;
  prResults = [];
  prSave();
  prRefreshRight();
}

/* ══════════════════════════════════════════════
   EXPORT EXCEL
   ══════════════════════════════════════════════ */
function prExport() {
  if (!prResults.length) { alert('No hay resultados para exportar.'); return; }
  if (typeof XLSX === 'undefined') { alert('Recargando librería Excel…'); return; }

  var rows = [['Institución','País','Tipo','Prioridad','Nombre','Cargo','Email','Confianza %','LinkedIn','Fuente','Pitch']];
  prResults.forEach(function(r) {
    var inst = PR_INSTITUTIONS.find(function(i){ return i.id===r.instId; });
    if (!inst) return;
    if (!r.contacts.length) {
      rows.push([inst.name, inst.country, inst.type, inst.priority,'—','—','—','—','—','—', r.pitch||'']);
    } else {
      r.contacts.forEach(function(c,ci) {
        rows.push([inst.name, inst.country, inst.type, inst.priority, c.name||'', c.role||'', c.email||'', c.confidence||'', c.linkedin||'', c.source||'', ci===0 ? (r.pitch||'') : '']);
      });
    }
  });

  var ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [{wch:30},{wch:6},{wch:15},{wch:8},{wch:25},{wch:35},{wch:35},{wch:8},{wch:40},{wch:10},{wch:80}];
  var wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Contactos');

  var pitchRows = [['Institución','Pitch Email']];
  prResults.filter(function(r){ return r.pitch; }).forEach(function(r) {
    var inst = PR_INSTITUTIONS.find(function(i){ return i.id===r.instId; });
    if (inst) pitchRows.push([inst.name, r.pitch]);
  });
  if (pitchRows.length > 1) {
    var ws2 = XLSX.utils.aoa_to_sheet(pitchRows);
    ws2['!cols'] = [{wch:30},{wch:100}];
    XLSX.utils.book_append_sheet(wb, ws2, 'Pitches');
  }

  XLSX.writeFile(wb, 'PR_Prospecting_' + new Date().toISOString().split('T')[0] + '.xlsx');
}
