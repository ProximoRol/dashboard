/* ═══════════════════════════════════════════════
   BRAND IDENTITY — Variables editables de marca
   Usadas por todos los agentes de Content Studio
   ═══════════════════════════════════════════════ */

const BI_STORE = 'pr_brand_identity_v1';

const BI_DEFAULTS = {
  empresa: 'Próximo Rol',
  servicio: 'Coaching de entrevistas de trabajo — Método StoryRole™',
  web: 'https://www.proximorol.com',
  mercados: 'España, UK y LATAM',
  servicios_detalle: 'Sesión única, Pack completo, Acompañamiento total',

  arc1: 'mentor',   arc1_pct: 45,
  arc2: 'retador',  arc2_pct: 35,
  arc3: 'narrador', arc3_pct: 20,

  audiencia_perfil: 'Profesional cualificado de 28-45 años. Tiene la experiencia necesaria para el rol — lo sabe. Pero lleva semanas o meses sin pasar entrevistas y no entiende por qué. Ha mandado CVs, ha tenido llamadas, ha llegado a finales. Y sigue sin la oferta.',

  audiencia_momento: 'Viene del rechazo repetido. Ha perdido confianza en sí mismo aunque intenta disimularlo. Siente que algo falla pero no sabe qué. Está empezando a dudar de su propia valía profesional. En el peor momento: a las puertas de la desesperación, aunque lo llame "estar un poco cansado del proceso". No quiere que le digan que puede hacerlo — quiere que alguien le diga exactamente qué está haciendo mal y cómo arreglarlo.',

  audiencia_deseo: 'Entrar a su próxima entrevista sabiendo que tiene una historia clara, coherente y poderosa. Sentirse orgulloso de lo que ha hecho — no arrogante. Que el entrevistador no solo le entienda, sino que le sienta. Que la oferta llegue y que tenga sentido haberla conseguido.',

  usp1: 'Encontramos TU historia — no una historia genérica, la tuya, de la que puedas sentirte orgulloso. Lo impresionante ya está ahí, solo hay que saber mostrarlo.',
  usp2: 'Vemos lo que tú no puedes ver. Cuando estás demasiado cerca de tu propia trayectoria, no logras verla con claridad. Nosotros sí.',
  usp3: 'Hemos estado en los dos lados de la mesa: hemos buscado trabajo Y hemos tomado decisiones de hiring en distintos países, industrias y niveles. Sabemos exactamente lo que busca el reclutador Y lo que quiere tu próximo jefe. Son dos cosas distintas.',

  diferenciador: 'La mayoría de coaches te enseñan a responder preguntas. Nosotros te ayudamos a construir tu narrativa primero — porque sin una historia coherente, las respuestas suenan a improvisación aunque sean técnicamente correctas. El Método StoryRole™ es un proceso de 4 fases: Diagnóstico → Construcción de narrativa → Simulacros reales → Preparación por empresa.',

  no_hacer: 'Recetas copy-paste que prometen que si repites estas frases vas a pasar la entrevista. Consejos de autoayuda vacíos ("¡Tú puedes!", "El éxito te espera", "Confía en ti mismo"). Listas de tips genéricas que cualquiera podría dar sin conocer al candidato. Contenido que da la respuesta sin explicar el mecanismo psicológico detrás. Nada que haga pensar que basta con una técnica para solucionar algo que requiere construir desde dentro.',

  voz_notas: 'Directa y sin rodeos — dice lo que otros coaches no se atreven a decir. Habla de tú. No usa jerga de autoayuda. Siempre da el por qué psicológico detrás del qué. Usa datos con citaciones reales. Usa casos reales (anonimizados) con números concretos. Crea frameworks con nombre. Primera frase siempre debe incomodar un poco — en el buen sentido. El entrevistador recuerda cómo le hiciste sentir, no lo que dijiste.',

  cta_principal: 'Reserva una llamada gratuita de 15 minutos en proximorol.com',

  ejemplo_contenido: `Frase de apertura de la web: "Tu experiencia Sí es buena. Solo que la estás contando fatal."

Apertura de blog: "Cada semana hablamos con profesionales que han fallado una entrevista que 'deberían haber pasado'. Tienen el perfil, la experiencia, los logros. Y sin embargo, salen de la sala —o cierran la videollamada— con esa sensación incómoda de que algo no cuadró."

Pullquote: "Practicar respuestas sin tener una narrativa clara es como aprender frases sueltas en un idioma que no entiendes."

Estadística con fuente: "El 63% de los profesionales nunca negocia su primera oferta — y deja entre €5.000 y €20.000 al año sobre la mesa." (Babcock & Laschever, Carnegie Mellon University, 2003)

Sobre el método: "No vas a improvisar. Eso no es una opción."`,
};

