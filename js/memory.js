/* ═══════════════════════════════════════════════════════════════════
   MEMORY ENGINE — Sistema de aprendizaje y memoria del Co-pilot
   Persiste en localStorage. Aprende de cada conversación.
   Se inyecta en el system prompt para hacer al co-pilot más preciso.
   ═══════════════════════════════════════════════════════════════════ */

const MEM_KEY     = 'pr_copilot_memory_v2';
const MEM_MAX_INS = 60;   // máx insights guardados

/* ══════════════════════════════════════════
   ESTRUCTURA DE MEMORIA
══════════════════════════════════════════ */
function memDefault() {
  return {
    version    : 2,
    createdAt  : Date.now(),
    updatedAt  : Date.now(),
    totalChats : 0,

    /* Perfil del negocio — crece con el tiempo */
    businessProfile: {
      monthlyRevenueGoal : null,   // €/mes objetivo
      monthlyClientGoal  : null,   // clientes/mes objetivo
      avgTicket          : 97,     // € por cliente (empieza en sesión única)
      currentMRR         : null,   // MRR actual conocido
      bestChannel        : null,   // qué canal convierte mejor (aprendido)
      mainBottleneck     : null,   // cuello de botella principal actual
      targetAudience     : 'Profesionales mid-senior España/LATAM en proceso de búsqueda de empleo',
      mainChallenge      : 'Tráfico casi 100% branded. Poco awareness non-branded.',
      lastReview         : null,   // fecha último review estratégico
    },

    /* Recomendaciones con seguimiento de estado */
    recommendations: {
      pending    : [],   // Propuestas, sin actuar todavía
      inProgress : [],   // En marcha
      done       : [],   // Completadas
      skipped    : [],   // Descartadas conscientemente
      failed     : [],   // Intentadas, no funcionaron
    },

    /* Experimentos — lo que se ha probado */
    experiments: [],
    // { id, date, channel, action, hypothesis, result, impact, notes }

    /* Calibración — lo que funciona para este negocio específico */
    calibration: {
      workingKeywords      : [],   // Keywords que han generado tráfico/leads
      workingContentFormats: [],   // Tipos de contenido con mejor engagement
      channelConversion    : {},   // { linkedin: 0.023, email: 0.041 }
      avgCAC               : null, // CAC aprendido con el tiempo
      bestConversionTime   : null, // Cuándo convierte mejor (temporada/día)
      audienceInsights     : [],   // Insights sobre el cliente ideal
    },

    /* Historial de objetivos mensuales */
    goalsHistory: [],
    // { month, year, targets: {clients, revenue, leads}, actuals: {...}, delta: {...} }

    /* Insights automáticos extraídos de conversaciones */
    insights: [],
    // { id, date, category, text, actionable, status, source }
  };
}

/* ══════════════════════════════════════════
   PERSISTENCIA
══════════════════════════════════════════ */
function memLoad() {
  try {
    const raw = localStorage.getItem(MEM_KEY);
    if (!raw) return memDefault();
    const data = JSON.parse(raw);
    /* Merge con defaults para no perder nuevas propiedades */
    const def = memDefault();
    return {
      ...def,
      ...data,
      businessProfile : { ...def.businessProfile, ...(data.businessProfile || {}) },
      calibration     : { ...def.calibration,     ...(data.calibration     || {}) },
      recommendations : { ...def.recommendations, ...(data.recommendations || {}) },
    };
  } catch (_) { return memDefault(); }
}

function memSave(mem) {
  mem.updatedAt = Date.now();
  try { localStorage.setItem(MEM_KEY, JSON.stringify(mem)); } catch (_) {}
}

/* ══════════════════════════════════════════
   OPERACIONES DE MEMORIA
══════════════════════════════════════════ */

/** Añadir insight al historial (auto-extraído o manual) */
function memAddInsight(text, category = 'general', actionable = true) {
  const mem = memLoad();
  const insight = {
    id         : 'ins_' + Date.now(),
    date       : new Date().toISOString().slice(0, 10),
    category,
    text,
    actionable,
    status     : actionable ? 'pending' : 'noted',
    source     : 'auto',
  };
  mem.insights.unshift(insight);
  if (mem.insights.length > MEM_MAX_INS) mem.insights = mem.insights.slice(0, MEM_MAX_INS);
  memSave(mem);
  return insight;
}

