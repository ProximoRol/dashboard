/* ═══════════════════════════════════════════════════════════════════
   EXPERIMENTS ENGINE — Rastreo riguroso de recomendaciones implementadas
   
   Propósito: Convertir "Copilot te dijo X" en "X funcionó con resultado Y"
   
   Diferencia con memory.js:
   - memory.js = guarda opiniones, insights, perfil del negocio
   - experiments.js = guarda DATOS de lo que pasó después
   
   Depende de: core.js (CFG, antFetch), memory.js (memAddInsight, memLoad, memSave)
   Carga DESPUÉS de memory.js en index.html
   ═══════════════════════════════════════════════════════════════════ */

const EXP_KEY      = 'pr_experiments_v1';
const EXP_DIGEST_KEY = 'pr_memory_digest_v1';
const EXP_MAX      = 100;

/* ── Baselines configurables por canal ── */
const EXP_BASELINES = {
  linkedin:  { engagementRate: 1.8, conversionRate: 0.05 },
  email:     { openRate: 25, replyRate: 2, conversionRate: 0.3 },
  seo:       { ctr: 2.5, conversionRate: 1.0 },
  ads:       { ctr: 0.8, conversionRate: 0.1, maxCPC: 3.0 },
  instagram: { engagementRate: 1.5, conversionRate: 0.03 },
  content:   { engagementRate: 2.0 },
};

/* ── Métricas esperadas por canal ── */
const EXP_CHANNEL_METRICS = {
  linkedin:  ['impressions','engagementRate','likes','comments','shares','leadsGenerated','clicksToSite'],
  email:     ['sent','openRate','replyRate','clicks','leadsGenerated'],
  seo:       ['sessions','pageviews','avgPosition','ctr','leadsGenerated'],
  ads:       ['impressions','clicks','ctr','spend','leadsGenerated','cpc'],
  instagram: ['reach','engagementRate','likes','comments','leadsGenerated'],
  content:   ['views','engagementRate','shares','leadsGenerated'],
};

const EXP_METRIC_LABELS = {
  impressions:'Impressions', engagementRate:'Engagement (%)', likes:'Likes',
  comments:'Comentarios', shares:'Shares', leadsGenerated:'Leads generados',
  clicksToSite:'Clicks al sitio', sent:'Emails enviados', openRate:'Open rate (%)',
  replyRate:'Reply rate (%)', clicks:'Clicks', sessions:'Sesiones',
  pageviews:'Pageviews', avgPosition:'Posici\u00f3n media', ctr:'CTR (%)',
  spend:'Gasto (\u20ac)', cpc:'CPC (\u20ac)', reach:'Alcance', views:'Vistas',
};

/* ══════════════════════════════════════════
   PERSISTENCIA
══════════════════════════════════════════ */

function expDefault() {
  return { version: 1, totalExperiments: 0, experiments: [] };
}

function expLoad() {
  try {
    const raw = localStorage.getItem(EXP_KEY);
    if (!raw) return expDefault();
    return JSON.parse(raw);
  } catch (_) { return expDefault(); }
}

function expSave(data) {
  try { localStorage.setItem(EXP_KEY, JSON.stringify(data)); } catch (_) {}
}

function expGetById(expId) {
  return expLoad().experiments.find(function(e) { return e.id === expId; }) || null;
}

/* ══════════════════════════════════════════
   CREAR EXPERIMENTO
══════════════════════════════════════════ */

function expCreateFromRecommendation(recId, recText, channel, expectedOutcome) {
  var data = expLoad();
  var exp = {
    id: 'exp_' + Date.now(),
    recommendationId: recId || null,
    date: new Date().toISOString().slice(0, 10),
    channel: channel || 'general',
    recommendation: {
      text: (recText || '').slice(0, 200),
      expectedOutcome: expectedOutcome || 'TBD'
    },
    implementation: { status: 'planning', dateStarted: null, dateCompleted: null, details: {} },
    measurement: { status: 'pending', dateOfMeasurement: null, metrics: {}, attribution: {} },
    analysis: { roi: null, incremental: null, conclusion: null, reason: null },
    feedback: { wouldRepeat: null, adjustments: null, nextSteps: null, confidence: null }
  };
  data.experiments.unshift(exp);
  if (data.experiments.length > EXP_MAX) data.experiments = data.experiments.slice(0, EXP_MAX);
  data.totalExperiments++;
  expSave(data);
  return exp.id;
}