const BI_ARCHETYPES = {
  mentor:   { label: 'El Mentor',          icon: '🧭', desc: 'Ve lo que tú no ves. Da claridad y perspectiva con autoridad sin condescendencia.', voice: 'Habla con la calma de quien ha guiado a muchos por este camino exacto. Sus palabras crean un "ajá" en el lector. No da órdenes — ilumina. Usa la distancia como ventaja: "Cuando estás demasiado cerca de tu historia, no puedes verla."' },
  retador:  { label: 'El Retador',         icon: '⚡', desc: 'Dice lo que nadie más se atreve. Confronta la comodidad con precisión quirúrgica.', voice: 'Nombra el problema con exactitud incómoda pero sin crueldad. "Tu experiencia Sí es buena. Solo que la estás contando fatal." Confronta suavemente — provoca reflexión, no defensiva. Siempre da el mecanismo, no solo el veredicto.' },
  narrador: { label: 'El Narrador',        icon: '✍️', desc: 'Encuentra la historia en la trayectoria y la hace poderosa. Estructura lo que parece caótico.', voice: 'Empieza con una escena concreta. Hace que el lector se vea reflejado. Transforma datos fríos en momentos humanos. "El entrevistador no recuerda listas de logros. Recuerda cómo le hiciste sentir."' },
  heroe:    { label: 'El Héroe Compasivo', icon: '🔥', desc: 'Ha pasado por el rechazo. Sabe lo que duele. Empuja con calidez.', voice: 'Valida antes de proponer. Crea la sensación de "alguien que entiende de verdad". No juzga el punto de partida — solo trabaja para cambiarlo.' },
  cuidador: { label: 'El Cuidador',        icon: '🛡️', desc: 'Contiene, apoya, da seguridad. El cliente se siente acompañado, no solo entrenado.', voice: '"No te dejamos solo en ningún momento." Tono cálido y contenedor. Valida emociones antes de dar soluciones.' },
  experto:  { label: 'El Experto',         icon: '🔬', desc: 'Habla con autoridad y datos reales. El mercado laboral es un sistema que se puede dominar.', voice: 'Cita estudios con autor y año. Usa números concretos. "El 87% de los reclutadores espera y acepta algún tipo de negociación." Desmitifica con hechos.' },
};

function biLoad() {
  try {
    const stored = JSON.parse(localStorage.getItem(BI_STORE) || 'null');
    return stored ? { ...BI_DEFAULTS, ...stored } : { ...BI_DEFAULTS };
  } catch(e) { return { ...BI_DEFAULTS }; }
}

function biSave(data) {
  try { localStorage.setItem(BI_STORE, JSON.stringify(data)); } catch(e) {}
}

