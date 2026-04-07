/* ═══════════════════════════════════════════════════════════════
   MARKETING CO-PILOT — Agente conversacional multi-módulo
   Depende de: core.js (antFetch, CFG, sD, eD, DAYS)
   ═══════════════════════════════════════════════════════════════ */

const CP_HISTORY = [];
let   CP_OPEN    = false;
let   CP_BUSY    = false;

/* ══════════════════════════════════════════════════════
   SUGERENCIAS DINÁMICAS — cambian según el estado real
══════════════════════════════════════════════════════ */

/* Banco completo de sugerencias por situación */
const CP_SUGGESTION_BANK = {
  noData: [
    { icon:'🚀', text:'¿Por dónde empiezo para conseguir mis primeros clientes?' },
    { icon:'📋', text:'Dame un plan de 30 días para arrancar Próximo Rol' },
    { icon:'✍️', text:'Escribe mi primer post de LinkedIn como coach de entrevistas' },
    { icon:'🔑', text:'¿Qué keywords tengo que atacar primero en SEO?' },
    { icon:'🌐', text:'Analiza mi sitio web y dime qué le falta para SEO' },
    { icon:'📧', text:'Escribe una secuencia de 3 emails de bienvenida para leads' },
    { icon:'🎯', text:'¿Cómo estructuro mi funnel de ventas desde cero?' },
    { icon:'💡', text:'¿Qué hace bien la competencia que yo debería copiar?' },
  ],
  noLinkedIn: [
    { icon:'💼', text:'¿Cómo conecto LinkedIn al dashboard y por qué me urge?' },
    { icon:'📅', text:'Dame un calendario editorial de LinkedIn para este mes' },
    { icon:'✍️', text:'Genera 5 ideas de posts para LinkedIn esta semana' },
    { icon:'🏆', text:'¿Qué tipo de contenido funciona mejor para coaching en LinkedIn?' },
  ],
  noEmail: [
    { icon:'📧', text:'¿Cómo configuro mi primer flujo de email marketing?' },
    { icon:'✉️', text:'Escribe un email de bienvenida para nuevos leads' },
    { icon:'🔧', text:'¿Cómo conecto Instantly al dashboard paso a paso?' },
    { icon:'🎯', text:'¿Cuál debería ser mi secuencia de nurturing para leads?' },
  ],
  noPipeline: [
    { icon:'🎯', text:'¿Cómo defino qué es una oportunidad para Próximo Rol?' },
    { icon:'📊', text:'¿Qué etapas debería tener mi pipeline de ventas?' },
    { icon:'💰', text:'¿Cómo trackeo mis primeras 10 conversaciones de venta?' },
  ],
  hasData: [
    { icon:'📊', text:'¿Cómo va el rendimiento esta semana?' },
    { icon:'🔥', text:'¿Qué canal está dando mejor retorno?' },
    { icon:'⚠️', text:'¿Qué necesita atención urgente?' },
    { icon:'✍️', text:'Genera un post de LinkedIn basado en mis mejores métricas' },
    { icon:'🗓️', text:'Dame un plan de acción para los próximos 7 días' },
    { icon:'💡', text:'¿Qué keywords nuevas debería atacar?' },
    { icon:'📈', text:'¿Qué debería hacer para duplicar mis sesiones web?' },
    { icon:'🎯', text:'¿Cómo mejoro mi tasa de conversión de visita a lead?' },
  ],
};

/* Devuelve las sugerencias más relevantes según el contexto actual */
function cpGetDynamicSuggestions() {
  const hasGa4Data  = !!document.querySelector('#ga4-kpis .kpi');
  const hasLinkedIn = !!CFG.liId;
  const hasEmail    = !!CFG.instantly;
  const hasPipeline = typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0;
  const dataPoints  = [hasGa4Data, hasLinkedIn, hasEmail, hasPipeline].filter(Boolean).length;

  if (dataPoints === 0) return CP_SUGGESTION_BANK.noData;

  /* Mezcla según lo que falta — prioriza los gaps más importantes */
  const suggestions = [];
  if (!hasLinkedIn) suggestions.push(...CP_SUGGESTION_BANK.noLinkedIn.slice(0, 2));
  if (!hasEmail)    suggestions.push(...CP_SUGGESTION_BANK.noEmail.slice(0, 2));
  if (!hasPipeline) suggestions.push(...CP_SUGGESTION_BANK.noPipeline.slice(0, 1));
  suggestions.push(...CP_SUGGESTION_BANK.hasData.slice(0, 8 - suggestions.length));
  return suggestions.slice(0, 8);
}

/* ══════════════════════════════════════════════════════
   CONTEXTO ENRIQUECIDO — diagnóstico de etapa y gaps
══════════════════════════════════════════════════════ */