/* ══════════════════════════════════════════
   REGISTRAR IMPLEMENTACIÓN
══════════════════════════════════════════ */

function expLogImplementation(expId, details) {
  var data = expLoad();
  var exp = data.experiments.find(function(e) { return e.id === expId; });
  if (!exp) return null;
  exp.implementation = {
    status: details.status || 'done',
    dateStarted: details.dateStarted || new Date().toISOString().slice(0, 10),
    dateCompleted: details.dateCompleted || null,
    details: {
      description: details.description || '',
      effort: { hours: parseFloat(details.hours) || 0 }
    }
  };
  expSave(data);
  expRenderPage();
  return exp.id;
}

/* ══════════════════════════════════════════
   REGISTRAR MEDICIÓN + ANÁLISIS AUTOMÁTICO
══════════════════════════════════════════ */

function expLogMeasurement(expId, channelMetrics) {
  var data = expLoad();
  var exp = data.experiments.find(function(e) { return e.id === expId; });
  if (!exp) return null;

  var metricsObj = {};
  metricsObj[exp.channel] = channelMetrics;

  exp.measurement = {
    status: 'measured',
    dateOfMeasurement: new Date().toISOString().slice(0, 10),
    metrics: metricsObj,
    attribution: channelMetrics.attribution || {}
  };

  /* Análisis automático — todo en el mismo objeto data */
  expAnalyzeInPlace(exp);

  expSave(data);
  expRenderPage();
  return exp.id;
}

/* ══════════════════════════════════════════
   ANÁLISIS — multi-canal, sin bug de doble-save
══════════════════════════════════════════ */

function expAnalyzeInPlace(exp) {
  if (exp.implementation.status !== 'done' || exp.measurement.status !== 'measured') return;

  var metrics = exp.measurement.metrics[exp.channel] || {};
  var baseline = EXP_BASELINES[exp.channel] || {};
  var impl = exp.implementation;

  /* 1. ROI */
  var roi = null;
  var leads = parseFloat(metrics.leadsGenerated) || 0;
  var hours = (impl.details.effort && impl.details.effort.hours) || 0;
  var spend = parseFloat(metrics.spend) || 0;
  var leadValue = 97;
  var totalCost = (hours * 20) + spend;
  if (leads > 0 && totalCost > 0) {
    roi = (leads * leadValue) / totalCost;
  }

  /* 2. Incremento vs baseline — depende del canal */
  var incremental = null;
  var primaryMetric = null;
  if (exp.channel === 'linkedin' || exp.channel === 'instagram' || exp.channel === 'content') {
    primaryMetric = 'engagementRate';
  } else if (exp.channel === 'email') {
    primaryMetric = 'openRate';
  } else if (exp.channel === 'seo' || exp.channel === 'ads') {
    primaryMetric = 'ctr';
  }
  if (primaryMetric && metrics[primaryMetric] && baseline[primaryMetric]) {
    incremental = ((metrics[primaryMetric] - baseline[primaryMetric]) / baseline[primaryMetric]) * 100;
  }

  /* 3. Conclusión — lógica multi-canal */
  var conclusion = 'inconclusive';
  var metricAboveBaseline = incremental !== null && incremental > 0;
  if (leads >= 2 && metricAboveBaseline) {
    conclusion = 'success';
  } else if (leads >= 1 || metricAboveBaseline) {
    conclusion = 'partial';
  } else if (leads === 0 && (incremental !== null && incremental <= 0)) {
    conclusion = 'failure';
  }

  exp.analysis = {
    roi: roi !== null ? parseFloat(roi.toFixed(1)) : null,
    incremental: incremental !== null ? parseFloat(incremental.toFixed(1)) : null,
    conclusion: conclusion,
    reason: expGenerateReason(exp, metrics, baseline)
  };
}

function expGenerateReason(exp, metrics, baseline) {
  var leads = parseFloat(metrics.leadsGenerated) || 0;
  var c = exp.analysis.conclusion;
  var inc = exp.analysis.incremental;
  if (c === 'success') {
    return leads + ' leads generados. M\u00e9trica principal subi\u00f3 ' + (inc > 0 ? '+' + inc + '%' : '') + ' vs baseline.';
  } else if (c === 'partial') {
    return 'Resultado parcial: ' + leads + ' lead(s). ' + (inc > 0 ? 'M\u00e9trica principal subi\u00f3 pero conversi\u00f3n baja.' : 'Hay leads pero m\u00e9trica principal no super\u00f3 baseline.');
  } else if (c === 'failure') {
    return 'Sin leads generados. M\u00e9trica principal no super\u00f3 baseline. Revisar approach.';
  }
  return 'Datos insuficientes para concluir.';
}