/** Añadir una recomendación rastreable */
function memAddRecommendation(rec) {
  const mem = memLoad();
  const r = {
    id        : 'rec_' + Date.now(),
    date      : new Date().toISOString().slice(0, 10),
    category  : rec.category || 'general',
    text      : rec.text,
    channel   : rec.channel || null,
    priority  : rec.priority || 'medium',
    status    : 'pending',
    outcome   : null,
    impact    : null,
    addedFrom : 'copilot',
  };
  mem.recommendations.pending.push(r);
  memSave(mem);
  return r.id;
}

/** Actualizar estado de una recomendación */
function memUpdateRec(id, newStatus, outcome = null, impact = null) {
  const mem = memLoad();
  const allBuckets = ['pending', 'inProgress', 'done', 'skipped', 'failed'];

  let found = null;
  for (const bucket of allBuckets) {
    const idx = mem.recommendations[bucket].findIndex(r => r.id === id);
    if (idx !== -1) {
      found = mem.recommendations[bucket].splice(idx, 1)[0];
      break;
    }
  }

  if (found) {
    found.status  = newStatus;
    found.outcome = outcome;
    found.impact  = impact;
    found.updatedAt = new Date().toISOString().slice(0, 10);

    const targetBucket = ['pending','inProgress','done','skipped','failed'].includes(newStatus)
      ? newStatus : 'done';
    mem.recommendations[targetBucket].push(found);

    /* Si fue exitosa, calibrar */
    if (newStatus === 'done' && impact === 'positive') {
      if (found.channel) {
        mem.calibration.channelConversion[found.channel] = (
          mem.calibration.channelConversion[found.channel] || 0.02
        ) * 1.1; /* Small positive update */
      }
    }
  }

  memSave(mem);
}

/** Añadir experimento (acción + hipótesis + resultado) */
function memAddExperiment(exp) {
  const mem = memLoad();
  const e = {
    id         : 'exp_' + Date.now(),
    date       : new Date().toISOString().slice(0, 10),
    channel    : exp.channel,
    action     : exp.action,
    hypothesis : exp.hypothesis,
    result     : exp.result || null,
    impact     : exp.impact || null, // 'positive' | 'negative' | 'neutral'
    notes      : exp.notes || '',
  };
  mem.experiments.unshift(e);
  if (mem.experiments.length > 30) mem.experiments = mem.experiments.slice(0, 30);
  memSave(mem);
  return e.id;
}

/** Actualizar el perfil de negocio */
function memUpdateProfile(updates) {
  const mem = memLoad();
  mem.businessProfile = { ...mem.businessProfile, ...updates };
  memSave(mem);
}

/** Añadir objetivo mensual */
function memSetGoals(month, year, targets) {
  const mem = memLoad();
  const existing = mem.goalsHistory.findIndex(g => g.month === month && g.year === year);
  if (existing !== -1) {
    mem.goalsHistory[existing].targets = targets;
  } else {
    mem.goalsHistory.push({ month, year, targets, actuals: null });
  }
  mem.goalsHistory = mem.goalsHistory.slice(-24); // últimos 24 meses
  memSave(mem);
}

/** Actualizar actuals de un mes */
function memSetActuals(month, year, actuals) {
  const mem = memLoad();
  const existing = mem.goalsHistory.findIndex(g => g.month === month && g.year === year);
  if (existing !== -1) {
    mem.goalsHistory[existing].actuals = actuals;
    if (mem.goalsHistory[existing].targets) {
      const t = mem.goalsHistory[existing].targets;
      mem.goalsHistory[existing].delta = {
        clients : (actuals.clients || 0) - (t.clients || 0),
        revenue : (actuals.revenue || 0) - (t.revenue || 0),
        leads   : (actuals.leads   || 0) - (t.leads   || 0),
      };
    }
  }
  memSave(mem);
}

/* ══════════════════════════════════════════
   AUTO-EXTRACCIÓN DE INSIGHTS (Claude Haiku)
   Se llama silenciosamente tras cada respuesta
══════════════════════════════════════════ */

let _memExtractTimer = null;