function cpGatherContext() {
  const ctx = {
    fechaConsulta : new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    periodoActivo : `${sD()} → ${eD()} (${DAYS} días)`,
    etapaNegocio  : 'lanzamiento',   // se calcula abajo
    puntuacionDatos: 0,              // 0-10
    canalesConectados : [],
    gapsActivos       : [],          // qué falta + cómo arreglarlo
    ga4           : null,
    searchConsole : null,
    linkedin      : null,
    email         : null,
    instagram     : null,
    pipeline      : null,
    presupuesto   : null,
  };

  /* ── Canales conectados ── */
  if (CFG.clientId && CFG.ga4) ctx.canalesConectados.push('Google Analytics 4');
  if (CFG.gsc)       ctx.canalesConectados.push('Search Console');
  if (CFG.ads)       ctx.canalesConectados.push('Google Ads');
  if (CFG.liId)      ctx.canalesConectados.push('LinkedIn');
  if (CFG.instantly) ctx.canalesConectados.push('Email (Instantly)');
  if (CFG.monday)    ctx.canalesConectados.push('CRM Monday.com');
  if (CFG.metatoken) ctx.canalesConectados.push('Instagram/Facebook');
  if (CFG.hunter)    ctx.canalesConectados.push('Hunter.io (Prospecting)');

  /* ── Gaps — qué falta y por qué importa ── */
  if (!CFG.liId) {
    ctx.gapsActivos.push({
      canal    : 'LinkedIn',
      urgencia : 'alta',
      impacto  : 'Tu audiencia principal (profesionales mid-senior en búsqueda de empleo) vive en LinkedIn. Sin datos de LinkedIn no puedo optimizar tu canal más importante.',
      accion   : 'Ve a Settings → LinkedIn. Necesitas crear una LinkedIn App en developers.linkedin.com y solicitar aprobación del producto "Marketing Developer Platform" (puede tardar 1-2 semanas).',
      quick    : 'Sin LinkedIn conectado, trabaja el contenido orgánico manualmente y tráeme los datos cuando puedas: nº de seguidores, engagement por post, alcance semanal.',
    });
  }
  if (!CFG.instantly) {
    ctx.gapsActivos.push({
      canal    : 'Email (Instantly)',
      urgencia : 'alta',
      impacto  : 'El email marketing tiene el CAC más bajo de todos los canales para servicios profesionales. Sin esto no puedo analizar tu nurturing ni tus tasas de conversión.',
      accion   : 'Ve a Settings → Instantly. Crea cuenta en instantly.ai, consigue tu API key en Settings → Integrations y pégala en el dashboard.',
      quick    : 'Mientras tanto, puedo ayudarte a diseñar tu secuencia de emails de bienvenida y nurturing lista para cuando conectes.',
    });
  }
  if (!CFG.monday) {
    ctx.gapsActivos.push({
      canal    : 'CRM (Monday.com)',
      urgencia : 'media',
      impacto  : 'Sin pipeline no puedo decirte cuántos leads se están convirtiendo, cuánto tarda un cliente en decidir, ni cuál es tu CAC real.',
      accion   : 'Ve a Settings → CRM. Si usas otro CRM, dímelo y trabajamos con los datos manualmente.',
      quick    : 'Cuéntame cuántas conversaciones de venta tienes activas ahora mismo y en qué estado está cada una.',
    });
  }
  if (!CFG.metatoken) {
    ctx.gapsActivos.push({
      canal    : 'Instagram/Facebook',
      urgencia : 'baja',
      impacto  : 'Instagram puede ser útil para brand awareness con contenido de tips de entrevistas, aunque para Próximo Rol es secundario respecto a LinkedIn.',
      accion   : 'Ve a Settings → Instagram/Facebook. Necesitas un Access Token del Graph API Explorer de Meta.',
      quick    : 'Si aún no tienes actividad en Instagram, no es urgente conectarlo — enfócate primero en LinkedIn y email.',
    });
  }
  if (!CFG.gsc) {
    ctx.gapsActivos.push({
      canal    : 'Search Console',
      urgencia : 'alta',
      impacto  : 'Sin Search Console no puedo ver por qué keywords te están encontrando en Google ni qué posiciones tienes. Es fundamental para tu estrategia SEO.',
      accion   : 'Ve a Settings → Google y añade la URL de tu propiedad (https://www.proximorol.com/). Debe estar verificada en search.google.com/search-console.',
      quick    : 'Te daré keywords objetivo basadas en el mercado español de coaching de entrevistas aunque no tengas datos propios todavía.',
    });
  }

  /* ── Leer datos del DOM ── */
  function readKPIs(id) {
    const el = document.getElementById(id);
    if (!el) return null;
    const kpis = {};
    el.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      const dlt = k.querySelector('.kd')?.textContent?.trim();
      if (lbl && val && !val.includes('not connected') && !val.includes('—')) {
        kpis[lbl] = dlt && dlt !== '–' ? `${val} (${dlt})` : val;
      }
    });
    return Object.keys(kpis).length ? kpis : null;
  }

  ctx.ga4       = readKPIs('ga4-kpis');
  ctx.linkedin  = readKPIs('li-kpis');

  const instKPIs = readKPIs('inst-kpis');
  if (instKPIs) {
    ctx.email = instKPIs;
    if (window._INST_AGG && window._INST_AGG.sent > 0) {
      const { sent, opens, replies } = window._INST_AGG;
      ctx.email._agregado = {
        enviados   : sent,
        aperturas  : opens,
        respuestas : replies,
        tasaApertura  : ((opens  / sent) * 100).toFixed(1) + '%',
        tasaRespuesta : ((replies / sent) * 100).toFixed(1) + '%',
      };
    }
  }

  ctx.presupuesto = readKPIs('budget-kpis');

  /* Search Console — top queries */
  const gscRows = Array.from(document.querySelectorAll('#gsc-q tr')).slice(1, 8);
  const topQueries = gscRows.map(r => r.querySelector('td')?.textContent?.trim()).filter(Boolean);
  if (topQueries.length) ctx.searchConsole = { topQueries };

  /* Pipeline */
  if (typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0) {
    const stages = {}, sources = {};
    let total = 0;
    _OPP_DATA.forEach(o => {
      const s = (o.stage  || 'desconocido').toLowerCase();
      const r = (o.source || 'desconocido');
      stages[s]  = (stages[s]  || 0) + 1;
      sources[r] = (sources[r] || 0) + 1;
      total += parseFloat(o.amount || 0);
    });
    ctx.pipeline = {
      total          : _OPP_DATA.length,
      valorPipeline  : '£' + Math.round(total).toLocaleString(),
      porEtapa       : stages,
      porFuente      : sources,
    };
  }

  /* ── Calcular puntuación de datos y etapa del negocio ── */
  let score = 0;
  if (ctx.ga4)          score += 2;
  if (ctx.searchConsole)score += 2;
  if (ctx.linkedin)     score += 2;
  if (ctx.email)        score += 1;
  if (ctx.pipeline && ctx.pipeline.total > 0) score += 2;
  if (ctx.presupuesto)  score += 1;
  if (ctx.ga4?.Sessions && !ctx.ga4.Sessions.includes('0')) score += 1;
  ctx.puntuacionDatos = Math.min(score, 10);

  if (score <= 2)       ctx.etapaNegocio = 'lanzamiento';
  else if (score <= 5)  ctx.etapaNegocio = 'early_traction';
  else if (score <= 8)  ctx.etapaNegocio = 'crecimiento';
  else                  ctx.etapaNegocio = 'optimizacion';

  /* ── Biblioteca de contenido (si existe) ── */
  const libCtx = typeof libBuildCopilotContext === 'function' ? libBuildCopilotContext() : null;
  ctx._libCtx = libCtx;

  return ctx;
}
/* ══════════════════════════════════════════════════════
   SYSTEM PROMPT — Estratega con conocimiento profundo
   del mercado, memoria viva y pensamiento crítico
══════════════════════════════════════════════════════ */

