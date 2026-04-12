/* ═══════════════════════════════════════════════
   BRAND IDENTITY UI — Editor de identidad de marca
   Lee/escribe a Supabase via /api/user-data.
   Los arquetipos se definen aquí (son info pública).
   La función buildIdentityContext() NO está aquí.
   ═══════════════════════════════════════════════ */

// ── Arquetipos (metadata pública — no son IP) ──
const BI_ARCHETYPES_UI = {
  mentor:   { label: 'El Mentor',          icon: '🧭', desc: 'Ve lo que el cliente no ve. Da claridad y perspectiva con autoridad sin condescendencia.' },
  retador:  { label: 'El Retador',         icon: '⚡', desc: 'Dice lo que nadie más se atreve. Confronta la comodidad con precisión quirúrgica.' },
  narrador: { label: 'El Narrador',        icon: '✍️', desc: 'Encuentra la historia y la hace poderosa. Estructura lo que parece caótico.' },
  heroe:    { label: 'El Héroe Compasivo', icon: '🔥', desc: 'Ha pasado por lo mismo. Sabe lo que duele. Empuja con calidez.' },
  cuidador: { label: 'El Cuidador',        icon: '🛡️', desc: 'Contiene, apoya, da seguridad. El cliente se siente acompañado.' },
  experto:  { label: 'El Experto',         icon: '🔬', desc: 'Habla con autoridad y datos reales. El mercado es un sistema que se puede dominar.' },
};

// ── Cache local para no esperar en cada tab switch ──
let BI_CACHE = null;
let BI_LOADED = false;

// ── Cargar identidad desde Supabase ──
async function biLoadFromServer() {
  try {
    const data = await apiFetch('/api/user-data?module=identity&key=brand_identity');
    if (data && data.data_value) {
      BI_CACHE = data.data_value;
      BI_LOADED = true;
      return BI_CACHE;
    }
  } catch(e) {
    console.warn('[identity-ui] No se pudo cargar identidad del servidor:', e.message);
  }
  // No hay datos guardados — devolver vacío
  BI_CACHE = {};
  BI_LOADED = true;
  return BI_CACHE;
}

// ── Guardar identidad a Supabase ──
async function biSaveToServer(data) {
  await apiFetch('/api/user-data', {
    method: 'POST',
    body: {
      module: 'identity',
      key: 'brand_identity',
      value: data
    }
  });
  BI_CACHE = data;
}

// ── Obtener datos (cache-first) ──
async function biGetData() {
  if (BI_LOADED && BI_CACHE) return BI_CACHE;
  return await biLoadFromServer();
}


