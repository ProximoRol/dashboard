/* ═══════════════════════════════════════════════
   INTELLIGENCE — GA4 Intel, Ads AI, KWI, SERP,
   Keyword Economics, SEO, Info Modal, Reports
   Depends on: core.js, analytics.js
   ═══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   GA4 INTELLIGENCE — FALLBACKS + AUTO-LOAD + RENDERERS
   ══════════════════════════════════════════════════════ */

const FALLBACK_RECS = [
  {icon:'🔍',priority:'high',title:'Lanzar campañas de búsqueda no-branded',meta:'Google Ads · Alto impacto',steps:['Identificar las 10 keywords no-branded de mayor volumen en España y LATAM desde GSC','Crear grupos de anuncios temáticos por servicio: "coaching entrevistas", "preparación entrevistas trabajo"','Escribir 3 RSAs por grupo con mensajes específicos al mercado hispanohablante','Configurar pujas de maximización de clics inicial y optimizar hacia conversiones'],kpis:[{v:'3-5x',l:'ROAS estimado'},{v:'+40%',l:'Tráfico orgánico'}],timeframe:'2-3 semanas',effort:'Medium'},
  {icon:'📝',priority:'high',title:'Optimizar landing pages por servicio',meta:'Conversión · Alto impacto',steps:['Auditar páginas de sesión única, pack completo y acompañamiento total','Añadir CTA claro above the fold: "Reserva tu sesión gratuita"','Incluir prueba social: testimonios, número de profesionales preparados','A/B test: formulario de contacto vs. botón de reserva directa'],kpis:[{v:'+25%',l:'Tasa de conversión'},{v:'-15%',l:'Tasa de rebote'}],timeframe:'1-2 semanas',effort:'Low'},
  {icon:'✍️',priority:'high',title:'Crear hub de contenido para búsqueda orgánica',meta:'SEO · Alto impacto',steps:['Mapear clusters de keywords: "cómo preparar entrevista trabajo", "preguntas entrevista laboral España"','Crear página pilar: "Guía completa para entrevistas de trabajo 2025"','Publicar 8-10 posts de apoyo en español targeting long-tail de España y LATAM','Añadir enlaces internos desde páginas de servicios al hub'],kpis:[{v:'+60%',l:'Tráfico orgánico'},{v:'Top 5',l:'Posición en España'}],timeframe:'6-8 semanas',effort:'High'},
  {icon:'🎯',priority:'med',title:'Configurar tracking de conversiones en GA4',meta:'Analytics · Crítico',steps:['Definir eventos clave: form_submit, reserva_sesion, contacto_whatsapp','Configurar tags en Google Tag Manager para cada evento','Crear objetivos en GA4 vinculados a cada conversión','Conectar GA4 con Google Ads para optimización de pujas inteligente'],kpis:[{v:'100%',l:'Visibilidad ROI'},{v:'2x',l:'Eficiencia de puja'}],timeframe:'1 semana',effort:'Low'},
  {icon:'💼',priority:'med',title:'Campaña de LinkedIn para profesionales hispanos',meta:'LinkedIn · Impacto medio',steps:['Publicar 3x/semana: consejos entrevistas, historias de éxito, insights del mercado laboral','Segmentar: profesionales mid-senior en España, México, Colombia, Argentina','Patrocinar los 3 posts orgánicos con mayor engagement','Retargeting a visitantes web con casos de éxito en carrusel'],kpis:[{v:'+35%',l:'Brand awareness'},{v:'8-12',l:'Leads/mes'}],timeframe:'4-6 semanas',effort:'Medium'},
  {icon:'📧',priority:'low',title:'Secuencia de nurturing para leads de entrevistas',meta:'Email · Continuo',steps:['Segmentar leads por tipo de servicio de interés','Construir 5 emails: bienvenida → educación metodología → caso de éxito → objeción precio → CTA sesión','Personalizar por sector y mercado (España vs LATAM)','KPIs objetivo: tasa de apertura >30%, clic >5%'],kpis:[{v:'+20%',l:'Calidad de leads'},{v:'30%',l:'Objetivo apertura'}],timeframe:'2-3 semanas',effort:'Medium'},
];

const FALLBACK_ERRORS = [
  {severity:'critical',title:'Sin eventos de conversión configurados',desc:'GA4 no tiene objetivos ni eventos definidos. Sin esto, no puedes medir el ROI ni optimizar campañas hacia conversiones reales.'},
  {severity:'critical',title:'Google Ads no vinculado a GA4',desc:'Sin este enlace, el smart bidding no puede optimizar hacia conversiones reales. Vincular en Admin GA4 → Google Ads Linking.'},
  {severity:'warning',title:'Tráfico casi 100% de marca (branded)',desc:'Los usuarios encuentran Próximo Rol buscando directamente el nombre. Se necesitan urgentemente campañas y SEO non-branded para captar nuevos usuarios.'},
  {severity:'warning',title:'Sin audiencias de remarketing definidas',desc:'No estás capturando visitantes para retargeting. Crea audiencias en GA4 basadas en páginas visitadas para campañas de remarketing en Ads y LinkedIn.'},
  {severity:'warning',title:'URLs de campañas sin parámetros UTM',desc:'El tráfico de email y redes sociales aparece como "Direct" en GA4. Añade UTM params a todos los enlaces de campañas para atribución correcta.'},
  {severity:'info',title:'Tráfico internacional sin segmentar',desc:'Revisar si el tráfico de LATAM está siendo correctamente atribuido. Considera crear vistas o propiedades separadas por mercado (España vs LATAM).'},
  {severity:'info',title:'LinkedIn Insight Tag no configurado',desc:'Instala el LinkedIn Insight Tag en la web para activar remarketing a visitantes y medir conversiones desde LinkedIn Ads.'},
  {severity:'info',title:'Datos de Search Console limitados a 28 días',desc:'Exporta datos GSC mensualmente para mantener histórico de keywords. Los datos desaparecen tras 16 meses en la plataforma.'},
];

const FALLBACK_KEYWORDS = [
  {kw:'coaching de entrevistas España',intent:'Comercial',vol:'880',diff:'Medium',priority:'p1',source:'GSC'},
  {kw:'preparación entrevistas de trabajo',intent:'Informacional',vol:'1200',diff:'Medium',priority:'p1',source:'AI gap'},
  {kw:'cómo preparar una entrevista',intent:'Informacional',vol:'2400',diff:'Low',priority:'p1',source:'AI gap'},
  {kw:'coach laboral madrid',intent:'Comercial',vol:'390',diff:'Low',priority:'p1',source:'AI gap'},
  {kw:'preguntas entrevista de trabajo respuestas',intent:'Informacional',vol:'3200',diff:'High',priority:'p2',source:'AI gap'},
  {kw:'preparar entrevista trabajo online',intent:'Comercial',vol:'260',diff:'Low',priority:'p2',source:'AI gap'},
  {kw:'coaching carrera profesional',intent:'Comercial',vol:'480',diff:'Medium',priority:'p2',source:'GSC'},
  {kw:'mejorar entrevista trabajo',intent:'Informacional',vol:'590',diff:'Low',priority:'p2',source:'AI gap'},
  {kw:'coaching entrevistas LATAM',intent:'Comercial',vol:'210',diff:'Low',priority:'p3',source:'AI gap'},
  {kw:'cómo conseguir trabajo profesional',intent:'Informacional',vol:'1800',diff:'High',priority:'p3',source:'AI gap'},
];

async function loadGA4Intelligence(){
  // Show fallbacks immediately — UI is never blank
  renderRecommendations(FALLBACK_RECS);
  renderErrors(FALLBACK_ERRORS);
  renderKeywords(FALLBACK_KEYWORDS);

  try {
    const ga4Data = {
      sessions:  document.querySelector('#ga4-kpis .kv')?.textContent||'N/A',
      topPages:  Array.from(document.querySelectorAll('#ga4-pg tr')).slice(1,6).map(r=>r.cells[0]?.textContent?.trim()).filter(Boolean),
      countries: Array.from(document.querySelectorAll('#ga4-geo tr')).slice(1,5).map(r=>r.cells[0]?.textContent?.trim()).filter(Boolean),
      gscQueries:Array.from(document.querySelectorAll('#gsc-q tr')).slice(1,8).map(r=>({kw:r.cells[0]?.textContent,clicks:r.cells[1]?.textContent,pos:r.cells[3]?.textContent})).filter(r=>r.kw)
    };

    const prompt = `Eres un estratega de marketing digital B2C para Próximo Rol, un servicio de coaching de entrevistas de trabajo para profesionales mid y senior de habla hispana. Web: proximorol.com. Servicios: Sesión única (97€), Pack Completo, Acompañamiento Total. Mercados: España (principal), LATAM (MX, AR, CO, CL), UK. Metodología: storytelling, mock interviews, coaching personalizado. Problema crítico: casi todo el tráfico es branded (búsquedas directas del nombre).

Datos actuales: ${JSON.stringify(ga4Data)}

Devuelve ÚNICAMENTE JSON válido (sin markdown, sin backticks) con esta estructura exacta:
{
  "recommendations": [
    {"icon":"emoji","priority":"high|med|low","title":"string","meta":"Canal · Impacto","steps":["paso1","paso2","paso3","paso4"],"kpis":[{"v":"valor","l":"etiqueta"},{"v":"valor","l":"etiqueta"}],"timeframe":"string","effort":"Low|Medium|High"}
  ],
  "errors": [
    {"severity":"critical|warning|info","title":"string","desc":"string"}
  ],
  "keywords": [
    {"kw":"string en español","intent":"Comercial|Informacional|Navegacional","vol":"número","diff":"Low|Medium|High","priority":"p1|p2|p3","source":"GSC|AI gap"}
  ]
}
Da 6 recomendaciones, 7 errores/issues, 10 keywords en español adaptadas al mercado hispanohablante. Prioriza España y LATAM.`;

    const data = await antFetch({model:'claude-sonnet-4-20250514', max_tokens:2500, messages:[{role:'user',content:prompt}]});
    
    const raw  = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').replace(/```json|```/g,'').trim();
    const parsed = JSON.parse(raw);
    if(parsed.recommendations?.length) renderRecommendations(parsed.recommendations);
    if(parsed.errors?.length)          renderErrors(parsed.errors);
    if(parsed.keywords?.length)        renderKeywords(parsed.keywords);
  } catch(e){ /* keep fallbacks */ }
}

function renderRecommendations(recs){
  const el = document.getElementById('ga4-recs-grid');
  if(!el) return;
  window._RECS = recs;
  el.innerHTML = recs.map((r,i)=>`
    <div class="rec-card" onclick="openRecModal(${i})">
      <div class="rec-card-header">
        <div class="rec-icon ${r.priority}">${r.icon}</div>
        <div style="flex:1;min-width:0">
          <div class="rec-title">${r.title}</div>
          <div class="rec-meta">${r.meta}</div>
        </div>
      </div>
      <div>
        <span class="rec-tag ${r.priority}">${r.priority==='high'?'Alto impacto':r.priority==='med'?'Impacto medio':'Quick win'}</span>
        <span class="rec-tag" style="background:var(--sf2);color:var(--mt)">${r.effort||''}</span>
      </div>
    </div>`).join('');
}

function renderErrors(errors){
  const el = document.getElementById('ga4-errors');
  if(!el) return;
  el.innerHTML = errors.map(e=>`
    <div class="err-item ${e.severity}">
      <div class="err-dot"></div>
      <div class="err-body">
        <div class="err-title">${e.title}</div>
        <div class="err-desc">${e.desc}</div>
      </div>
    </div>`).join('');
}

function renderKeywords(kws){
  const el = document.getElementById('ga4-keywords');
  if(!el) return;
  el.innerHTML = kws.map(k=>`
    <div class="kw-pill">
      <div class="kw-pill-top">
        <span class="kw-name">${k.kw}</span>
        <span class="kw-badge ${k.priority}">${k.priority==='p1'?'Prioridad':k.priority==='p2'?'Secundaria':'Explorar'}</span>
      </div>
      <div class="kw-meta">${k.intent} · Vol: ${k.vol} · Dificultad: ${k.diff} · <em>${k.source}</em></div>
    </div>`).join('');
}