const CP_MARKET_KNOWLEDGE = `
## CONOCIMIENTO DE MERCADO — Coaching de entrevistas en España/LATAM

### El cliente ideal de Próximo Rol
- Profesional de 28-48 años, posición media o senior (manager, director, especialista 5+ años exp)
- Está buscando empleo activamente o anticipando un cambio en 3-6 meses
- Ha tenido una o más entrevistas fallidas y no sabe exactamente por qué
- Su mayor dolor: saber que es bueno en su trabajo pero no saber cómo vender eso en 45 minutos
- Miedos concretos: quedarse en blanco, parecer arrogante, el famoso "cuéntame sobre ti"
- Principales mercados: Madrid, Barcelona, Bilbao; en LATAM: CDMX, Bogotá, Buenos Aires, Santiago
- Disposición a pagar: €97 por sesión única es un precio accesible si el ROI es claro (conseguir trabajo 2 semanas antes = ya se pagó 5-10x)

### Por qué compran (motivadores de compra)
1. Un proceso de selección importante inminente (Amazon, McKinsey, empresa internacional)
2. Llevan meses buscando sin éxito y quieren saber qué están haciendo mal
3. Recomendación de alguien que pasó por Próximo Rol y consiguió el trabajo
4. Contenido educativo de LinkedIn que les hace pensar "este tío sabe de lo que habla"

### Benchmark del sector (servicios de coaching profesional España)
- Tasa de conversión web: 1.5-3.5% visita → lead | 15-30% lead → cliente
- CAC (coste adquisición cliente) típico: €25-80 en mercados maduros, más alto al principio
- LTV: si el cliente hace sesión única + pack = €97 + €300-400 → LTV medio ~€250
- Open rate email para servicios profesionales: 28-38%
- CTR en LinkedIn Ads para B2C coaching: 0.4-1.1%
- Tiempo medio de decisión desde lead hasta compra: 3-14 días
- SEO: keywords con intención de compra tardan 4-8 meses en posicionar en España

### Keywords de alta intención para atacar (España)
**Comerciales (intención de compra directa):**
- "coach de entrevistas madrid" (vol ~140/mes, dificultad baja)
- "preparar entrevista de trabajo online" (vol ~260/mes)
- "coaching carrera profesional españa" (vol ~480/mes)
- "coach laboral barcelona" / "coach laboral madrid" (vol ~210-390/mes)
- "preparacion entrevistas trabajo españa" (vol ~320/mes)

**Informacionales (tráfico alto, nutrir → convertir):**
- "cómo preparar una entrevista de trabajo" (vol ~2.400/mes, difícil)
- "preguntas entrevista de trabajo respuestas" (vol ~3.200/mes, muy difícil)
- "cuéntame sobre ti entrevista" (vol ~1.800/mes, moderado)
- "entrevista por competencias ejemplos" (vol ~1.600/mes)
- "cómo responder por qué quieres este trabajo" (vol ~900/mes)

**LATAM (México, Colombia, Argentina):**
- "coaching entrevistas laborales" (vol ~600/mes LATAM total)
- "cómo pasar una entrevista de trabajo" (vol ~2.100/mes LATAM)

### Contenido que funciona en LinkedIn para coaching profesional
**Formatos con mayor engagement (basado en el sector):**
1. Historia personal de transformación: "Mi cliente llevaba 8 meses buscando. En 6 semanas tenía 3 ofertas. Aquí el cambio que hizo."
2. Tips accionables en formato lista: "5 cosas que destrypes en tu entrevista sin darte cuenta"
3. Desmitificar: "La pregunta de 'cuéntame sobre ti' no es para saber tu CV — es para esto"
4. Detrás de escena: "Así preparo a mis clientes para entrevistas en Amazon/Google"
5. Datos o estadísticas que sorprenden: "El 73% de los rechazos ocurren en los primeros 3 minutos"

**Cadencia recomendada para empezar:** 3 posts/semana, martes y jueves en horario 8-9h y 18-19h (hora española)

### Funnel recomendado para Próximo Rol (etapa de lanzamiento)
1. **Awareness:** LinkedIn orgánico + SEO blog posts educativos
2. **Lead capture:** Lead magnet gratuito (ej: "Guía: Los 10 errores que te cuestan la entrevista") → email
3. **Nurturing:** Secuencia de 5 emails: bienvenida → problema → metodología → caso de éxito → CTA sesión
4. **Conversión:** Llamada de descubrimiento gratuita 15 min → sesión de pago
5. **Retención/Referidos:** Seguimiento post-servicio, pedir recomendaciones en LinkedIn

### Competidores directos en España
- **Michael Page / Robert Half / Randstad:** Tienen career coaching pero es impersonal y caro
- **Coachs independientes en LinkedIn:** Fragmentado, sin metodología clara, precios similares
- **Plataformas como Domestika o Udemy:** Cursos grabados, pero no personalizados
- **Ventaja de Próximo Rol:** Personalización + metodología de storytelling + precio accesible`;