async function memAutoExtract(userMsg, assistantMsg) {
  if (!CFG.ak) return;

  /* Solo extraer si la conversación fue sustancial */
  if (assistantMsg.length < 100) return;

  /* Rate limiting — espera 2s desde la última extracción */
  clearTimeout(_memExtractTimer);
  _memExtractTimer = setTimeout(async () => {
    try {
      const prompt = `Analiza este intercambio de marketing y extrae SOLO si hay algo concreto y accionable.

USUARIO: ${userMsg.slice(0, 300)}
ASISTENTE: ${assistantMsg.slice(0, 600)}

Responde SOLO en JSON válido (sin markdown) con esta estructura:
{
  "insights": [
    {"category": "seo|content|linkedin|email|pipeline|budget|strategy|audience", "text": "insight concreto en 1 frase", "actionable": true}
  ],
  "recommendations": [
    {"category": "string", "channel": "string|null", "text": "recomendación específica en 1 frase", "priority": "high|medium|low"}
  ]
}

Máximo 2 insights y 1 recomendación. Si no hay nada concreto y accionable, devuelve {"insights":[],"recommendations":[]}.`;

      const data = await antFetch({
        model      : 'claude-haiku-4-5-20251001',
        max_tokens : 300,
        messages   : [{ role: 'user', content: prompt }],
      });

      const raw  = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
      const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());

      (parsed.insights || []).forEach(ins =>
        memAddInsight(ins.text, ins.category, ins.actionable)
      );
      (parsed.recommendations || []).forEach(rec => memAddRecommendation(rec));

      /* Actualizar panel de memoria si está abierto */
      if (document.getElementById('mem-panel')?.classList.contains('mem-open')) {
        memRenderPanel();
      }

    } catch (_) { /* silencioso — no interrumpe al usuario */ }
  }, 2000);
}

/* ══════════════════════════════════════════
   RESUMEN COMPACTO PARA SYSTEM PROMPT
   Máx ~400 tokens para no gastar contexto
══════════════════════════════════════════ */

function memBuildSummary() {
  const mem = memLoad();

  const lines = [];

  /* Perfil */
  const bp = mem.businessProfile;
  if (bp.monthlyClientGoal)  lines.push(`Objetivo: ${bp.monthlyClientGoal} clientes/mes a €${bp.avgTicket || 97}/ticket`);
  if (bp.currentMRR)         lines.push(`MRR actual conocido: €${bp.currentMRR}`);
  if (bp.bestChannel)        lines.push(`Canal con mejor conversión hasta ahora: ${bp.bestChannel}`);
  if (bp.mainBottleneck)     lines.push(`Cuello de botella principal: ${bp.mainBottleneck}`);
  if (bp.mainChallenge)      lines.push(`Reto conocido: ${bp.mainChallenge}`);

  /* Calibración */
  const cal = mem.calibration;
  if (cal.workingKeywords.length)       lines.push(`Keywords que han generado tráfico: ${cal.workingKeywords.slice(0, 5).join(', ')}`);
  if (cal.workingContentFormats.length) lines.push(`Formatos de contenido que funcionan: ${cal.workingContentFormats.slice(0, 3).join(', ')}`);
  if (Object.keys(cal.channelConversion).length) {
    const ccs = Object.entries(cal.channelConversion)
      .map(([k, v]) => `${k}: ${(v * 100).toFixed(1)}%`).join(', ');
    lines.push(`Tasas de conversión aprendidas: ${ccs}`);
  }
  if (cal.avgCAC) lines.push(`CAC promedio observado: €${cal.avgCAC}`);

  /* Recomendaciones pendientes (top 3) */
  const pending = mem.recommendations.pending.slice(0, 3);
  if (pending.length) {
    lines.push(`Recomendaciones pendientes de implementar: ${pending.map(r => r.text).join(' | ')}`);
  }

  /* Lo que no funcionó */
  const failed = mem.recommendations.failed.slice(0, 3);
  if (failed.length) {
    lines.push(`Intentos que NO funcionaron (no repetir): ${failed.map(r => `${r.text} (${r.outcome || 'sin resultado'})`).join(' | ')}`);
  }

  /* Experimentos recientes */
  const exps = mem.experiments.filter(e => e.impact).slice(0, 4);
  if (exps.length) {
    lines.push(`Experimentos recientes: ${exps.map(e => `[${e.impact}] ${e.action} en ${e.channel}`).join(' | ')}`);
  }

  /* Historial de objetivos */
  const lastGoal = mem.goalsHistory.slice(-2);
  if (lastGoal.length) {
    lastGoal.forEach(g => {
      if (g.actuals) {
        lines.push(`${g.month}/${g.year}: objetivo ${g.targets?.clients || '?'} clientes → real ${g.actuals.clients || '?'} clientes (${g.delta?.clients >= 0 ? '+' : ''}${g.delta?.clients || 0})`);
      }
    });
  }

  /* Insights recientes (top 5, solo los accionables) */
  const recentIns = mem.insights.filter(i => i.actionable).slice(0, 5);
  if (recentIns.length) {
    lines.push(`Aprendizajes recientes de conversaciones: ${recentIns.map(i => i.text).join(' | ')}`);
  }

  if (lines.length === 0) return null;

  return `## MEMORIA DEL NEGOCIO (${mem.totalChats} conversaciones previas)\n${lines.map(l => `- ${l}`).join('\n')}`;
}