/* ══════════════════════════════════════════
   REGISTRAR FEEDBACK + INYECTAR EN MEMORY
══════════════════════════════════════════ */

function expLogFeedback(expId, feedback) {
  var data = expLoad();
  var exp = data.experiments.find(function(e) { return e.id === expId; });
  if (!exp) return null;

  exp.feedback = {
    wouldRepeat: feedback.wouldRepeat,
    adjustments: feedback.adjustments || '',
    nextSteps: feedback.nextSteps || '',
    confidence: parseInt(feedback.confidence) || 3
  };
  expSave(data);

  /* Inyectar en memory — calibración numérica + insight textual */
  expFeedbackToMemory(exp);

  /* Regenerar digest si es posible */
  expTriggerDigest();

  expRenderPage();
  return exp.id;
}

/* ══════════════════════════════════════════
   RETROALIMENTACIÓN → MEMORY (2 capas)
══════════════════════════════════════════ */

function expFeedbackToMemory(exp) {
  if (!exp || !exp.analysis.conclusion) return;

  /* CAPA 2: Calibración numérica — sobreescribe, no acumula */
  if (typeof memLoad === 'function' && typeof memSave === 'function') {
    var mem = memLoad();
    var ch = exp.channel;
    var metrics = (exp.measurement.metrics && exp.measurement.metrics[ch]) || {};

    if (!mem.calibration) mem.calibration = {};

    /* Canal de conversión */
    if (!mem.calibration.channelConversion) mem.calibration.channelConversion = {};
    if (metrics.engagementRate) {
      var old = mem.calibration.channelConversion[ch] || metrics.engagementRate;
      mem.calibration.channelConversion[ch] = parseFloat((old * 0.7 + metrics.engagementRate * 0.3).toFixed(2));
    }

    /* CAC */
    var leads = parseFloat(metrics.leadsGenerated) || 0;
    var hours = (exp.implementation.details.effort && exp.implementation.details.effort.hours) || 0;
    var spend = parseFloat(metrics.spend) || 0;
    if (leads > 0) {
      var cac = ((hours * 20) + spend) / leads;
      mem.calibration.avgCAC = mem.calibration.avgCAC
        ? parseFloat((mem.calibration.avgCAC * 0.7 + cac * 0.3).toFixed(0))
        : Math.round(cac);
    }

    /* Canales validados / fallidos */
    if (!mem.calibration.validatedChannels) mem.calibration.validatedChannels = [];
    if (!mem.calibration.failedApproaches) mem.calibration.failedApproaches = [];
    if (!mem.calibration.workingContentFormats) mem.calibration.workingContentFormats = [];

    if (exp.analysis.conclusion === 'success') {
      if (mem.calibration.validatedChannels.indexOf(ch) === -1) {
        mem.calibration.validatedChannels.push(ch);
      }
      var format = exp.recommendation.text.slice(0, 50);
      if (mem.calibration.workingContentFormats.indexOf(format) === -1) {
        mem.calibration.workingContentFormats.push(format);
      }
      if (exp.analysis.roi && (!mem.businessProfile.bestChannel || exp.analysis.roi > 1.5)) {
        mem.businessProfile.bestChannel = ch;
      }
    } else if (exp.analysis.conclusion === 'failure') {
      var failText = ch + ': ' + exp.recommendation.text.slice(0, 40);
      if (mem.calibration.failedApproaches.indexOf(failText) === -1) {
        mem.calibration.failedApproaches.push(failText);
      }
    }

    memSave(mem);
  }

  /* CAPA 3: Insight cualitativo — solo si tiene feedback cualitativo */
  if (exp.feedback.adjustments && typeof memAddInsight === 'function') {
    var text = exp.channel + ': ' + exp.analysis.conclusion + ' (ROI ' + (exp.analysis.roi || 'N/A') + '). ';
    text += exp.feedback.adjustments;
    memAddInsight(text, 'experiment_result', true, exp.feedback.confidence || 3,
      exp.analysis.roi > 1.5 ? 'high' : 'medium');
  }
}

/* ══════════════════════════════════════════
   DESCARTAR EXPERIMENTO
══════════════════════════════════════════ */

