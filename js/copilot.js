/* ═══════════════════════════════════════════════════════════════
   MARKETING CO-PILOT — Agente conversacional multi-módulo
   Depende de: core.js (antFetch, CFG, sD, eD, DAYS)
   ═══════════════════════════════════════════════════════════════ */

const CP_HISTORY = [];
let   CP_OPEN    = false;
let   CP_BUSY    = false;

/* ── Quick prompts por contexto ── */
const CP_SUGGESTIONS = [
  { icon:'📊', text:'¿Cómo va el rendimiento esta semana?' },
  { icon:'🔥', text:'¿Cuál es el canal con mejor ROI ahora mismo?' },
  { icon:'⚠️', text:'¿Qué está fallando o necesita atención urgente?' },
  { icon:'✍️', text:'Genera un post de LinkedIn para esta semana' },
  { icon:'🎯', text:'¿Cuántas oportunidades hay en el pipeline?' },
  { icon:'📧', text:'¿Cómo van las campañas de email?' },
  { icon:'🗓️', text:'Dame un plan de acción para los próximos 7 días' },
  { icon:'💡', text:'¿Qué keywords deberíamos atacar ahora?' },
];

/* ── Recoge datos en vivo del dashboard ── */
function cpGatherContext() {
  const ctx = {
    fechaConsulta: new Date().toLocaleDateString('es-ES', { weekday:'long', year:'numeric', month:'long', day:'numeric' }),
    periodoActivo: `${sD()} → ${eD()} (${DAYS} días)`,
    canalesConectados: [],
    ga4: null,
    searchConsole: null,
    googleAds: null,
    linkedin: null,
    email: null,
    instagram: null,
    pipeline: null,
    presupuesto: null,
  };

  /* Canales conectados */
  if (CFG.clientId && CFG.ga4) ctx.canalesConectados.push('Google Analytics 4');
  if (CFG.gsc)      ctx.canalesConectados.push('Search Console');
  if (CFG.ads)      ctx.canalesConectados.push('Google Ads');
  if (CFG.liId)     ctx.canalesConectados.push('LinkedIn');
  if (CFG.instantly)ctx.canalesConectados.push('Email (Instantly)');
  if (CFG.monday)   ctx.canalesConectados.push('CRM Monday.com');
  if (CFG.metatoken)ctx.canalesConectados.push('Instagram/Facebook');
  if (CFG.hunter)   ctx.canalesConectados.push('Hunter.io (Prospecting)');

  /* GA4 KPIs — lee del DOM en tiempo real */
  const kpiEl = document.getElementById('ga4-kpis');
  if (kpiEl && kpiEl.querySelectorAll('.kpi').length) {
    const kpis = {};
    kpiEl.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      const dlt = k.querySelector('.kd')?.textContent?.trim();
      if (lbl && val) kpis[lbl] = dlt ? `${val} (${dlt})` : val;
    });
    if (Object.keys(kpis).length) ctx.ga4 = kpis;
  }

  /* LinkedIn KPIs */
  const liEl = document.getElementById('li-kpis');
  if (liEl && liEl.querySelectorAll('.kpi').length) {
    const kpis = {};
    liEl.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      const dlt = k.querySelector('.kd')?.textContent?.trim();
      if (lbl && val) kpis[lbl] = dlt ? `${val} (${dlt})` : val;
    });
    if (Object.keys(kpis).length) ctx.linkedin = kpis;
  }

  /* Email (Instantly) KPIs */
  const instEl = document.getElementById('inst-kpis');
  if (instEl && instEl.querySelectorAll('.kpi').length) {
    const kpis = {};
    instEl.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      const dlt = k.querySelector('.kd')?.textContent?.trim();
      if (lbl && val) kpis[lbl] = dlt ? `${val} (${dlt})` : val;
    });
    if (Object.keys(kpis).length) ctx.email = kpis;

    /* Datos agregados globales de Instantly si existen */
    if (window._INST_AGG) {
      ctx.email.resumenAgregado = {
        enviados: window._INST_AGG.sent || 0,
        abiertos: window._INST_AGG.opens || 0,
        respuestas: window._INST_AGG.replies || 0,
        tasaApertura: window._INST_AGG.sent > 0
          ? ((window._INST_AGG.opens / window._INST_AGG.sent) * 100).toFixed(1) + '%'
          : 'N/A',
        tasaRespuesta: window._INST_AGG.sent > 0
          ? ((window._INST_AGG.replies / window._INST_AGG.sent) * 100).toFixed(1) + '%'
          : 'N/A',
      };
    }
  }

  /* Instagram KPIs */
  const igEl = document.getElementById('ig-kpis');
  if (igEl && igEl.querySelectorAll('.kpi').length) {
    const kpis = {};
    igEl.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      if (lbl && val) kpis[lbl] = val;
    });
    if (Object.keys(kpis).length) ctx.instagram = kpis;
  }

  /* Pipeline de oportunidades */
  if (typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0) {
    const stages  = {};
    const sources = {};
    let   totalAmt = 0;
    _OPP_DATA.forEach(o => {
      const st = (o.stage  || 'Desconocido').toLowerCase();
      const sr = (o.source || 'Desconocido');
      stages[st]  = (stages[st]  || 0) + 1;
      sources[sr] = (sources[sr] || 0) + 1;
      totalAmt += parseFloat(o.amount || 0);
    });
    ctx.pipeline = {
      totalOportunidades: _OPP_DATA.length,
      valorTotalPipeline: '£' + Math.round(totalAmt).toLocaleString(),
      porEtapa: stages,
      porFuente: sources,
    };
  }

  /* Presupuesto — lee del DOM */
  const budgetKpi = document.getElementById('budget-kpis');
  if (budgetKpi && budgetKpi.querySelectorAll('.kpi').length) {
    const kpis = {};
    budgetKpi.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      if (lbl && val) kpis[lbl] = val;
    });
    if (Object.keys(kpis).length) ctx.presupuesto = kpis;
  }

  /* Search Console — top queries si están visibles */
  const gscQ = document.getElementById('gsc-q');
  if (gscQ) {
    const rows = Array.from(gscQ.querySelectorAll('tr')).slice(1, 6);
    const queries = rows.map(r => {
      const cells = r.querySelectorAll('td');
      return cells[0]?.textContent?.trim();
    }).filter(Boolean);
    if (queries.length) ctx.searchConsole = { topQueries: queries };
  }

  return ctx;
}