function openRecModal(i){
  const r = (window._RECS||FALLBACK_RECS)[i];
  if(!r) return;
  const pLabel = r.priority==='high'?'Alto impacto':r.priority==='med'?'Impacto medio':'Quick win';
  document.getElementById('rec-modal-body').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">
      <div class="rec-icon ${r.priority}" style="width:40px;height:40px;font-size:20px">${r.icon}</div>
      <div>
        <div style="font-size:15px;font-weight:700;color:var(--tx)">${r.title}</div>
        <div style="font-size:12px;color:var(--mt);margin-top:2px">${r.meta}</div>
      </div>
    </div>
    <div style="display:flex;gap:6px;margin-bottom:14px;flex-wrap:wrap">
      <span class="rec-tag ${r.priority}">${pLabel}</span>
      <span class="rec-tag" style="background:var(--sf2);color:var(--mt)">${r.effort} esfuerzo</span>
      <span class="rec-tag" style="background:var(--sf2);color:var(--mt)">${r.timeframe}</span>
    </div>
    <div class="rm-section">
      <div class="rm-label">Pasos de implementación</div>
      <div class="rm-steps">${(r.steps||[]).map((s,j)=>`<div class="rm-step"><div class="rm-step-num">${j+1}</div><span>${s}</span></div>`).join('')}</div>
    </div>
    ${r.kpis?.length?`<div class="rm-section"><div class="rm-label">Resultados esperados</div><div class="rm-kpis">${r.kpis.map(k=>`<div class="rm-kpi"><div class="rm-kpi-v">${k.v}</div><div class="rm-kpi-l">${k.l}</div></div>`).join('')}</div></div>`:''}
  `;
  document.getElementById('rec-modal-overlay').classList.add('open');
}
function closeRecModal(){
  document.getElementById('rec-modal-overlay').classList.remove('open');
}

/* ══════════════════════════════════════════════════════
   ADS AI RECOMMENDATIONS
   ══════════════════════════════════════════════════════ */
async function runAdsAIRecommendations(){
  const btn = document.getElementById('ads-ai-btn');
  const out = document.getElementById('ads-ai-out');
  if(!btn||!out) return;

  // Gather Ads data visible in the DOM
  const kpiText = document.getElementById('ads-kpis')?.innerText||'';
  const campText = document.getElementById('ads-c')?.innerText||'';

  btn.disabled = true;
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Analizando campañas…`;
  out.innerHTML = `<div style="padding:20px;text-align:center;color:var(--ht);font-size:13px">🧠 Claude está analizando el rendimiento de tus Google Ads…</div>`;

  const prompt = `Eres un experto en Google Ads para Próximo Rol, un servicio de coaching de entrevistas para profesionales mid y senior de habla hispana.

DATOS ACTUALES DE GOOGLE ADS:
KPIs: ${kpiText||'No disponibles aún — analiza en base al contexto del negocio'}
Campañas: ${campText||'No disponibles aún — analiza en base al contexto del negocio'}

CONTEXTO:
- Próximo Rol: coaching de entrevistas para profesionales. Precio: 97€-600€
- Mercados: España (principal), LATAM (MX,AR,CO,CL), UK
- Problema actual: casi todo el tráfico es de marca (branded). Necesitan campañas non-branded.
- Competidores en España: InfoJobs, Michael Page, coaches en LinkedIn
- Competidores en LATAM: OCC Mundial, coaches en LinkedIn, Udemy

Genera un análisis de campañas y recomendaciones concretas para maximizar ROI. Responde SOLO en JSON válido, sin markdown:
{
  "diagnostico": "2-3 frases sobre el estado actual de las campañas",
  "kpis_clave": [
    {"metrica": "...", "estado": "bueno|regular|malo", "comentario": "..."}
  ],
  "recomendaciones_campañas": [
    {
      "tipo": "Nueva campaña|Optimización|Pausa|Presupuesto|Audiencia|Copys",
      "prioridad": "alta|media|baja",
      "titulo": "...",
      "descripcion": "...",
      "mercado": "España|LATAM|UK|Global",
      "keywords_sugeridas": ["keyword1","keyword2","keyword3"],
      "presupuesto_sugerido": "..."
    }
  ],
  "estructura_campañas_recomendada": [
    {"campaña": "...", "tipo": "Search|Display|Performance Max", "mercado": "...", "objetivo": "...", "budget_mensual": "..."}
  ],
  "quick_wins": [
    {"accion": "...", "impacto": "...", "tiempo": "Esta semana|Este mes"}
  ]
}`;

  try {
    const data = await antFetch({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2500,
        tools:[{"type":"web_search_20250305","name":"web_search"}],
        messages: [{role: 'user', content: prompt}]
      });
    
    const raw = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean = raw.replace(/```json|```/g,'').trim();
    let r;
    try { r = JSON.parse(clean); }
    catch(e) { const m = clean.match(/\{[\s\S]*\}/); if(m) r=JSON.parse(m[0]); else throw e; }

    const tipoColor={'Nueva campaña':'var(--green)','Optimización':'var(--blue)',Pausa:'var(--red)',Presupuesto:'var(--amber)',Audiencia:'var(--purple)',Copys:'var(--teal)'};
    const tipoBg={'Nueva campaña':'var(--gp)','Optimización':'var(--bp)',Pausa:'var(--rp)',Presupuesto:'var(--ap)',Audiencia:'var(--pp)',Copys:'var(--tp)'};
    const prioColor={alta:'#DC2626',media:'#D97706',baja:'#059669'};
    const estadoIcon={bueno:'✅',regular:'⚠️',malo:'🔴'};

    out.innerHTML = `
      <!-- Diagnóstico -->
      <div style="padding:12px 14px;background:var(--sf2);border-radius:var(--r);margin-bottom:14px;font-size:13px;color:var(--tx)">${r.diagnostico||''}</div>

      <!-- KPIs clave -->
      ${(r.kpis_clave||[]).length ? `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:8px;margin-bottom:16px">
        ${(r.kpis_clave||[]).map(k=>`
        <div style="background:var(--sf2);border-radius:var(--r);padding:10px 12px">
          <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${estadoIcon[k.estado]||'•'} ${k.metrica}</div>
          <div style="font-size:11px;color:var(--mt)">${k.comentario}</div>
        </div>`).join('')}
      </div>` : ''}

      <!-- Recomendaciones de campañas -->
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Recomendaciones de campañas</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${(r.recomendaciones_campañas||[]).map(rec=>`
        <div style="border:1px solid var(--bd);border-radius:var(--r);padding:12px 14px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap">
            <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:${tipoBg[rec.tipo]||'var(--sf2)'};color:${tipoColor[rec.tipo]||'var(--mt)'}">${rec.tipo}</span>
            <span style="font-size:12px;font-weight:500;color:var(--tx)">${rec.titulo}</span>
            <span style="font-size:9px;font-weight:700;color:${prioColor[rec.prioridad]||'var(--mt)'};text-transform:uppercase;margin-left:auto">${rec.prioridad}</span>
            <span style="font-size:10px;color:var(--ht)">${rec.mercado||''}</span>
          </div>
          <div style="font-size:11px;color:var(--mt);margin-bottom:6px">${rec.descripcion}</div>
          ${rec.keywords_sugeridas?.length ? `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px">${rec.keywords_sugeridas.map(k=>`<span style="padding:2px 8px;background:var(--bp);color:var(--blue);border-radius:20px;font-size:10px">${k}</span>`).join('')}</div>` : ''}
          ${rec.presupuesto_sugerido ? `<div style="font-size:10px;color:var(--teal)">💰 ${rec.presupuesto_sugerido}</div>` : ''}
        </div>`).join('')}
      </div>

      <!-- Estructura recomendada -->
      ${(r.estructura_campañas_recomendada||[]).length ? `
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">Estructura de campañas recomendada</div>
      <div style="overflow-x:auto;margin-bottom:16px">
        <table class="dt"><thead><tr><th>Campaña</th><th>Tipo</th><th>Mercado</th><th>Objetivo</th><th style="text-align:right">Budget/mes</th></tr></thead>
        <tbody>${(r.estructura_campañas_recomendada||[]).map(c=>`
        <tr>
          <td><span class="tm">${c.campaña}</span></td>
          <td><span style="font-size:10px;background:var(--bp);color:var(--blue);padding:2px 6px;border-radius:10px">${c.tipo}</span></td>
          <td style="font-size:11px">${c.mercado}</td>
          <td style="font-size:11px;color:var(--mt)">${c.objetivo}</td>
          <td style="text-align:right;font-family:'DM Mono',monospace;font-size:11px">${c.budget_mensual}</td>
        </tr>`).join('')}</tbody></table>
      </div>` : ''}

      <!-- Quick Wins -->
      ${(r.quick_wins||[]).length ? `
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px">⚡ Quick Wins</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
        ${(r.quick_wins||[]).map(q=>`
        <div style="background:var(--gp);border:1px solid #9FE1CB;border-radius:var(--r);padding:12px 14px">
          <div style="font-size:11px;font-weight:600;color:var(--green2);margin-bottom:3px">${q.accion}</div>
          <div style="font-size:11px;color:var(--mt);margin-bottom:5px">${q.impacto}</div>
          <div style="font-size:10px;color:var(--ht)">⏱ ${q.tiempo}</div>
        </div>`).join('')}
      </div>` : ''}

      <div style="margin-top:12px;font-size:10px;color:var(--ht);text-align:right">Generado por Claude AI · ${new Date().toLocaleDateString('es-ES')}</div>
    `;
  } catch(e) {
    out.innerHTML = `<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B"><strong>⚠ Error en recomendaciones de campañas</strong><br>${e.message.replace(/\n/g,'<br>')}<br><details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;opacity:.7">Ver detalle (para copiar)</summary><pre style="margin-top:6px;font-size:10px;background:rgba(0,0,0,.06);padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all">${e.stack||e.message}</pre></details></div>`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg> Analizar campañas`;
  }
}

/* ══════════════════════════════════════════════════════
   KEYWORD INTELLIGENCE MODULE
   ══════════════════════════════════════════════════════ */

const KWI_STORE = 'eco_kwi_tracker';
const KWI_BRAND_TERMS = ['próximo rol','proximo rol','proximorol','coaching entrevistas'];

/* ── Entry point when page is shown ── */
function renderKWIPage(){
  setNB('kwi','live');
  renderKWIBrandedSplit();
  renderKWITracker();
  renderSERPHistoryChips();
}

/* ── Block 1: Branded vs Non-branded ── */
async function renderKWIBrandedSplit(){
  const el = document.getElementById('kwi-split-body');
  if(!el) return;

  // If GSC not configured
  if(!CFG.gsc){
    el.innerHTML=`<div class="notice"><strong>Search Console not connected</strong> — Add your GSC URL in Settings to see branded vs. non-branded split.<button class="cbtn" onclick="showP('settings',null)">Open Settings →</button></div>`;
    return;
  }

  el.innerHTML=`<div class="ld"><div class="sp2"></div>Loading GSC data…</div>`;
  try{
    const data = await gscQ({startDate:sD(),endDate:eD(),dimensions:['query'],rowLimit:100,orderBy:[{fieldName:'impressions',sortOrder:'DESCENDING'}]});
    const rows = data.rows||[];
    if(rows.length===0){
      el.innerHTML=`<div style="padding:16px;color:var(--ht);font-size:13px;text-align:center">No query data yet. Check that Search Console has data for the selected period.</div>`;
      return;
    }

    const branded=[], nonBranded=[];
    rows.forEach(r=>{
      const q=(r.keys[0]||'').toLowerCase();
      const isBrand = KWI_BRAND_TERMS.some(t=>q.includes(t));
      (isBrand?branded:nonBranded).push(r);
    });

    const totClk = rows.reduce((a,r)=>a+(r.clicks||0),0);
    const bClk   = branded.reduce((a,r)=>a+(r.clicks||0),0);
    const nbClk  = nonBranded.reduce((a,r)=>a+(r.clicks||0),0);
    const bPct   = totClk>0?Math.round((bClk/totClk)*100):0;
    const nbPct  = 100-bPct;

    // Top non-branded sorted by impressions
    const topNB = [...nonBranded].sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,8);

    el.innerHTML=`
      <!-- Summary bar -->
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:12px">
          <span style="color:var(--purple);font-weight:600">🏷 Branded: ${bPct}% (${bClk.toLocaleString()} clicks)</span>
          <span style="color:var(--green);font-weight:600">🌍 Non-branded: ${nbPct}% (${nbClk.toLocaleString()} clicks)</span>
        </div>
        <div style="height:10px;border-radius:20px;background:var(--sf2);overflow:hidden;display:flex">
          <div style="width:${bPct}%;background:#7C3AED;transition:width .5s"></div>
          <div style="width:${nbPct}%;background:#1D9E75;transition:width .5s"></div>
        </div>
        ${bPct>70?`<div style="margin-top:8px;padding:8px 12px;background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B">⚠ <strong>${bPct}% of clicks come from branded searches</strong> — You're being found mainly by people who already know Próximo Rol. High risk of low discoverability for new prospects.</div>`
          :`<div style="margin-top:8px;padding:8px 12px;background:var(--gp);border:1px solid #A7F3D0;border-radius:var(--r);font-size:12px;color:var(--green2)">✓ Good balance — ${nbPct}% of clicks come from non-branded organic searches.</div>`}
      </div>
      <!-- KPI mini cards -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-bottom:16px">
        ${[
          {l:'Total queries',v:rows.length,s:'in period'},
          {l:'Branded queries',v:branded.length,s:'terms'},
          {l:'Non-branded',v:nonBranded.length,s:'organic terms'},
          {l:'Avg position (NB)',v:nonBranded.length>0?(nonBranded.reduce((a,r)=>a+(r.position||0),0)/nonBranded.length).toFixed(1):'—',s:'Google rank'},
        ].map(k=>`<div style="background:var(--sf2);border-radius:var(--r);padding:10px 12px"><div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${k.l}</div><div style="font-size:20px;font-weight:600">${k.v}</div><div style="font-size:11px;color:var(--ht)">${k.s}</div></div>`).join('')}
      </div>
      <!-- Top non-branded table -->
      <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Top non-branded queries</div>
      <table class="dt"><thead><tr><th>Query</th><th>Clicks</th><th>Impressions</th><th>CTR</th><th>Avg Pos.</th><th></th></tr></thead>
      <tbody>${topNB.map(r=>{
        const pos=parseFloat(r.position||0);
        const posColor=pos<=3?'var(--green)':pos<=10?'var(--amber)':'var(--red)';
        return`<tr>
          <td><span class="tm">${r.keys[0]}</span></td>
          <td>${(r.clicks||0).toLocaleString()}</td>
          <td>${(r.impressions||0).toLocaleString()}</td>
          <td>${((r.ctr||0)*100).toFixed(1)}%</td>
          <td style="color:${posColor};font-weight:500">${pos.toFixed(1)}</td>
          <td><button onclick="kwiAddFromGSC('${r.keys[0].replace(/'/g,"\\'")}','UK','organic')" style="padding:2px 8px;border:1px solid var(--green);border-radius:20px;font-size:10px;color:var(--green);background:none;cursor:pointer">+ Track</button></td>
        </tr>`;
      }).join('')}</tbody></table>`;
  }catch(e){
    el.innerHTML=`<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B;padding:12px"><strong>GSC error:</strong> ${e.message}</div>`;
  }
}