function expDiscard(expId) {
  var data = expLoad();
  data.experiments = data.experiments.filter(function(e) { return e.id !== expId; });
  expSave(data);
  expRenderPage();
}

/* ══════════════════════════════════════════
   DETECCIÓN DE ACTIONABILIDAD (para copilot.js)
══════════════════════════════════════════ */

function expDetectActionable(text) {
  var t = text || '';
  var actionVerbs = /\b(crea|publica|haz|implementa|configura|prueba|escribe|env[ií]a|registra|conecta|lanza|ejecuta|programa|agenda|graba|dise[ñn]a|prepara|sube|comparte)\b/i;
  var contentTypes = /\b(post|reel|carrusel|infograf[ií]a|stories?|newsletter|art[ií]culo|blog|landing|campa[ñn]a|anuncio|ad|email|secuencia|webinar)\b/i;
  var specificity = /\d+\s*(posts?|semanas?|personas?|leads?|emails?|art[ií]culos?|d[ií]as?|horas?|sesiones?|campa[ñn]as?|reels?|stories|carruseles?|slides?|contenidos?|v[ií]deos?)/i;
  var planIndicators = /\b(plan\b|secuencia|calendario|estrategia|pasos?\b|d[ií]a\s*\d|semana\s*\d|fase\s*\d)/i;
  var hasAction = actionVerbs.test(t) || contentTypes.test(t);
  var hasStructure = specificity.test(t) || planIndicators.test(t);
  return hasAction && hasStructure;
}

function expDetectChannel(msg) {
  var m = (msg || '').toLowerCase();
  if (/linkedin|red social|post|publicaci/.test(m)) return 'linkedin';
  if (/email|instantly|campa[ñn]a|nurturing|apertura/.test(m)) return 'email';
  if (/seo|keyword|palabra|b[uú]squeda|google|posici/.test(m)) return 'seo';
  if (/ads|anuncio|ppc|sem|google ads|publicidad/.test(m)) return 'ads';
  if (/instagram|facebook|reel|story|meta/.test(m)) return 'instagram';
  if (/contenido|content|blog|art[ií]culo|copy/.test(m)) return 'content';
  return 'general';
}

/* ══════════════════════════════════════════
   MEMORY DIGEST — Claude comprime todo el conocimiento
══════════════════════════════════════════ */

function expGetDigest() {
  try {
    var raw = localStorage.getItem(EXP_DIGEST_KEY);
    if (!raw) return null;
    var obj = JSON.parse(raw);
    if (Date.now() - obj.ts > 24 * 60 * 60 * 1000) return null;
    return obj.text;
  } catch (_) { return null; }
}

function expSaveDigest(text) {
  try {
    localStorage.setItem(EXP_DIGEST_KEY, JSON.stringify({ ts: Date.now(), text: text }));
  } catch (_) {}
}

