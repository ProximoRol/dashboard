/* ═══════════════════════════════════════════════════════════════
   ALERT MONITOR — Detección automática de anomalías y alertas IA
   Depende de: core.js, pipeline.js (_OPP_DATA), analytics.js
   Se auto-ejecuta 5 s después de loadAll() y en cada refresh
   ═══════════════════════════════════════════════════════════════ */

/* ── Estado global ── */
let AM_ALERTS       = [];   // Array de alertas activas
let AM_DISMISSED    = new Set(JSON.parse(localStorage.getItem('pr_dismissed_alerts') || '[]'));
let AM_PANEL_OPEN   = false;
let AM_LAST_RUN     = null;
let AM_AI_RUNNING   = false;

/* ── Severidades ── */
const SEV = {
  critical : { color:'#DC2626', bg:'#FEF2F2', border:'#FECACA', label:'Crítico',  icon:'🔴' },
  warning  : { color:'#D97706', bg:'#FFFBEB', border:'#FDE68A', label:'Atención', icon:'🟡' },
  info     : { color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE', label:'Info',     icon:'🔵' },
  ok       : { color:'#1D9E75', bg:'#D4F0DE', border:'#86EFAC', label:'Bien',     icon:'🟢' },
};

/* ══════════════════════════════════════════════════════════════
   REGLAS — Checks basados en datos del DOM y variables globales
══════════════════════════════════════════════════════════════ */

function amRunRules() {
  const alerts = [];

  /* ── Helper: leer un KPI del DOM ── */
  function readKPI(containerId, labelText) {
    const container = document.getElementById(containerId);
    if (!container) return null;
    for (const kpi of container.querySelectorAll('.kpi')) {
      if ((kpi.querySelector('.kl')?.textContent || '').toLowerCase().includes(labelText.toLowerCase())) {
        const val  = kpi.querySelector('.kv')?.textContent?.trim() || '';
        const delta= kpi.querySelector('.kd')?.textContent?.trim() || '';
        return { raw: val, delta };
      }
    }
    return null;
  }

  /* ── Helper: parsear delta ("↓ -32.5%") → número ── */
  function parseDelta(deltaStr) {
    if (!deltaStr) return 0;
    const m = deltaStr.match(/([+-]?\d+\.?\d*)\s*%/);
    if (!m) return 0;
    const n = parseFloat(m[1]);
    return deltaStr.includes('↓') || (deltaStr.includes('-') && !deltaStr.includes('+')) ? -Math.abs(n) : Math.abs(n);
  }

  /* ─────────────────────────────────────────
     1. GA4 — Caída de sesiones
  ───────────────────────────────────────── */
  const sessions = readKPI('ga4-kpis', 'Session');
  if (sessions) {
    const delta = parseDelta(sessions.delta);
    if (delta <= -40) {
      alerts.push({
        id: 'ga4_sessions_critical',
        severity: 'critical',
        module: 'ga4',
        moduleLabel: 'Google Analytics',
        title: `Caída crítica de sesiones (${delta.toFixed(0)}%)`,
        desc: `El tráfico web ha caído ${Math.abs(delta).toFixed(0)}% respecto al período anterior. Posibles causas: caída en rankings SEO, problema técnico en la web, o fin de una campaña activa.`,
        action: 'Ver Analytics',
        actionFn: "showP('ga4', document.querySelector('.ni[onclick*=\\'ga4\\']'))",
        ts: Date.now(),
      });
    } else if (delta <= -20) {
      alerts.push({
        id: 'ga4_sessions_warning',
        severity: 'warning',
        module: 'ga4',
        moduleLabel: 'Google Analytics',
        title: `Descenso de sesiones (${delta.toFixed(0)}%)`,
        desc: `El tráfico ha bajado ${Math.abs(delta).toFixed(0)}% vs período anterior. Revisa si hay cambios en campañas activas o posibles caídas de posicionamiento.`,
        action: 'Ver Analytics',
        actionFn: "showP('ga4', document.querySelector('.ni[onclick*=\\'ga4\\']'))",
        ts: Date.now(),
      });
    }
  }

  /* ─────────────────────────────────────────
     2. GA4 — Bounce rate alto
  ───────────────────────────────────────── */
  const bounce = readKPI('ga4-kpis', 'Bounce');
  if (bounce) {
    const delta = parseDelta(bounce.delta);
    const pct   = parseFloat(bounce.raw) || 0;
    if (pct > 75 && delta > 10) {
      alerts.push({
        id: 'ga4_bounce_high',
        severity: 'warning',
        module: 'ga4',
        moduleLabel: 'Google Analytics',
        title: `Tasa de rebote alta: ${bounce.raw}`,
        desc: `El ${bounce.raw} de usuarios abandona la web sin interactuar. Está ${delta.toFixed(0)}% por encima del período anterior. Revisa la landing page principal y la velocidad de carga.`,
        action: 'Ver Analytics',
        actionFn: "showP('ga4', document.querySelector('.ni[onclick*=\\'ga4\\']'))",
        ts: Date.now(),
      });
    }
  }

  /* ─────────────────────────────────────────
     3. Pipeline — Oportunidades estancadas
  ───────────────────────────────────────── */
  if (typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0) {
    const now = new Date();
    const stale = _OPP_DATA.filter(o => {
      const daysSince = (now - o.created) / (1000 * 60 * 60 * 24);
      const stage = (o.stage || '').toLowerCase();
      const isOpen = !stage.includes('won') && !stage.includes('lost');
      return isOpen && daysSince > 21;
    });
    if (stale.length >= 3) {
      alerts.push({
        id: 'pipeline_stale_opps',
        severity: 'warning',
        module: 'opps',
        moduleLabel: 'Pipeline',
        title: `${stale.length} oportunidades sin actividad (+21 días)`,
        desc: `Hay ${stale.length} oportunidades abiertas que llevan más de 21 días sin cambiar de etapa. Conviene hacer seguimiento antes de que se enfríen.`,
        action: 'Ver Pipeline',
        actionFn: "showP('opps', document.querySelector('.ni[onclick*=\\'opps\\']'))",
        ts: Date.now(),
      });
    }

    /* Sin nuevas oportunidades este mes */
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();
    const newThisMonth = _OPP_DATA.filter(o =>
      o.created.getMonth() === thisMonth && o.created.getFullYear() === thisYear
    );
    if (newThisMonth.length === 0) {
      alerts.push({
        id: 'pipeline_no_new_opps',
        severity: 'warning',
        module: 'opps',
        moduleLabel: 'Pipeline',
        title: 'Sin nuevas oportunidades este mes',
        desc: `No se ha registrado ninguna nueva oportunidad en ${now.toLocaleString('es-ES', { month: 'long' })}. Puede que el pipeline esté enfriándose o que falten registrar leads recientes.`,
        action: 'Ver Pipeline',
        actionFn: "showP('opps', document.querySelector('.ni[onclick*=\\'opps\\']'))",
        ts: Date.now(),
      });
    }
  }

  /* ─────────────────────────────────────────
     4. Email — Tasa de apertura baja
  ───────────────────────────────────────── */
  if (window._INST_AGG) {
    const { sent, opens, replies } = window._INST_AGG;
    if (sent > 50) {
      const openRate  = (opens  / sent) * 100;
      const replyRate = (replies / sent) * 100;
      if (openRate < 15) {
        alerts.push({
          id: 'email_open_rate_critical',
          severity: 'critical',
          module: 'inst',
          moduleLabel: 'Email Campaigns',
          title: `Tasa de apertura crítica: ${openRate.toFixed(1)}%`,
          desc: `Solo ${openRate.toFixed(1)}% de los emails se están abriendo (sobre ${sent.toLocaleString()} enviados). El benchmark del sector es 25–35%. Revisa subject lines, sender reputation y segmentación.`,
          action: 'Ver Campañas',
          actionFn: "showP('inst', document.querySelector('.ni[onclick*=\\'inst\\']'))",
          ts: Date.now(),
        });
      } else if (openRate < 25) {
        alerts.push({
          id: 'email_open_rate_low',
          severity: 'warning',
          module: 'inst',
          moduleLabel: 'Email Campaigns',
          title: `Tasa de apertura por debajo del benchmark: ${openRate.toFixed(1)}%`,
          desc: `El ${openRate.toFixed(1)}% de apertura está por debajo del benchmark de 25–35% para servicios profesionales. Prueba A/B en subject lines y revisa la hora de envío.`,
          action: 'Ver Campañas',
          actionFn: "showP('inst', document.querySelector('.ni[onclick*=\\'inst\\']'))",
          ts: Date.now(),
        });
      }
      if (replyRate < 1 && sent > 200) {
        alerts.push({
          id: 'email_reply_rate_low',
          severity: 'info',
          module: 'inst',
          moduleLabel: 'Email Campaigns',
          title: `Tasa de respuesta muy baja: ${replyRate.toFixed(2)}%`,
          desc: `Con ${sent.toLocaleString()} emails enviados, solo ${replies} respuestas. Considera personalizar más el mensaje o cambiar el CTA.`,
          action: 'Ver Campañas',
          actionFn: "showP('inst', document.querySelector('.ni[onclick*=\\'inst\\']'))",
          ts: Date.now(),
        });
      }
    }
  }

  /* ─────────────────────────────────────────
     5. LinkedIn — Sin datos conectados
  ───────────────────────────────────────── */
  if (CFG.liId) {
    const liKpis = document.getElementById('li-kpis');
    if (liKpis && liKpis.innerHTML.includes('not connected')) {
      alerts.push({
        id: 'linkedin_not_loading',
        severity: 'warning',
        module: 'li',
        moduleLabel: 'LinkedIn',
        title: 'LinkedIn no está cargando datos',
        desc: 'LinkedIn está configurado pero no se están recibiendo métricas. El token OAuth puede haber expirado — prueba a reconectar desde Settings.',
        action: 'Ver Settings',
        actionFn: "showP('settings', document.querySelector('.ni[onclick*=\\'settings\\']'))",
        ts: Date.now(),
      });
    }
  }

  /* ─────────────────────────────────────────
     6. Sin conversiones configuradas (GA4)
  ───────────────────────────────────────── */
  const gscEl = document.getElementById('gsc-kpis');
  const convEl = document.getElementById('ga4-fn');
  if (convEl) {
    const convText = convEl.textContent || '';
    if (convText.includes('2.1%') || convText.includes('0 Form')) {
      alerts.push({
        id: 'ga4_no_conversions',
        severity: 'info',
        module: 'ga4',
        moduleLabel: 'Google Analytics',
        title: 'Conversiones sin tracking real',
        desc: 'El funnel de GA4 usa estimaciones por defecto. Configurar eventos reales (form_submit, reserva_sesion) daría datos exactos de conversión y permitiría optimizar campañas de Ads.',
        action: 'Ver Analytics',
        actionFn: "showP('ga4', document.querySelector('.ni[onclick*=\\'ga4\\']'))",
        ts: Date.now(),
      });
    }
  }

  /* ─────────────────────────────────────────
     7. Señal positiva — todo bien esta semana
  ───────────────────────────────────────── */
  const critAndWarn = alerts.filter(a => a.severity === 'critical' || a.severity === 'warning');
  if (critAndWarn.length === 0 && sessions) {
    const delta = parseDelta(sessions.delta);
    if (delta >= 10) {
      alerts.push({
        id: 'ga4_sessions_up',
        severity: 'ok',
        module: 'ov',
        moduleLabel: 'Overview',
        title: `Tráfico al alza esta semana (+${delta.toFixed(0)}%)`,
        desc: `Las sesiones han subido un ${delta.toFixed(0)}% respecto al período anterior. Buen momento para revisar qué canal está tirando y amplificar esa acción.`,
        action: 'Ver Overview',
        actionFn: "showP('ov', document.querySelector('.ni[onclick*=\\'ov\\']'))",
        ts: Date.now(),
      });
    }
  }

  return alerts;
}

/* ══════════════════════════════════════════════════════════════
   ANÁLISIS IA — Claude resume y prioriza todas las alertas
══════════════════════════════════════════════════════════════ */

async function amRunAIAnalysis() {
  if (!CFG.ak || AM_AI_RUNNING) return;
  if (AM_ALERTS.filter(a => a.severity !== 'ok').length === 0) return;

  AM_AI_RUNNING = true;
  amSetAIBtn(true);

  const ctx = {
    periodo: `${sD()} → ${eD()} (${DAYS} días)`,
    alertas: AM_ALERTS.map(a => ({
      severidad: a.severity,
      modulo: a.moduleLabel,
      titulo: a.title,
      descripcion: a.desc,
    })),
    canalesConectados: Object.keys({
      ga4: CFG.ga4,
      linkedin: CFG.liId,
      email: CFG.instantly,
      crm: CFG.monday,
      instagram: CFG.metatoken,
    }).filter(k => !!{ga4:CFG.ga4,linkedin:CFG.liId,email:CFG.instantly,crm:CFG.monday,instagram:CFG.metatoken}[k]),
  };

  const prompt = `Eres el analista de marketing de Próximo Rol (coaching de entrevistas para profesionales hispanohablantes).

Aquí están las alertas detectadas automáticamente en el dashboard para el período ${ctx.periodo}:

${ctx.alertas.map((a, i) => `${i+1}. [${a.severidad.toUpperCase()}] ${a.titulo} (${a.modulo})\n   ${a.descripcion}`).join('\n\n')}

Canales conectados: ${ctx.canalesConectados.join(', ')}

Escribe un diagnóstico ejecutivo breve (máximo 120 palabras) con:
1. Lo más urgente a atender HOY
2. Una acción concreta y específica para Próximo Rol

Sé directo. Sin introducción. Sin bullet points — usa párrafos cortos. En español.`;

  try {
    const data = await antFetch({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
    if (text) amRenderAISummary(text);

    /* ── Guardar diagnóstico de alertas en memoria ── */
    if (text && typeof memAddInsight === 'function') {
      const summary = text.replace(/\n+/g, ' ').trim().slice(0, 160);
      const mem2 = typeof memLoad === 'function' ? memLoad() : { insights: [] };
      if (typeof memIsDuplicate !== 'function' || !memIsDuplicate(summary, mem2.insights)) {
        memAddInsight(summary, 'alert', true, 4, 'high');
      }
    }
  } catch (err) {
    console.warn('Alert AI analysis failed:', err.message);
  } finally {
    AM_AI_RUNNING = false;
    amSetAIBtn(false);
  }
}

/* ══════════════════════════════════════════════════════════════
   MOTOR — Orquesta checks y actualiza UI
══════════════════════════════════════════════════════════════ */

function amRun() {
  /* Espera a que el DOM tenga datos — si no hay KPIs cargados, reintenta */
  const hasData = document.querySelector('#ga4-kpis .kpi') || (typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length > 0);
  if (!hasData) {
    setTimeout(amRun, 3000);
    return;
  }

  AM_ALERTS = amRunRules();
  AM_LAST_RUN = new Date();

  amUpdateBadge();
  amRenderList();

  /* Análisis IA — solo bajo demanda, nunca automático */
  /* Para activar: pulsa "✦ Analizar con IA" en el panel de alertas */
}

/* Engancha a loadAll — se ejecuta 5 s después de cada refresh */
const _origLoadAll = typeof loadAll === 'function' ? loadAll : null;
function amHookLoadAll() {
  if (typeof loadAll !== 'function') return;
  const original = loadAll;
  window.loadAll = function() {
    original.apply(this, arguments);
    setTimeout(amRun, 5000);
  };
}

/* ══════════════════════════════════════════════════════════════
   UI — Badge, panel, lista de alertas
══════════════════════════════════════════════════════════════ */

function amUpdateBadge() {
  const active  = AM_ALERTS.filter(a => !AM_DISMISSED.has(a.id));
  const urgent  = active.filter(a => a.severity === 'critical' || a.severity === 'warning');
  const badge   = document.getElementById('am-badge');
  const bellBtn = document.getElementById('am-bell-btn');

  if (!badge || !bellBtn) return;

  if (urgent.length > 0) {
    badge.textContent = urgent.length;
    badge.style.display = 'flex';
    bellBtn.classList.toggle('am-bell-critical', urgent.some(a => a.severity === 'critical'));
  } else {
    badge.style.display = 'none';
    bellBtn.classList.remove('am-bell-critical');
  }
}

function amTogglePanel() {
  AM_PANEL_OPEN = !AM_PANEL_OPEN;
  const panel = document.getElementById('am-panel');
  if (!panel) return;
  panel.classList.toggle('am-panel-open', AM_PANEL_OPEN);
  if (AM_PANEL_OPEN) amRenderList();
}

function amDismiss(id) {
  AM_DISMISSED.add(id);
  localStorage.setItem('pr_dismissed_alerts', JSON.stringify([...AM_DISMISSED]));
  amUpdateBadge();
  amRenderList();
}

function amDismissAll() {
  AM_ALERTS.forEach(a => AM_DISMISSED.add(a.id));
  localStorage.setItem('pr_dismissed_alerts', JSON.stringify([...AM_DISMISSED]));
  amUpdateBadge();
  amRenderList();
}

function amClearDismissed() {
  AM_DISMISSED.clear();
  localStorage.setItem('pr_dismissed_alerts', '[]');
  amUpdateBadge();
  amRenderList();
}

function amSetAIBtn(loading) {
  const btn = document.getElementById('am-ai-btn');
  if (!btn) return;
  btn.disabled  = loading;
  btn.innerHTML = loading
    ? `<span class="am-spin">⟳</span> Analizando…`
    : `✦ Analizar con IA`;
}

function amRenderAISummary(text) {
  const el = document.getElementById('am-ai-summary');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:7px;margin-bottom:8px">
      <span style="font-size:13px">✦</span>
      <span style="font-size:11px;font-weight:600;color:var(--purple);text-transform:uppercase;letter-spacing:.05em">Diagnóstico IA</span>
    </div>
    <div style="font-size:12px;color:var(--tx);line-height:1.65">${text.replace(/\n/g,'<br>')}</div>`;
}

function amRenderList() {
  const el = document.getElementById('am-list');
  if (!el) return;

  const active = AM_ALERTS.filter(a => !AM_DISMISSED.has(a.id));

  if (active.length === 0) {
    el.innerHTML = `
      <div style="text-align:center;padding:2rem 1rem;color:var(--mt)">
        <div style="font-size:28px;margin-bottom:.5rem">✅</div>
        <div style="font-size:13px;font-weight:500">Todo en orden</div>
        <div style="font-size:11px;margin-top:4px;color:var(--ht)">No hay alertas activas ahora mismo</div>
        ${AM_DISMISSED.size > 0 ? `<button onclick="amClearDismissed()" style="margin-top:12px;padding:5px 12px;border:1px solid var(--bd2);border-radius:20px;background:none;color:var(--ht);font-size:11px;cursor:pointer;font-family:inherit">Restaurar ${AM_DISMISSED.size} descartadas</button>` : ''}
      </div>`;
    return;
  }

  /* Ordenar: critical → warning → info → ok */
  const order = { critical: 0, warning: 1, info: 2, ok: 3 };
  const sorted = [...active].sort((a, b) => (order[a.severity] || 4) - (order[b.severity] || 4));

  el.innerHTML = sorted.map(alert => {
    const s = SEV[alert.severity] || SEV.info;
    return `
      <div class="am-alert-item" style="border-left:3px solid ${s.color}">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:5px">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span class="am-severity-badge" style="background:${s.bg};color:${s.color};border-color:${s.border}">${s.icon} ${s.label}</span>
            <span style="font-size:10px;color:var(--ht);background:var(--sf2);padding:2px 7px;border-radius:10px">${alert.moduleLabel}</span>
          </div>
          <button onclick="amDismiss('${alert.id}')" class="am-dismiss-btn" title="Descartar">✕</button>
        </div>
        <div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:4px">${alert.title}</div>
        <div style="font-size:11px;color:var(--mt);line-height:1.55;margin-bottom:8px">${alert.desc}</div>
        <button onclick="${alert.actionFn};amTogglePanel()" class="am-action-btn">${alert.action} →</button>
      </div>`;
  }).join('');

  /* Footer con timestamp y dismiss all */
  const lastRun = AM_LAST_RUN
    ? `Última comprobación: ${AM_LAST_RUN.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`
    : '';

  document.getElementById('am-footer').innerHTML = `
    <span style="font-size:10px;color:var(--ht)">${lastRun}</span>
    <div style="display:flex;gap:6px">
      <button onclick="amRun()" class="am-footer-btn">↺ Refrescar</button>
      ${active.length > 1 ? `<button onclick="amDismissAll()" class="am-footer-btn">Descartar todas</button>` : ''}
    </div>`;
}

/* ══════════════════════════════════════════════════════════════
   INIT — Inyecta estilos, HTML del panel y engancha a loadAll
══════════════════════════════════════════════════════════════ */

(function amInit() {
  /* CSS */
  const style = document.createElement('style');
  style.textContent = `
    /* Bell button */
    #am-bell-btn {
      position:relative;width:34px;height:34px;border-radius:var(--r);
      border:1px solid var(--bd2);background:var(--sf2);color:var(--mt);
      cursor:pointer;display:flex;align-items:center;justify-content:center;
      transition:all .15s;flex-shrink:0;
    }
    #am-bell-btn:hover { border-color:var(--green);color:var(--green);background:var(--gp); }
    #am-bell-btn.am-bell-critical { border-color:#FECACA;color:var(--red);background:var(--rp);animation:am-shake .4s ease; }
    @keyframes am-shake {
      0%,100%{transform:translateX(0)}
      20%{transform:translateX(-3px)}
      40%{transform:translateX(3px)}
      60%{transform:translateX(-2px)}
      80%{transform:translateX(2px)}
    }

    /* Badge */
    #am-badge {
      position:absolute;top:-5px;right:-5px;
      min-width:16px;height:16px;
      background:var(--red);color:white;
      border-radius:10px;border:2px solid var(--bg);
      font-size:9px;font-weight:700;
      align-items:center;justify-content:center;
      padding:0 3px;line-height:1;
    }

    /* Panel */
    #am-panel {
      position:fixed;top:52px;right:0;z-index:9996;
      width:360px;max-height:calc(100vh - 72px);
      background:var(--bg);border-left:1px solid var(--bd2);
      border-bottom:1px solid var(--bd2);border-bottom-left-radius:var(--rl);
      display:flex;flex-direction:column;overflow:hidden;
      transform:translateX(100%);
      transition:transform .22s cubic-bezier(.4,0,.2,1);
      box-shadow:-4px 4px 24px rgba(0,0,0,.1);
    }
    #am-panel.am-panel-open { transform:translateX(0); }

    /* Panel header */
    .am-panel-header {
      display:flex;align-items:center;gap:10px;padding:12px 14px;
      background:var(--sf);border-bottom:1px solid var(--bd);flex-shrink:0;
    }
    .am-panel-title { font-size:13px;font-weight:600;flex:1;color:var(--tx); }

    /* AI summary box */
    #am-ai-summary {
      display:none;margin:10px 14px 0;
      background:var(--pp);border:1px solid #DDD6FE;border-radius:var(--r);
      padding:11px 13px;flex-shrink:0;
    }

    /* AI button */
    #am-ai-btn {
      margin:10px 14px;padding:7px 14px;
      background:var(--pp);color:var(--purple);
      border:1px solid #DDD6FE;border-radius:var(--r);
      font-size:12px;font-weight:500;cursor:pointer;
      display:flex;align-items:center;justify-content:center;gap:6px;
      font-family:'DM Sans',sans-serif;transition:all .15s;flex-shrink:0;
    }
    #am-ai-btn:hover:not(:disabled) { background:#EDE9FE; }
    #am-ai-btn:disabled { opacity:.6;cursor:not-allowed; }
    .am-spin { display:inline-block;animation:am-rotate .8s linear infinite; }
    @keyframes am-rotate { to { transform:rotate(360deg); } }

    /* Alert list */
    #am-list { flex:1;overflow-y:auto;padding:10px 14px; }
    #am-list::-webkit-scrollbar { width:4px; }
    #am-list::-webkit-scrollbar-thumb { background:var(--bd2);border-radius:2px; }

    .am-alert-item {
      background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);
      padding:11px 13px;margin-bottom:8px;
      border-top-left-radius:0;border-bottom-left-radius:0;
    }
    .am-severity-badge {
      font-size:10px;padding:2px 7px;border-radius:20px;
      font-weight:600;border:1px solid;
    }
    .am-dismiss-btn {
      background:none;border:none;color:var(--ht);cursor:pointer;
      font-size:12px;padding:2px 4px;border-radius:4px;line-height:1;flex-shrink:0;
      transition:color .12s;
    }
    .am-dismiss-btn:hover { color:var(--red); }
    .am-action-btn {
      padding:4px 11px;background:var(--sf2);
      border:1px solid var(--bd2);border-radius:20px;
      font-size:11px;font-weight:500;color:var(--mt);
      cursor:pointer;font-family:'DM Sans',sans-serif;
      transition:all .12s;
    }
    .am-action-btn:hover { border-color:var(--green);color:var(--green);background:var(--gp); }

    /* Footer */
    #am-footer {
      display:flex;align-items:center;justify-content:space-between;
      padding:10px 14px;border-top:1px solid var(--bd);
      background:var(--sf);flex-shrink:0;
    }
    .am-footer-btn {
      padding:4px 10px;background:none;border:1px solid var(--bd2);border-radius:20px;
      font-size:10px;color:var(--ht);cursor:pointer;font-family:'DM Sans',sans-serif;
      transition:all .12s;
    }
    .am-footer-btn:hover { color:var(--tx);border-color:var(--mt); }
  `;
  document.head.appendChild(style);

  /* Renderiza el botón y el panel una vez el DOM está listo */
  function amInjectUI() {
    /* Bell button → va en el topbar .tpr antes del botón Refresh */
    const topbarRight = document.querySelector('.tpr');
    if (topbarRight) {
      const bellWrap = document.createElement('div');
      bellWrap.style.position = 'relative';
      bellWrap.innerHTML = `
        <button id="am-bell-btn" onclick="amTogglePanel()" title="Alertas del dashboard">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span id="am-badge" style="display:none"></span>
        </button>`;
      /* Insertar antes del primer hijo (dps) */
      topbarRight.insertBefore(bellWrap, topbarRight.firstChild);
    }

    /* Alert panel → añadir al #app como sibling del topbar */
    const app = document.getElementById('app');
    if (app) {
      const panel = document.createElement('div');
      panel.id = 'am-panel';
      panel.innerHTML = `
        <div class="am-panel-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color:var(--amber)">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span class="am-panel-title">Alert Monitor</span>
          <button id="am-ai-btn" onclick="amRunAIAnalysis()">✦ Analizar con IA</button>
          <button class="am-dismiss-btn" onclick="amTogglePanel()" title="Cerrar" style="font-size:14px;margin-left:4px">✕</button>
        </div>
        <div id="am-ai-summary"></div>
        <div id="am-list"><div style="padding:2rem;text-align:center;color:var(--ht);font-size:12px">Ejecutando checks…</div></div>
        <div id="am-footer"></div>`;
      app.appendChild(panel);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', amInjectUI);
  } else {
    setTimeout(amInjectUI, 0);
  }

  /* Hook a loadAll — espera a que core.js lo defina */
  function tryHook(attempts) {
    if (typeof loadAll === 'function') {
      amHookLoadAll();
    } else if (attempts < 20) {
      setTimeout(() => tryHook(attempts + 1), 300);
    }
  }
  setTimeout(() => tryHook(0), 500);

  /* Primera ejecución tras el lanzamiento del dashboard */
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(amRun, 7000); // Da tiempo a que loadAll() cargue los datos
  });
})();