/* ── Block 2: AI Keyword Gap Analysis ── */
async function runKWIAnalysis(){
  const btn=document.getElementById('kwi-run-btn');
  const out=document.getElementById('kwi-ai-out');
  if(!btn||!out) return;

  const markets=[];
  if(document.getElementById('kwi-mkt-uk')?.checked) markets.push('UK');
  if(document.getElementById('kwi-mkt-eu')?.checked) markets.push('Europe (DE, FR, NL, SE)');
  if(document.getElementById('kwi-mkt-us')?.checked) markets.push('USA');
  if(document.getElementById('kwi-mkt-es')?.checked) markets.push('España');
  if(document.getElementById('kwi-mkt-latam')?.checked) markets.push('LATAM (MX, AR, CO, CL)');
  const focus=document.getElementById('kwi-focus')?.value||'all';

  btn.disabled=true;
  btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Analysing…`;
  out.innerHTML=`<div style="padding:16px;text-align:center;color:var(--ht);font-size:13px">🧠 Claude está analizando oportunidades de keywords para Próximo Rol en ${markets.join(', ')}…</div>`;

  try{
    const focusLabel={all:'all intent types (transactional, informational, competitor)',transactional:'high-purchase-intent transactional keywords',informational:'informational/content keywords for SEO blog strategy',competitor:'competitor-comparison and alternative-to keywords'}[focus];

    const hasSpanish = markets.some(m=>m.includes('España')||m.includes('LATAM'));
    const currencyNote = hasSpanish ? 'Use EUR (€) for España and USD ($) for LATAM markets, GBP (£) for UK.' : 'Use GBP (£) for UK, EUR (€) for Europe, USD ($) for USA.';
    const langNote = hasSpanish ? 'IMPORTANT: For España and LATAM markets, generate keywords in SPANISH (e.g. "preparación entrevistas de trabajo", "coaching laboral", "cómo conseguir trabajo"). Include both Spanish-language and English terms where relevant for those markets.' : '';

    const prompt=`You are a B2B SEO and SEM specialist for Próximo Rol, a B2C interview coaching service that helps mid and senior professionals tell their career story with clarity and conviction. Próximo Rol helps professionals prepare for job interviews through storytelling methodology, mock interviews and personalised coaching.

CONTEXT:
- Próximo Rol is being found almost exclusively through branded searches (people searching "próximo rol" directly)
- They need to rank for and/or bid on non-branded keywords to reach prospects who don't know them yet
- Markets to analyse: ${markets.join(', ')}
- Focus: ${focusLabel}
- ${currencyNote}
${langNote}

TASK:
Generate a keyword gap analysis with 20-25 high-value keywords that Próximo Rol's competitors are likely targeting but Próximo Rol is not.

For each keyword provide:
1. The keyword phrase (in the appropriate language for the market)
2. Estimated monthly search volume range (low/medium/high: <500, 500-2000, 2000+)
3. Estimated CPC range in the appropriate currency for that market
4. Competition level (low/medium/high)
5. Recommended strategy: "organic", "paid", or "both"
6. Market (UK/EU/USA/España/LATAM/Global)
7. Intent type: transactional / informational / competitor
8. Brief rationale (1 sentence)

Return ONLY valid JSON, no markdown, no preamble. Format:
{"keywords":[{"kw":"...","volume":"low|medium|high","cpc":"£X-£Y or €X-€Y or $X-$Y","competition":"low|medium|high","strategy":"organic|paid|both","market":"...","intent":"...","rationale":"..."}]}`;

    const data = await antFetch({
        model:'claude-sonnet-4-20250514',
        max_tokens:2500,
        messages:[{role:'user',content:prompt}]
      });
    const raw=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean=raw.replace(/```json|```/g,'').trim();
    const parsed=JSON.parse(clean);
    const kws=parsed.keywords||[];

    const intentColor={transactional:'var(--green)',informational:'var(--blue)',competitor:'var(--purple)'};
    const intentBg={transactional:'var(--gp)',informational:'var(--bp)',competitor:'var(--pp)'};
    const volDot={low:'🔵',medium:'🟡',high:'🟢'};
    const compColor={low:'var(--green)',medium:'var(--amber)',high:'var(--red)'};

    out.innerHTML=`
      <div style="margin-bottom:12px;display:flex;gap:8px;flex-wrap:wrap;align-items:center">
        <span style="font-size:12px;color:var(--mt)">${kws.length} keywords identified for ${markets.join(', ')}</span>
        <span style="margin-left:auto;font-size:11px;color:var(--ht)">Generated by Claude AI · ${new Date().toLocaleDateString('en-GB')}</span>
      </div>
      <div style="overflow-x:auto">
      <table class="dt"><thead><tr>
        <th>Keyword</th><th>Volume</th><th>Est. CPC</th><th>Competition</th><th>Strategy</th><th>Market</th><th>Intent</th><th></th>
      </tr></thead><tbody>
      ${kws.map(k=>`<tr>
        <td style="max-width:240px">
          <div style="font-weight:500;font-size:12px">${k.kw}</div>
          <div style="font-size:10px;color:var(--ht);margin-top:2px">${k.rationale}</div>
        </td>
        <td>${volDot[k.volume]||'—'} <span style="font-size:11px">${k.volume}</span></td>
        <td style="font-family:'DM Mono',monospace;font-size:11px">${k.cpc||'—'}</td>
        <td style="color:${compColor[k.competition]||'var(--mt)'};font-size:12px;font-weight:500">${k.competition||'—'}</td>
        <td><span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:${k.strategy==='paid'?'var(--ap)':k.strategy==='both'?'var(--bp)':'var(--gp)'};color:${k.strategy==='paid'?'var(--amber)':k.strategy==='both'?'var(--blue)':'var(--green)'}">${k.strategy}</span></td>
        <td style="font-size:11px">${k.market}</td>
        <td><span style="padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;background:${intentBg[k.intent]||'var(--sf2)'};color:${intentColor[k.intent]||'var(--mt)'}">${k.intent}</span></td>
        <td><button onclick="kwiAddFromAI('${k.kw.replace(/'/g,"\\'")}','${k.market}','${k.strategy}')" style="padding:2px 8px;border:1px solid var(--green);border-radius:20px;font-size:10px;color:var(--green);background:none;cursor:pointer">+ Track</button></td>
      </tr>`).join('')}
      </tbody></table></div>`;

  }catch(e){
    out.innerHTML=`<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B"><strong>⚠ Error en análisis de keywords</strong><br>${e.message.replace(/\n/g,'<br>')}<br><details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;opacity:.7">Ver detalle (para copiar)</summary><pre style="margin-top:6px;font-size:10px;background:rgba(0,0,0,.06);padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all">${e.stack||e.message}</pre></details></div>`;
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg> Run Analysis`;
  }
}

/* ── Block 3: Keyword Tracker ── */
function kwiLoadTracked(){
  try{return JSON.parse(localStorage.getItem(KWI_STORE)||'[]');}catch(e){return[];}
}
function kwiSaveTracked(arr){localStorage.setItem(KWI_STORE,JSON.stringify(arr));}

function kwiAddKw(){
  const row=document.getElementById('kwi-add-row');
  if(row) row.style.display='flex';
  const inp=document.getElementById('kwi-kw-input');
  if(inp){inp.value='';inp.focus();}
}

function kwiSaveKw(){
  const kw=(document.getElementById('kwi-kw-input')?.value||'').trim();
  if(!kw) return;
  const intent=document.getElementById('kwi-kw-intent')?.value||'transactional';
  const market=document.getElementById('kwi-kw-market')?.value||'UK';
  const strategy=document.getElementById('kwi-kw-strategy')?.value||'organic';
  const arr=kwiLoadTracked();
  if(arr.some(k=>k.kw.toLowerCase()===kw.toLowerCase())){alert('This keyword is already tracked.');return;}
  arr.push({id:Date.now(),kw,intent,market,strategy,added:new Date().toISOString().split('T')[0],notes:''});
  kwiSaveTracked(arr);
  document.getElementById('kwi-add-row').style.display='none';
  renderKWITracker();
}

function kwiAddFromGSC(kw,market,strategy){
  const arr=kwiLoadTracked();
  if(arr.some(k=>k.kw.toLowerCase()===kw.toLowerCase())){
    alert('Already tracking: '+kw);return;
  }
  arr.push({id:Date.now(),kw,intent:'informational',market,strategy,added:new Date().toISOString().split('T')[0],notes:'From GSC'});
  kwiSaveTracked(arr);
  renderKWITracker();
  // Show feedback
  const t=document.createElement('div');
  t.style.cssText='position:fixed;bottom:24px;right:24px;background:var(--green);color:white;padding:10px 18px;border-radius:var(--r);font-size:13px;z-index:9999;box-shadow:0 4px 16px rgba(0,0,0,.15)';
  t.textContent='✓ Added to tracker: '+kw;
  document.body.appendChild(t);
  setTimeout(()=>t.remove(),2500);
}

function kwiAddFromAI(kw,market,strategy){
  kwiAddFromGSC(kw,market,strategy);
}

function kwiDeleteKw(id){
  const arr=kwiLoadTracked().filter(k=>k.id!==id);
  kwiSaveTracked(arr);
  renderKWITracker();
}

function renderKWITracker(){
  const el=document.getElementById('kwi-tracker-table');
  if(!el) return;
  const arr=kwiLoadTracked();
  if(arr.length===0){
    el.innerHTML=`<div style="padding:24px;text-align:center;color:var(--ht);font-size:13px">No keywords tracked yet. Add keywords manually or click <strong>+ Track</strong> on any keyword above.</div>`;
    return;
  }
  const stratBg={organic:'var(--gp)',paid:'var(--ap)',both:'var(--bp)'};
  const stratColor={organic:'var(--green)',paid:'var(--amber)',both:'var(--blue)'};
  const intentBg={transactional:'var(--gp)',informational:'var(--bp)',navigational:'var(--ap)',competitor:'var(--pp)'};
  const intentColor={transactional:'var(--green)',informational:'var(--blue)',navigational:'var(--amber)',competitor:'var(--purple)'};
  el.innerHTML=`<table class="dt"><thead><tr><th>Keyword</th><th>Intent</th><th>Market</th><th>Strategy</th><th>Added</th><th>Notes</th><th></th></tr></thead>
  <tbody>${arr.map(k=>`<tr>
    <td style="font-weight:500">${k.kw}</td>
    <td><span style="padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;background:${intentBg[k.intent]||'var(--sf2)'};color:${intentColor[k.intent]||'var(--mt)'}">${k.intent}</span></td>
    <td style="font-size:12px">${k.market}</td>
    <td><span style="padding:2px 7px;border-radius:20px;font-size:10px;font-weight:600;background:${stratBg[k.strategy]||'var(--sf2)'};color:${stratColor[k.strategy]||'var(--mt)'}">${k.strategy}</span></td>
    <td style="font-size:11px;color:var(--ht)">${k.added||'—'}</td>
    <td style="font-size:11px;color:var(--mt)">${k.notes||'—'}</td>
    <td><button onclick="kwiDeleteKw(${k.id})" style="padding:2px 8px;border:1px solid #FECACA;border-radius:20px;font-size:10px;color:var(--red);background:none;cursor:pointer">Remove</button></td>
  </tr>`).join('')}</tbody></table>
  <div style="padding:8px 0;font-size:11px;color:var(--ht)">${arr.length} keyword${arr.length!==1?'s':''} tracked · Saved in browser storage</div>`;
}

/* ══════════════════════════════════════════════════════
   SERP COMPETITOR ANALYZER MODULE
   ══════════════════════════════════════════════════════ */

const SERP_STORE = 'eco_serp_history';

function serpLoadHistory(){
  try{return JSON.parse(localStorage.getItem(SERP_STORE)||'[]');}catch(e){return[];}
}
function serpSaveHistory(arr){
  // Keep last 20 searches
  localStorage.setItem(SERP_STORE, JSON.stringify(arr.slice(-20)));
}

function renderSERPHistoryChips(){
  const el = document.getElementById('serp-history-chips');
  if(!el) return;
  const hist = serpLoadHistory();
  if(hist.length===0){el.innerHTML='<span style="font-size:11px;color:var(--ht)">No searches yet — try a keyword above</span>';return;}
  el.innerHTML = hist.slice().reverse().slice(0,8).map(h=>`
    <div style="display:flex;align-items:center;gap:0;background:var(--sf2);border:1px solid var(--bd2);border-radius:20px;overflow:hidden">
      <span onclick="serpLoadSaved('${h.query.replace(/'/g,"\\'")}','${h.market}')" style="padding:4px 10px 4px 12px;font-size:11px;cursor:pointer;color:var(--tx)" title="Re-run this search">🔍 ${h.query} <span style="color:var(--ht)">[${h.market}]</span></span>
      <span onclick="serpDeleteHistory('${h.id}')" style="padding:4px 8px;font-size:11px;color:var(--ht);cursor:pointer;border-left:1px solid var(--bd2)" title="Remove">×</span>
    </div>`).join('');
}

function serpDeleteHistory(id){
  const arr = serpLoadHistory().filter(h=>h.id!=id);
  serpSaveHistory(arr);
  renderSERPHistoryChips();
}

function serpLoadSaved(query, market){
  const inp = document.getElementById('serp-input');
  const mkt = document.getElementById('serp-market');
  if(inp) inp.value = query;
  if(mkt) mkt.value = market;
  runSERPAnalysis();
}