async function expGenerateDigest() {
  if (!CFG || !CFG.ak) return null;

  var mem = typeof memLoad === 'function' ? memLoad() : {};
  var data = expLoad();
  var completed = data.experiments.filter(function(e) {
    return e.analysis && e.analysis.conclusion;
  }).slice(0, 15);

  if (completed.length === 0 && (!mem.insights || mem.insights.length === 0)) return null;

  /* Construir input para Claude */
  var input = 'DATOS CRUDOS PARA COMPRIMIR EN BRIEFING ESTRATEGICO:\n\n';

  /* Perfil */
  var bp = mem.businessProfile || {};
  input += 'Perfil: ' + (bp.monthlyClientGoal || '?') + ' clientes/mes objetivo';
  input += ', ticket medio ' + (bp.avgTicket || 97) + ' EUR';
  if (bp.currentMRR) input += ', MRR ' + bp.currentMRR + ' EUR';
  if (bp.mainBottleneck) input += ', cuello de botella: ' + bp.mainBottleneck;
  input += '\n\n';

  /* Calibración */
  var cal = mem.calibration || {};
  if (cal.channelConversion && Object.keys(cal.channelConversion).length) {
    input += 'Calibracion por canal:\n';
    for (var ch in cal.channelConversion) {
      input += '- ' + ch + ': ' + cal.channelConversion[ch] + '% engagement/conversion\n';
    }
    if (cal.avgCAC) input += '- CAC promedio: ' + cal.avgCAC + ' EUR\n';
    if (cal.validatedChannels && cal.validatedChannels.length) input += '- Canales validados: ' + cal.validatedChannels.join(', ') + '\n';
    if (cal.failedApproaches && cal.failedApproaches.length) input += '- NO funciono: ' + cal.failedApproaches.join(' | ') + '\n';
    input += '\n';
  }

  /* Experimentos completados */
  if (completed.length) {
    input += 'Experimentos completados (ultimos ' + completed.length + '):\n';
    completed.forEach(function(e) {
      input += '- ' + e.channel + ': "' + e.recommendation.text.slice(0, 80) + '" = ' + e.analysis.conclusion;
      if (e.analysis.roi) input += ' ROI ' + e.analysis.roi + 'x';
      if (e.feedback.adjustments) input += ' | ajuste: ' + e.feedback.adjustments.slice(0, 60);
      input += '\n';
    });
    input += '\n';
  }

  /* Insights recientes */
  var insights = (mem.insights || []).slice(0, 12);
  if (insights.length) {
    input += 'Insights recientes (' + insights.length + '):\n';
    insights.forEach(function(i) {
      input += '- [' + i.category + '] ' + i.text + '\n';
    });
    input += '\n';
  }

  /* Recomendaciones fallidas */
  var failed = (mem.recommendations && mem.recommendations.failed) ? mem.recommendations.failed.slice(0, 5) : [];
  if (failed.length) {
    input += 'Intentos fallidos:\n';
    failed.forEach(function(r) { input += '- ' + r.text + (r.outcome ? ' (' + r.outcome + ')' : '') + '\n'; });
  }

  try {
    var resp = await antFetch({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: input + '\n\nComprime TODO lo anterior en un BRIEFING ESTRATEGICO de maximo 250 palabras para inyectar como contexto de un marketing co-pilot. Estructura:\n1. SITUACION (1-2 frases: etapa, canales probados)\n2. QUE FUNCIONA Y POR QUE (datos concretos, numeros)\n3. QUE NO FUNCIONA (datos concretos)\n4. CUELLO DE BOTELLA ACTUAL (el factor limitante principal)\n5. SIGUIENTE ACCION RECOMENDADA (basada en patrones de los datos)\n\nSe CONCISO. Cada frase debe tener un dato o numero. Sin introducciones. Sin repetir lo obvio. Responde en espanol.\nResponde SOLO el briefing, sin markdown, sin encabezados, sin backticks.' }]
    });
    var text = (resp.content || []).filter(function(b) { return b.type === 'text'; }).map(function(b) { return b.text; }).join('').trim();
    if (text && text.length > 50) {
      expSaveDigest(text);
      return text;
    }
  } catch (_) {}
  return null;
}

var _expDigestTimer = null;
function expTriggerDigest() {
  clearTimeout(_expDigestTimer);
  _expDigestTimer = setTimeout(function() {
    expGenerateDigest();
  }, 3000);
}

/* ══════════════════════════════════════════
   CONTAR EXPERIMENTOS POR ESTADO
══════════════════════════════════════════ */

function expCounts() {
  var data = expLoad();
  var counts = { planning: 0, implemented: 0, measured: 0, complete: 0, total: data.experiments.length };
  data.experiments.forEach(function(e) {
    if (e.feedback.confidence !== null) counts.complete++;
    else if (e.measurement.status === 'measured') counts.measured++;
    else if (e.implementation.status === 'done') counts.implemented++;
    else counts.planning++;
  });
  return counts;
}

/* ══════════════════════════════════════════
   UI — PÁGINA COMPLETA DE EXPERIMENTOS
══════════════════════════════════════════ */