function memIncrementChats() {
  const mem = memLoad();
  mem.totalChats++;
  memSave(mem);
}

/* ══════════════════════════════════════════
   UI — Panel de memoria
══════════════════════════════════════════ */

function memTogglePanel() {
  const panel = document.getElementById('mem-panel');
  if (!panel) return;
  const isOpen = panel.classList.toggle('mem-open');
  if (isOpen) memRenderPanel();
}

function memRenderPanel() {
  const el = document.getElementById('mem-body');
  if (!el) return;
  const mem = memLoad();
  const bp  = mem.businessProfile;

  /* ── Perfil ── */
  let html = `<div class="mem-section-title">Perfil del negocio</div>`;
  html += `
    <div class="mem-profile-grid">
      <div class="mem-profile-item" onclick="memEditField('monthlyClientGoal','Clientes/mes objetivo','number')">
        <div class="mem-profile-label">Objetivo clientes/mes</div>
        <div class="mem-profile-val">${bp.monthlyClientGoal ? bp.monthlyClientGoal + ' clientes' : '<span style="color:var(--ht)">No definido</span>'}</div>
      </div>
      <div class="mem-profile-item" onclick="memEditField('monthlyRevenueGoal','Revenue objetivo/mes (€)','number')">
        <div class="mem-profile-label">Revenue objetivo/mes</div>
        <div class="mem-profile-val">${bp.monthlyRevenueGoal ? '€' + bp.monthlyRevenueGoal : '<span style="color:var(--ht)">No definido</span>'}</div>
      </div>
      <div class="mem-profile-item" onclick="memEditField('currentMRR','MRR actual (€)','number')">
        <div class="mem-profile-label">MRR actual</div>
        <div class="mem-profile-val">${bp.currentMRR ? '€' + bp.currentMRR : '<span style="color:var(--ht)">No definido</span>'}</div>
      </div>
      <div class="mem-profile-item" onclick="memEditField('avgTicket','Ticket medio (€)','number')">
        <div class="mem-profile-label">Ticket medio</div>
        <div class="mem-profile-val">€${bp.avgTicket || 97}</div>
      </div>
    </div>`;

  if (bp.mainBottleneck) {
    html += `<div style="margin-top:8px;padding:8px 10px;background:var(--ap);border-radius:var(--r);font-size:11px;color:var(--amber)">⚠ Cuello de botella: <strong>${bp.mainBottleneck}</strong></div>`;
  }

  /* ── Recomendaciones ── */
  const pending = mem.recommendations.pending;
  const done    = mem.recommendations.done.slice(-5);
  const failed  = mem.recommendations.failed.slice(-3);

  html += `<div class="mem-section-title" style="margin-top:14px">Recomendaciones (${pending.length} pendientes)</div>`;

  if (pending.length === 0) {
    html += `<div style="font-size:11px;color:var(--ht);padding:6px 0">Sin recomendaciones pendientes.</div>`;
  } else {
    html += pending.map(r => `
      <div class="mem-rec-item">
        <div style="display:flex;gap:6px;align-items:flex-start">
          <span class="mem-priority mem-p-${r.priority}">${r.priority}</span>
          <div style="flex:1">
            <div style="font-size:12px;color:var(--tx)">${r.text}</div>
            <div style="font-size:10px;color:var(--ht);margin-top:2px">${r.category} · ${r.date}</div>
          </div>
        </div>
        <div style="display:flex;gap:4px;margin-top:7px;flex-wrap:wrap">
          <button class="mem-rec-btn mem-btn-done" onclick="memUpdateRec('${r.id}','done',null,'positive');memRenderPanel()">✓ Hecho</button>
          <button class="mem-rec-btn mem-btn-progress" onclick="memUpdateRec('${r.id}','inProgress');memRenderPanel()">⟳ En marcha</button>
          <button class="mem-rec-btn mem-btn-skip" onclick="memUpdateRec('${r.id}','skipped');memRenderPanel()">✕ Omitir</button>
          <button class="mem-rec-btn mem-btn-fail" onclick="memUpdateRec('${r.id}','failed','probado sin resultado','negative');memRenderPanel()">✗ Falló</button>
        </div>
      </div>`).join('');
  }

  if (done.length > 0) {
    html += `<div style="font-size:10px;color:var(--green);margin-top:10px;font-weight:600">✅ Completadas recientemente</div>`;
    html += done.map(r => `<div style="font-size:11px;color:var(--mt);padding:3px 0;border-bottom:1px solid var(--bd)">${r.text}</div>`).join('');
  }
  if (failed.length > 0) {
    html += `<div style="font-size:10px;color:var(--red);margin-top:10px;font-weight:600">✗ No funcionó</div>`;
    html += failed.map(r => `<div style="font-size:11px;color:var(--mt);padding:3px 0;border-bottom:1px solid var(--bd)">${r.text} <span style="color:var(--ht)">${r.outcome ? '— ' + r.outcome : ''}</span></div>`).join('');
  }

  /* ── Insights ── */
  const insights = mem.insights.slice(0, 12);
  html += `<div class="mem-section-title" style="margin-top:14px">Aprendizajes (${mem.insights.length} total)</div>`;
  if (insights.length === 0) {
    html += `<div style="font-size:11px;color:var(--ht);padding:6px 0">El co-pilot irá guardando aprendizajes de vuestras conversaciones automáticamente.</div>`;
  } else {
    html += insights.map(i => `
      <div style="display:flex;gap:6px;padding:5px 0;border-bottom:1px solid var(--bd);align-items:flex-start">
        <span style="font-size:9px;padding:2px 6px;border-radius:8px;background:var(--sf2);color:var(--ht);flex-shrink:0;margin-top:1px">${i.category}</span>
        <div style="flex:1;font-size:11px;color:var(--tx);line-height:1.5">${i.text}</div>
        <span style="font-size:9px;color:var(--ht);flex-shrink:0">${i.date}</span>
      </div>`).join('');
  }

  /* ── Calibración ── */
  const cal = mem.calibration;
  if (cal.workingKeywords.length || cal.workingContentFormats.length) {
    html += `<div class="mem-section-title" style="margin-top:14px">Calibración (lo que funciona)</div>`;
    if (cal.workingKeywords.length) {
      html += `<div style="font-size:11px;color:var(--mt);margin-bottom:4px"><strong>Keywords validadas:</strong> ${cal.workingKeywords.join(', ')}</div>`;
    }
    if (cal.workingContentFormats.length) {
      html += `<div style="font-size:11px;color:var(--mt)"><strong>Contenido que convierte:</strong> ${cal.workingContentFormats.join(', ')}</div>`;
    }
  }

  /* ── Reset ── */
  html += `
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:10px;color:var(--ht)">${mem.totalChats} conversaciones · actualizado ${new Date(mem.updatedAt).toLocaleDateString('es-ES')}</span>
      <button onclick="if(confirm('¿Borrar toda la memoria? No se puede deshacer.'))memReset()" style="font-size:10px;color:var(--red);background:none;border:none;cursor:pointer;padding:4px">Borrar memoria</button>
    </div>`;

  el.innerHTML = html;
}

