/* ═══════════════════════════════════════════════════════════════
   MARKETING CO-PILOT UI — Solo interfaz
   Toda la lógica de IA está en el backend.
   Depende de: core.js (apiFetch, API_BASE, CFG, sD, eD, DAYS)
   ═══════════════════════════════════════════════════════════════ */

const CP_HISTORY = [];
let   CP_OPEN    = false;
let   CP_BUSY    = false;

/* ══════════════════════════════════════════════════════
   SUGERENCIAS DINÁMICAS — cambian según el estado real
══════════════════════════════════════════════════════ */

const CP_SUGGESTION_BANK = {
  noData: [
    { icon:'🚀', text:'¿Por dónde empiezo para conseguir mis primeros clientes?' },
    { icon:'📋', text:'Dame un plan de 30 días para arrancar' },
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
    { icon:'🎯', text:'¿Cómo defino qué es una oportunidad para mi negocio?' },
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

function cpGetDynamicSuggestions() {
  const hasGa4Data  = !!document.querySelector('#ga4-kpis .kpi');
  const hasLinkedIn = !!CFG.liId;
  const hasEmail    = !!CFG.instantly;
  const hasPipeline = typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0;
  const dataPoints  = [hasGa4Data, hasLinkedIn, hasEmail, hasPipeline].filter(Boolean).length;

  if (dataPoints === 0) return CP_SUGGESTION_BANK.noData;

  const suggestions = [];
  if (!hasLinkedIn) suggestions.push(...CP_SUGGESTION_BANK.noLinkedIn.slice(0, 2));
  if (!hasEmail)    suggestions.push(...CP_SUGGESTION_BANK.noEmail.slice(0, 2));
  if (!hasPipeline) suggestions.push(...CP_SUGGESTION_BANK.noPipeline.slice(0, 1));
  suggestions.push(...CP_SUGGESTION_BANK.hasData.slice(0, 8 - suggestions.length));
  return suggestions.slice(0, 8);
}

/* ══════════════════════════════════════════════════════
   CONTEXTO — Lee datos del DOM para enviar al backend
══════════════════════════════════════════════════════ */

function cpGatherContext() {
  const ctx = {
    fechaConsulta : new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    periodoActivo : `${sD()} → ${eD()} (${DAYS} días)`,
    etapaNegocio  : 'lanzamiento',
    puntuacionDatos: 0,
    canalesConectados : [],
    gapsActivos       : [],
    ga4           : null,
    searchConsole : null,
    linkedin      : null,
    email         : null,
    instagram     : null,
    pipeline      : null,
    presupuesto   : null,
    pnlContext    : null,
    libraryContext: null,
    siteContext    : null,
  };

  /* Canales conectados */
  if (CFG.clientId && CFG.ga4) ctx.canalesConectados.push('Google Analytics 4');
  if (CFG.gsc)       ctx.canalesConectados.push('Search Console');
  if (CFG.ads)       ctx.canalesConectados.push('Google Ads');
  if (CFG.liId)      ctx.canalesConectados.push('LinkedIn');
  if (CFG.instantly) ctx.canalesConectados.push('Email (Instantly)');
  if (CFG.monday)    ctx.canalesConectados.push('CRM Monday.com');
  if (CFG.metatoken) ctx.canalesConectados.push('Instagram/Facebook');

  /* Gaps */
  if (!CFG.liId) {
    ctx.gapsActivos.push({ canal:'LinkedIn', urgencia:'alta', impacto:'Tu audiencia principal vive en LinkedIn. Sin datos no puedo optimizar tu canal más importante.', accion:'Ve a Settings → LinkedIn.', quick:'Trabaja el contenido orgánico manualmente.' });
  }
  if (!CFG.instantly) {
    ctx.gapsActivos.push({ canal:'Email (Instantly)', urgencia:'alta', impacto:'El email marketing tiene el CAC más bajo. Sin esto no puedo analizar tu nurturing.', accion:'Ve a Settings → Instantly.', quick:'Puedo ayudarte a diseñar tu secuencia de emails.' });
  }
  if (!CFG.monday) {
    ctx.gapsActivos.push({ canal:'CRM (Monday.com)', urgencia:'media', impacto:'Sin pipeline no puedo decirte cuántos leads se están convirtiendo.', accion:'Ve a Settings → CRM.', quick:'Cuéntame cuántas conversaciones de venta tienes activas.' });
  }
  if (!CFG.gsc) {
    ctx.gapsActivos.push({ canal:'Search Console', urgencia:'alta', impacto:'Sin Search Console no puedo ver por qué keywords te están encontrando en Google.', accion:'Ve a Settings → Google y añade la URL de tu propiedad.', quick:'Te daré keywords objetivo basadas en el mercado.' });
  }

  /* Leer datos del DOM */
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
  ctx.presupuesto = readKPIs('budget-kpis');

  const instKPIs = readKPIs('inst-kpis');
  if (instKPIs) {
    ctx.email = instKPIs;
    if (window._INST_AGG && window._INST_AGG.sent > 0) {
      const { sent, opens, replies } = window._INST_AGG;
      ctx.email._agregado = {
        enviados: sent, aperturas: opens, respuestas: replies,
        tasaApertura: ((opens/sent)*100).toFixed(1)+'%',
        tasaRespuesta: ((replies/sent)*100).toFixed(1)+'%',
      };
    }
  }

  /* Search Console — top queries */
  const gscRows = Array.from(document.querySelectorAll('#gsc-q tr')).slice(1, 8);
  const topQueries = gscRows.map(r => r.querySelector('td')?.textContent?.trim()).filter(Boolean);
  if (topQueries.length) ctx.searchConsole = { topQueries };

  /* Pipeline */
  if (typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0) {
    const stages = {}, sources = {};
    let total = 0;
    _OPP_DATA.forEach(o => {
      const s = (o.stage||'desconocido').toLowerCase();
      const r = (o.source||'desconocido');
      stages[s] = (stages[s]||0)+1;
      sources[r] = (sources[r]||0)+1;
      total += parseFloat(o.amount||0);
    });
    ctx.pipeline = { total:_OPP_DATA.length, valorPipeline:'£'+Math.round(total).toLocaleString(), porEtapa:stages, porFuente:sources };
  }

  /* Puntuación de datos y etapa */
  let score = 0;
  if (ctx.ga4) score += 2;
  if (ctx.searchConsole) score += 2;
  if (ctx.linkedin) score += 2;
  if (ctx.email) score += 1;
  if (ctx.pipeline && ctx.pipeline.total > 0) score += 2;
  if (ctx.presupuesto) score += 1;
  ctx.puntuacionDatos = Math.min(score, 10);
  if (score <= 2) ctx.etapaNegocio = 'lanzamiento';
  else if (score <= 5) ctx.etapaNegocio = 'early_traction';
  else if (score <= 8) ctx.etapaNegocio = 'crecimiento';
  else ctx.etapaNegocio = 'optimizacion';

  /* P&L context */
  if (window._PNL_CONTEXT) ctx.pnlContext = window._PNL_CONTEXT;

  /* Library context */
  if (typeof libBuildCopilotContext === 'function') ctx.libraryContext = libBuildCopilotContext();

  /* Moneda del usuario */
  if (typeof getUserCurrency === 'function') ctx.userCurrency = getUserCurrency();

  return ctx;
}

/* ── Estado de confirmación pendiente ── */
let CP_PENDING_CONFIRM = null;

/* ══════════════════════════════════════════════════════
   STREAMING — Lee SSE desde el backend
══════════════════════════════════════════════════════ */

async function cpStream(userMsg) {
  CP_BUSY = true;
  cpSetBusy(true);

  const topic = cpDetectTopic(userMsg);
  if (CP_DEEP_MODE) { CP_DEEP_MODE = false; cpToggleDeepMode(); }

  /* ── Confirmación de búsqueda web pendiente ── */
  if (CP_PENDING_CONFIRM) {
    const conf = typeof libParseUserConfirmation === 'function' ? libParseUserConfirmation(userMsg) : null;
    if (conf === 'yes') {
      const pending = CP_PENDING_CONFIRM;
      CP_PENDING_CONFIRM = null;
      CP_BUSY = false; cpSetBusy(false);
      if (pending.type === 'realtime') {
        await cpDoRealtimeSearch(pending.originalMsg, pending.query);
      } else if (pending.type === 'sync_needed' || pending.type === 'sync_stale') {
        cpAddMsg('assistant', '🔄 Iniciando sincronización del sitio…');
        if (typeof libSyncSite === 'function') { await libSyncSite(true); await cpStream(pending.originalMsg); }
      }
      return;
    } else if (conf === 'no') {
      CP_PENDING_CONFIRM = null;
    } else {
      CP_PENDING_CONFIRM = null;
    }
  }

  /* ── Preguntar antes de buscar en web ── */
  if (typeof libShouldAskForWebSearch === 'function') {
    const askResult = libShouldAskForWebSearch(userMsg);
    if (askResult) {
      CP_PENDING_CONFIRM = { ...askResult, originalMsg: userMsg };
      CP_BUSY = false; cpSetBusy(false);
      cpAddMsg('assistant', askResult.message);
      return;
    }
  }

  const ctx = cpGatherContext();
  const memorySummary = typeof memBuildSummary === 'function' ? memBuildSummary(topic) : null;

  /* Trim history */
  if (CP_HISTORY.length > 6) CP_HISTORY.splice(0, CP_HISTORY.length - 6);
  CP_HISTORY.push({ role: 'user', content: userMsg });

  const placeholderId = 'cp-msg-' + Date.now();
  cpAddPlaceholder(placeholderId);

  let fullText = '';

  try {
    const jwt = window.__SUPABASE_JWT__;
    const resp = await fetch(API_BASE + '/api/claude-proxy', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jwt && { 'Authorization': 'Bearer ' + jwt }),
      },
      body: JSON.stringify({
        module: 'copilot',
        action: 'stream',
        payload: {
          context: ctx,
          memorySummary,
          history: CP_HISTORY,
          deepMode: CP_DEEP_MODE,
        }
      }),
    });

    if (!resp.ok) {
      const e = await resp.json().catch(() => ({}));
      throw new Error(e?.error || `HTTP ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const lines = decoder.decode(value, { stream: true }).split('\n');
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (!raw) continue;
        try {
          const parsed = JSON.parse(raw);
          if (parsed.type === 'delta' && parsed.text) {
            fullText += parsed.text;
            cpUpdatePlaceholder(placeholderId, fullText);
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
        } catch (e) {
          if (e.message && !e.message.includes('JSON')) throw e;
        }
      }
    }

    CP_HISTORY.push({ role: 'assistant', content: fullText });
    cpFinalizePlaceholder(placeholderId, fullText);

    /* Session buffer */
    if (typeof cpBufferSession === 'function') cpBufferSession(userMsg, fullText);
    if (typeof memIncrementChats === 'function') memIncrementChats();

    /* Auto-extract insights (silent, non-blocking) */
    cpAutoExtractInsights(userMsg, fullText);

    /* Experiment tracking */
    if (typeof expDetectActionable === 'function' && expDetectActionable(fullText)) {
      var _expChannel = typeof expDetectChannel === 'function' ? expDetectChannel(userMsg + ' ' + fullText) : 'general';
      var _expRecId = null;
      if (typeof memAddRecommendation === 'function') {
        _expRecId = memAddRecommendation({ text: fullText.slice(0, 300), category: _expChannel, channel: _expChannel, priority: 'medium' });
      }
      var _expId = typeof expCreateFromRecommendation === 'function'
        ? expCreateFromRecommendation(_expRecId, fullText, _expChannel, 'TBD', userMsg) : null;
      if (_expId) {
        cpAddMsg('assistant', '\n\n---\n**📊 Rastreando esta recomendación.** Cuando la implementes, ve a **Experimentos** en la sidebar para reportar resultados.');
        if (typeof expUpdateBadge === 'function') expUpdateBadge();
      }
    }

  } catch (err) {
    CP_HISTORY.pop();
    cpFinalizePlaceholder(placeholderId, `❌ **Error:** ${err.message}`);
  } finally {
    CP_BUSY = false;
    cpSetBusy(false);
  }
}

/* ── Auto-extract insights via backend (silent) ── */
async function cpAutoExtractInsights(userMsg, assistantMsg) {
  if (assistantMsg.length < 120) return;
  setTimeout(async () => {
    try {
      const mem = typeof memLoad === 'function' ? memLoad() : { insights: [] };
      const existingTopics = mem.insights.slice(0, 8).map(i => i.text).join(' | ');

      const data = await apiFetch('/api/claude-proxy', {
        method: 'POST',
        body: {
          module: 'copilot',
          action: 'extract-insights',
          payload: { userMsg: userMsg.slice(0, 400), assistantMsg: assistantMsg.slice(0, 800), existingTopics }
        }
      });

      if (data.insights) {
        data.insights.forEach(ins => {
          if (typeof memIsDuplicate === 'function' && memIsDuplicate(ins.text, mem.insights)) return;
          if ((ins.confidence || 3) < 2) return;
          if (typeof memAddInsight === 'function') {
            memAddInsight(ins.text, ins.category, ins.actionable !== false, ins.confidence || 3, ins.revenueImpact || 'medium');
          }
        });
      }
      if (data.recommendations) {
        data.recommendations.forEach(rec => {
          if (typeof memAddRecommendation === 'function') memAddRecommendation(rec);
        });
      }

      if (document.getElementById('mem-panel')?.classList.contains('mem-open')) {
        if (typeof memRenderPanel === 'function') memRenderPanel();
      }
    } catch (_) { /* silent */ }
  }, 2500);
}

/* ── Realtime search via backend ── */
async function cpDoRealtimeSearch(originalMsg, query) {
  CP_BUSY = true; cpSetBusy(true);
  const pid = 'cp-rt-' + Date.now();
  cpAddPlaceholder(pid);
  cpUpdatePlaceholder(pid, '🔍 Buscando información del sitio en tiempo real…');

  try {
    const siteData = await apiFetch('/api/claude-proxy', {
      method: 'POST',
      body: { module: 'copilot', action: 'fetch-site', payload: { siteUrl: query || 'proximorol.com' } }
    });

    cpFinalizePlaceholder(pid, '');
    document.getElementById(pid)?.remove();

    // Re-stream with site context
    const ctx = cpGatherContext();
    if (siteData.siteContext) ctx.siteContext = siteData.siteContext;

    CP_BUSY = false; cpSetBusy(false);

    // Inject the message and stream
    await cpStream(originalMsg);

  } catch (err) {
    cpFinalizePlaceholder(pid, '⚠ Error buscando: ' + err.message);
    CP_BUSY = false; cpSetBusy(false);
  }
}

/* ══════════════════════════════════════════════════════
   TOPIC DETECTION
══════════════════════════════════════════════════════ */

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

/* ══════════════════════════════════════════════
   SESSION BUFFER
══════════════════════════════════════════════ */

const CP_SESSION_KEY = 'pr_session_buffer_v1';

function cpBufferSession(userMsg, assistantMsg) {
  try {
    const buf = window.__CP_BUF_CACHE__ || JSON.parse(localStorage.getItem(CP_SESSION_KEY) || '[]');
    buf.push({ ts: Date.now(), user: userMsg.slice(0, 300), asst: assistantMsg.slice(0, 500) });
    const trimmed = buf.slice(-25);
    window.__CP_BUF_CACHE__ = trimmed;
    DB.set('copilot', 'buffer', trimmed);
    cpUpdateSaveBtn();
  } catch (_) {}
}

function cpGetBufferCount() {
  const buf = window.__CP_BUF_CACHE__ || [];
  return buf.length;
}

function cpUpdateSaveBtn() {
  const btn = document.getElementById('cp-save-btn');
  if (!btn) return;
  const count = cpGetBufferCount();
  btn.style.display = count === 0 ? 'none' : 'flex';
  if (count > 0) btn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/></svg> Guardar sesión (${count})`;
}

async function cpSaveSession() {
  const buf = window.__CP_BUF_CACHE__ || [];
  if (buf.length === 0) return;
  const btn = document.getElementById('cp-save-btn');
  if (btn) { btn.disabled = true; btn.innerHTML = '⟳ Guardando…'; }

  try {
    const combined = buf.map(b => b.asst).join('\n---\n');
    const data = await apiFetch('/api/claude-proxy', {
      method: 'POST',
      body: {
        module: 'copilot',
        action: 'extract-insights',
        payload: {
          userMsg: buf.map(b => b.user).join('\n---\n').slice(0, 800),
          assistantMsg: combined.slice(0, 1500),
          existingTopics: '',
        }
      }
    });

    if (data.insights) {
      data.insights.forEach(ins => {
        if (typeof memAddInsight === 'function') memAddInsight(ins.text, ins.category, ins.actionable !== false, ins.confidence || 3, ins.revenueImpact || 'medium');
      });
    }
    if (data.recommendations) {
      data.recommendations.forEach(rec => { if (typeof memAddRecommendation === 'function') memAddRecommendation(rec); });
    }
  } catch(_) {}

  window.__CP_BUF_CACHE__ = [];
  DB.remove('copilot', 'buffer');
  localStorage.removeItem(CP_SESSION_KEY); // limpiar legacy
  if (btn) { btn.disabled = false; btn.style.display = 'none'; }
  cpAddMsg('assistant', '✅ **Sesión guardada.** Analicé los intercambios y actualicé mi memoria con los aprendizajes más relevantes.');
}

/* ── Deep Mode toggle ── */
let CP_DEEP_MODE = false;

function cpToggleDeepMode() {
  CP_DEEP_MODE = !CP_DEEP_MODE;
  const btn = document.getElementById('cp-deep-btn');
  if (!btn) return;
  btn.style.background   = CP_DEEP_MODE ? 'var(--pp)' : '';
  btn.style.color        = CP_DEEP_MODE ? 'var(--purple)' : '';
  btn.style.borderColor  = CP_DEEP_MODE ? '#DDD6FE' : '';
  btn.title = CP_DEEP_MODE
    ? 'Modo Profundo ACTIVO — usando Opus. Clic para desactivar.'
    : 'Activar Modo Profundo (Opus) para la siguiente respuesta';
}

/* ══════════════════════════════════════════════
   UI — Renderizado
══════════════════════════════════════════════ */

function cpMd(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<strong style="font-size:13px;color:var(--tx)">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong style="font-size:14px;color:var(--tx)">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code style="background:var(--sf2);padding:1px 5px;border-radius:4px;font-size:11px;font-family:var(--mono,monospace)">$1</code>')
    .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:var(--green);flex-shrink:0;margin-top:1px">•</span><span>$1</span></div>')
    .replace(/^\d+\. (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:var(--green);flex-shrink:0">›</span><span>$1</span></div>')
    .replace(/\n{2,}/g, '<br><br>').replace(/\n/g, '<br>');
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
  div.appendChild(avatar); div.appendChild(bubble);
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}

function cpAddPlaceholder(id) {
  const msgs = document.getElementById('cp-messages');
  if (!msgs) return;
  const div = document.createElement('div');
  div.id = id;
  div.style.cssText = 'display:flex;gap:8px;margin-bottom:12px;';
  div.innerHTML = `<div style="width:26px;height:26px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:600;background:var(--pp);color:var(--purple)">✦</div>
    <div class="cp-bubble" style="max-width:85%;padding:10px 13px;border-radius:12px;border-bottom-left-radius:3px;font-size:13px;line-height:1.6;background:var(--sf);border:1px solid var(--bd)">
      <span class="cp-typing"><span></span><span></span><span></span></span>
    </div>`;
  msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
}

function cpUpdatePlaceholder(id, text) {
  const el = document.querySelector(`#${id} .cp-bubble`);
  if (!el) return;
  el.innerHTML = cpMd(text) + '<span class="cp-cursor">▍</span>';
  const msgs = document.getElementById('cp-messages');
  if (msgs) msgs.scrollTop = msgs.scrollHeight;
}

function cpFinalizePlaceholder(id, text) {
  const el = document.querySelector(`#${id} .cp-bubble`);
  if (!el) return;
  el.innerHTML = cpMd(text) + cpMakeCopyBtn(text);
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
  }).catch(function(){});
}

function cpMakeCopyBtn(rawText) {
  var id = 'cp-raw-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6);
  window[id] = rawText;
  return '<button class="cp-copy-btn" onclick="cpCopyText(this,window[\'' + id + '\'])">'
    + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg> Copiar'
    + '</button>';
}

function cpSetBusy(busy) {
  const btn = document.getElementById('cp-send');
  const input = document.getElementById('cp-input');
  if (btn)   { btn.disabled = busy; btn.style.opacity = busy ? '.4' : '1'; }
  if (input) { input.disabled = busy; }
  const sugg = document.getElementById('cp-sugg');
  if (sugg)  sugg.style.display = busy ? 'none' : 'flex';
}

/* ══════════════════════════════════════════════
   NAV — Toggle, Send, Clear, Welcome
══════════════════════════════════════════════ */

function toggleCopilot() {
  CP_OPEN = !CP_OPEN;
  const panel = document.getElementById('copilot-panel');
  const fab = document.getElementById('copilot-fab');
  if (!panel) return;
  panel.classList.toggle('cp-open', CP_OPEN);
  if (fab) fab.classList.toggle('cp-fab-active', CP_OPEN);
  if (CP_OPEN) {
    if (CP_HISTORY.length === 0) cpShowWelcome();
    setTimeout(() => document.getElementById('cp-input')?.focus(), 300);
  }
}

function cpShowWelcome() {
  const ctx = cpGatherContext();
  const welcomeByStage = {
    lanzamiento: `Hola 👋 Soy tu **Marketing Co-pilot**.\n\nEstamos en **etapa de lanzamiento** — poca data propia, pero eso no es problema. Conozco bien el mercado de coaching profesional en España y LATAM.\n\n**Lo que puedo hacer ahora mismo:**\n- Darte un plan de 30 días para conseguir tus primeros clientes\n- Escribir tu primer post de LinkedIn publicable\n- Diseñar tu secuencia de email de bienvenida\n- Decirte exactamente qué keywords atacar primero\n\n¿Por dónde empezamos?`,
    early_traction: `Hola 👋 Soy tu **Marketing Co-pilot**.\n\nYa hay señales de vida — veo ${ctx.canalesConectados.length > 0 ? ctx.canalesConectados.join(', ') : 'algunos canales conectados'}. **Etapa de tracción inicial**: el objetivo ahora es identificar qué está funcionando y amplificarlo.\n\n${ctx.gapsActivos.length > 0 ? `Veo **${ctx.gapsActivos.length} canal(es) sin conectar** que impactarían directamente en tu crecimiento.` : 'Tienes buena cobertura de canales.'}\n\n¿Qué quieres trabajar hoy?`,
    crecimiento: `Hola 👋 Tengo datos suficientes para analizar. Veo **${ctx.canalesConectados.length} canales activos** y ${ctx.pipeline ? `${ctx.pipeline.total} oportunidades en el pipeline` : 'datos de tráfico disponibles'}.\n\nEl momento es bueno para identificar las palancas que más impactan en clientes nuevos. ¿Qué analizamos?`,
    optimizacion: `Hola 👋 Dashboard en estado maduro — buena cobertura de datos. Listo para análisis profundo. ¿Qué quieres optimizar hoy?`,
  };
  cpAddMsg('assistant', welcomeByStage[ctx.etapaNegocio] || welcomeByStage.lanzamiento);
}

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

function cpClearSiteCache() {
  localStorage.removeItem('pr_site_context_v1');
  cpAddMsg('assistant', '🔄 **Caché del sitio limpiado.** La próxima vez que preguntes sobre SEO o contenido, revisaré el sitio en tiempo real de nuevo.');
}

function cpAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── Init: inyecta estilos y renderiza sugerencias ── */
(function cpInit() {
  const style = document.createElement('style');
  style.textContent = `
    #copilot-fab { position:fixed;bottom:24px;right:24px;z-index:9998;width:48px;height:48px;border-radius:50%;background:var(--green);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(0,0,0,.18);transition:transform .2s,box-shadow .2s,background .2s; }
    #copilot-fab:hover { transform:scale(1.07); box-shadow:0 6px 20px rgba(0,0,0,.22); }
    #copilot-fab.cp-fab-active { background:var(--green2); }
    #copilot-fab svg { width:22px;height:22px; }
    .cp-fab-dot { position:absolute;top:3px;right:3px;width:9px;height:9px;background:#22c55e;border-radius:50%;border:2px solid white;animation:cp-pulse 2.4s ease-in-out infinite; }
    @keyframes cp-pulse { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.3);opacity:.7} }
    #copilot-panel { position:fixed;bottom:84px;right:24px;z-index:9997;width:380px;max-height:580px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--rl);display:flex;flex-direction:column;overflow:hidden;opacity:0;transform:translateY(12px) scale(.97);pointer-events:none;transition:opacity .22s ease,transform .22s ease;box-shadow:0 8px 40px rgba(0,0,0,.14); }
    #copilot-panel.cp-open { opacity:1;transform:none;pointer-events:all; }
    .cp-header { display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--sf);border-bottom:1px solid var(--bd);flex-shrink:0; }
    .cp-header-icon { width:30px;height:30px;border-radius:8px;background:var(--pp);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0; }
    .cp-header-title { font-size:13px;font-weight:600;flex:1;color:var(--tx); }
    .cp-header-sub { font-size:10px;color:var(--ht); }
    .cp-header-actions { display:flex;gap:4px; }
    .cp-icon-btn { width:28px;height:28px;border:none;background:none;cursor:pointer;border-radius:6px;display:flex;align-items:center;justify-content:center;color:var(--ht);font-size:13px;transition:background .12s,color .12s; }
    .cp-icon-btn:hover { background:var(--sf2);color:var(--tx); }
    #cp-messages { flex:1;overflow-y:auto;padding:14px;scroll-behavior:smooth; }
    #cp-messages::-webkit-scrollbar { width:4px; }
    #cp-messages::-webkit-scrollbar-track { background:transparent; }
    #cp-messages::-webkit-scrollbar-thumb { background:var(--bd2);border-radius:2px; }
    .cp-typing { display:inline-flex;gap:4px;align-items:center;padding:2px 0; }
    .cp-typing span { width:6px;height:6px;border-radius:50%;background:var(--ht);animation:cp-bounce .8s ease-in-out infinite; }
    .cp-typing span:nth-child(2) { animation-delay:.15s; }
    .cp-typing span:nth-child(3) { animation-delay:.3s; }
    @keyframes cp-bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }
    .cp-cursor { display:inline-block;color:var(--green);animation:cp-blink .7s step-end infinite;margin-left:1px; }
    @keyframes cp-blink { 0%,100%{opacity:1} 50%{opacity:0} }
    #cp-sugg { display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px;border-top:1px solid var(--bd);background:var(--sf);flex-shrink:0;max-height:130px;overflow-y:auto; }
    .cp-sugg-btn { padding:5px 10px;border:1px solid var(--bd2);border-radius:20px;background:var(--sf2);color:var(--mt);font-size:11px;cursor:pointer;display:flex;align-items:center;gap:5px;transition:border-color .12s,color .12s,background .12s;font-family:'DM Sans',sans-serif;white-space:nowrap; }
    .cp-sugg-btn:hover { border-color:var(--green);color:var(--green);background:var(--gp); }
    .cp-input-row { display:flex;gap:8px;padding:10px 12px;border-top:1px solid var(--bd);background:var(--sf);align-items:flex-end;flex-shrink:0; }
    #cp-input { flex:1;padding:8px 11px;border:1.5px solid var(--bd2);border-radius:var(--r);background:var(--sf2);color:var(--tx);font-size:13px;font-family:'DM Sans',sans-serif;resize:none;outline:none;line-height:1.5;min-height:36px;max-height:120px;overflow-y:auto;transition:border-color .15s; }
    #cp-input:focus { border-color:var(--green); }
    #cp-input::placeholder { color:var(--ht); }
    #cp-send { width:34px;height:34px;border-radius:9px;background:var(--green);color:white;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background .15s,opacity .15s; }
    #cp-send:hover:not(:disabled) { background:var(--green2); }
    #cp-send svg { width:16px;height:16px; }
    .cp-copy-btn { display:inline-flex;align-items:center;gap:4px;margin-top:8px;padding:3px 10px;font-size:10px;font-family:'DM Sans',sans-serif;color:var(--ht);background:var(--sf2);border:0.5px solid var(--bd);border-radius:14px;cursor:pointer;transition:all .15s; }
    .cp-copy-btn:hover { color:var(--green);border-color:var(--green); }
    .cp-copy-btn.cp-copied { color:var(--green);border-color:var(--green); }
    .cp-copy-btn svg { width:11px;height:11px; }
  `;
  document.head.appendChild(style);

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cpRenderSuggestions);
  } else {
    setTimeout(cpRenderSuggestions, 0);
  }

  // Precargar buffer desde Supabase al inicio
  setTimeout(async () => {
    if (typeof DB !== 'undefined' && typeof apiFetch === 'function' && window.__SUPABASE_JWT__) {
      const buf = await DB.get('copilot', 'buffer', []);
      window.__CP_BUF_CACHE__ = Array.isArray(buf) ? buf : [];
      cpUpdateSaveBtn();
    }
  }, 1000);
})();