function expRenderPage() {
  var el = document.getElementById('page-exp');
  if (!el) return;
  var data = expLoad();
  var exps = data.experiments;

  var html = '';

  /* KPIs rápidos */
  var counts = expCounts();
  html += '<div id="exp-kpis" style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px">';
  html += expKpiCard('Pendientes', counts.planning, 'var(--amber)');
  html += expKpiCard('Implementados', counts.implemented, 'var(--blue)');
  html += expKpiCard('Medidos', counts.measured, 'var(--purple)');
  html += expKpiCard('Completados', counts.complete, 'var(--green)');
  html += '</div>';

  /* Digest actual */
  var digest = expGetDigest();
  if (digest) {
    html += '<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:14px 16px;margin-bottom:20px">';
    html += '<div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px">Briefing estrat\u00e9gico (auto-generado)</div>';
    html += '<div style="font-size:12px;line-height:1.7;color:var(--mt);white-space:pre-line">' + digest.replace(/</g, '&lt;') + '</div>';
    html += '<button onclick="expRegenerateDigest()" style="margin-top:10px;font-size:11px;padding:4px 12px;background:var(--sf2);border:0.5px solid var(--bd);border-radius:4px;cursor:pointer;color:var(--ht)">Regenerar digest</button>';
    html += '</div>';
  }

  if (exps.length === 0) {
    html += '<div style="text-align:center;padding:40px 20px;color:var(--ht)">';
    html += '<div style="font-size:32px;margin-bottom:12px">&#128300;</div>';
    html += '<div style="font-size:14px;font-weight:500;margin-bottom:6px">Sin experimentos todav\u00eda</div>';
    html += '<div style="font-size:12px">Cuando el Copilot te d\u00e9 una recomendaci\u00f3n accionable, se crear\u00e1 un experimento autom\u00e1ticamente aqu\u00ed.</div>';
    html += '</div>';
  } else {
    exps.forEach(function(exp) {
      html += expRenderCard(exp);
    });
  }

  el.innerHTML = html;
}

function expKpiCard(label, value, color) {
  return '<div style="flex:1;min-width:100px;background:var(--sf);border-radius:var(--r);padding:12px 14px">'
    + '<div style="font-size:10px;color:var(--ht);text-transform:uppercase;letter-spacing:.04em">' + label + '</div>'
    + '<div style="font-size:22px;font-weight:600;color:' + color + ';margin-top:4px">' + value + '</div>'
    + '</div>';
}

function expRenderCard(exp) {
  var statusColors = {
    success: 'var(--green)', partial: 'var(--amber)',
    failure: 'var(--red)', inconclusive: 'var(--ht)'
  };
  var statusLabels = {
    success: 'Exitoso', partial: 'Parcial',
    failure: 'Fallido', inconclusive: 'Inconcluso'
  };

  var conclusionColor = statusColors[exp.analysis.conclusion] || 'var(--ht)';
  var conclusionLabel = statusLabels[exp.analysis.conclusion] || 'Pendiente';
  var isComplete = exp.feedback.confidence !== null;

  var html = '<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:14px 16px;margin-bottom:12px">';

  /* Header */
  html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px">';
  html += '<div style="flex:1">';
  html += '<div style="font-size:13px;font-weight:500;color:var(--tx)">' + exp.recommendation.text.replace(/</g, '&lt;') + '</div>';
  html += '<div style="font-size:11px;color:var(--ht);margin-top:3px">';
  html += exp.channel + ' &middot; ' + exp.date;
  if (exp.analysis.conclusion) {
    html += ' &middot; <span style="color:' + conclusionColor + ';font-weight:500">' + conclusionLabel + '</span>';
  }
  if (exp.analysis.roi) {
    html += ' &middot; ROI ' + exp.analysis.roi + 'x';
  }
  html += '</div></div>';
  html += '<button onclick="if(confirm(\'Descartar este experimento?\'))expDiscard(\'' + exp.id + '\')" style="background:none;border:none;cursor:pointer;color:var(--ht);font-size:12px;padding:2px" title="Descartar">&times;</button>';
  html += '</div>';

  /* Análisis (si existe) */
  if (exp.analysis.reason && exp.analysis.conclusion) {
    html += '<div style="font-size:11px;color:var(--mt);margin-top:8px;padding:8px 10px;background:var(--bg);border-radius:4px">' + exp.analysis.reason.replace(/</g, '&lt;') + '</div>';
  }

  /* Feedback (si existe) */
  if (isComplete && exp.feedback.adjustments) {
    html += '<div style="font-size:11px;color:var(--mt);margin-top:6px;padding:8px 10px;background:var(--gp);border-radius:4px">';
    html += '<strong>Feedback:</strong> ' + exp.feedback.adjustments.replace(/</g, '&lt;');
    html += ' &middot; Confianza: ' + exp.feedback.confidence + '/5';
    html += ' &middot; Repetir\u00eda: ' + (exp.feedback.wouldRepeat === 'yes' ? 'S\u00ed' : exp.feedback.wouldRepeat === 'changes' ? 'Con cambios' : 'No');
    html += '</div>';
  }

  /* Botón de siguiente acción */
  html += '<div style="margin-top:10px">';
  if (exp.implementation.status === 'planning') {
    html += '<button onclick="expShowForm(\'' + exp.id + '\',\'impl\')" style="font-size:11px;padding:5px 12px;background:var(--sf2);border:0.5px solid var(--bd);border-radius:20px;cursor:pointer;color:var(--mt)">+ Reportar implementaci\u00f3n</button>';
  } else if (exp.implementation.status === 'done' && exp.measurement.status === 'pending') {
    html += '<button onclick="expShowForm(\'' + exp.id + '\',\'meas\')" style="font-size:11px;padding:5px 12px;background:var(--sf2);border:0.5px solid var(--bd);border-radius:20px;cursor:pointer;color:var(--mt)">&#128202; Reportar resultados</button>';
  } else if (exp.measurement.status === 'measured' && !isComplete) {
    html += '<button onclick="expShowForm(\'' + exp.id + '\',\'feed\')" style="font-size:11px;padding:5px 12px;background:var(--sf2);border:0.5px solid var(--bd);border-radius:20px;cursor:pointer;color:var(--mt)">&#128172; Dar feedback</button>';
  }
  html += '</div>';

  /* Form container */
  html += '<div id="exp-form-' + exp.id + '"></div>';

  html += '</div>';
  return html;
}