function biGetContext() {
  const d = biLoad();
  const arcs = [
    { key: d.arc1, pct: parseInt(d.arc1_pct) || 0 },
    { key: d.arc2, pct: parseInt(d.arc2_pct) || 0 },
    { key: d.arc3, pct: parseInt(d.arc3_pct) || 0 },
  ].filter(a => a.key && a.pct > 0 && BI_ARCHETYPES[a.key]);

  const arcText = arcs.map(a => {
    const arc = BI_ARCHETYPES[a.key];
    return `• ${arc.label} (${a.pct}%): ${arc.voice}`;
  }).join('\n');

  return `
═══════════════════════════════════════════════
IDENTIDAD DE MARCA — LEE ESTO ANTES DE GENERAR
═══════════════════════════════════════════════
EMPRESA: ${d.empresa}
MÉTODO PROPIO: StoryRole™ — proceso de 4 fases: Diagnóstico → Narrativa → Simulacros → Preparación por empresa
MERCADOS: ${d.mercados}
SERVICIOS: ${d.servicios_detalle}
WEB: ${d.web}

VOZ DE MARCA — ARQUETIPOS (el % define el peso de cada uno):
${arcText}

CLIENTE IDEAL:
Perfil: ${d.audiencia_perfil}
Momento emocional: ${d.audiencia_momento}
Qué desea: ${d.audiencia_deseo}

PROPUESTA DE VALOR ÚNICA:
1. ${d.usp1}
2. ${d.usp2}
3. ${d.usp3}

DIFERENCIADOR VS COMPETENCIA:
${d.diferenciador}

JAMÁS HACER:
${d.no_hacer}

NOTAS DE VOZ:
${d.voz_notas}

CTA PRINCIPAL: ${d.cta_principal}
${d.ejemplo_contenido ? `\nEJEMPLOS DE VOZ Y TONO REAL DE LA MARCA (aprende de estos):\n${d.ejemplo_contenido}` : ''}
═══════════════════════════════════════════════`;
}