function memReset() {
  localStorage.removeItem(MEM_KEY);
  memRenderPanel();
}

function memEditField(field, label, type = 'text') {
  const mem = memLoad();
  const current = mem.businessProfile[field];
  const val = prompt(`${label} (actual: ${current || 'no definido'})`, current || '');
  if (val === null) return;
  const parsed = type === 'number' ? (parseFloat(val) || null) : (val.trim() || null);
  memUpdateProfile({ [field]: parsed });
  memRenderPanel();
}

/* ══════════════════════════════════════════
   INIT — Estilos + panel HTML
══════════════════════════════════════════ */

(function memInit() {
  const style = document.createElement('style');
  style.textContent = `
    #mem-btn {
      width:28px;height:28px;border:none;background:none;cursor:pointer;
      border-radius:6px;display:flex;align-items:center;justify-content:center;
      color:var(--purple);font-size:13px;transition:background .12s;
    }
    #mem-btn:hover { background:var(--pp); }

    #mem-panel {
      position:fixed;top:52px;right:0;z-index:9995;
      width:320px;max-height:calc(100vh - 72px);
      background:var(--bg);border-left:1px solid var(--bd2);
      border-bottom:1px solid var(--bd2);border-bottom-left-radius:var(--rl);
      display:flex;flex-direction:column;overflow:hidden;
      transform:translateX(100%);
      transition:transform .22s cubic-bezier(.4,0,.2,1);
      box-shadow:-4px 4px 24px rgba(0,0,0,.1);
    }
    #mem-panel.mem-open { transform:translateX(0); }
    #mem-header {
      display:flex;align-items:center;gap:8px;padding:12px 14px;
      background:var(--sf);border-bottom:1px solid var(--bd);flex-shrink:0;
    }
    #mem-body { flex:1;overflow-y:auto;padding:14px; }
    #mem-body::-webkit-scrollbar { width:4px; }
    #mem-body::-webkit-scrollbar-thumb { background:var(--bd2);border-radius:2px; }

    .mem-section-title {
      font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;
      letter-spacing:.06em;margin-bottom:8px;
    }
    .mem-profile-grid {
      display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:4px;
    }
    .mem-profile-item {
      background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);
      padding:8px 10px;cursor:pointer;transition:border-color .12s;
    }
    .mem-profile-item:hover { border-color:var(--green); }
    .mem-profile-label { font-size:9px;color:var(--ht);text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px; }
    .mem-profile-val { font-size:13px;font-weight:600;color:var(--tx); }
    .mem-rec-item {
      background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);
      padding:9px 11px;margin-bottom:7px;
    }
    .mem-priority {
      font-size:9px;padding:2px 6px;border-radius:8px;font-weight:600;
      text-transform:uppercase;letter-spacing:.04em;flex-shrink:0;margin-top:2px;
    }
    .mem-p-high { background:var(--rp);color:var(--red); }
    .mem-p-medium { background:var(--ap);color:var(--amber); }
    .mem-p-low { background:var(--gp);color:var(--green); }
    .mem-rec-btn {
      padding:3px 9px;border-radius:20px;font-size:10px;font-weight:500;
      cursor:pointer;border:1px solid;font-family:'DM Sans',sans-serif;transition:all .12s;
    }
    .mem-btn-done     { background:var(--gp);color:var(--green);border-color:var(--green); }
    .mem-btn-progress { background:var(--bp);color:var(--blue);border-color:var(--blue); }
    .mem-btn-skip     { background:var(--sf2);color:var(--ht);border-color:var(--bd2); }
    .mem-btn-fail     { background:var(--rp);color:var(--red);border-color:#FECACA; }
  `;
  document.head.appendChild(style);

  function memInjectUI() {
    /* Botón ✦ en el header del copilot */
    const cpHeader = document.querySelector('.cp-header-actions');
    if (cpHeader) {
      const btn = document.createElement('button');
      btn.id = 'mem-btn';
      btn.title = 'Memoria del Co-pilot';
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/><path d="M12 6v6l4 2"/></svg>`;
      btn.onclick = memTogglePanel;
      cpHeader.insertBefore(btn, cpHeader.firstChild);
    }

    /* Panel */
    const app = document.getElementById('app');
    if (app) {
      const panel = document.createElement('div');
      panel.id = 'mem-panel';
      panel.innerHTML = `
        <div id="mem-header">
          <span style="font-size:14px">🧠</span>
          <span style="font-size:13px;font-weight:600;flex:1;color:var(--tx)">Memoria del Co-pilot</span>
          <button onclick="memTogglePanel()" style="background:none;border:none;cursor:pointer;color:var(--ht);font-size:14px;padding:2px 4px">✕</button>
        </div>
        <div id="mem-body"></div>`;
      app.appendChild(panel);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', memInjectUI);
  } else {
    setTimeout(memInjectUI, 500);
  }
})();