/* ══════════════════════════════════════════
   FORMULARIOS
══════════════════════════════════════════ */

function expShowForm(expId, type) {
  var container = document.getElementById('exp-form-' + expId);
  if (!container) return;
  var exp = expGetById(expId);
  if (!exp) return;

  var html = '<div style="margin-top:12px;padding:14px;background:var(--bg);border:1px solid var(--bd);border-radius:var(--r)">';

  if (type === 'impl') {
    html += '<div style="font-size:12px;font-weight:600;margin-bottom:10px">Reportar implementaci\u00f3n</div>';
    html += expFormField('Fecha inicio', 'date', 'exp-impl-start-' + expId, new Date().toISOString().slice(0, 10));
    html += expFormField('Fecha fin', 'date', 'exp-impl-end-' + expId, '');
    html += expFormSelect('Estado', 'exp-impl-status-' + expId, [
      ['done','Completado'], ['partial','Parcial'], ['failed','No se pudo']
    ]);
    html += expFormField('Qu\u00e9 hiciste', 'text', 'exp-impl-desc-' + expId, '', 'Ej: 12 posts, 3/semana sobre errores comunes');
    html += expFormField('Horas invertidas', 'number', 'exp-impl-hours-' + expId, '', 'Ej: 8');
    html += '<button onclick="expSubmitImpl(\'' + expId + '\')" style="margin-top:8px;font-size:12px;padding:6px 16px;background:var(--green);color:white;border:none;border-radius:20px;cursor:pointer">Guardar</button>';
    html += ' <button onclick="expHideForm(\'' + expId + '\')" style="font-size:12px;padding:6px 12px;background:none;border:0.5px solid var(--bd);border-radius:20px;cursor:pointer;color:var(--ht)">Cancelar</button>';

  } else if (type === 'meas') {
    html += '<div style="font-size:12px;font-weight:600;margin-bottom:10px">Resultados \u2014 ' + exp.channel + '</div>';
    var fields = EXP_CHANNEL_METRICS[exp.channel] || ['leadsGenerated'];
    fields.forEach(function(f) {
      html += expFormField(EXP_METRIC_LABELS[f] || f, 'number', 'exp-meas-' + f + '-' + expId, '', '');
    });
    html += '<button onclick="expSubmitMeas(\'' + expId + '\')" style="margin-top:8px;font-size:12px;padding:6px 16px;background:var(--green);color:white;border:none;border-radius:20px;cursor:pointer">Analizar</button>';
    html += ' <button onclick="expHideForm(\'' + expId + '\')" style="font-size:12px;padding:6px 12px;background:none;border:0.5px solid var(--bd);border-radius:20px;cursor:pointer;color:var(--ht)">Cancelar</button>';

  } else if (type === 'feed') {
    html += '<div style="font-size:12px;font-weight:600;margin-bottom:10px">Feedback</div>';
    html += expFormSelect('Lo repetir\u00edas?', 'exp-feed-repeat-' + expId, [
      ['yes','S\u00ed'], ['changes','Con cambios'], ['no','No']
    ]);
    html += expFormField('Qu\u00e9 ajustar\u00edas', 'text', 'exp-feed-adjust-' + expId, '', 'Ej: Mejorar CTA con link directo');
    html += expFormField('Pr\u00f3ximos pasos', 'text', 'exp-feed-next-' + expId, '', 'Ej: Repetir con 4 posts/semana');
    html += '<div style="margin:8px 0 4px"><label style="font-size:11px;color:var(--ht)">Confianza en el resultado (1-5)</label></div>';
    html += '<input type="range" id="exp-feed-conf-' + expId + '" min="1" max="5" value="3" style="width:100%">';
    html += '<button onclick="expSubmitFeed(\'' + expId + '\')" style="margin-top:8px;font-size:12px;padding:6px 16px;background:var(--green);color:white;border:none;border-radius:20px;cursor:pointer">Guardar y cerrar</button>';
    html += ' <button onclick="expHideForm(\'' + expId + '\')" style="font-size:12px;padding:6px 12px;background:none;border:0.5px solid var(--bd);border-radius:20px;cursor:pointer;color:var(--ht)">Cancelar</button>';
  }

  html += '</div>';
  container.innerHTML = html;
}