// ── Render identity editor tab ──
async function renderIdentityTab() {
  const el = document.getElementById('cs-identity-panel');
  if (!el) return;

  // Mostrar loading mientras carga
  el.innerHTML = '<div style="padding:32px;text-align:center;color:var(--ht)">Cargando identidad de marca…</div>';

  const d = await biGetData();

  const esc = v => String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const arcRows = [1,2,3].map(n => {
    const key = d[`arc${n}`] || (n===1?'mentor':n===2?'retador':'narrador');
    const pct = d[`arc${n}_pct`] || (n===1?45:n===2?35:20);
    const opts = Object.entries(BI_ARCHETYPES_UI).map(([k,a]) =>
      `<option value="${esc(k)}" ${key===k?'selected':''}>${a.icon} ${a.label}</option>`
    ).join('');
    return `<div style="display:flex;gap:6px;align-items:center;margin-bottom:6px">
      <select class="fi" id="bi-arc${n}" onchange="biUpdateArcRow(${n})" style="flex:2">${opts}</select>
      <input type="number" class="fi" id="bi-arc${n}-pct" value="${pct}" min="0" max="100" step="5" oninput="biValidatePct()" style="width:60px;text-align:center">
      <span style="font-size:11px;color:var(--mt)">%</span>
    </div>
    <div id="bi-arc${n}-desc" style="font-size:11px;color:var(--mt);margin-bottom:8px;padding-left:4px">${BI_ARCHETYPES_UI[key]?.desc || ''}</div>`;
  }).join('');

  el.innerHTML = `<div style="padding:16px">
    <div style="margin-bottom:16px">
      <div style="font-size:14px;font-weight:600;margin-bottom:4px">Identidad de marca</div>
      <div style="font-size:12px;color:var(--mt)">Los agentes usan esta información para generar contenido alineado con tu marca. Se sincroniza automáticamente.</div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Datos básicos</div>
      <div class="bi-row"><label class="bi-label">Empresa / Marca</label><input class="fi bi-input" id="bi-empresa" placeholder="Nombre de tu empresa o marca"></div>
      <div class="bi-row"><label class="bi-label">Servicio principal</label><input class="fi bi-input" id="bi-servicio" placeholder="Ej: Consultoría de marketing digital"></div>
      <div class="bi-row"><label class="bi-label">Mercados</label><input class="fi bi-input" id="bi-mercados" placeholder="Ej: España, UK, LATAM"></div>
      <div class="bi-row"><label class="bi-label">Servicios en detalle</label><input class="fi bi-input" id="bi-servicios" placeholder="Ej: Auditoría, Plan estratégico, Acompañamiento"></div>
      <div class="bi-row"><label class="bi-label">CTA principal</label><input class="fi bi-input" id="bi-cta" placeholder="Ej: Agenda una llamada gratuita en tudominio.com"></div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Voz de marca — Arquetipos <span class="bi-hint">(deben sumar 100%)</span></div>
      <div id="bi-pct-warning" style="display:none;font-size:11px;color:var(--red);margin-bottom:6px;padding:6px 8px;background:var(--rp);border-radius:var(--r)">⚠ Los porcentajes deben sumar 100%</div>
      ${arcRows}
      <div style="font-size:11px;color:var(--mt);margin-top:4px">Total: <span id="bi-pct-sum" style="font-weight:500">100</span>%</div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Cliente ideal</div>
      <div class="bi-row"><label class="bi-label">Perfil</label><textarea class="fi bi-textarea" id="bi-perfil" placeholder="Describe a tu cliente ideal: edad, situación, qué busca..."></textarea></div>
      <div class="bi-row"><label class="bi-label">Momento emocional <span class="bi-hint">(qué siente justo antes de contactarte)</span></label><textarea class="fi bi-textarea" id="bi-momento" placeholder="¿Qué frustración o necesidad tiene en este momento?"></textarea></div>
      <div class="bi-row"><label class="bi-label">Qué desea en el fondo</label><textarea class="fi bi-textarea" id="bi-deseo" placeholder="¿Cuál es el resultado ideal que busca?"></textarea></div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Propuesta de valor</div>
      <div class="bi-row"><label class="bi-label">USP 1</label><input class="fi bi-input" id="bi-usp1" placeholder="Tu primera propuesta de valor única"></div>
      <div class="bi-row"><label class="bi-label">USP 2</label><input class="fi bi-input" id="bi-usp2" placeholder="Segunda propuesta de valor"></div>
      <div class="bi-row"><label class="bi-label">USP 3</label><input class="fi bi-input" id="bi-usp3" placeholder="Tercera propuesta de valor"></div>
      <div class="bi-row"><label class="bi-label">Diferenciador vs competencia</label><textarea class="fi bi-textarea" id="bi-diferenciador" placeholder="¿Qué te hace diferente de la competencia?"></textarea></div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Qué NUNCA publicaría esta marca</div>
      <div class="bi-row"><textarea class="fi bi-textarea" id="bi-no-hacer" style="min-height:80px" placeholder="Tipos de contenido, tono o mensajes que tu marca nunca usaría..."></textarea></div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Notas de voz</div>
      <div class="bi-row"><textarea class="fi bi-textarea" id="bi-voz" placeholder="Define el tono de tu marca: formal/informal, directa, técnica, cercana..."></textarea></div>
    </div>

    <div class="bi-section">
      <div class="bi-section-title">Ejemplos de voz real <span class="bi-hint">(opcional — los agentes aprenden de estos)</span></div>
      <div class="bi-row"><textarea class="fi bi-textarea" id="bi-ejemplo" style="min-height:120px" placeholder="Pega frases, párrafos o posts que representen bien la voz de la marca."></textarea></div>
    </div>

    <div style="display:flex;gap:8px;margin-top:8px">
      <button onclick="biSaveForm()" id="bi-save-btn" style="flex:1;padding:10px;background:var(--green);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">Guardar identidad</button>
      <button onclick="biResetForm()" style="padding:10px 16px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:'DM Sans',sans-serif">Limpiar todo</button>
    </div>
    <div id="bi-save-msg" style="display:none;font-size:12px;color:var(--green);margin-top:8px;text-align:center">✓ Identidad guardada — todos los agentes la usarán en la próxima generación</div>
  </div>`;

  // Set values via JS (avoids HTML injection)
  const setVal = (id, val) => { const el2 = document.getElementById(id); if (el2) el2.value = val || ''; };
  setVal('bi-empresa', d.empresa);
  setVal('bi-servicio', d.servicio);
  setVal('bi-mercados', d.mercados);
  setVal('bi-servicios', d.servicios_detalle);
  setVal('bi-cta', d.cta_principal);
  setVal('bi-perfil', d.audiencia_perfil);
  setVal('bi-momento', d.audiencia_momento);
  setVal('bi-deseo', d.audiencia_deseo);
  setVal('bi-usp1', d.usp1);
  setVal('bi-usp2', d.usp2);
  setVal('bi-usp3', d.usp3);
  setVal('bi-diferenciador', d.diferenciador);
  setVal('bi-no-hacer', d.no_hacer);
  setVal('bi-voz', d.voz_notas);
  setVal('bi-ejemplo', d.ejemplo_contenido);

  biValidatePct();
}