function cpBuildSystem(ctx) {
  /* ── Sección de estado actual ── */
  const stageDescriptions = {
    lanzamiento      : 'ETAPA: LANZAMIENTO — Pocos o ningún dato propio. Actúa como estratega que construye desde cero. Da recomendaciones basadas en tu conocimiento del mercado, no en datos del dashboard.',
    early_traction   : 'ETAPA: TRACCIÓN INICIAL — Algunos datos empiezan a aparecer. Analiza las señales tempranas, identifica qué está funcionando y qué no, y guía el próximo paso concreto.',
    crecimiento      : 'ETAPA: CRECIMIENTO — Datos suficientes para optimizar. Analiza rendimiento, identifica palancas de mejora y propone experimentos con impacto medible.',
    optimizacion     : 'ETAPA: OPTIMIZACIÓN — Dashboard maduro con datos ricos. Profundiza en análisis, correlaciones entre canales y optimización de CAC/LTV.',
  };

  /* ── Resumen de datos disponibles ── */
  const dataLines = [];
  if (ctx.ga4)          dataLines.push(`- GA4: ${Object.entries(ctx.ga4).map(([k,v])=>`${k}: ${v}`).join(' | ')}`);
  else                  dataLines.push('- GA4: sin datos (pocas visitas o módulo no cargado todavía)');
  if (ctx.searchConsole)dataLines.push(`- Search Console: top queries → ${ctx.searchConsole.topQueries.join(', ')}`);
  else if (CFG.gsc)     dataLines.push('- Search Console: conectado pero sin queries visibles aún');
  else                  dataLines.push('- Search Console: no conectado');
  if (ctx.linkedin)     dataLines.push(`- LinkedIn: ${Object.entries(ctx.linkedin).map(([k,v])=>`${k}: ${v}`).join(' | ')}`);
  else if (CFG.liId)    dataLines.push('- LinkedIn: conectado pero sin datos todavía');
  else                  dataLines.push('- LinkedIn: no conectado (gap prioritario)');
  if (ctx.email?._agregado) {
    const a = ctx.email._agregado;
    dataLines.push(`- Email: ${a.enviados} enviados | ${a.tasaApertura} apertura | ${a.tasaRespuesta} respuesta`);
  } else if (CFG.instantly) {
    dataLines.push('- Email (Instantly): conectado, sin campañas activas todavía');
  } else {
    dataLines.push('- Email (Instantly): no conectado');
  }
  if (ctx.pipeline)     dataLines.push(`- Pipeline: ${ctx.pipeline.total} oportunidades | ${ctx.pipeline.valorPipeline} total | etapas: ${JSON.stringify(ctx.pipeline.porEtapa)}`);
  else                  dataLines.push('- Pipeline CRM: sin oportunidades registradas todavía');
  if (ctx.presupuesto)  dataLines.push(`- Budget: ${Object.entries(ctx.presupuesto).map(([k,v])=>`${k}: ${v}`).join(' | ')}`);

  /* ── Gaps activos con instrucciones ── */
  const gapsSection = ctx.gapsActivos.length > 0
    ? `\n## GAPS ACTIVOS — Lo que falta y cómo arreglarlo\n` +
      ctx.gapsActivos.map(g =>
        `### ${g.canal} (urgencia: ${g.urgencia})\n- Impacto si no está: ${g.impacto}\n- Cómo conectar: ${g.accion}\n- Mientras tanto: ${g.quick}`
      ).join('\n\n')
    : '';

  /* ── Memoria viva (si existe) ── */
  const memorySummary = typeof memBuildSummary === 'function' ? memBuildSummary(ctx._topicHint || null) : null;

  /* ── P&L context (si está disponible) ── */
  let pnlContext = '';
  if (window._PNL_CONTEXT) {
    const { ytd, mc } = window._PNL_CONTEXT;
    pnlContext = `\n## P&L ACTUAL\n- Revenue YTD: £${Math.round(ytd.gross_revenue).toLocaleString()} | ${ytd.total_clients} clientes\n- EBITDA YTD: £${Math.round(ytd.ebitda).toLocaleString()}\n- CAC este mes: ${mc.cac ? '£' + mc.cac : 'sin datos'}\n- LTV/CAC: ${mc.ltv_cac_ratio || 'N/A'}`;
  }

  /* ── Biblioteca de contenido publicado ── */
  const libSection = ctx._libCtx || '';

  /* ── Site context (solo si fue fetcheado para esta pregunta) ── */
  const siteSection = ctx._siteCtx ? cpBuildSiteSection(ctx._siteCtx) : '';

  return `Eres el Marketing Co-pilot de Próximo Rol. Eres un estratega de marketing con experiencia en servicios de coaching y formación profesional en España y LATAM.

Tu misión: **ayudar a Próximo Rol a conseguir más clientes, aumentar revenue y mejorar la rentabilidad.** Todo lo que digas debe orientarse a un impacto medible en estas tres métricas.

## SOBRE PRÓXIMO ROL
- Coaching de entrevistas para profesionales mid-senior hispanohablantes
- Web: proximorol.com
- Servicios: Sesión única (€97) · Pack Completo (€297) · Acompañamiento Total (€497)
- Mercados: España (principal) · México · Argentina · Colombia · Chile · UK hispano
- Metodología: storytelling personal, mock interviews, coaching psicológico

## MODO ACTUAL
${stageDescriptions[ctx.etapaNegocio] || stageDescriptions.lanzamiento}
Puntuación de datos disponibles: ${ctx.puntuacionDatos}/10

## DATOS EN TIEMPO REAL (${ctx.periodoActivo})
${dataLines.join('\n')}
${pnlContext}
${libSection}
${siteSection}
${gapsSection}

${memorySummary || ''}

## CONOCIMIENTO DE MERCADO
${ctx.puntuacionDatos <= 3
  ? CP_MARKET_KNOWLEDGE
  : `### Benchmark del sector (referencia rápida)
- Conversión web: 1.5-3.5% visita → lead | 15-30% lead → cliente
- CAC típico servicios coaching: €25-80 | LTV medio: ~€250
- Open rate email profesional: 28-38% | Tiempo decisión lead→compra: 3-14 días
- SEO keywords intención compra España: 4-8 meses en posicionar
- Keywords clave: "coach de entrevistas madrid" (140/mes) | "preparar entrevista trabajo online" (260/mes) | "coaching carrera profesional españa" (480/mes)`
}

## FRAMEWORK DE PENSAMIENTO — Aplica estas dimensiones en respuestas estratégicas

**1. IMPACTO EN REVENUE**: Traduce cada recomendación a €. "Si mejoramos X en Y%, son N clientes × €97 = €M/mes adicionales."

**2. CAUSA RAÍZ**: No el síntoma, la causa. Las sesiones bajaron → ¿SEO? ¿Campaña parada? ¿Estacionalidad? ¿UX?

**3. CUELLO DE BOTELLA ACTUAL**: ¿Qué es lo que REALMENTE limita el crecimiento ahora? (Normalmente uno: awareness, conversión, precio, propuesta de valor, o proceso de venta)

**4. SEGUNDO ORDEN**: Si hacemos X, ¿qué pasa después? Más tráfico sin mejor conversión = más gasto sin más revenue.

**5. MEMORIA Y CALIBRACIÓN**: ¿Qué hemos probado antes? ¿Qué funcionó o falló según la memoria? No repetir errores conocidos.

**6. PRIORIZACIÓN**: Para cualquier lista de acciones: (impacto estimado × probabilidad de éxito) ÷ esfuerzo. Las primeras 2 acciones deben poder ejecutarse esta semana.

**7. HORIZONTE TEMPORAL**: Diferencia entre lo que hace efecto en 7 días (táctico) vs 90 días (estratégico). El usuario necesita victorias rápidas Y una dirección clara.

## REGLAS DE COMPORTAMIENTO

- **Cuando no hay datos de un canal**: Usa tu conocimiento del mercado. Nunca pares en "no hay datos".
- **Cuando el pipeline está vacío**: Ayuda a estructurar el proceso, no a lamentarse de que está vacío.
- **Cuando generes contenido**: Que sea publicable tal cual, no un boceto.
- **Cuando des una lista de acciones**: Las dos primeras son ejecutables esta semana, las siguientes son estratégicas.
- **Framing siempre en revenue**: "Esto puede generar X clientes adicionales" > "Esto aumentará el engagement".
- **Español, directo, sin introducción innecesaria. Máximo 280 palabras.**`;}


/* ── Estado de confirmación pendiente ── */
let CP_PENDING_CONFIRM = null; /* { type, originalMsg, query } */