async function runSERPAnalysis(){
  const query = (document.getElementById('serp-input')?.value||'').trim();
  const market = document.getElementById('serp-market')?.value||'UK';
  if(!query){
    document.getElementById('serp-results').innerHTML=`<div style="padding:12px;color:var(--ht);font-size:13px">Enter a keyword to analyse.</div>`;
    return;
  }

  const btn = document.getElementById('serp-btn');
  const out = document.getElementById('serp-results');
  btn.disabled=true;
  btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Searching…`;
  out.innerHTML=`<div style="padding:20px;text-align:center;color:var(--ht);font-size:13px">🔍 Searching Google for "<strong>${query}</strong>" in ${market} and analysing competitors…</div>`;

  const marketCtx = {
    UK:'United Kingdom, google.co.uk',
    EU:'Europe (focus on Germany, France, Netherlands)',
    USA:'United States, google.com',
    España:'España, google.es — busca en español, incluye competidores locales como InfoJobs, LinkedIn España, Michael Page España',
    LATAM:'América Latina (México, Argentina, Colombia, Chile) — busca en español, incluye competidores como OCC Mundial, Computrabajo, Bumeran',
    Global:'Global search results'
  }[market]||market;
  const isSpanish = market==='España'||market==='LATAM';
  const cpcCurrency = market==='UK'?'£':market==='USA'?'$':'€';

  const prompt = `You are a competitive intelligence analyst. Use web search to research the Google SERP for the keyword: "${query}" targeting ${marketCtx}.

Search for this keyword and analyse the results. ${isSpanish ? 'Respond with all keyword data and competitor names as they appear in that Spanish-speaking market. The keyword may need to be searched in Spanish.' : ''}

Provide:
1. TOP ORGANIC RESULTS (up to 8): The actual companies/pages ranking organically
2. PAID ADS (if visible): Companies running Google Ads for this keyword
3. CPC ESTIMATE: What advertisers typically pay per click for this keyword in ${cpcCurrency}
4. COMPETITOR PROFILES: For the top 3-5 companies appearing, describe their positioning/messaging
5. PRÓXIMO ROL GAP ANALYSIS: Is Próximo Rol (proximorol.com) appearing? What would it take to rank here?

Próximo Rol provides interview coaching services for mid and senior Spanish-speaking professionals in Spain, UK and LATAM.

Return ONLY valid JSON, no markdown, no preamble:
{
  "keyword": "...",
  "market": "...",
  "search_date": "...",
  "cpc_estimate": {"min":"${cpcCurrency}X","max":"${cpcCurrency}Y","competition":"low|medium|high","monthly_searches":"X-Y"},
  "organic_results": [{"position":1,"company":"...","domain":"...","title":"...","description":"...","type":"organic|news|map|featured_snippet"}],
  "paid_ads": [{"position":1,"company":"...","domain":"...","headline":"...","description":"..."}],
  "top_competitors": [{"company":"...","domain":"...","positioning":"...","strengths":"..."}],
  "proximorol_present": false,
  "proximorol_gap": "...",
  "recommendation": "organic|paid|both",
  "recommendation_rationale": "..."
}`;

  try{
    const data = await antFetch({
        model:'claude-sonnet-4-20250514',
        max_tokens:2500,
        tools:[{"type":"web_search_20250305","name":"web_search"}],
        messages:[{role:'user',content:prompt}]
      });
    

    // Extract text from all content blocks
    const raw = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean = raw.replace(/```json|```/g,'').trim();

    let r;
    try{ r = JSON.parse(clean); }
    catch(e){
      // Fallback: try to extract JSON object from text
      const match = clean.match(/\{[\s\S]*\}/);
      if(match) r = JSON.parse(match[0]);
      else throw new Error('Could not parse response: '+clean.slice(0,200));
    }

    // Save to history
    const hist = serpLoadHistory();
    hist.push({id:Date.now(), query, market, date:new Date().toISOString().split('T')[0], result:r});
    serpSaveHistory(hist);
    renderSERPHistoryChips();

    // Render results
    const compColor={low:'var(--green)',medium:'var(--amber)',high:'var(--red)'};
    const recBg={organic:'var(--gp)',paid:'var(--ap)',both:'var(--bp)'};
    const recColor={organic:'var(--green)',paid:'var(--amber)',both:'var(--blue)'};
    const typeStyle={
      organic:'background:#E0F2FE;color:#0369A1',
      paid:'background:#FEF9C3;color:#854D0E',
      featured_snippet:'background:var(--gp);color:var(--green2)',
      news:'background:var(--bp);color:var(--blue)',
      map:'background:#F0FDF4;color:#166534'
    };

    const organic = r.organic_results||[];
    const ads = r.paid_ads||[];
    const competitors = r.top_competitors||[];
    const cpc = r.cpc_estimate||{};

    out.innerHTML=`
      <!-- Header summary bar -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:8px;margin-bottom:16px;padding:12px;background:var(--sf2);border-radius:var(--r)">
        <div>
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Keyword</div>
          <div style="font-size:13px;font-weight:600;margin-top:2px">${r.keyword||query}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Est. CPC</div>
          <div style="font-size:13px;font-weight:600;margin-top:2px;font-family:'DM Mono',monospace">${cpc.min||'—'} – ${cpc.max||'—'}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Monthly Searches</div>
          <div style="font-size:13px;font-weight:600;margin-top:2px">${cpc.monthly_searches||'—'}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Competition</div>
          <div style="font-size:13px;font-weight:600;margin-top:2px;color:${compColor[cpc.competition]||'var(--tx)'}">${cpc.competition||'—'}</div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Recommendation</div>
          <div style="margin-top:4px"><span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:600;background:${recBg[r.recommendation]||'var(--sf2)'};color:${recColor[r.recommendation]||'var(--mt)'}">${r.recommendation||'—'}</span></div>
        </div>
        <div>
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em">Próximo Rol present</div>
          <div style="font-size:13px;font-weight:600;margin-top:2px;color:${r.proximorol_present?'var(--green)':'var(--red)'}">${r.proximorol_present?'✓ Yes':'✗ No'}</div>
        </div>
      </div>

      <!-- Recommendation rationale -->
      <div style="padding:10px 14px;background:${recBg[r.recommendation]||'var(--sf2)'};border-left:3px solid ${recColor[r.recommendation]||'var(--mt)'};border-radius:0 var(--r) var(--r) 0;margin-bottom:16px;font-size:12px;color:var(--tx)">
        <strong>Recommendation:</strong> ${r.recommendation_rationale||'—'}
      </div>

      <!-- Two columns: Organic + Ads -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <!-- Organic results -->
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">📄 Organic results (${organic.length})</div>
          ${organic.length===0?'<div style="font-size:12px;color:var(--ht);padding:8px">No organic data returned.</div>':
          organic.map(res=>`
            <div style="padding:10px 12px;border:1px solid var(--bd);border-radius:var(--r);margin-bottom:6px;background:var(--sf)">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="width:20px;height:20px;border-radius:50%;background:var(--sf2);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0">${res.position}</span>
                <span style="font-size:11px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${res.company||res.domain||'—'}</span>
                <span style="padding:1px 6px;border-radius:20px;font-size:9px;font-weight:600;${typeStyle[res.type]||'background:var(--sf2);color:var(--ht)'}">${res.type||'organic'}</span>
              </div>
              <div style="font-size:11px;color:var(--ht);margin-bottom:3px;font-family:'DM Mono',monospace">${res.domain||''}</div>
              <div style="font-size:12px;font-weight:500;color:var(--blue);margin-bottom:2px">${res.title||''}</div>
              <div style="font-size:11px;color:var(--mt);line-height:1.4">${res.description||''}</div>
            </div>`).join('')}
        </div>
        <!-- Paid ads -->
        <div>
          <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">📢 Paid Ads (${ads.length})</div>
          ${ads.length===0?'<div style="font-size:12px;color:var(--ht);padding:8px">No ads detected for this keyword.</div>':
          ads.map(ad=>`
            <div style="padding:10px 12px;border:1px solid #FDE68A;border-radius:var(--r);margin-bottom:6px;background:#FFFBEB">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="width:20px;height:20px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;flex-shrink:0;color:var(--amber)">${ad.position}</span>
                <span style="font-size:11px;font-weight:600;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ad.company||ad.domain||'—'}</span>
                <span style="padding:1px 6px;border-radius:20px;font-size:9px;font-weight:600;background:#FEF9C3;color:#854D0E">AD</span>
              </div>
              <div style="font-size:11px;color:var(--ht);margin-bottom:3px;font-family:'DM Mono',monospace">${ad.domain||''}</div>
              <div style="font-size:12px;font-weight:500;color:var(--amber);margin-bottom:2px">${ad.headline||''}</div>
              <div style="font-size:11px;color:var(--mt);line-height:1.4">${ad.description||''}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- Competitor profiles -->
      ${competitors.length>0?`
      <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">🏢 Competitor profiles</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:16px">
        ${competitors.map(c=>`
          <div style="padding:12px 14px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
            <div style="font-size:13px;font-weight:600;margin-bottom:2px">${c.company||'—'}</div>
            <div style="font-size:11px;color:var(--ht);font-family:'DM Mono',monospace;margin-bottom:6px">${c.domain||''}</div>
            <div style="font-size:11px;color:var(--mt);margin-bottom:4px"><strong>Positioning:</strong> ${c.positioning||'—'}</div>
            <div style="font-size:11px;color:var(--mt)"><strong>Strengths:</strong> ${c.strengths||'—'}</div>
          </div>`).join('')}
      </div>`:''}

      <!-- Próximo Rol gap -->
      <div style="padding:12px 14px;background:${r.proximorol_present?'var(--gp)':'var(--rp)'};border:1px solid ${r.proximorol_present?'#A7F3D0':'#FECACA'};border-radius:var(--r)">
        <div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${r.proximorol_present?'var(--green2)':'#991B1B'};margin-bottom:4px">
          ${r.proximorol_present?'✓ Próximo Rol appearing':'⚠ NOT appearing'}
        </div>
        <div style="font-size:12px;color:var(--tx)">${r.proximorol_gap||'—'}</div>
      </div>
      <div style="font-size:10px;color:var(--ht);margin-top:8px;text-align:right">Analysed ${r.search_date||new Date().toLocaleDateString('en-GB')} · ${market} · Powered by Claude + Web Search</div>`;

  }catch(e){
    out.innerHTML=`<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B"><strong>⚠ Error en búsqueda SERP</strong><br>${e.message.replace(/\n/g,'<br>')}<br><details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;opacity:.7">Ver detalle técnico (para copiar)</summary><pre style="margin-top:6px;font-size:10px;background:rgba(0,0,0,.06);padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all">${e.stack||e.message}</pre></details></div>`;
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Analyze SERP`;
  }
}

/* ══════════════════════════════════════════════════════
   KEYWORD ECONOMICS PLANNER MODULE
   ══════════════════════════════════════════════════════ */

async function runEconAnalysis(){
  const kw      = (document.getElementById('econ-kw')?.value||'').trim();
  const budget  = parseFloat(document.getElementById('econ-budget')?.value||500);
  const cvr     = parseFloat(document.getElementById('econ-cvr')?.value||2.5);
  const market  = document.getElementById('econ-market')?.value||'UK';
  const btn     = document.getElementById('econ-btn');
  const out     = document.getElementById('econ-results');

  const currencySymbol = market==='UK'?'£':market==='USA'?'$':'€';
  const currencyCode = market==='UK'?'GBP':market==='USA'?'USD':'EUR';
  const langNote = (market==='España'||market==='LATAM') ? '\nIMPORTANT: Respond with keyword insights in Spanish where relevant for this market. Consider local competitors like InfoJobs, LinkedIn España, Michael Page España for España; and OCC Mundial, Computrabajo, Bumeran for LATAM.' : '';

  if(!kw){ out.innerHTML=`<div style="padding:12px;color:var(--ht);font-size:13px">Enter a keyword to analyse.</div>`; return; }

  btn.disabled=true;
  btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Calculating…`;
  out.innerHTML=`<div style="padding:20px;text-align:center;color:var(--ht);font-size:13px">📊 Analysing keyword economics for "<strong>${kw}</strong>" in ${market}…</div>`;

  const prompt=`You are a B2C PPC and SEO strategist. Analyse the keyword economics for Próximo Rol, an interview coaching service helping professionals in Spain, UK and LATAM prepare for job interviews.

KEYWORD: "${kw}"
TARGET MARKET: ${market}
MONTHLY BUDGET: ${currencySymbol}${budget}
ASSUMED LANDING PAGE CONVERSION RATE: ${cvr}%
${langNote}

Provide a comprehensive economic analysis. Return ONLY valid JSON, no markdown:
{
  "keyword": "...",
  "market": "...",
  "cpc": {
    "min": 0.00,
    "max": 0.00,
    "recommended_bid": 0.00,
    "currency": "${currencyCode}",
    "competition": "low|medium|high",
    "notes": "..."
  },
  "paid_projection": {
    "monthly_clicks_min": 0,
    "monthly_clicks_max": 0,
    "monthly_clicks_recommended": 0,
    "monthly_leads_min": 0,
    "monthly_leads_max": 0,
    "monthly_leads_recommended": 0,
    "cost_per_lead_min": 0.00,
    "cost_per_lead_max": 0.00,
    "cost_per_lead_recommended": 0.00,
    "annual_leads_projection": 0,
    "annual_spend": 0.00,
    "roi_assessment": "poor|fair|good|excellent",
    "roi_rationale": "..."
  },
  "organic_difficulty": {
    "score": 0,
    "label": "Easy|Moderate|Hard|Very Hard",
    "estimated_months_to_rank": "X-Y months",
    "rationale": "..."
  },
  "organic_strategy": [
    {
      "phase": 1,
      "title": "...",
      "duration": "Month X-Y",
      "actions": ["action 1", "action 2", "action 3"],
      "priority": "high|medium|low"
    }
  ],
  "content_ideas": [
    {"type": "blog|landing_page|guide|case_study", "title": "...", "rationale": "..."}
  ],
  "recommendation": {
    "short_term": "...",
    "long_term": "...",
    "budget_split": {"paid_pct": 70, "seo_pct": 30},
    "overall": "..."
  }
}`;

  try{
    const data = await antFetch({
        model:'claude-sonnet-4-20250514',
        max_tokens:2500,
        messages:[{role:'user',content:prompt}]
      });
    const raw   = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean = raw.replace(/```json|```/g,'').trim();
    let r;
    try{ r=JSON.parse(clean); }
    catch(e){ const m=clean.match(/\{[\s\S]*\}/); if(m) r=JSON.parse(m[0]); else throw new Error('Parse error'); }

    const p   = r.paid_projection||{};
    const cpc = r.cpc||{};
    const od  = r.organic_difficulty||{};
    const rec = r.recommendation||{};
    const phases = r.organic_strategy||[];
    const content= r.content_ideas||[];

    const roiColor={excellent:'var(--green)',good:'var(--teal)',fair:'var(--amber)',poor:'var(--red)'}[p.roi_assessment]||'var(--mt)';
    const diffColor={'Easy':'var(--green)','Moderate':'var(--teal)','Hard':'var(--amber)','Very Hard':'var(--red)'}[od.label]||'var(--mt)';
    const compColor={low:'var(--green)',medium:'var(--amber)',high:'var(--red)'}[cpc.competition]||'var(--mt)';
    const phaseColor={high:'var(--green)',medium:'var(--amber)',low:'var(--ht)'}; 
    const typeColor={blog:'var(--bp)',landing_page:'var(--gp)',guide:'var(--pp)',case_study:'var(--ap)'};
    const typeText={blog:'var(--blue)',landing_page:'var(--green)',guide:'var(--purple)',case_study:'var(--amber)'};

    // Budget slider projection
    const recCpc = cpc.recommended_bid||((cpc.min||1)+(cpc.max||2))/2;
    const recClicks = budget/recCpc;
    const recLeads  = recClicks*(cvr/100);

    out.innerHTML=`
      <!-- KPI summary row -->
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px;margin-bottom:16px">
        ${[
          {l:'Recommended CPC',v:`£${recCpc.toFixed(2)}`,s:`Range: £${(cpc.min||0).toFixed(2)}–£${(cpc.max||0).toFixed(2)}`,c:'var(--teal)'},
          {l:'Competition',v:cpc.competition||'—',s:cpc.notes?.slice(0,40)||'',c:compColor},
          {l:'Est. monthly clicks',v:Math.round(recClicks).toLocaleString(),s:`for £${budget}/mo`,c:'var(--blue)'},
          {l:'Est. monthly leads',v:Math.round(recLeads).toLocaleString(),s:`at ${cvr}% CVR`,c:'var(--green)'},
          {l:'Cost per lead',v:`£${recLeads>0?(budget/recLeads).toFixed(0):'—'}`,s:'estimated',c:roiColor},
          {l:'ROI assessment',v:p.roi_assessment||'—',s:p.roi_rationale?.slice(0,40)||'',c:roiColor},
        ].map(k=>`<div style="background:var(--sf2);border-radius:var(--r);padding:10px 12px;border-left:3px solid ${k.c}">
          <div style="font-size:10px;color:var(--ht);font-weight:600;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px">${k.l}</div>
          <div style="font-size:18px;font-weight:700;color:${k.c}">${k.v}</div>
          <div style="font-size:10px;color:var(--ht);margin-top:2px">${k.s}</div>
        </div>`).join('')}
      </div>

      <!-- Budget calculator (live) -->
      <div style="padding:14px;background:var(--sf2);border-radius:var(--r);margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">📐 Budget calculator — adjust to see projections</div>
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px">
          <span style="font-size:13px;font-weight:600">£</span>
          <input type="range" id="econ-slider" min="100" max="10000" step="100" value="${budget}" oninput="econCalc(${recCpc},${cvr})" style="flex:1;min-width:180px;accent-color:var(--teal)"/>
          <input type="number" id="econ-slider-val" value="${budget}" min="100" max="50000" step="100" oninput="document.getElementById('econ-slider').value=this.value;econCalc(${recCpc},${cvr})" style="width:90px;padding:6px 8px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf);color:var(--tx);outline:none"/>
          <span style="font-size:12px;color:var(--ht)">/month</span>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:8px" id="econ-calc-row">
          <!-- filled by econCalc() -->
        </div>
      </div>

      <!-- Two column: Paid vs Organic strategy -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <!-- Paid ads analysis -->
        <div style="padding:14px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
          <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">📢 Paid (Google Ads)</div>
          <div style="font-size:12px;color:var(--tx);margin-bottom:8px">${p.roi_rationale||'—'}</div>
          <div style="display:flex;flex-direction:column;gap:6px">
            ${[
              {l:'Min clicks/mo',v:p.monthly_clicks_min||0},
              {l:'Max clicks/mo',v:p.monthly_clicks_max||0},
              {l:'Leads (min)',v:p.monthly_leads_min||0},
              {l:'Leads (max)',v:p.monthly_leads_max||0},
              {l:'Annual leads',v:p.annual_leads_projection||0},
              {l:'Annual spend',v:`£${(p.annual_spend||0).toLocaleString()}`},
            ].map(row=>`<div style="display:flex;justify-content:space-between;font-size:12px;border-bottom:1px solid var(--bd);padding-bottom:4px">
              <span style="color:var(--mt)">${row.l}</span><span style="font-weight:600">${row.v}</span>
            </div>`).join('')}
          </div>
        </div>
        <!-- Organic difficulty -->
        <div style="padding:14px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
          <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">🌱 Organic SEO Difficulty</div>
          <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px">
            <div style="width:56px;height:56px;border-radius:50%;border:4px solid ${diffColor};display:flex;align-items:center;justify-content:center;flex-direction:column">
              <span style="font-size:16px;font-weight:700;color:${diffColor}">${od.score||0}</span>
              <span style="font-size:8px;color:var(--ht)">/100</span>
            </div>
            <div>
              <div style="font-size:14px;font-weight:600;color:${diffColor}">${od.label||'—'}</div>
              <div style="font-size:11px;color:var(--ht)">${od.estimated_months_to_rank||'—'} to rank</div>
            </div>
          </div>
          <div style="font-size:12px;color:var(--mt)">${od.rationale||'—'}</div>
        </div>
      </div>

      <!-- Recommended budget split -->
      <div style="padding:12px 14px;background:var(--bp);border-left:3px solid var(--blue);border-radius:0 var(--r) var(--r) 0;margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">💡 Overall Recommendation</div>
        <div style="font-size:12px;color:var(--tx);margin-bottom:6px">${rec.overall||'—'}</div>
        <div style="display:flex;gap:12px;font-size:12px">
          <span><strong>Short-term:</strong> ${rec.short_term||'—'}</span>
        </div>
        <div style="font-size:12px;margin-top:4px"><strong>Long-term:</strong> ${rec.long_term||'—'}</div>
        ${rec.budget_split?`<div style="margin-top:10px">
          <div style="font-size:11px;color:var(--ht);margin-bottom:4px">Suggested budget split</div>
          <div style="height:8px;border-radius:20px;overflow:hidden;display:flex">
            <div style="width:${rec.budget_split.paid_pct||70}%;background:var(--amber)"></div>
            <div style="width:${rec.budget_split.seo_pct||30}%;background:var(--green)"></div>
          </div>
          <div style="display:flex;gap:12px;font-size:10px;margin-top:4px">
            <span style="color:var(--amber)">■ Paid ${rec.budget_split.paid_pct||70}%</span>
            <span style="color:var(--green)">■ SEO ${rec.budget_split.seo_pct||30}%</span>
          </div>
        </div>`:''}
      </div>

      <!-- Organic strategy phases -->
      ${phases.length>0?`
      <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:10px">🗺 Organic SEO Roadmap</div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
        ${phases.map(ph=>`
          <div style="border:1px solid var(--bd);border-radius:var(--r);overflow:hidden">
            <div style="padding:10px 14px;background:var(--sf2);display:flex;align-items:center;gap:10px">
              <span style="width:24px;height:24px;border-radius:50%;background:var(--green);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0">${ph.phase}</span>
              <span style="font-size:13px;font-weight:600;flex:1">${ph.title}</span>
              <span style="font-size:11px;color:var(--ht)">${ph.duration}</span>
              <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:${ph.priority==='high'?'var(--gp)':ph.priority==='medium'?'var(--ap)':'var(--sf2)'};color:${phaseColor[ph.priority]||'var(--ht)'}">${ph.priority}</span>
            </div>
            <div style="padding:10px 14px;display:flex;flex-direction:column;gap:4px">
              ${(ph.actions||[]).map(a=>`<div style="display:flex;align-items:flex-start;gap:8px;font-size:12px;color:var(--mt)"><span style="color:var(--green);flex-shrink:0;margin-top:1px">→</span>${a}</div>`).join('')}
            </div>
          </div>`).join('')}
      </div>`:''}

      <!-- Content ideas -->
      ${content.length>0?`
      <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">✍️ Content ideas to rank organically</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">
        ${content.map(c=>`
          <div style="padding:10px 12px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
            <span style="padding:2px 8px;border-radius:20px;font-size:10px;font-weight:600;background:${typeColor[c.type]||'var(--sf2)'};color:${typeText[c.type]||'var(--mt)'};display:inline-block;margin-bottom:6px">${c.type?.replace('_',' ')||'content'}</span>
            <div style="font-size:12px;font-weight:500;margin-bottom:4px">${c.title}</div>
            <div style="font-size:11px;color:var(--ht)">${c.rationale}</div>
          </div>`).join('')}
      </div>`:''}
      <div style="font-size:10px;color:var(--ht);margin-top:10px;text-align:right">Analysis by Claude AI · ${new Date().toLocaleDateString('en-GB')} · Estimates only — validate with Google Keyword Planner</div>`;

    // Run initial calc
    econCalc(recCpc, cvr);

  }catch(e){
    out.innerHTML=`<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B"><strong>⚠ Error en cálculo ROI</strong><br>${e.message.replace(/\n/g,'<br>')}<br><details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;opacity:.7">Ver detalle (para copiar)</summary><pre style="margin-top:6px;font-size:10px;background:rgba(0,0,0,.06);padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all">${e.stack||e.message}</pre></details></div>`;
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg> Calculate ROI`;
  }
}

function econCalc(cpc, cvr){
  const slider = document.getElementById('econ-slider');
  const valInp = document.getElementById('econ-slider-val');
  const row    = document.getElementById('econ-calc-row');
  if(!slider||!row) return;
  const budget = parseFloat(slider?.value||500);
  if(valInp) valInp.value = budget;
  const clicks = budget / cpc;
  const leads  = clicks * (cvr/100);
  const cpl    = leads>0 ? budget/leads : 0;
  row.innerHTML=[
    {l:'Budget',v:`£${budget.toLocaleString()}`,c:'var(--tx)'},
    {l:'Est. clicks',v:Math.round(clicks).toLocaleString(),c:'var(--blue)'},
    {l:'Est. leads',v:Math.round(leads).toLocaleString(),c:'var(--green)'},
    {l:'Cost per lead',v:`£${cpl.toFixed(0)}`,c:'var(--teal)'},
    {l:'Annual leads',v:Math.round(leads*12).toLocaleString(),c:'var(--purple)'},
    {l:'Annual spend',v:`£${(budget*12).toLocaleString()}`,c:'var(--amber)'},
  ].map(k=>`<div style="background:var(--sf);border-radius:var(--r);padding:8px 10px;text-align:center">
    <div style="font-size:10px;color:var(--ht);margin-bottom:2px">${k.l}</div>
    <div style="font-size:15px;font-weight:700;color:${k.c}">${k.v}</div>
  </div>`).join('');
}

/* ══════════════════════════════════════════════════════
   SEO INTELLIGENCE MODULE
   ══════════════════════════════════════════════════════ */

const SEO_CHECK_STORE = 'eco_seo_checklist';
let SEO_CHAT_HISTORY  = [];

/* ── Tab switcher ── */
function seoTab(id){
  ['audit','chat','spy','check'].forEach(t=>{
    const panel = document.getElementById('seopanel-'+t);
    const btn   = document.getElementById('seotab-'+t);
    if(!panel||!btn) return;
    const active = t===id;
    panel.style.display = active?'block':'none';
    btn.style.background = active?'var(--green)':'none';
    btn.style.color      = active?'white':'var(--mt)';
  });
  if(id==='check') renderSEOChecklist();
  if(id==='chat' && SEO_CHAT_HISTORY.length===0) renderChatHistory();
}

function renderSEOPage(){
  setNB('seo','live');
  seoTab('audit');
  renderSEOChecklist();
}

/* ══ BLOCK 1: PAGE AUDITOR ══ */
async function runPageAudit(){
  const url   = (document.getElementById('audit-url')?.value||'').trim();
  const focus = document.getElementById('audit-focus')?.value||'full';
  const btn   = document.getElementById('audit-btn');
  const out   = document.getElementById('audit-results');
  if(!url){ out.innerHTML=`<div style="padding:12px;color:var(--ht);font-size:13px">Enter a URL to audit.</div>`; return; }

  btn.disabled=true;
  btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Auditing…`;
  out.innerHTML=`<div style="padding:20px;text-align:center;color:var(--ht);font-size:13px">🔍 Fetching and auditing <strong>${url}</strong>…<br><small style="margin-top:6px;display:block">This may take 15-20 seconds</small></div>`;

  const focusCtx = {full:'a complete SEO audit covering all aspects',onpage:'on-page SEO factors only (titles, headings, meta, keywords)',content:'content quality, readability and topical authority',technical:'technical SEO (schema, canonical, robots, site structure)',ux:'user experience and conversion optimisation'}[focus];

  const prompt=`You are a senior SEO specialist auditing a website for Próximo Rol, a B2C interview coaching service for professionals in Spain, UK, LATAM and Dubai.

Perform ${focusCtx} for this URL: ${url}

Fetch and read the page content, then evaluate it across these dimensions:

Return ONLY valid JSON, no markdown:
{
  "url": "...",
  "page_title": "...",
  "overall_score": 0,
  "grade": "A|B|C|D|F",
  "summary": "...",
  "critical_issues": [{"issue":"...","impact":"high|medium|low","fix":"..."}],
  "on_page": {
    "title_tag": {"present":true,"value":"...","length":0,"score":0,"verdict":"good|ok|poor","recommendation":"..."},
    "meta_description": {"present":true,"value":"...","length":0,"score":0,"verdict":"good|ok|poor","recommendation":"..."},
    "h1": {"present":true,"value":"...","count":0,"score":0,"verdict":"good|ok|poor","recommendation":"..."},
    "h2_count": 0,
    "keyword_density": {"primary_keyword":"...","present":true,"score":0,"recommendation":"..."},
    "internal_links": {"count":0,"score":0,"recommendation":"..."},
    "images_alt": {"score":0,"recommendation":"..."}
  },
  "content": {
    "word_count": 0,
    "readability": {"score":0,"verdict":"...","recommendation":"..."},
    "topical_authority": {"score":0,"verdict":"...","recommendation":"..."},
    "cta_present": true,
    "cta_recommendation": "..."
  },
  "technical": {
    "schema_markup": {"present":true,"types":[],"recommendation":"..."},
    "canonical": {"present":true,"recommendation":"..."},
    "mobile_friendly": {"verdict":"...","recommendation":"..."}
  },
  "quick_wins": [{"action":"...","effort":"low|medium|high","impact":"high|medium|low","time":"X hours"}],
  "epr_specific": {"recommendation":"...","missing_keywords":[],"opportunities":"..."}
}`;

  try{
    const data = await antFetch({
        model:'claude-sonnet-4-20250514',
        max_tokens:2500,
        tools:[{"type":"web_search_20250305","name":"web_search"}],
        messages:[{role:'user',content:prompt}]
      });
    
    const raw  = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean= raw.replace(/```json|```/g,'').trim();
    let r; try{r=JSON.parse(clean);}catch(e){const m=clean.match(/\{[\s\S]*\}/);if(m)r=JSON.parse(m[0]);else throw new Error('Parse error');}

    const gradeColor={A:'var(--green)',B:'var(--teal)',C:'var(--amber)',D:'#EA580C',F:'var(--red)'}[r.grade]||'var(--mt)';
    const verdictColor={good:'var(--green)',ok:'var(--amber)',poor:'var(--red)'};
    const impactBg={high:'var(--rp)',medium:'var(--ap)',low:'var(--sf2)'};
    const impactColor={high:'var(--red)',medium:'var(--amber)',low:'var(--ht)'};
    const effortBg={low:'var(--gp)',medium:'var(--ap)',high:'var(--bp)'};
    const effortColor={low:'var(--green)',medium:'var(--amber)',high:'var(--blue)'};

    const op = r.on_page||{}; const ct = r.content||{}; const te = r.technical||{};
    const issues = r.critical_issues||[]; const wins = r.quick_wins||[];

    const scoreRow = (label, obj) => {
      if(!obj) return '';
      const v = obj.verdict||'ok';
      const icon = v==='good'?'✓':v==='poor'?'✗':'~';
      return `<tr>
        <td style="padding:7px 10px;font-size:12px;border-bottom:1px solid var(--bd)">${label}</td>
        <td style="padding:7px 10px;font-size:12px;border-bottom:1px solid var(--bd);color:var(--mt);max-width:200px;word-break:break-word">${obj.value||obj.primary_keyword||obj.count||obj.word_count||''}</td>
        <td style="padding:7px 10px;border-bottom:1px solid var(--bd);text-align:center"><span style="color:${verdictColor[v]||'var(--mt)'};font-weight:600;font-size:13px">${icon}</span></td>
        <td style="padding:7px 10px;font-size:11px;color:var(--mt);border-bottom:1px solid var(--bd)">${obj.recommendation||''}</td>
      </tr>`;
    };

    out.innerHTML=`
      <!-- Score header -->
      <div style="display:flex;align-items:center;gap:20px;padding:16px;background:var(--sf2);border-radius:var(--r);margin-bottom:16px;flex-wrap:wrap">
        <div style="width:72px;height:72px;border-radius:50%;border:5px solid ${gradeColor};display:flex;align-items:center;justify-content:center;flex-direction:column;flex-shrink:0">
          <span style="font-size:26px;font-weight:800;color:${gradeColor}">${r.grade||'—'}</span>
        </div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600;margin-bottom:4px">${r.page_title||url}</div>
          <div style="font-size:12px;color:var(--mt);margin-bottom:6px">${r.summary||''}</div>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:8px;border-radius:20px;background:var(--bd);overflow:hidden"><div style="height:100%;width:${r.overall_score||0}%;background:${gradeColor};transition:width .5s"></div></div>
            <span style="font-size:12px;font-weight:600;color:${gradeColor}">${r.overall_score||0}/100</span>
          </div>
        </div>
      </div>

      <!-- Critical issues -->
      ${issues.length>0?`
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">⚠ Critical issues (${issues.length})</div>
        ${issues.map(i=>`<div style="padding:10px 14px;background:${impactBg[i.impact]||'var(--sf2)'};border-left:3px solid ${impactColor[i.impact]||'var(--ht)'};border-radius:0 var(--r) var(--r) 0;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600">${i.issue}</span>
            <span style="padding:1px 7px;border-radius:20px;font-size:9px;font-weight:600;background:${impactColor[i.impact]||'var(--ht)'};color:white;margin-left:auto">${i.impact}</span>
          </div>
          <div style="font-size:11px;color:var(--mt)">💡 ${i.fix}</div>
        </div>`).join('')}
      </div>`:''}

      <!-- On-page table -->
      <div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">📄 On-page factors</div>
        <table style="width:100%;border-collapse:collapse;background:var(--sf);border-radius:var(--r);overflow:hidden;border:1px solid var(--bd)">
          <thead><tr style="background:var(--sf2)">
            <th style="padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;text-align:left">Element</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;text-align:left">Current value</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;text-align:center">Status</th>
            <th style="padding:7px 10px;font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;text-align:left">Recommendation</th>
          </tr></thead>
          <tbody>
            ${scoreRow('Title tag', op.title_tag)}
            ${scoreRow('Meta description', op.meta_description)}
            ${scoreRow('H1 heading', op.h1)}
            ${scoreRow('Keyword density', op.keyword_density)}
            ${scoreRow('Internal links', op.internal_links)}
            ${scoreRow('Image alt text', op.images_alt)}
            ${scoreRow('Readability', ct.readability)}
            ${scoreRow('Topical authority', ct.topical_authority)}
            ${scoreRow('Schema markup', te.schema_markup)}
          </tbody>
        </table>
      </div>

      <!-- Coaching-specific -->
      ${r.epr_specific?`
      <div style="padding:12px 14px;background:var(--gp);border-left:3px solid var(--green);border-radius:0 var(--r) var(--r) 0;margin-bottom:16px">
        <div style="font-size:11px;font-weight:600;color:var(--green2);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">🎯 Oportunidades específicas — Coaching de Entrevistas</div>
        <div style="font-size:12px;color:var(--tx);margin-bottom:6px">${r.epr_specific.recommendation||''}</div>
        ${r.epr_specific.missing_keywords?.length>0?`<div style="font-size:11px;color:var(--mt)"><strong>Keywords que faltan:</strong> ${r.epr_specific.missing_keywords.join(', ')}</div>`:''}
        ${r.epr_specific.opportunities?`<div style="font-size:11px;color:var(--mt);margin-top:4px"><strong>Oportunidades:</strong> ${r.epr_specific.opportunities}</div>`:''}
      </div>`:''}

      <!-- Quick wins -->
      ${wins.length>0?`
      <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">⚡ Quick wins</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">
        ${wins.map(w=>`<div style="padding:10px 12px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
          <div style="font-size:12px;font-weight:500;margin-bottom:6px">${w.action}</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <span style="padding:1px 7px;border-radius:20px;font-size:9px;font-weight:600;background:${effortBg[w.effort]||'var(--sf2)'};color:${effortColor[w.effort]||'var(--ht)'}">Effort: ${w.effort}</span>
            <span style="padding:1px 7px;border-radius:20px;font-size:9px;font-weight:600;background:${impactBg[w.impact]||'var(--sf2)'};color:${impactColor[w.impact]||'var(--ht)'}">Impact: ${w.impact}</span>
            ${w.time?`<span style="padding:1px 7px;border-radius:20px;font-size:9px;background:var(--sf2);color:var(--ht)">⏱ ${w.time}</span>`:''}
          </div>
        </div>`).join('')}
      </div>`:''}
      <div style="font-size:10px;color:var(--ht);margin-top:10px;text-align:right">Audited ${new Date().toLocaleDateString('en-GB')} · Powered by Claude AI + Web Search</div>`;

  }catch(e){
    out.innerHTML=`<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B"><strong>⚠ Error en auditoría</strong><br>${e.message.replace(/\n/g,'<br>')}<br><details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;opacity:.7">Ver detalle (para copiar)</summary><pre style="margin-top:6px;font-size:10px;background:rgba(0,0,0,.06);padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all">${e.stack||e.message}</pre></details></div>`;
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Audit Page`;
  }
}

/* ══ BLOCK 2: SEO CHAT ══ */
function renderChatHistory(){
  const el = document.getElementById('seo-chat-history');
  if(!el) return;
  if(SEO_CHAT_HISTORY.length===0){
    el.innerHTML=`<div style="padding:16px;text-align:center;color:var(--ht);font-size:13px">👋 Ask anything about SEO for Próximo Rol.<br><small>Shift+Enter for new line · Enter to send</small></div>`;
    return;
  }
  el.innerHTML = SEO_CHAT_HISTORY.map(m=>{
    const isUser = m.role==='user';
    return `<div style="display:flex;gap:10px;${isUser?'flex-direction:row-reverse':''}">
      <div style="width:28px;height:28px;border-radius:50%;background:${isUser?'var(--green)':'var(--purple)'};display:flex;align-items:center;justify-content:center;font-size:12px;flex-shrink:0">${isUser?'M':'🤖'}</div>
      <div style="max-width:85%;padding:10px 14px;border-radius:${isUser?'var(--rl) var(--rl) 4px var(--rl)':'var(--rl) var(--rl) var(--rl) 4px'};background:${isUser?'var(--green)':'var(--sf)'};color:${isUser?'white':'var(--tx)'};font-size:12px;line-height:1.6;border:${isUser?'none':'1px solid var(--bd)'}">
        ${m.content.replace(/\n/g,'<br>')}
      </div>
    </div>`;
  }).join('');
  el.scrollTop = el.scrollHeight;
}

function seoAskSuggestion(q){ const inp=document.getElementById('seo-chat-input'); if(inp){inp.value=q; runSEOChat();} }
function seoClearChat(){ SEO_CHAT_HISTORY=[]; renderChatHistory(); }

async function runSEOChat(){
  const inp  = document.getElementById('seo-chat-input');
  const btn  = document.getElementById('chat-send-btn');
  const q    = (inp?.value||'').trim();
  if(!q) return;

  SEO_CHAT_HISTORY.push({role:'user',content:q});
  inp.value='';
  renderChatHistory();
  btn.disabled=true;
  btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg>`;

  // Build messages for API (last 8 turns to stay within context)
  const history = SEO_CHAT_HISTORY.slice(-8);
  const msgs = [
    {role:'user', content:`SYSTEM: Eres un consultor experto en SEO y marketing digital especializado en webs de servicios B2C en español. Trabajas para Próximo Rol — un servicio de coaching de entrevistas para profesionales mid y senior de habla hispana. Su web es proximorol.com. Siempre da consejos específicos y accionables relevantes para sus mercados: España, LATAM (México, Argentina, Colombia, Chile) y UK. Cuando necesites información actualizada, usa la búsqueda web. Responde siempre en español.\n\nPregunta del usuario: ${history[0].content}`},
    ...history.slice(1).map(m=>({role:m.role,content:m.content}))
  ];

  try{
    const data = await antFetch({
        model:'claude-sonnet-4-20250514',
        max_tokens:2500,
        tools:[{"type":"web_search_20250305","name":"web_search"}],
        messages: msgs
      });
    
    const answer = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
    SEO_CHAT_HISTORY.push({role:'assistant',content:answer||'No response received.'});
    renderChatHistory();
  }catch(e){
    SEO_CHAT_HISTORY.push({role:'assistant',content:`⚠ Error: ${e.message}\n\n${e.message.includes('API Key') ? '→ Ve a ⚙️ Settings y configura tu Anthropic API Key' : 'Inténtalo de nuevo o copia el error para diagnóstico.'}`});
    renderChatHistory();
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg> Send`;
  }
}

/* ══ BLOCK 3: COMPETITOR SPY ══ */
async function runCompetitorSpy(){
  const url   = (document.getElementById('spy-url')?.value||'').trim();
  const vsUrl = (document.getElementById('spy-vs-url')?.value||'').trim();
  const btn   = document.getElementById('spy-btn');
  const out   = document.getElementById('spy-results');
  if(!url){ out.innerHTML=`<div style="padding:12px;color:var(--ht);font-size:13px">Enter a competitor URL.</div>`; return; }

  btn.disabled=true;
  btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin 1s linear infinite"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg> Spying…`;
  out.innerHTML=`<div style="padding:20px;text-align:center;color:var(--ht);font-size:13px">🕵️ Analysing competitor page…</div>`;

  const vsCtx = vsUrl ? `Also compare against Próximo Rol's page: ${vsUrl}` : '';

  const prompt=`You are an SEO competitive intelligence analyst. Analyse this competitor page for Próximo Rol (interview coaching service for Spanish-speaking professionals in Spain, UK and LATAM).

Competitor URL: ${url}
${vsCtx}

Fetch the competitor page and analyse:
1. Their SEO strategy (title, meta, headings, keywords)
2. Their content positioning and messaging
3. What they do better than a typical coaching service
4. Gaps and weaknesses Próximo Rol could exploit
${vsUrl?'5. Direct comparison with the Próximo Rol page provided':''}

Return ONLY valid JSON, no markdown:
{
  "competitor_url":"...",
  "company_name":"...",
  "page_title":"...",
  "meta_description":"...",
  "primary_keywords":["..."],
  "h1":"...",
  "content_summary":"...",
  "positioning":"...",
  "strengths":[{"point":"...","detail":"..."}],
  "weaknesses":[{"point":"...","detail":"..."}],
  "seo_score":0,
  "tactics":["..."],
  "proximorol_opportunities":[{"opportunity":"...","action":"...","priority":"high|medium|low"}],
  "vs_comparison":{"winner":"competitor|proximorol|tie","reasoning":"...","proximorol_advantages":["..."],"competitor_advantages":["..."]}
}`;

  try{
    const data = await antFetch({
        model:'claude-sonnet-4-20250514',
        max_tokens:2500,
        tools:[{"type":"web_search_20250305","name":"web_search"}],
        messages:[{role:'user',content:prompt}]
      });
    
    const raw  = (data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    const clean= raw.replace(/```json|```/g,'').trim();
    let r; try{r=JSON.parse(clean);}catch(e){const m=clean.match(/\{[\s\S]*\}/);if(m)r=JSON.parse(m[0]);else throw new Error('Parse error');}

    const prioColor={high:'var(--red)',medium:'var(--amber)',low:'var(--ht)'};
    const prioBg={high:'var(--rp)',medium:'var(--ap)',low:'var(--sf2)'};
    const opps = r.proximorol_opportunities||[];
    const vs   = r.vs_comparison||{};

    out.innerHTML=`
      <!-- Header -->
      <div style="padding:14px;background:var(--sf2);border-radius:var(--r);margin-bottom:14px">
        <div style="font-size:14px;font-weight:600;margin-bottom:4px">${r.company_name||'Competitor'}</div>
        <div style="font-size:11px;color:var(--ht);font-family:'DM Mono',monospace;margin-bottom:8px">${r.competitor_url||url}</div>
        <div style="font-size:12px;margin-bottom:4px"><strong>Title:</strong> ${r.page_title||'—'}</div>
        <div style="font-size:12px;margin-bottom:4px"><strong>Meta:</strong> ${r.meta_description||'—'}</div>
        <div style="font-size:12px;margin-bottom:6px"><strong>H1:</strong> ${r.h1||'—'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">
          ${(r.primary_keywords||[]).map(k=>`<span style="padding:2px 8px;border-radius:20px;font-size:10px;background:var(--bp);color:var(--blue);font-weight:500">${k}</span>`).join('')}
        </div>
      </div>

      <!-- Strengths & Weaknesses -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">
        <div style="padding:12px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
          <div style="font-size:11px;font-weight:600;color:var(--red);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">💪 Their strengths</div>
          ${(r.strengths||[]).map(s=>`<div style="margin-bottom:6px"><div style="font-size:12px;font-weight:500">${s.point}</div><div style="font-size:11px;color:var(--mt)">${s.detail}</div></div>`).join('')}
        </div>
        <div style="padding:12px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
          <div style="font-size:11px;font-weight:600;color:var(--green);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">🎯 Their weaknesses</div>
          ${(r.weaknesses||[]).map(w=>`<div style="margin-bottom:6px"><div style="font-size:12px;font-weight:500">${w.point}</div><div style="font-size:11px;color:var(--mt)">${w.detail}</div></div>`).join('')}
        </div>
      </div>

      <!-- Opportunities for Próximo Rol -->
      ${opps.length>0?`
      <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">🚀 Opportunities for Próximo Rol</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:14px">
        ${opps.map(o=>`<div style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border:1px solid var(--bd);border-radius:var(--r);background:var(--sf)">
          <span style="padding:2px 8px;border-radius:20px;font-size:9px;font-weight:600;background:${prioBg[o.priority]||'var(--sf2)'};color:${prioColor[o.priority]||'var(--ht)'};white-space:nowrap;flex-shrink:0">${o.priority}</span>
          <div>
            <div style="font-size:12px;font-weight:500;margin-bottom:2px">${o.opportunity}</div>
            <div style="font-size:11px;color:var(--mt)">→ ${o.action}</div>
          </div>
        </div>`).join('')}
      </div>`:''}

      <!-- VS Comparison -->
      ${vsUrl&&vs.reasoning?`
      <div style="padding:12px 14px;background:var(--bp);border-left:3px solid var(--blue);border-radius:0 var(--r) var(--r) 0">
        <div style="font-size:11px;font-weight:600;color:var(--blue);text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px">⚔️ Head-to-head: ${vs.winner==='Próximo Rol'?'✓ Próximo Rol wins':vs.winner==='competitor'?'⚠ Competitor wins':'🤝 Tie'}</div>
        <div style="font-size:12px;color:var(--tx);margin-bottom:8px">${vs.reasoning}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
          ${vs.proximorol_advantages?.length>0?`<div><div style="font-size:10px;font-weight:600;color:var(--green);margin-bottom:4px">ECOVERITAS ADVANTAGES</div>${vs.proximorol_advantages.map(a=>`<div style="font-size:11px;color:var(--mt)">✓ ${a}</div>`).join('')}</div>`:''}
          ${vs.competitor_advantages?.length>0?`<div><div style="font-size:10px;font-weight:600;color:var(--red);margin-bottom:4px">COMPETITOR ADVANTAGES</div>${vs.competitor_advantages.map(a=>`<div style="font-size:11px;color:var(--mt)">✗ ${a}</div>`).join('')}</div>`:''}
        </div>
      </div>`:''}
      <div style="font-size:10px;color:var(--ht);margin-top:10px;text-align:right">Analysed ${new Date().toLocaleDateString('en-GB')} · Claude AI + Web Search</div>`;

  }catch(e){
    out.innerHTML=`<div style="padding:14px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B"><strong>⚠ Error en Competitor Spy</strong><br>${e.message.replace(/\n/g,'<br>')}<br><details style="margin-top:8px"><summary style="cursor:pointer;font-size:11px;opacity:.7">Ver detalle (para copiar)</summary><pre style="margin-top:6px;font-size:10px;background:rgba(0,0,0,.06);padding:8px;border-radius:6px;white-space:pre-wrap;word-break:break-all">${e.stack||e.message}</pre></details></div>`;
  } finally {
    btn.disabled=false;
    btn.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg> Spy Page`;
  }
}

/* ══ BLOCK 4: SEO CHECKLIST ══ */
const SEO_CHECKLIST = [
  {cat:'🏷 On-Page',items:[
    {id:'title',label:'Title tag present and under 60 characters'},
    {id:'meta',label:'Meta description between 120–158 characters'},
    {id:'h1',label:'Single H1 tag containing the primary keyword'},
    {id:'h2s',label:'H2/H3 tags structure the content correctly'},
    {id:'kw_density',label:'Primary keyword appears in the first 100 words'},
    {id:'alt_text',label:'All images have descriptive alt text'},
    {id:'url_slug',label:'URLs are short, descriptive and keyword-rich'},
    {id:'internal_links',label:'Minimum 2–3 internal links per page'},
  ]},
  {cat:'📝 Content',items:[
    {id:'word_count',label:'Service pages have 800+ words of content'},
    {id:'readability',label:'Content is readable (short sentences, brief paragraphs)'},
    {id:'cta',label:'Every page has a clear, visible CTA'},
    {id:'trust',label:'Testimonials or client logos are present'},
    {id:'faq',label:'FAQ section on key pages'},
    {id:'freshness',label:'Content updated within the last 6 months'},
    {id:'blog',label:'Blog activo con artículos sobre entrevistas y carrera profesional'},
  ]},
  {cat:'⚙️ Technical',items:[
    {id:'https',label:'Site uses HTTPS across all pages'},
    {id:'mobile',label:'Responsive design — mobile-friendly'},
    {id:'speed',label:'Page load time under 3 seconds'},
    {id:'sitemap',label:'XML sitemap submitted to Google Search Console'},
    {id:'robots',label:'robots.txt file configured correctly'},
    {id:'canonical',label:'Canonical tags on pages with similar content'},
    {id:'404',label:'Custom 404 pages with a link back to home'},
    {id:'schema',label:'Schema markup implemented (Organization, Service)'},
  ]},
  {cat:'🔗 Authority',items:[
    {id:'gmb',label:'Google Business Profile created and verified'},
    {id:'backlinks',label:'Minimum 10 backlinks from relevant domains'},
    {id:'social',label:'Social profiles linked from the website'},
    {id:'directories',label:'Listado en directorios de coaches y desarrollo profesional'},
    {id:'press',label:'At least 1 mention in an industry media outlet'},
  ]},
  {cat:'📊 Analytics',items:[
    {id:'gsc_verified',label:'Google Search Console verified and active'},
    {id:'ga4_setup',label:'GA4 configured with conversion events'},
    {id:'goals',label:'Goals/conversions defined in Analytics'},
    {id:'monthly_review',label:'Monthly review of keywords and rankings'},
  ]},
];

function seoCheckLoad(){ try{return JSON.parse(localStorage.getItem(SEO_CHECK_STORE)||'{}');}catch(e){return{};} }
function seoCheckSave(d){ localStorage.setItem(SEO_CHECK_STORE,JSON.stringify(d)); }

function seoCheckToggle(id){
  const d=seoCheckLoad();
  d[id]=!d[id];
  seoCheckSave(d);
  renderSEOChecklist();
}

function seoCheckReset(){
  if(!confirm('Reset all checklist items?')) return;
  seoCheckSave({});
  renderSEOChecklist();
}

function renderSEOChecklist(){
  const el  = document.getElementById('seo-checklist-body');
  const bar = document.getElementById('seo-check-bar');
  const scr = document.getElementById('seo-check-score');
  if(!el) return;
  const d = seoCheckLoad();
  const total = SEO_CHECKLIST.reduce((a,c)=>a+c.items.length,0);
  const done  = Object.values(d).filter(Boolean).length;
  const pct   = total>0?Math.round((done/total)*100):0;
  const barColor = pct>=80?'var(--green)':pct>=50?'var(--amber)':'var(--red)';
  if(bar){ bar.style.width=pct+'%'; bar.style.background=barColor; }
  if(scr){ scr.textContent=`${done} / ${total} (${pct}%)`; scr.style.color=barColor; }

  el.innerHTML = SEO_CHECKLIST.map(cat=>`
    <div style="margin-bottom:16px">
      <div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:8px;padding:6px 10px;background:var(--sf2);border-radius:var(--r)">${cat.cat}</div>
      <div style="display:flex;flex-direction:column;gap:4px">
        ${cat.items.map(item=>{
          const checked = !!d[item.id];
          return `<label style="display:flex;align-items:center;gap:10px;padding:8px 12px;border-radius:var(--r);cursor:pointer;transition:background .12s;${checked?'background:var(--gp);':'background:var(--sf);border:1px solid var(--bd);'}" onmouseover="this.style.background='${checked?'var(--gp)':'var(--sf2)'}'" onmouseout="this.style.background='${checked?'var(--gp)':'var(--sf)'}'">
            <input type="checkbox" ${checked?'checked':''} onchange="seoCheckToggle('${item.id}')" style="width:15px;height:15px;accent-color:var(--green);cursor:pointer;flex-shrink:0"/>
            <span style="font-size:12px;${checked?'text-decoration:line-through;color:var(--ht)':'color:var(--tx)'}">${item.label}</span>
          </label>`;
        }).join('')}
      </div>
    </div>`).join('');
}

/* ══════════════════════════════════════════════════════
   INFO MODAL SYSTEM
   ══════════════════════════════════════════════════════ */

const INFO_CONTENT = {
  ov: {
    icon:'📊', title:'Overview', sub:'Cross-channel marketing performance at a glance',
    sections:[
      {title:'What you see here', rows:[
        {icon:'📈',text:'<strong>KPI cards</strong> — Sessions, users, conversions and bounce rate pulled live from GA4'},
        {icon:'📉',text:'<strong>Sessions over time</strong> — Daily trend chart for the selected date range'},
        {icon:'💰',text:'<strong>Cost vs Pipeline</strong> — YTD spend compared to total pipeline value from Monday.com'},
        {icon:'📋',text:'<strong>Channel comparison table</strong> — Side-by-side performance across all connected platforms'},
        {icon:'🥧',text:'<strong>Traffic sources</strong> — Breakdown of how visitors are reaching your site (organic, direct, paid, referral)'},
        {icon:'🎯',text:'<strong>Pipeline funnel</strong> — Opportunities by stage from Monday.com'},
        {icon:'💼',text:'<strong>LinkedIn & Email</strong> — Summary cards for social and outreach performance'},
      ]},
      {title:'Data sources', rows:[
        {icon:'🟢',text:'GA4, Monday.com, LinkedIn, Instantly — all live via API'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'Use the date picker (top right) to switch between 7d, 28d, 90d, 1y or a custom range — all charts update simultaneously'},
      ]},
    ]
  },
  report: {
    icon:'📅', title:'Monthly Report', sub:'Automated executive summary for the current month',
    sections:[
      {title:'What you see here', rows:[
        {icon:'📊',text:'<strong>KPI scorecard</strong> — Monthly spend, leads, opportunities, cost per lead, form conversions and service page hits'},
        {icon:'💷',text:'<strong>Spend by month</strong> — Bar chart comparing actual spend across the year'},
        {icon:'👥',text:'<strong>Leads & Opportunities chart</strong> — Monthly volume of leads and pipeline opportunities'},
        {icon:'🌐',text:'<strong>Traffic by source</strong> — GA4 session breakdown for the selected month'},
        {icon:'⚡',text:'<strong>Email campaign summary</strong> — Instantly campaign metrics for the period'},
      ]},
      {title:'How to use it', rows:[
        {icon:'💡',text:'This page auto-fills with data for the current calendar month. Share it with leadership as a quick performance snapshot'},
        {icon:'📝',text:'Input leads, opportunities and spend data manually in Budget & Costs to make this report fully accurate'},
      ]},
    ]
  },
  ga4: {
    icon:'📈', title:'Google Analytics 4', sub:'Website traffic, behaviour and conversion data',
    sections:[
      {title:'What you see here', rows:[
        {icon:'👥',text:'<strong>Sessions, Users, Bounce Rate, Conversions</strong> — Core traffic KPIs for the selected period'},
        {icon:'📉',text:'<strong>Sessions over time</strong> — Daily trend with sessions and users overlaid'},
        {icon:'📄',text:'<strong>Top pages</strong> — Which pages are getting the most traffic'},
        {icon:'🌍',text:'<strong>Countries</strong> — Geographic breakdown of your visitors'},
        {icon:'🔄',text:'<strong>Conversion funnel</strong> — Drop-off at each stage from landing to conversion'},
      ]},
      {title:'Requirements', rows:[
        {icon:'🔑',text:'Google OAuth connected + GA4 Property ID <code>properties/283327165</code> configured in Settings'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'Switch to 90d view to spot longer-term trends. Compare periods using the custom date picker'},
        {icon:'💡',text:'High bounce on a specific page? Cross-reference with Search Console to see what keyword drove that traffic'},
      ]},
    ]
  },
  gsc: {
    icon:'🔍', title:'Search Console', sub:'Organic search visibility — how Google sees your site',
    sections:[
      {title:'What you see here', rows:[
        {icon:'👆',text:'<strong>Clicks, Impressions, CTR, Avg Position</strong> — Your organic search performance in Google'},
        {icon:'📉',text:'<strong>Clicks & Impressions over time</strong> — Trend chart showing organic visibility'},
        {icon:'🔑',text:'<strong>Top keywords</strong> — The queries people use to find you, with CTR and position'},
        {icon:'📄',text:'<strong>Top pages (organic)</strong> — Which pages receive the most organic clicks'},
      ]},
      {title:'Requirements', rows:[
        {icon:'⚠',text:'Admin must add your Google account under GSC Users & Permissions for this tab to load'},
        {icon:'🔑',text:'Search Console URL must be set in Settings'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'A low CTR (under 3%) with high impressions means your title/meta description needs improving'},
        {icon:'💡',text:'Keywords ranking position 5–15 are your best quick-win opportunities — small content improvements can move them to page 1'},
      ]},
    ]
  },
  ads: {
    icon:'📢', title:'Google Ads', sub:'Paid search campaign performance and spend',
    sections:[
      {title:'What you see here', rows:[
        {icon:'💰',text:'<strong>Spend, Clicks, Impressions, Conversions</strong> — Paid search KPIs for the last 30 days'},
        {icon:'📋',text:'<strong>Campaign table</strong> — Status, impressions, clicks, CTR, spend and conversions per campaign'},
      ]},
      {title:'Requirements', rows:[
        {icon:'⚠',text:'Requires a Google Ads Developer Token from your Manager Account (MCC) via API Center'},
        {icon:'🔑',text:'Customer ID <code>565-493-1478</code> and Developer Token must be set in Settings'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'Use Keyword Intelligence → Economics Planner alongside this tab to compare actual CPC vs estimates'},
      ]},
    ]
  },
  kwi: {
    icon:'🧠', title:'Keyword Intelligence', sub:'Discover, analyse and track keyword opportunities',
    sections:[
      {title:'What you see here', rows:[
        {icon:'🏷',text:'<strong>Branded vs Non-branded split</strong> — What % of your organic clicks come from people already searching for "Próximo Rol" vs. discovery searches'},
        {icon:'🤖',text:'<strong>AI Keyword Gap Analysis</strong> — Claude identifies 20–25 high-value keywords your competitors target that you are missing, with volume, CPC and strategy recommendation'},
        {icon:'📋',text:'<strong>Keyword Tracker</strong> — Save keywords to monitor, tagged by intent (transactional/informational), market (UK/EU/USA) and strategy (organic/paid)'},
        {icon:'🔴',text:'<strong>SERP Competitor Analyzer</strong> — Type any keyword and see who ranks on Google right now, what ads are running, estimated CPC and whether Próximo Rol appears'},
        {icon:'📐',text:'<strong>Keyword Economics Planner</strong> — Input a keyword and monthly budget to get projected clicks, leads, cost per lead, organic difficulty score and a full SEO roadmap'},
      ]},
      {title:'Requirements', rows:[
        {icon:'🟢',text:'AI analysis and SERP Analyzer work immediately — no additional connections needed'},
        {icon:'⚠',text:'Branded split requires Search Console to be connected'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'Start with the AI Gap Analysis → track your top 5 picks → run Economics Planner on each to prioritise paid vs organic'},
        {icon:'💡',text:'Use SERP Analyzer before launching any paid campaign to see who you\'re competing against and what copy they use'},
      ]},
    ]
  },
  seo: {
    icon:'🔎', title:'SEO Intelligence', sub:'Audit, analyse and improve Próximo Rol\'s search visibility',
    sections:[
      {title:'What you see here', rows:[
        {icon:'🔍',text:'<strong>Page Auditor</strong> — Enter any proximorol.com URL and get a scored audit (A–F): title tag, meta, headings, keyword usage, internal links, schema, oportunidades específicas de coaching y quick wins con ratings de esfuerzo/impacto'},
        {icon:'💬',text:'<strong>SEO Chat</strong> — Un asistente IA especialista con contexto completo de Próximo Rol y coaching de entrevistas. Ask anything — strategy, content ideas, technical fixes — and get actionable answers with web-sourced data'},
        {icon:'🕵️',text:'<strong>Competitor Page Spy</strong> — Enter a competitor URL to extract their SEO strategy: keywords, title, meta, content positioning, strengths, weaknesses and specific opportunities for Próximo Rol to exploit. Add your own URL for a head-to-head comparison'},
        {icon:'✅',text:'<strong>SEO Checklist</strong> — 30 items across On-Page, Content, Technical, Authority and Analytics. Track your implementation progress with a live score bar saved in your browser'},
      ]},
      {title:'Requirements', rows:[
        {icon:'🟢',text:'All 4 tools work immediately — powered by Claude AI and web search, no extra connections required'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'Start with the Checklist to identify your biggest gaps, then use Page Auditor on your homepage and key service pages'},
        {icon:'💡',text:'Run Competitor Spy on the top 3 domains from your SERP Analyzer results to build a targeted response strategy'},
      ]},
    ]
  },
  li: {
    icon:'💼', title:'LinkedIn', sub:'Company page performance — followers, posts and engagement',
    sections:[
      {title:'What you see here', rows:[
        {icon:'👥',text:'<strong>Followers, Impressions, Clicks, Engagement rate</strong> — Core LinkedIn KPIs'},
        {icon:'📈',text:'<strong>Follower growth</strong> — Month-by-month trend'},
        {icon:'📝',text:'<strong>Posts per month</strong> — Publishing frequency'},
        {icon:'📊',text:'<strong>Impressions & Clicks over time</strong> — Content reach and engagement'},
        {icon:'🏆',text:'<strong>Top posts</strong> — Best performing content for the period'},
      ]},
      {title:'Requirements', rows:[
        {icon:'⚠',text:'Requires LinkedIn Marketing Developer Platform approval — contact LinkedIn to upgrade your app'},
      ]},
    ]
  },
  inst: {
    icon:'⚡', title:'Instantly', sub:'Email outreach campaigns — delivery, opens, replies and clicks',
    sections:[
      {title:'What you see here', rows:[
        {icon:'📧',text:'<strong>Sent, Opens, Replies, Clicks, Bounce rate, Reply rate</strong> — 6 core email KPIs'},
        {icon:'🤖',text:'<strong>AI Insights</strong> — Automatically generated observations on campaign performance'},
        {icon:'🔄',text:'<strong>Engagement funnel</strong> — Drop-off from sent → opened → clicked → replied'},
        {icon:'📊',text:'<strong>Open rate by campaign</strong> — Top 8 campaigns compared visually'},
        {icon:'📋',text:'<strong>All campaigns table</strong> — Full list with per-campaign metrics'},
      ]},
      {title:'Requirements', rows:[
        {icon:'🔑',text:'Instantly API key must be set in Settings. Currently returning 401 — verify the API key is active'},
      ]},
      {title:'Tips', rows:[
        {icon:'💡',text:'Una tasa de respuesta superior al 3% es excelente para outreach a profesionales en búsqueda activa de empleo'},
      ]},
    ]
  },
  opps: {
    icon:'🎯', title:'Opportunities Pipeline', sub:'Sales pipeline from Monday.com — all active opportunities',
    sections:[
      {title:'What you see here', rows:[
        {icon:'📊',text:'<strong>Stage cards</strong> — Count and value of opportunities in Discovery, Proposal, Won and Lost'},
        {icon:'📈',text:'<strong>Created by month (by stage)</strong> — Stacked bar showing new opportunities each month'},
        {icon:'🌐',text:'<strong>Created by month (by source)</strong> — Which sources (LinkedIn, referral, outbound) generate pipeline'},
        {icon:'🥧',text:'<strong>By source donut</strong> — Visual breakdown of opportunity sources'},
        {icon:'💷',text:'<strong>Amount by month</strong> — Pipeline value created each month'},
        {icon:'📋',text:'<strong>All opportunities table</strong> — Searchable, filterable list of every deal with stage, value and source'},
      ]},
      {title:'Filters', rows:[
        {icon:'🔽',text:'Filter by source, stage and year. Click any source pill to isolate that channel\'s pipeline'},
      ]},
      {title:'Requirements', rows:[
        {icon:'🔑',text:'Monday.com API token + Board ID <code>1678993739</code> configured in Settings'},
      ]},
    ]
  },
  mon: {
    icon:'📋', title:'Monday.com', sub:'Raw board data and task management overview',
    sections:[
      {title:'What you see here', rows:[
        {icon:'📋',text:'Raw Monday.com board data for your configured board'},
        {icon:'💡',text:'For the full pipeline analysis with charts, filters and deal tracking, use the <strong>Opportunities Pipeline</strong> tab'},
      ]},
      {title:'Requirements', rows:[
        {icon:'🔑',text:'Monday.com API token must be set in Settings'},
      ]},
    ]
  },
  budget: {
    icon:'💰', title:'Budget & Costs', sub:'Marketing spend tracking — targets vs actuals with ROI',
    sections:[
      {title:'What you see here', rows:[
        {icon:'💷',text:'<strong>YTD summary cards</strong> — Total budget, actual spend, variance and ROI ratio'},
        {icon:'📤',text:'<strong>Upload expenses</strong> — Import Excel/CSV bank or accounting exports; the dashboard maps vendor names to categories automatically'},
        {icon:'📊',text:'<strong>Monthly comparison chart</strong> — Target vs actual spend per month'},
        {icon:'📋',text:'<strong>YTD by category</strong> — Breakdown across Advertising, Outbound, Meetings and Tools with expandable detail'},
        {icon:'💡',text:'<strong>6 insight cards</strong> — Auto-generated observations on spend patterns, efficiency and ROI'},
        {icon:'📄',text:'<strong>Full breakdown table</strong> — Every line item with target, actual and variance'},
      ]},
      {title:'How to use it', rows:[
        {icon:'1️⃣',text:'Set monthly targets in the Budget Settings section'},
        {icon:'2️⃣',text:'Upload your expense file (Excel or CSV) to import actuals'},
        {icon:'3️⃣',text:'Use the reassignment panel to map any unrecognised vendors to the correct category'},
      ]},
    ]
  },
  settings: {
    icon:'⚙️', title:'Settings', sub:'Platform credentials and API connections',
    sections:[
      {title:'What you can configure', rows:[
        {icon:'📊',text:'<strong>Google</strong> — OAuth Client ID, GA4 Property ID, Search Console URL, Google Ads Customer ID and Developer Token'},
        {icon:'💼',text:'<strong>LinkedIn</strong> — App Client ID and Organisation URN'},
        {icon:'⚡',text:'<strong>Instantly</strong> — API key for email campaign data'},
        {icon:'📋',text:'<strong>Monday.com</strong> — API token for pipeline and board data'},
      ]},
      {title:'Notes', rows:[
        {icon:'💡',text:'Changes take effect immediately — no restart or page reload required'},
        {icon:'🔒',text:'All credentials are stored locally in your browser only — nothing is sent to any server'},
      ]},
    ]
  },
};

function openInfoModal(tabId){
  const d = INFO_CONTENT[tabId];
  if(!d) return;
  const el = document.getElementById('info-modal-content');
  el.innerHTML=`
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
      <span style="font-size:24px">${d.icon}</span>
      <div>
        <div class="im-title">${d.title}</div>
        <div class="im-sub">${d.sub}</div>
      </div>
    </div>
    <hr style="border:none;border-top:1px solid var(--bd);margin:14px 0">
    ${d.sections.map(s=>`
      <div class="im-section">
        <div class="im-section-title">${s.title}</div>
        ${s.rows.map(r=>`<div class="im-row"><span style="flex-shrink:0;width:18px">${r.icon}</span><span>${r.text}</span></div>`).join('')}
      </div>`).join('')}`;
  document.getElementById('info-modal-overlay').classList.add('open');
}

function closeInfoModal(){
  document.getElementById('info-modal-overlay').classList.remove('open');
}

// Close on Escape key
document.addEventListener('keydown', e=>{ if(e.key==='Escape') closeInfoModal(); });

/* spin animation for AI button */
(()=>{const s=document.createElement('style');s.textContent='@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}';document.head.appendChild(s);})();