// ── Arc row change ──
function biUpdateArcRow(n) {
  const key = document.getElementById(`bi-arc${n}`)?.value;
  const descEl = document.getElementById(`bi-arc${n}-desc`);
  if (descEl) descEl.textContent = key && BI_ARCHETYPES_UI[key] ? BI_ARCHETYPES_UI[key].desc : '';
  biValidatePct();
}

// ── Validate percentages ──
function biValidatePct() {
  const sum = [1,2,3].reduce((a,n) => {
    const v = parseInt(document.getElementById(`bi-arc${n}-pct`)?.value || 0);
    return a + (isNaN(v) ? 0 : v);
  }, 0);
  const sumEl = document.getElementById('bi-pct-sum');
  const warn = document.getElementById('bi-pct-warning');
  if (sumEl) { sumEl.textContent = sum; sumEl.style.color = sum === 100 ? 'var(--green)' : 'var(--red)'; }
  if (warn) warn.style.display = sum !== 100 ? 'block' : 'none';
}


// ── Save identity to Supabase ──
async function biSaveForm() {
  const sum = [1,2,3].reduce((a,n) => a + (parseInt(document.getElementById(`bi-arc${n}-pct`)?.value||0)||0), 0);
  if (sum !== 100) { alert('Los porcentajes de arquetipos deben sumar exactamente 100%.'); return; }

  const data = {
    empresa: document.getElementById('bi-empresa')?.value.trim()||'',
    servicio: document.getElementById('bi-servicio')?.value.trim()||'',
    mercados: document.getElementById('bi-mercados')?.value.trim()||'',
    servicios_detalle: document.getElementById('bi-servicios')?.value.trim()||'',
    cta_principal: document.getElementById('bi-cta')?.value.trim()||'',
    arc1: document.getElementById('bi-arc1')?.value||'',
    arc1_pct: parseInt(document.getElementById('bi-arc1-pct')?.value||0),
    arc2: document.getElementById('bi-arc2')?.value||'',
    arc2_pct: parseInt(document.getElementById('bi-arc2-pct')?.value||0),
    arc3: document.getElementById('bi-arc3')?.value||'',
    arc3_pct: parseInt(document.getElementById('bi-arc3-pct')?.value||0),
    audiencia_perfil: document.getElementById('bi-perfil')?.value.trim()||'',
    audiencia_momento: document.getElementById('bi-momento')?.value.trim()||'',
    audiencia_deseo: document.getElementById('bi-deseo')?.value.trim()||'',
    usp1: document.getElementById('bi-usp1')?.value.trim()||'',
    usp2: document.getElementById('bi-usp2')?.value.trim()||'',
    usp3: document.getElementById('bi-usp3')?.value.trim()||'',
    diferenciador: document.getElementById('bi-diferenciador')?.value.trim()||'',
    no_hacer: document.getElementById('bi-no-hacer')?.value.trim()||'',
    voz_notas: document.getElementById('bi-voz')?.value.trim()||'',
    ejemplo_contenido: document.getElementById('bi-ejemplo')?.value.trim()||'',
  };

  const btn = document.getElementById('bi-save-btn');
  btn.disabled = true;
  btn.textContent = 'Guardando…';

  try {
    await biSaveToServer(data);
    const msg = document.getElementById('bi-save-msg');
    if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000); }
  } catch(e) {
    alert('Error al guardar: ' + e.message);
  }

  btn.disabled = false;
  btn.textContent = 'Guardar identidad';
}


// ── Reset form ──
async function biResetForm() {
  if (!confirm('¿Limpiar todos los campos? Esto eliminará tu identidad guardada.')) return;
  try {
    await biSaveToServer({});
    BI_CACHE = {};
    renderIdentityTab();
  } catch(e) {
    alert('Error al limpiar: ' + e.message);
  }
}