/* ── Streaming desde la API ── */
async function cpStream(userMsg) {
  if (!CFG.ak) {
    cpAddMsg('assistant', '⚙️ **API Key no configurada.** Ve a **Settings** → *Anthropic API Key* y añade tu clave `sk-ant-...` para activar el Co-pilot.');
    return;
  }

  CP_BUSY = true;
  cpSetBusy(true);

  const topic  = cpDetectTopic(userMsg);
  const model  = CP_DEEP_MODE ? 'claude-opus-4-5' : 'claude-sonnet-4-20250514';
  const maxTok = CP_DEEP_MODE ? 2048 : 1800;
  if (CP_DEEP_MODE) { CP_DEEP_MODE = false; cpToggleDeepMode(); }

  /* ══ SISTEMA INTELIGENTE DE 3 CAPAS ══
     Primero resuelve si tiene suficiente contexto local,
     luego decide si preguntar o actuar */

  let siteCtx   = null;
  let skipAsk   = false;

  /* ¿El usuario está respondiendo a una confirmación pendiente? */
  if (CP_PENDING_CONFIRM) {
    const conf = libParseUserConfirmation ? libParseUserConfirmation(userMsg) : null;
    if (conf === 'yes') {
      /* Usuario confirmó → ejecutar la acción pendiente */
      const pending = CP_PENDING_CONFIRM;
      CP_PENDING_CONFIRM = null;
      CP_BUSY = false;
      cpSetBusy(false);
      if (pending.type === 'realtime') {
        await cpDoRealtimeSearch(pending.originalMsg, pending.query);
      } else if (pending.type === 'sync_needed' || pending.type === 'sync_stale') {
        cpAddMsg('assistant', '🔄 Iniciando sincronización del sitio…');
        if (typeof libSyncSite === 'function') {
          await libSyncSite(true);
          await cpStream(pending.originalMsg);
        }
      }
      return;
    } else if (conf === 'no') {
      /* Usuario dijo no → responder con lo que hay */
      CP_PENDING_CONFIRM = null;
      skipAsk = true;
      userMsg = CP_PENDING_CONFIRM?.originalMsg || userMsg;
    } else {
      /* Respuesta ambigua → tratar como mensaje normal */
      CP_PENDING_CONFIRM = null;
    }
  }

  /* ¿Hay algo sobre el sitio/contenido que necesite resolver? */
  if (!skipAsk && typeof libShouldAskForWebSearch === 'function') {
    const askResult = libShouldAskForWebSearch(userMsg);
    if (askResult) {
      CP_PENDING_CONFIRM = { ...askResult, originalMsg: userMsg };
      CP_BUSY = false;
      cpSetBusy(false);
      cpAddMsg('assistant', askResult.message);
      return;
    }
  }

  const ctx = cpGatherContext();
  if (typeof memBuildSummary === 'function') ctx._topicHint = topic;
  ctx._siteCtx = siteCtx;
  const system = cpBuildSystem(ctx);

  /* ── Ventana deslizante: máx 6 mensajes (3 pares) en historial ──
     La memoria persistente ya captura lo estratégico.
     El historial solo necesita dar continuidad conversacional reciente. */
  if (CP_HISTORY.length > 6) CP_HISTORY.splice(0, CP_HISTORY.length - 6);

  CP_HISTORY.push({ role: 'user', content: userMsg });

  /* Placeholder con typing indicator */
  const placeholderId = 'cp-msg-' + Date.now();
  cpAddPlaceholder(placeholderId);

  let fullText = '';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':    'application/json',
        'x-api-key':       CFG.ak,
        'anthropic-version':                 '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model:      model,
        max_tokens: maxTok,
        system,
        messages:   CP_HISTORY,
        stream:     true,
      }),
    });

    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(e?.error?.message || `HTTP ${resp.status}`);
    }

    const reader  = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]' || !raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullText += parsed.delta.text;
            cpUpdatePlaceholder(placeholderId, fullText);
          }
        } catch (_) {}
      }
    }

    CP_HISTORY.push({ role: 'assistant', content: fullText });
    cpFinalizePlaceholder(placeholderId, fullText);

    /* ── Session buffer (gratis — sin llamada API) ── */
    if (typeof cpBufferSession === 'function') cpBufferSession(userMsg, fullText);
    if (typeof memIncrementChats === 'function') memIncrementChats();

    /* ── Experiment tracking — crear experimento si la respuesta es accionable ── */
    if (typeof expDetectActionable === 'function' && expDetectActionable(fullText)) {
      var _expChannel = typeof expDetectChannel === 'function' ? expDetectChannel(userMsg + ' ' + fullText) : 'general';
      var _expRecId = null;
      if (typeof memAddRecommendation === 'function') {
        _expRecId = memAddRecommendation({ text: fullText.slice(0, 300), category: _expChannel, channel: _expChannel, priority: 'medium' });
      }
      var _expId = typeof expCreateFromRecommendation === 'function'
        ? expCreateFromRecommendation(_expRecId, fullText, _expChannel, 'TBD', userMsg)
        : null;
      if (_expId) {
        cpAddMsg('assistant',
          '\n\n---\n**\ud83d\udcca Rastreando esta recomendaci\u00f3n.** ' +
          'Cuando la implementes, ve a **Experimentos** en la sidebar para reportar resultados. ' +
          'Ajustar\u00e9 mis recomendaciones futuras bas\u00e1ndome en datos reales.'
        );
        if (typeof expUpdateBadge === 'function') expUpdateBadge();
      }
    }

  } catch (err) {
    CP_HISTORY.pop();
    cpFinalizePlaceholder(placeholderId, `❌ **Error:** ${err.message}\n\nComprueba tu API key en Settings.`);
  } finally {
    CP_BUSY = false;
    cpSetBusy(false);
  }
}

/* ══════════════════════════════
   UI — Renderizado
══════════════════════════════ */