/* ── Render identity tab ── */
function renderIdentityTab() {
  const d = biLoad();
  const el = document.getElementById('cs-identity-panel');
  if (!el) return;

  // Helper: escape HTML attribute values
  const esc = v => String(v||'').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

  const arcRows = [1,2,3].map(n => {
    const key = d[`arc${n}`] || '';
    const pct = d[`arc${n}_pct`] || (n===1?45:n===2?35:20);
    const opts = Object.entries(BI_ARCHETYPES).map(([k,a]) =>
      `<option value="${esc(k)}" ${key===k?'selected':''}>${a.icon} ${a.label}</option>`
    ).join('');
    const desc = key && BI_ARCHETYPES[key] ? esc(BI_ARCHETYPES[key].desc) : '';
    return `<div class="bi-arc-row">
      <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
        <span style="font-size:11px;font-weight:600;color:var(--ht);width:24px">A${n}</span>
        <select class="fi bi-arc-select" id="bi-arc${n}" onchange="biUpdateArcRow(${n})" style="flex:1;font-family:'DM Sans',sans-serif;cursor:pointer">
          <option value="">— Sin arquetipo —</option>${opts}
        </select>
        <div style="display:flex;align-items:center;gap:5px">
          <input type="number" class="fi" id="bi-arc${n}-pct" value="${pct}" min="0" max="100" step="5" oninput="biValidatePct()" style="width:60px;text-align:center;font-family:'DM Mono',monospace">
          <span style="font-size:11px;color:var(--ht)">%</span>
        </div>
      </div>
      <div id="bi-arc${n}-desc" style="font-size:11px;color:var(--mt);margin-left:32px;font-style:italic;line-height:1.5">${desc}</div>
    </div>`;
  }).join('');

  // Build safe scaffold — textareas and inputs set via JS after render
  el.innerHTML = `
    <div class="cd" style="max-width:720px">
      <div class="ch"><span class="ct">Identidad de marca</span><span class="bg bg-p">Usada por todos los agentes</span></div>
      <div style="padding:4px 0">
        <div style="font-size:12px;color:var(--mt);margin-bottom:16px;line-height:1.6">Rellena esto una vez. Todos los agentes lo leen antes de generar. Si cambias de empresa, cambias estos valores y toda la voz cambia.</div>

        <div class="bi-section">
          <div class="bi-section-title">Datos básicos</div>
          <div class="bi-row"><label class="bi-label">Empresa</label><input class="fi bi-input" id="bi-empresa"></div>
          <div class="bi-row"><label class="bi-label">Servicio principal</label><input class="fi bi-input" id="bi-servicio"></div>
          <div class="bi-row"><label class="bi-label">Mercados</label><input class="fi bi-input" id="bi-mercados"></div>
          <div class="bi-row"><label class="bi-label">Servicios (detalle)</label><input class="fi bi-input" id="bi-servicios"></div>
          <div class="bi-row"><label class="bi-label">CTA principal</label><input class="fi bi-input" id="bi-cta"></div>
        </div>

        <div class="bi-section">
          <div class="bi-section-title">Arquetipos de marca — máx. 3, deben sumar 100%</div>
          <div style="font-size:11px;color:var(--ht);margin-bottom:12px">El % define cuánto peso tiene cada arquetipo en el tono generado.</div>
          ${arcRows}
          <div id="bi-pct-warning" style="font-size:11px;color:var(--red);display:none;margin-top:6px">⚠ Los porcentajes deben sumar exactamente 100%</div>
          <div style="font-size:11px;color:var(--mt);margin-top:4px">Total: <span id="bi-pct-sum" style="font-weight:500">100</span>%</div>
        </div>

        <div class="bi-section">
          <div class="bi-section-title">Cliente ideal</div>
          <div class="bi-row"><label class="bi-label">Perfil</label><textarea class="fi bi-textarea" id="bi-perfil"></textarea></div>
          <div class="bi-row"><label class="bi-label">Momento emocional <span class="bi-hint">(qué siente justo antes de contactarte)</span></label><textarea class="fi bi-textarea" id="bi-momento"></textarea></div>
          <div class="bi-row"><label class="bi-label">Qué desea en el fondo</label><textarea class="fi bi-textarea" id="bi-deseo"></textarea></div>
        </div>

        <div class="bi-section">
          <div class="bi-section-title">Propuesta de valor</div>
          <div class="bi-row"><label class="bi-label">USP 1</label><input class="fi bi-input" id="bi-usp1"></div>
          <div class="bi-row"><label class="bi-label">USP 2</label><input class="fi bi-input" id="bi-usp2"></div>
          <div class="bi-row"><label class="bi-label">USP 3</label><input class="fi bi-input" id="bi-usp3"></div>
          <div class="bi-row"><label class="bi-label">Diferenciador vs competencia</label><textarea class="fi bi-textarea" id="bi-diferenciador"></textarea></div>
        </div>

        <div class="bi-section">
          <div class="bi-section-title">Qué NUNCA publicaría esta marca</div>
          <div class="bi-row"><textarea class="fi bi-textarea" id="bi-no-hacer" style="min-height:80px"></textarea></div>
        </div>

        <div class="bi-section">
          <div class="bi-section-title">Notas de voz</div>
          <div class="bi-row"><textarea class="fi bi-textarea" id="bi-voz"></textarea></div>
        </div>

        <div class="bi-section">
          <div class="bi-section-title">Ejemplos de voz real <span class="bi-hint">(opcional — los agentes aprenden de estos)</span></div>
          <div class="bi-row"><textarea class="fi bi-textarea" id="bi-ejemplo" style="min-height:120px" placeholder="Pega frases, párrafos o posts que representen bien la voz de la marca."></textarea></div>
        </div>

        <div style="display:flex;gap:8px;margin-top:8px">
          <button onclick="biSaveForm()" style="flex:1;padding:10px;background:var(--green);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif">Guardar identidad</button>
          <button onclick="biResetForm()" style="padding:10px 16px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:'DM Sans',sans-serif">Restaurar defaults</button>
        </div>
        <div id="bi-save-msg" style="display:none;font-size:12px;color:var(--green);margin-top:8px;text-align:center">✓ Identidad guardada — todos los agentes la usarán en la próxima generación</div>
      </div>
    </div>`;

  // Set values safely via JS (avoids HTML injection issues with quotes etc.)
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
}

function biUpdateArcRow(n) {
  const key = document.getElementById(`bi-arc${n}`)?.value;
  const descEl = document.getElementById(`bi-arc${n}-desc`);
  if (descEl) descEl.textContent = key && BI_ARCHETYPES[key] ? BI_ARCHETYPES[key].desc : '';
  biValidatePct();
}

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

function biSaveForm() {
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
  biSave(data);
  const msg = document.getElementById('bi-save-msg');
  if (msg) { msg.style.display = 'block'; setTimeout(() => msg.style.display = 'none', 3000); }
}

function biResetForm() {
  if (!confirm('¿Restaurar todos los valores a los defaults de Próximo Rol?')) return;
  biSave(BI_DEFAULTS);
  renderIdentityTab();
}