/* ── Prompt de sistema ── */
function cpBuildSystem(ctx) {
  return `Eres el Marketing Co-pilot de Próximo Rol, un asistente de estrategia e inteligencia de marketing integrado en el dashboard privado del equipo.

## SOBRE PRÓXIMO ROL
- **Producto:** Coaching de entrevistas de trabajo para profesionales mid y senior hispanohablantes
- **Web:** proximorol.com
- **Servicios:** Sesión única (€97), Pack Completo, Acompañamiento Total
- **Mercados:** España (principal), México, Argentina, Colombia, Chile, UK hispano
- **Metodología:** Storytelling personal, mock interviews, coaching psicológico, preparación estratégica
- **Problema clave actual:** El tráfico es casi 100% branded — los usuarios llegan porque ya conocen la marca, no porque la descubran en búsquedas non-branded o redes

## CANALES ACTIVOS
${ctx.canalesConectados.length ? ctx.canalesConectados.map(c => `- ${c}`).join('\n') : '- (sin canales configurados aún)'}

## DATOS EN TIEMPO REAL DEL DASHBOARD
**Período analizado:** ${ctx.periodoActivo}
**Fecha de consulta:** ${ctx.fechaConsulta}

${ctx.ga4 ? `### Google Analytics 4\n${Object.entries(ctx.ga4).map(([k,v])=>`- **${k}:** ${v}`).join('\n')}` : '### Google Analytics 4\n- Sin datos cargados todavía'}

${ctx.searchConsole ? `### Search Console\n- Top queries: ${ctx.searchConsole.topQueries.join(', ')}` : ''}

${ctx.linkedin ? `### LinkedIn\n${Object.entries(ctx.linkedin).map(([k,v])=>`- **${k}:** ${v}`).join('\n')}` : '### LinkedIn\n- Sin datos cargados'}

${ctx.email ? `### Email (Instantly)\n${Object.entries(ctx.email).map(([k,v])=>typeof v === 'object' ? `- **${k}:** ${JSON.stringify(v)}` : `- **${k}:** ${v}`).join('\n')}` : '### Email (Instantly)\n- Sin datos cargados'}

${ctx.instagram ? `### Instagram/Facebook\n${Object.entries(ctx.instagram).map(([k,v])=>`- **${k}:** ${v}`).join('\n')}` : ''}

${ctx.pipeline ? `### Pipeline de Oportunidades\n- **Total oportunidades:** ${ctx.pipeline.totalOportunidades}\n- **Valor total:** ${ctx.pipeline.valorTotalPipeline}\n- **Por etapa:** ${JSON.stringify(ctx.pipeline.porEtapa)}\n- **Por fuente:** ${JSON.stringify(ctx.pipeline.porFuente)}` : '### Pipeline\n- Sin datos cargados'}

${ctx.presupuesto ? `### Presupuesto\n${Object.entries(ctx.presupuesto).map(([k,v])=>`- **${k}:** ${v}`).join('\n')}` : ''}

## TU FORMA DE RESPONDER
- Siempre en **español**
- Directo y accionable — el usuario es quien gestiona el marketing de Próximo Rol día a día
- Usa markdown: **negrita** para métricas importantes, listas con guiones para acciones
- Cuando propongas acciones, ordénalas por impacto o urgencia (primero las más importantes)
- Si un canal no tiene datos, menciónalo brevemente y continúa con lo que sí tienes
- Para generación de contenido (posts, emails, copies) usa el tono de Próximo Rol: cercano, experto, orientado a resultados profesionales
- Máximo 4 párrafos o bullets en respuestas generales — si necesitan más detalle, el usuario lo pedirá`;
}

/* ── Streaming desde la API ── */
async function cpStream(userMsg) {
  if (!CFG.ak) {
    cpAddMsg('assistant', '⚙️ **API Key no configurada.** Ve a **Settings** → *Anthropic API Key* y añade tu clave `sk-ant-...` para activar el Co-pilot.');
    return;
  }

  CP_BUSY = true;
  cpSetBusy(true);

  const ctx    = cpGatherContext();
  const system = cpBuildSystem(ctx);
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
        model:      'claude-sonnet-4-20250514',
        max_tokens: 1024,
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
  bubble.innerHTML = isUser ? text.replace(/\n/g,'<br>') : cpMd(text);
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

function cpFinalizePlaceholder(id, text) {
  const el = document.querySelector(`#${id} .cp-bubble`);
  if (!el) return;
  el.innerHTML = cpMd(text);
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

/* ── Panel toggle ── */
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

  const ctx    = cpGatherContext();
  const loaded = ctx.canalesConectados.length;
  const hasData = ctx.ga4 || ctx.linkedin || ctx.email || ctx.pipeline;

  const welcomeText = hasData
    ? `Hola 👋 Soy tu **Marketing Co-pilot**.\n\nVeo que tienes **${loaded} ${loaded === 1 ? 'canal conectado' : 'canales conectados'}** y datos cargados en el dashboard.\n\nPuedo analizar el rendimiento, responder preguntas cruzadas entre canales, generar contenido y darte un plan de acción. ¿Por dónde empezamos?`
    : `Hola 👋 Soy tu **Marketing Co-pilot**.\n\nTodavía no veo datos cargados en el dashboard — puede que haya que esperar a que carguen o refrescar la página.\n\nPero puedo ayudarte igualmente: hazte una pregunta y usaré lo que tenga disponible.`;

  cpAddMsg('assistant', welcomeText);
}

/* ── Enviar mensaje ── */
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

function cpAutoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

/* ── Renderiza los quick suggestions ── */
function cpRenderSuggestions() {
  const el = document.getElementById('cp-sugg');
  if (!el) return;
  el.innerHTML = CP_SUGGESTIONS.map(s =>
    `<button class="cp-sugg-btn" onclick="cpSendSuggestion('${s.text.replace(/'/g,"\\'")}')">
      <span style="font-size:13px">${s.icon}</span> ${s.text}
    </button>`
  ).join('');
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
  `;
  document.head.appendChild(style);

  /* Renderiza suggestions cuando el DOM esté listo */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', cpRenderSuggestions);
  } else {
    setTimeout(cpRenderSuggestions, 0);
  }
})();