/* Markdown minimalista: negrita, código inline, headers, bullets */
function cpMd(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    /* headers */
    .replace(/^### (.+)$/gm, '<strong style="font-size:13px;color:var(--tx)">$1</strong>')
    .replace(/^## (.+)$/gm,  '<strong style="font-size:14px;color:var(--tx)">$1</strong>')
    /* bold */
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    /* inline code */
    .replace(/`(.+?)`/g, '<code style="background:var(--sf2);padding:1px 5px;border-radius:4px;font-size:11px;font-family:var(--mono,monospace)">$1</code>')
    /* bullets */
    .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:var(--green);flex-shrink:0;margin-top:1px">•</span><span>$1</span></div>')
    /* numbered list */
    .replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:var(--green);flex-shrink:0">›</span><span>$1</span></div>')
    /* line breaks */
    .replace(/\n{2,}/g, '<br><br>')
    .replace(/\n/g, '<br>');
}

function cpAddMsg(role, text) {
  const msgs = document.getElementById('cp-messages');
  if (!msgs) return;
  const isUser = role === 'user';
  const div = document.createElement('div');
  div.style.cssText = `display:flex;gap:8px;margin-bottom:12px;${isUser ? 'flex-direction:row-reverse' : ''}`;
  const avatar = document.createElement('div');
  avatar.style.cssText = `width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;${isUser ? 'background:var(--green);color:white' : 'background:var(--pp);color:var(--purple)'}`;
  avatar.textContent = isUser ? (document.getElementById('sb-av')?.textContent || 'U') : '✦';
  const bubble = document.createElement('div');
  bubble.style.cssText = `max-width:85%;padding:10px 13px;border-radius:12px;font-size:13px;line-height:1.6;${isUser ? 'background:var(--green);color:white;border-bottom-right-radius:3px' : 'background:var(--sf);border:1px solid var(--bd);border-bottom-left-radius:3px'}`;
  bubble.innerHTML = isUser ? text.replace(/\n/g,'<br>') : cpMd(text) + cpMakeCopyBtn(text);
  div.appendChild(avatar);
  div.appendChild(bubble);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function cpAddPlaceholder(id) {
  const msgs = document.getElementById('cp-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
  div.innerHTML = `
    <div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;background:var(--pp);color:var(--purple)">✦</div>
    <div class="cp-bubble" style="max-width:85%;padding:10px 13px;border-radius:12px;border-bottom-left-radius:3px;font-size:13px;line-height:1.6;background:var(--sf);border:1px solid var(--bd)">
      <span class="cp-typing"><span></span><span></span><span></span></span>
    </div>`;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

function cpUpdatePlaceholder(id, text) {
  const el = document.querySelector(`#${id} .cp-bubble`);
  if (!el) return;
  el.innerHTML = cpMd(text) + '<span class="cp-cursor">▍</span>';
  const msgs = document.getElementById('cp-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function cpCopyText(btn, text) {
  navigator.clipboard.writeText(text).then(function() {
    btn.classList.add('cp-copied');
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg> Copiado';
    setTimeout(function() {
      btn.classList.remove('cp-copied');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar';
    }, 2000);
  }).catch(function() {});
}

function cpMakeCopyBtn(rawText) {
  var id = 'cp-raw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  window[id] = rawText;
  return '<button class="cp-copy-btn" onclick="cpCopyText(this,window[\'' + id + '\'])">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar'
    + '</button>';
}

function cpFinalizePlaceholder(id, text) {
  const el = document.querySelector(`#${id} .cp-bubble`);
  if (!el) return;
  el.innerHTML = cpMd(text) + cpMakeCopyBtn(text);
  const msgs = document.getElementById('cp-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function cpSetBusy(busy) {
  const btn   = document.getElementById('cp-send');
  const input = document.getElementById('cp-input');
  if (btn)   { btn.disabled = busy; btn.style.opacity = busy ? '.4' : '1'; }
  if (input) { input.disabled = busy; }
  /* Hide suggestions while busy */
  const sugg = document.getElementById('cp-sugg');
  if (sugg)  sugg.style.display = busy ? 'none' : 'flex';
}

/* ══════════════════════════════════════════════
   SESSION BUFFER — acumula sin coste API
   Se extrae solo cuando el usuario lo pide
   o automáticamente 1x/día máximo
══════════════════════════════════════════════ */

const CP_SESSION_KEY = 'pr_session_buffer_v1';

function cpBufferSession(userMsg, assistantMsg) {
  try {
    const buf = JSON.parse(localStorage.getItem(CP_SESSION_KEY) || '[]');
    buf.push({ ts: Date.now(), user: userMsg.slice(0, 300), asst: assistantMsg.slice(0, 500) });
    localStorage.setItem(CP_SESSION_KEY, JSON.stringify(buf.slice(-25)));
    cpUpdateSaveBtn();
  } catch (_) {}
}

function cpGetBufferCount() {
  try { return JSON.parse(localStorage.getItem(CP_SESSION_KEY) || '[]').length; }
  catch (_) { return 0; }
}

function cpUpdateSaveBtn() {
  const btn = document.getElementById('cp-save-btn');
  if (!btn) return;
  const count = cpGetBufferCount();
  btn.style.display = count === 0 ? 'none' : 'flex';
  if (count > 0) btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Guardar sesión (${count})`;
}

async function cpSaveSession() {
  const buf = JSON.parse(localStorage.getItem(CP_SESSION_KEY) || '[]');
  if (buf.length === 0 || !CFG.ak) return;
  const btn = document.getElementById('cp-save-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⟳ Guardando…'; }
  if (typeof memAutoExtract === 'function') {
    await memAutoExtract(
      buf.map(b => b.user).join('\n---\n'),
      buf.map(b => b.asst).join('\n---\n')
    );
  }
  localStorage.removeItem(CP_SESSION_KEY);
  if (btn) { btn.disabled = false; btn.style.display = 'none'; }
  cpAddMsg('assistant', '✅ **Sesión guardada.** Analicé los intercambios y actualicé mi memoria con los aprendizajes más relevantes. En la próxima conversación tendré más contexto sobre Próximo Rol.');
}

/* ── Deep Mode (Opus) toggle ── */
let CP_DEEP_MODE = false;

function cpToggleDeepMode() {
  CP_DEEP_MODE = !CP_DEEP_MODE;
  const btn = document.getElementById('cp-deep-btn');
  if (!btn) return;
  btn.style.background   = CP_DEEP_MODE ? 'var(--pp)' : '';
  btn.style.color        = CP_DEEP_MODE ? 'var(--purple)' : '';
  btn.style.borderColor  = CP_DEEP_MODE ? '#DDD6FE' : '';
  btn.title = CP_DEEP_MODE
    ? 'Modo Profundo ACTIVO — usando Opus (más lento, más preciso). Clic para desactivar.'
    : 'Activar Modo Profundo (Opus) para la siguiente respuesta';
}

/* ── Detect topic from message for contextual memory injection ── */
function cpDetectTopic(msg) {
  const m = msg.toLowerCase();
  if (/linkedin|red social|post|publicaci/.test(m)) return 'linkedin';
  if (/email|instantly|campaña|nurturing|apertura/.test(m)) return 'email';
  if (/seo|keyword|palabra|búsqueda|google|posici/.test(m)) return 'seo';
  if (/pipeline|oportunidad|crm|lead|cliente|venta/.test(m)) return 'pipeline';
  if (/presupuesto|budget|coste|cac|ltv|revenue|ingreso/.test(m)) return 'budget';
  if (/instagram|facebook|reel|story/.test(m)) return 'instagram';
  if (/contenido|content|blog|artículo|copy/.test(m)) return 'content';
  if (/audiencia|cliente ideal|perfil|buyer/.test(m)) return 'audience';
  return null;
}

/* ── Detect if question needs real website knowledge ── */
function cpNeedsSiteContext(msg) {
  const m = msg.toLowerCase();
  return /keyword|posicion|ranking|seo|web\s|pagina|página|contenido|landing|blog|titulo|meta|h1|texto|copy|url|sitio|site|encontr[ao]|buscan|busca[nd]|indexa|google.*encontr|trafico|tráfico|orgánico|organico/.test(m);
}

/* ── Site context cache — fetcheado una vez, válido 30 min ── */
const CP_SITE_CACHE_KEY = 'pr_site_context_v1';

function cpGetSiteCache() {
  try {
    const raw = localStorage.getItem(CP_SITE_CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    /* Expired after 30 min */
    if (Date.now() - obj.ts > 30 * 60 * 1000) return null;
    return obj.data;
  } catch (_) { return null; }
}

function cpSetSiteCache(data) {
  try {
    localStorage.setItem(CP_SITE_CACHE_KEY, JSON.stringify({ ts: Date.now(), data }));
  } catch (_) {}
}

/* ── Fetch & analyze website via Anthropic web_search tool ── */
async function cpFetchSiteContext() {
  const cached = cpGetSiteCache();
  if (cached) return cached;

  if (!CFG.ak) return null;

  try {
    const data = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CFG.ak,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Analiza el sitio web de Próximo Rol (proximorol.com). Necesito saber:
1. Qué páginas principales existen (URLs y títulos)
2. Qué keywords o términos usa en los títulos, H1 y meta descriptions de las páginas principales
3. Si tiene sección de blog o recursos
4. Qué servicios describe y cómo los llama exactamente
5. Si hay páginas específicas para "coaching entrevistas", "preparar entrevista", "CV", etc.

Busca primero "site:proximorol.com" y luego visita la homepage y páginas de servicios.
Responde en formato JSON sin markdown: {"pages":[{"url":"...","title":"...","keywords":["..."]}],"hasKeywords":["..."],"missingKeywords":["..."],"blogExists":true/false,"summary":"..."}`
        }]
      })
    }).then(r => r.json());

    /* Extract text from tool use + final response */
    const textBlocks = (data.content || []).filter(b => b.type === 'text');
    const raw = textBlocks.map(b => b.text).join('').trim();

    let parsed = null;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) parsed = JSON.parse(jsonMatch[0]);
    } catch (_) {
      /* If JSON parse fails, use raw text as summary */
      parsed = { summary: raw.slice(0, 800), pages: [], hasKeywords: [], missingKeywords: [] };
    }

    if (parsed) {
      cpSetSiteCache(parsed);
      return parsed;
    }
  } catch (_) {}
  return null;
}