function expFormField(label, type, id, value, placeholder) {
  return '<div style="margin-bottom:8px">'
    + '<label style="display:block;font-size:11px;color:var(--ht);margin-bottom:3px">' + label + '</label>'
    + '<input type="' + type + '" id="' + id + '" value="' + (value || '') + '" placeholder="' + (placeholder || '') + '" style="width:100%;padding:6px 8px;font-size:12px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--sf2);color:var(--tx);box-sizing:border-box;font-family:DM Sans,sans-serif">'
    + '</div>';
}

function expFormSelect(label, id, options) {
  var html = '<div style="margin-bottom:8px">'
    + '<label style="display:block;font-size:11px;color:var(--ht);margin-bottom:3px">' + label + '</label>'
    + '<select id="' + id + '" style="width:100%;padding:6px 8px;font-size:12px;border:0.5px solid var(--bd);border-radius:var(--r);background:var(--sf2);color:var(--tx);font-family:DM Sans,sans-serif">';
  options.forEach(function(o) { html += '<option value="' + o[0] + '">' + o[1] + '</option>'; });
  html += '</select></div>';
  return html;
}

function expHideForm(expId) {
  var c = document.getElementById('exp-form-' + expId);
  if (c) c.innerHTML = '';
}

/* ── Submit handlers ── */

function expSubmitImpl(expId) {
  expLogImplementation(expId, {
    dateStarted: document.getElementById('exp-impl-start-' + expId).value,
    dateCompleted: document.getElementById('exp-impl-end-' + expId).value,
    status: document.getElementById('exp-impl-status-' + expId).value,
    description: document.getElementById('exp-impl-desc-' + expId).value,
    hours: document.getElementById('exp-impl-hours-' + expId).value
  });
}

function expSubmitMeas(expId) {
  var exp = expGetById(expId);
  if (!exp) return;
  var fields = EXP_CHANNEL_METRICS[exp.channel] || ['leadsGenerated'];
  var metrics = {};
  fields.forEach(function(f) {
    var val = document.getElementById('exp-meas-' + f + '-' + expId);
    if (val && val.value) metrics[f] = parseFloat(val.value);
  });
  expLogMeasurement(expId, metrics);
}

function expSubmitFeed(expId) {
  expLogFeedback(expId, {
    wouldRepeat: document.getElementById('exp-feed-repeat-' + expId).value,
    adjustments: document.getElementById('exp-feed-adjust-' + expId).value,
    nextSteps: document.getElementById('exp-feed-next-' + expId).value,
    confidence: document.getElementById('exp-feed-conf-' + expId).value
  });
}

async function expRegenerateDigest() {
  var btn = event.target;
  btn.textContent = 'Generando...';
  btn.disabled = true;
  await expGenerateDigest();
  expRenderPage();
}

/* ══════════════════════════════════════════
   BADGE EN SIDEBAR
══════════════════════════════════════════ */

function expUpdateBadge() {
  var badge = document.getElementById('nb-exp');
  if (!badge) return;
  var c = expCounts();
  var pending = c.planning + c.implemented + c.measured;
  if (pending > 0) {
    badge.textContent = pending;
    badge.className = 'nb nb-live';
  } else if (c.total > 0) {
    badge.textContent = c.complete;
    badge.className = 'nb nb-pend';
  } else {
    badge.textContent = '\u2014';
    badge.className = 'nb nb-off';
  }
}

/* ══════════════════════════════════════════
   INIT
══════════════════════════════════════════ */

(function expInit() {
  function run() {
    expUpdateBadge();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', run);
  } else {
    setTimeout(run, 600);
  }
})();