/* ── Build site context section for system prompt ── */
function cpBuildSiteSection(siteCtx) {
  if (!siteCtx) return '';
  const lines = ['## ANÁLISIS REAL DEL SITIO PROXIMOROL.COM (datos actuales, no suposiciones)'];
  if (siteCtx.summary) lines.push(siteCtx.summary);
  if (siteCtx.pages?.length) {
    lines.push('\nPáginas encontradas:');
    siteCtx.pages.slice(0, 8).forEach(p => {
      lines.push(`- ${p.url}: "${p.title}" ${p.keywords?.length ? '| keywords: ' + p.keywords.join(', ') : ''}`);
    });
  }
  if (siteCtx.hasKeywords?.length) lines.push('\nKeywords YA presentes en el sitio: ' + siteCtx.hasKeywords.join(', '));
  if (siteCtx.missingKeywords?.length) lines.push('\nKeywords AUSENTES (gaps reales confirmados): ' + siteCtx.missingKeywords.join(', '));
  if (siteCtx.blogExists !== undefined) lines.push(`\nBlog/recursos: ${siteCtx.blogExists ? 'Existe' : 'No existe'}`);
  lines.push('\nINSTRUCCIÓN: Usa estos datos reales. NO digas "imagino que..." o "probablemente..." sobre el contenido del sitio.');
  return lines.join('\n');
}
function toggleCopilot() {
  CP_OPEN = !CP_OPEN;
  const panel = document.getElementById('copilot-panel');
  const fab   = document.getElementById('copilot-fab');
  if (!panel) return;
  panel.classList.toggle('cp-open', CP_OPEN);
  if (fab) fab.classList.toggle('cp-fab-active', CP_OPEN);
  if (CP_OPEN) {
    /* Primer mensaje de bienvenida si el historial está vacío */
    if (CP_HISTORY.length === 0) cpShowWelcome();
    setTimeout(() => document.getElementById('cp-input')?.focus(), 300);
  }
}

function cpShowWelcome() {
  const msgs = document.getElementById('cp-messages');
  if (!msgs) return;

  const ctx = cpGatherContext();

  const welcomeByStage = {
    lanzamiento: `Hola 👋 Soy tu **Marketing Co-pilot** para Próximo Rol.\n\nEstamos en **etapa de lanzamiento** — poca data propia, pero eso no es problema. Conozco bien el mercado de coaching profesional en España y LATAM, los benchmarks del sector, las keywords que funcionan y el contenido que convierte.\n\n**Lo que puedo hacer ahora mismo aunque no tengas datos:**\n- Darte un plan de 30 días para conseguir tus primeros clientes\n- Escribir tu primer post de LinkedIn publicable\n- Diseñar tu secuencia de email de bienvenida\n- Decirte exactamente qué keywords atacar primero\n- Ayudarte a estructurar tu pipeline de ventas desde cero\n\n¿Por dónde empezamos?`,

    early_traction: `Hola 👋 Soy tu **Marketing Co-pilot**.\n\nYa hay señales de vida en el dashboard — veo ${ctx.canalesConectados.length > 0 ? ctx.canalesConectados.join(', ') : 'algunos canales conectados'}. **Etapa de tracción inicial**: el objetivo ahora es identificar qué está funcionando y amplificarlo, no optimizar lo que aún no existe.\n\n${ctx.gapsActivos.length > 0 ? `Veo **${ctx.gapsActivos.length} canal(es) sin conectar** que impactarían directamente en tu crecimiento. Te puedo decir cuáles priorizar.` : 'Tienes buena cobertura de canales.'}\n\n¿Qué quieres trabajar hoy?`,

    crecimiento: `Hola 👋 Tengo datos suficientes para analizar. Veo **${ctx.canalesConectados.length} canales activos** y ${ctx.pipeline ? `${ctx.pipeline.total} oportunidades en el pipeline` : 'datos de tráfico disponibles'}.\n\nEl momento es bueno para identificar las palancas que más impactan en clientes nuevos. ¿Qué analizamos?`,

    optimizacion: `Hola 👋 Dashboard en estado maduro — buena cobertura de datos. Listo para análisis profundo. ¿Qué quieres optimizar hoy?`,
  };

  const text = welcomeByStage[ctx.etapaNegocio] || welcomeByStage.lanzamiento;
  cpAddMsg('assistant', text);
}

/* ── Renderiza sugerencias dinámicas ── */
function cpRenderSuggestions() {
  const el = document.getElementById('cp-sugg');
  if (!el) return;
  const suggestions = cpGetDynamicSuggestions();
  el.innerHTML = suggestions.map(s =>
    `<button class="cp-sugg-btn" onclick="cpSendSuggestion('${s.text.replace(/'/g,"\\'")}')">
      <span style="font-size:13px">${s.icon}</span> ${s.text}
    </button>`
  ).join('');
}
function cpSend() {
  if (CP_BUSY) return;
  const input = document.getElementById('cp-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  cpAutoResize(input);

  /* Ocultar sugerencias tras el primer mensaje */
  const sugg = document.getElementById('cp-sugg');
  if (sugg && CP_HISTORY.length > 0) sugg.style.display = 'none';

  cpAddMsg('user', text);
  cpStream(text);
}

function cpSendSuggestion(text) {
  if (CP_BUSY) return;
  const sugg = document.getElementById('cp-sugg');
  if (sugg) sugg.style.display = 'none';
  cpAddMsg('user', text);
  cpStream(text);
}

function cpClearHistory() {
  CP_HISTORY.length = 0;
  const msgs = document.getElementById('cp-messages');
  if (msgs) msgs.innerHTML = '';
  const sugg = document.getElementById('cp-sugg');
  if (sugg) sugg.style.display = 'flex';
  cpShowWelcome();
}

/* ── Realtime search (Opción A) — llamado solo con confirmación ── */
async function cpDoRealtimeSearch(originalMsg, query) {
  CP_BUSY = true;
  cpSetBusy(true);
  const placeholderId = 'cp-rt-' + Date.now();
  cpAddPlaceholder(placeholderId);
  cpUpdatePlaceholder(placeholderId, '🔍 Buscando en proximorol.com en tiempo real…');

  let realtimeData = null;
  if (typeof libRealtimeSearch === 'function') {
    realtimeData = await libRealtimeSearch(query || originalMsg);
  }

  cpFinalizePlaceholder(placeholderId, '');
  document.getElementById(placeholderId)?.remove();

  /* Reinyectar con contexto real */
  const ctx    = cpGatherContext();
  if (realtimeData) ctx._siteCtx = { summary: realtimeData, pages:[], hasKeywords:[], missingKeywords:[] };
  ctx._topicHint = cpDetectTopic(originalMsg);
  const system = cpBuildSystem(ctx);
  CP_HISTORY.push({ role: 'user', content: originalMsg });

  const pid = 'cp-msg-' + Date.now();
  cpAddPlaceholder(pid);
  let fullText = '';
  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': CFG.ak,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1024, system, messages:CP_HISTORY, stream:true }),
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const reader = resp.body.getReader(); const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      for (const line of decoder.decode(value, { stream:true }).split('\n')) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim(); if (raw === '[DONE]' || !raw) continue;
        try { const p = JSON.parse(raw); if (p.type==='content_block_delta'&&p.delta?.text) { fullText+=p.delta.text; cpUpdatePlaceholder(pid,fullText); } } catch(_){}
      }
    }
    CP_HISTORY.push({ role:'assistant', content:fullText });
    cpFinalizePlaceholder(pid, fullText);
    if (typeof cpBufferSession==='function') cpBufferSession(originalMsg, fullText);
    if (typeof memIncrementChats==='function') memIncrementChats();
  } catch(err) {
    CP_HISTORY.pop();
    cpFinalizePlaceholder(pid, `❌ **Error:** ${err.message}`);
  } finally {
    CP_BUSY = false; cpSetBusy(false);
  }
}

function cpClearSiteCache() {
  localStorage.removeItem(CP_SITE_CACHE_KEY);
  cpAddMsg('assistant', '🔄 **Caché del sitio limpiado.** La próxima vez que preguntes sobre SEO o contenido, revisaré proximorol.com en tiempo real de nuevo.');
}

function cpAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── Init: inyecta estilos y renderiza sugerencias ── */
(function cpInit() {
  /* Inyectar CSS */
  const style = document.createElement('style');
  style.textContent = `
    /* FAB */
    #copilot-fab {
      position:fixed;bottom:24px;right:24px;z-index:9998;
      width:48px;height:48px;border-radius:50%;
      background:var(--green);color:white;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;
      box-shadow:0 4px 16px rgba(0,0,0,.18);
      transition:transform .2s,box-shadow .2s,background .2s;
    }
    #copilot-fab:hover { transform:scale(1.07); box-shadow:0 6px 20px rgba(0,0,0,.22); }
    #copilot-fab.cp-fab-active { background:var(--green2); }
    #copilot-fab svg { width:22px;height:22px; }
    .cp-fab-dot {
      position:absolute;top:3px;right:3px;width:9px;height:9px;
      background:#22c55e;border-radius:50%;border:2px solid white;
      animation:cp-pulse 2.4s ease-in-out infinite;
    }
    @keyframes cp-pulse {
      0%,100%{transform:scale(1);opacity:1}
      50%{transform:scale(1.3);opacity:.7}
    }

    /* Panel */
    #copilot-panel {
      position:fixed;bottom:84px;right:24px;z-index:9997;
      width:380px;max-height:580px;
      background:var(--bg);border:1px solid var(--bd2);border-radius:var(--rl);
      display:flex;flex-direction:column;overflow:hidden;
      opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;
      transition:opacity .22s ease,transform .22s ease;
      box-shadow:0 8px 40px rgba(0,0,0,.14);
    }
    #copilot-panel.cp-open {
      opacity:1;transform:none;pointer-events:all;
    }

    /* Header */
    .cp-header {
      display:flex;align-items:center;gap:10px;padding:12px 14px;
      background:var(--sf);border-bottom:1px solid var(--bd);
      flex-shrink:0;
    }
    .cp-header-icon {
      width:30px;height:30px;border-radius:8px;
      background:var(--pp);display:flex;align-items:center;justify-content:center;
      font-size:15px;flex-shrink:0;
    }
    .cp-header-title { font-size:13px;font-weight:600;flex:1;color:var(--tx); }
    .cp-header-sub   { font-size:10px;color:var(--ht); }
    .cp-header-actions { display:flex;gap:4px; }
    .cp-icon-btn {
      width:28px;height:28px;border:none;background:none;cursor:pointer;
      border-radius:6px;display:flex;align-items:center;justify-content:center;
      color:var(--ht);font-size:13px;transition:background .12s,color .12s;
    }
    .cp-icon-btn:hover { background:var(--sf2);color:var(--tx); }

    /* Messages */
    #cp-messages {
      flex:1;overflow-y:auto;padding:14px;scroll-behavior:smooth;
    }
    #cp-messages::-webkit-scrollbar { width:4px; }
    #cp-messages::-webkit-scrollbar-track { background:transparent; }
    #cp-messages::-webkit-scrollbar-thumb { background:var(--bd2);border-radius:2px; }

    /* Typing indicator */
    .cp-typing { display:inline-flex;gap:4px;align-items:center;padding:2px 0; }
    .cp-typing span {
      width:6px;height:6px;border-radius:50%;background:var(--ht);
      animation:cp-bounce .8s ease-in-out infinite;
    }
    .cp-typing span:nth-child(2) { animation-delay:.15s; }
    .cp-typing span:nth-child(3) { animation-delay:.3s; }
    @keyframes cp-bounce {
      0%,60%,100%{transform:translateY(0)}
      30%{transform:translateY(-5px)}
    }

    /* Cursor blink */
    .cp-cursor {
      display:inline-block;color:var(--green);animation:cp-blink .7s step-end infinite;margin-left:1px;
    }
    @keyframes cp-blink {0%,100%{opacity:1}50%{opacity:0}}

    /* Suggestions */
    #cp-sugg {
      display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;
      border-top:1px solid var(--bd);background:var(--sf);flex-shrink:0;
      max-height:130px;overflow-y:auto;
    }
    .cp-sugg-btn {
      padding:5px 10px;border:1px solid var(--bd2);border-radius:20px;
      background:var(--sf2);color:var(--mt);font-size:11px;cursor:pointer;
      display:flex;align-items:center;gap:5px;
      transition:border-color .12s,color .12s,background .12s;
      font-family:'DM Sans',sans-serif;white-space:nowrap;
    }
    .cp-sugg-btn:hover { border-color:var(--green);color:var(--green);background:var(--gp); }

    /* Input area */
    .cp-input-row {
      display:flex;gap:8px;padding:10px 12px;
      border-top:1px solid var(--bd);background:var(--sf);
      align-items:flex-end;flex-shrink:0;
    }
    #cp-input {
      flex:1;padding:8px 11px;border:1.5px solid var(--bd2);border-radius:var(--r);
      background:var(--sf2);color:var(--tx);font-size:13px;
      font-family:'DM Sans',sans-serif;resize:none;outline:none;
      line-height:1.5;min-height:36px;max-height:120px;overflow-y:auto;
      transition:border-color .15s;
    }
    #cp-input:focus { border-color:var(--green); }
    #cp-input::placeholder { color:var(--ht); }
    #cp-send {
      width:34px;height:34px;border-radius:9px;
      background:var(--green);color:white;border:none;cursor:pointer;
      display:flex;align-items:center;justify-content:center;flex-shrink:0;
      transition:background .15s,opacity .15s;
    }
    #cp-send:hover:not(:disabled) { background:var(--green2); }
    #cp-send svg { width:16px;height:16px; }

    /* Copy button */
    .cp-copy-btn {
      display:inline-flex;align-items:center;gap:4px;
      margin-top:8px;padding:3px 10px;
      font-size:10px;font-family:'DM Sans',sans-serif;
      color:var(--ht);background:var(--sf2);
      border:0.5px solid var(--bd);border-radius:14px;
      cursor:pointer;transition:all .15s;
    }
    .cp-copy-btn:hover { color:var(--green);border-color:var(--green); }
    .cp-copy-btn.cp-copied { color:var(--green);border-color:var(--green); }
    .cp-copy-btn svg { width:11px;height:11px; }
  `;
  document.head.appendChild(style);

  /* Renderiza suggestions cuando el DOM esté listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cpRenderSuggestions);
  } else {
    setTimeout(cpRenderSuggestions, 0);
  }
})();
