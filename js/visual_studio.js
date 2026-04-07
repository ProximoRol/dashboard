/* ═══════════════════════════════════════════════════════════════
   VISUAL STUDIO — Generador de contenido visual para Instagram
   Modos: Single (un post) · Batch (5-6 posts en secuencia)
   Depends on: core.js, identity_block.js
   ═══════════════════════════════════════════════════════════════ */

const VS_STORE = 'pr_visual_studio_v1';

/* ── Estado del módulo ── */
let VS_MODE       = 'single';
let VS_FORMAT     = '1:1';
let VS_STYLE      = 'tipografico';
let VS_BRIEF      = '';
let VS_IMG_PROMPT = '';
let VS_CAPTION    = '';
let VS_IMG_B64    = '';
let VS_IMG_MIME   = 'image/png';

/* ── Estado batch ── */
let VS_BATCH_RUNNING = false;
let VS_BATCH_STOP    = false;

/* ── Estilos visuales disponibles ── */
const VS_STYLES = {
  tipografico: {
    label: 'Bold / Tipografico',
    icon: 'T',
    desc: 'Texto impactante como protagonista. Fondo limpio, tipografia grande.',
    gemini_hint: 'Bold typography as the hero, clean minimal background, strong contrast, modern sans-serif font, professional coaching brand aesthetic, Instagram feed post'
  },
  minimalista: {
    label: 'Minimalista',
    icon: 'M',
    desc: 'Espacios en blanco, paleta limitada. Sofisticacion y claridad.',
    gemini_hint: 'Minimalist design, lots of white space, limited color palette (2-3 colors), subtle geometric elements, premium feel, clean and modern'
  },
  datos: {
    label: 'Datos / Infografia',
    icon: 'D',
    desc: 'Estadisticas y cifras visualizadas. Autoridad a traves de numeros.',
    gemini_hint: 'Data visualization infographic style, clean charts or stats layout, professional color scheme, easy to read numbers and percentages, modern flat design'
  },
  fotografico: {
    label: 'Fotografico',
    icon: 'F',
    desc: 'Imagen realista de persona o escena laboral con texto superpuesto.',
    gemini_hint: 'Realistic professional photography style, office or interview setting, natural lighting, authentic candid feel, with space for text overlay, editorial quality'
  }
};

/* ── Formatos ── */
const VS_FORMATS = {
  '1:1':  { label: 'Feed (1:1)',      w: 1080, h: 1080, gemini: '1:1' },
  '9:16': { label: 'Story (9:16)',    w: 1080, h: 1920, gemini: '9:16' },
  '4:5':  { label: 'Portrait (4:5)', w: 1080, h: 1350, gemini: '4:5' }
};

/* ═══════════════════════════════════════════════
   INTELIGENCIA CRUZADA
   ═══════════════════════════════════════════════ */
function vsGetIntelligenceContext() {
  var parts = [];
  try {
    var brand = (typeof biGetContext === 'function') ? biGetContext() : '';
    if (brand) parts.push(brand);
  } catch(e) {}
  try {
    var kwRows = Array.from(document.querySelectorAll('#kw-table tbody tr')).slice(0, 5);
    var keywords = kwRows.map(function(r) { return r.cells[0] ? r.cells[0].textContent.trim() : ''; }).filter(Boolean);
    if (keywords.length > 0) parts.push('TOP KEYWORDS ACTIVOS:\n' + keywords.map(function(k) { return '- ' + k; }).join('\n'));
  } catch(e) {}
  try {
    var igKpis = document.querySelectorAll('#ig-main .kc');
    var igMetrics = [];
    igKpis.forEach(function(kpi) {
      var val = kpi.querySelector('.kv'); var lbl = kpi.querySelector('.kl');
      if (val && lbl) igMetrics.push(lbl.textContent.trim() + ': ' + val.textContent.trim());
    });
    if (igMetrics.length > 0) parts.push('METRICAS INSTAGRAM:\n' + igMetrics.slice(0, 4).join(' | '));
  } catch(e) {}
  return parts.join('\n\n');
}

/* ═══════════════════════════════════════════════
   PERSISTENCIA
   ═══════════════════════════════════════════════ */
function vsSave() {
  try {
    localStorage.setItem(VS_STORE, JSON.stringify({
      format: VS_FORMAT, style: VS_STYLE, brief: VS_BRIEF,
      imgPrompt: VS_IMG_PROMPT, caption: VS_CAPTION,
      imgB64: VS_IMG_B64, imgMime: VS_IMG_MIME,
      savedAt: new Date().toISOString()
    }));
  } catch(e) {}
}

function vsLoadSaved() {
  try { var s = localStorage.getItem(VS_STORE); return s ? JSON.parse(s) : null; }
  catch(e) { return null; }
}

/* ═══════════════════════════════════════════════
   ENTRY POINT
   ═══════════════════════════════════════════════ */
function loadVisualStudio() {
  var el = document.getElementById('vs-main');
  if (!el) return;
  var saved = vsLoadSaved();
  if (saved) {
    VS_FORMAT     = saved.format    || '1:1';
    VS_STYLE      = saved.style     || 'tipografico';
    VS_BRIEF      = saved.brief     || '';
    VS_IMG_PROMPT = saved.imgPrompt || '';
    VS_CAPTION    = saved.caption   || '';
    VS_IMG_B64    = saved.imgB64    || '';
    VS_IMG_MIME   = saved.imgMime   || 'image/png';
  }
  vsRender(el);
}

/* ═══════════════════════════════════════════════
   RENDER PRINCIPAL
   ═══════════════════════════════════════════════ */
function vsRender(el) {
  var hasKey       = !!(typeof CFG !== 'undefined' && CFG.geminiKey);
  var hasAnthropic = !!(typeof CFG !== 'undefined' && CFG.ak);

  var warnings = '';
  if (!hasAnthropic) {
    warnings += '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#991B1B;margin-bottom:12px">'
      + '<strong>Anthropic API Key no configurada.</strong>'
      + '<button onclick="showP(\'settings\',null)" style="margin-left:8px;padding:3px 10px;border:1px solid #DC2626;border-radius:4px;background:white;font-size:11px;cursor:pointer;color:#991B1B">Ir a Settings</button>'
      + '</div>';
  }
  if (!hasKey) {
    warnings += '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#92400E;margin-bottom:12px">'
      + '<strong>Gemini API Key no configurada</strong> — necesaria para generar imagenes.'
      + '<button onclick="showP(\'settings\',null)" style="margin-left:8px;padding:3px 10px;border:1px solid #D97706;border-radius:4px;background:white;font-size:11px;cursor:pointer;color:#92400E">Ir a Settings</button>'
      + '</div>';
  }

  var singleActive = VS_MODE === 'single'
    ? 'background:var(--purple);color:white;border-color:var(--purple);'
    : 'background:var(--sf2);color:var(--mt);border-color:var(--bd2);';
  var batchActive = VS_MODE === 'batch'
    ? 'background:var(--purple);color:white;border-color:var(--purple);'
    : 'background:var(--sf2);color:var(--mt);border-color:var(--bd2);';

  var header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px">'
    + '<div>'
    + '<h2 style="font-size:16px;font-weight:600;color:var(--tx);margin:0">Visual Studio</h2>'
    + '<p style="font-size:12px;color:var(--ht);margin:3px 0 0">Concepto &rarr; Brief &rarr; Imagen &rarr; Caption para Instagram</p>'
    + '</div>'
    + '<div style="display:flex;gap:4px;background:var(--sf2);padding:3px;border-radius:var(--r)">'
    + '<button onclick="vsSetMode(\'single\')" style="' + singleActive + 'border:1px solid;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Post individual</button>'
    + '<button onclick="vsSetMode(\'batch\')"  style="' + batchActive  + 'border:1px solid;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Batch (5-6 posts)</button>'
    + '</div>'
    + '</div>';

  var content = VS_MODE === 'batch' ? vsBatchPanel(hasKey) : vsSinglePanel(hasKey);
  el.innerHTML = warnings + header + content;
}

/* ═══════════════════════════════════════════════
   PANEL SINGLE
   ═══════════════════════════════════════════════ */
function vsSinglePanel(hasKey) {
  var formatBtns = Object.keys(VS_FORMATS).map(function(k) {
    var f = VS_FORMATS[k];
    var active = VS_FORMAT === k
      ? 'background:var(--purple);color:white;border-color:var(--purple);'
      : 'background:var(--sf2);color:var(--mt);';
    return '<button onclick="vsSetFormat(\'' + k + '\')" style="' + active + 'border:1px solid var(--bd2);border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' + f.label + '</button>';
  }).join('');

  var styleBtns = Object.keys(VS_STYLES).map(function(k) {
    var s = VS_STYLES[k];
    var active = VS_STYLE === k
      ? 'border-color:var(--purple);background:var(--sf2);'
      : 'border-color:var(--bd);background:transparent;';
    return '<button onclick="vsSetStyle(\'' + k + '\')" style="' + active + 'border:1px solid;border-radius:var(--r);padding:8px 12px;font-size:12px;cursor:pointer;text-align:left;font-family:\'DM Sans\',sans-serif;color:var(--tx)">'
      + '<strong style="font-size:12px">' + s.label + '</strong>'
      + '</button>';
  }).join('');

  var step2Html = '';
  if (VS_BRIEF) {
    step2Html += '<div class="cd" style="margin-bottom:16px">'
      + '<div class="ch"><span class="ct">Brief creativo</span><span class="bg bg-p">Claude</span></div>'
      + '<div style="margin-top:10px;font-size:13px;line-height:1.7;color:var(--tx);white-space:pre-wrap">' + escHtml(VS_BRIEF) + '</div>'
      + '</div>';
  }
  if (VS_IMG_PROMPT) {
    step2Html += '<div class="cd" style="margin-bottom:16px">'
      + '<div class="ch"><span class="ct">Prompt para Gemini</span><span class="bg bg-b">Editable</span></div>'
      + '<div style="margin-top:10px"><textarea id="vs-img-prompt" class="fi" style="min-height:80px;font-size:12px;font-family:monospace;line-height:1.5">' + escHtml(VS_IMG_PROMPT) + '</textarea></div>'
      + '<div style="margin-top:10px;display:flex;gap:10px;align-items:center">'
      + '<button onclick="vsGenerateImage()" id="vs-gen-img-btn" style="padding:9px 18px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif' + (!hasKey ? ';opacity:.5' : '') + '" ' + (!hasKey ? 'disabled' : '') + '>Generar imagen con Gemini</button>'
      + '<span style="font-size:11px;color:var(--ht)">Gemini Imagen 3 - ' + VS_FORMATS[VS_FORMAT].label + '</span>'
      + '</div></div>';
  }
  if (VS_CAPTION) {
    step2Html += '<div class="cd" style="margin-bottom:16px">'
      + '<div class="ch"><span class="ct">Caption generado</span><span class="bg bg-g">Instagram</span></div>'
      + '<div style="margin-top:10px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:280px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
      + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button>'
      + '</div>';
  }

  var prevResult = VS_IMG_B64
    ? vsRenderResult(false)
    : '<div style="display:flex;align-items:center;justify-content:center;height:180px;color:var(--ht);font-size:13px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2)">La imagen generada aparecera aqui</div>';

  return '<div class="cd" style="margin-bottom:16px">'
    + '<div class="ch"><span class="ct">Paso 1 - Concepto del post</span><span class="bg bg-p">Claude genera el brief</span></div>'
    + '<div style="margin-top:12px">'
    + '<label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:6px">Formato</label>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">' + formatBtns + '</div>'
    + '<label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:6px">Tema o concepto</label>'
    + '<textarea id="vs-concept" class="fi" style="min-height:70px" placeholder="Ej: El 73% de los reclutadores decide en los primeros 30 segundos."></textarea>'
    + '<label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:8px;margin-top:12px">Estilo visual</label>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">' + styleBtns + '</div>'
    + '<div style="margin-top:14px">'
    + '<button onclick="vsGenerateBrief()" id="vs-brief-btn" style="padding:9px 20px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Generar brief + prompt</button>'
    + '</div></div></div>'
    + '<div id="vs-step2">' + step2Html + '</div>'
    + '<div class="cd"><div class="ch"><span class="ct">Resultado</span><span class="bg bg-g">Imagen + Caption</span></div>'
    + '<div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap">'
    + '<div id="vs-img-preview" style="flex:1;min-width:220px">' + prevResult + '</div>'
    + '<div id="vs-caption-area" style="flex:1;min-width:220px">'
    + (VS_CAPTION
      ? '<div style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:300px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
        + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button>'
      : '<div style="display:flex;align-items:center;justify-content:center;height:80px;color:var(--ht);font-size:13px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2)">El caption aparecera aqui</div>')
    + '</div></div></div>';
}

/* ═══════════════════════════════════════════════
   PANEL BATCH
   ═══════════════════════════════════════════════ */
function vsBatchPanel(hasKey) {
  var formatBtns = Object.keys(VS_FORMATS).map(function(k) {
    var f = VS_FORMATS[k];
    var active = VS_FORMAT === k
      ? 'background:var(--purple);color:white;border-color:var(--purple);'
      : 'background:var(--sf2);color:var(--mt);';
    return '<button onclick="vsSetFormat(\'' + k + '\')" style="' + active + 'border:1px solid var(--bd2);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' + f.label + '</button>';
  }).join('');

  var styleBtns = Object.keys(VS_STYLES).map(function(k) {
    var s = VS_STYLES[k];
    var active = VS_STYLE === k
      ? 'border-color:var(--purple);background:var(--sf2);'
      : 'border-color:var(--bd);background:transparent;';
    return '<button onclick="vsSetBatchStyle(\'' + k + '\')" style="' + active + 'border:1px solid;border-radius:var(--r);padding:5px 10px;font-size:11px;cursor:pointer;font-family:\'DM Sans\',sans-serif;color:var(--tx)">' + s.label + '</button>';
  }).join('');

  return '<div class="cd" style="margin-bottom:16px">'
    + '<div class="ch"><span class="ct">Batch - Generacion en serie</span><span class="bg bg-p">Claude + Gemini</span></div>'
    + '<div style="margin-top:14px">'
    + '<div style="background:#F3EFFF;border:1px solid #DDD6FE;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#5B21B6;margin-bottom:14px;line-height:1.6">'
    + '<strong>Como usar:</strong> Pega los captions del Content Studio, separados por <code style="background:#EDE9FE;padding:1px 5px;border-radius:3px">---</code> (tres guiones solos en una linea). El sistema genera la imagen para cada uno en secuencia automaticamente.'
    + '</div>'
    + '<label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:6px">Captions del Content Studio</label>'
    + '<textarea id="vs-batch-input" class="fi" style="min-height:240px;font-size:12px;line-height:1.6" placeholder="Pega aqui tu primer caption...\n\n---\n\nPega aqui tu segundo caption...\n\n---\n\nPega aqui tu tercer caption..."></textarea>'
    + '<div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:12px;align-items:flex-start">'
    + '<div><label style="font-size:11px;font-weight:500;color:var(--ht);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Formato</label>'
    + '<div style="display:flex;gap:6px">' + formatBtns + '</div></div>'
    + '<div><label style="font-size:11px;font-weight:500;color:var(--ht);display:block;margin-bottom:6px;text-transform:uppercase;letter-spacing:.04em">Estilo visual</label>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">' + styleBtns + '</div></div>'
    + '</div>'
    + '<div style="margin-top:16px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'
    + '<button onclick="vsBatchGenerate()" id="vs-batch-btn" style="padding:10px 24px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif' + (!hasKey ? ';opacity:.5;cursor:not-allowed' : '') + '" ' + (!hasKey ? 'disabled' : '') + '>Generar todos los posts</button>'
    + '<button onclick="vsBatchStop()" id="vs-batch-stop-btn" style="display:none;padding:10px 16px;background:#FEF2F2;color:var(--red);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Detener</button>'
    + '<span style="font-size:11px;color:var(--ht)">~20 seg por post - Gemini Imagen 3</span>'
    + '</div></div></div>'

    + '<div id="vs-batch-progress" style="display:none;margin-bottom:16px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:12px 14px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">'
    + '<span id="vs-batch-status" style="font-size:12px;font-weight:500;color:var(--tx)">Iniciando...</span>'
    + '<span id="vs-batch-counter" style="font-size:11px;color:var(--ht)">0 / 0</span>'
    + '</div>'
    + '<div style="height:4px;background:var(--sf2);border-radius:2px;overflow:hidden">'
    + '<div id="vs-batch-bar" style="height:100%;background:var(--purple);border-radius:2px;width:0%;transition:width .4s ease"></div>'
    + '</div>'
    + '</div>'

    + '<div id="vs-batch-results"></div>';
}

/* ═══════════════════════════════════════════════
   BATCH — Parsear input
   ═══════════════════════════════════════════════ */
function vsBatchParse(text) {
  return text.split(/\n\s*---\s*\n/)
    .map(function(s) { return s.trim(); })
    .filter(function(s) { return s.length > 10; });
}

/* ═══════════════════════════════════════════════
   BATCH — Loop principal
   ═══════════════════════════════════════════════ */
async function vsBatchGenerate() {
  var inputEl = document.getElementById('vs-batch-input');
  if (!inputEl || !inputEl.value.trim()) {
    alert('Pega al menos un caption antes de generar.');
    return;
  }

  var captions = vsBatchParse(inputEl.value);
  if (captions.length === 0) {
    alert('No se encontraron posts. Asegurate de separar cada caption con --- en una linea sola.');
    return;
  }

  var key = (typeof CFG !== 'undefined') ? CFG.geminiKey : '';
  if (!key) { alert('Configura tu Gemini API Key en Settings.'); return; }

  VS_BATCH_RUNNING = true;
  VS_BATCH_STOP    = false;
  if (!window.VS_BATCH_IMGS) window.VS_BATCH_IMGS = {};

  var btn     = document.getElementById('vs-batch-btn');
  var stopBtn = document.getElementById('vs-batch-stop-btn');
  var progDiv = document.getElementById('vs-batch-progress');
  var resDiv  = document.getElementById('vs-batch-results');

  if (btn)     { btn.disabled = true; btn.textContent = 'Generando...'; }
  if (stopBtn) stopBtn.style.display = 'inline-block';
  if (progDiv) progDiv.style.display = 'block';

  /* Pre-renderizar todas las tarjetas en estado pending */
  if (resDiv) {
    var cardsHtml = '';
    for (var j = 0; j < captions.length; j++) {
      cardsHtml += vsBatchCard(j, 'pending', captions[j], null, null);
    }
    resDiv.innerHTML = cardsHtml;
  }

  var intelligence = vsGetIntelligenceContext();
  var styleData    = VS_STYLES[VS_STYLE];
  var formatData   = VS_FORMATS[VS_FORMAT];
  var i = 0;

  for (i = 0; i < captions.length; i++) {
    if (VS_BATCH_STOP) break;

    vsBatchSetProgress(i, captions.length, 'Generando brief para post ' + (i + 1) + ' de ' + captions.length + '...');
    vsBatchUpdateCard(i, 'briefing', captions[i], null, null);

    try {
      var promptResult = await vsBatchGetPrompt(captions[i], intelligence, styleData, formatData);
      if (VS_BATCH_STOP) break;

      vsBatchSetProgress(i, captions.length, 'Generando imagen para post ' + (i + 1) + ' de ' + captions.length + '...');
      vsBatchUpdateCard(i, 'imaging', captions[i], null, null);

      var imgResult = await vsBatchGetImage(promptResult.geminiPrompt, formatData.gemini, key);
      vsBatchUpdateCard(i, 'done', captions[i], imgResult, null);

    } catch(e) {
      vsBatchUpdateCard(i, 'error', captions[i], null, e.message);
    }

    if (i < captions.length - 1 && !VS_BATCH_STOP) {
      await new Promise(function(r) { setTimeout(r, 1200); });
    }
  }

  VS_BATCH_RUNNING = false;
  var doneCount = VS_BATCH_STOP ? i : captions.length;
  vsBatchSetProgress(captions.length, captions.length,
    VS_BATCH_STOP ? ('Detenido - ' + doneCount + ' posts generados') : ('Todos los posts generados'));

  if (btn)     { btn.disabled = false; btn.textContent = 'Generar todos los posts'; }
  if (stopBtn) stopBtn.style.display = 'none';
}

/* ── Claude: solo brief + prompt Gemini (caption ya existe) ── */
async function vsBatchGetPrompt(caption, intelligence, styleData, formatData) {
  var systemPrompt = intelligence + '\n\n'
    + 'VISUAL STUDIO - DIRECTOR CREATIVO (MODO BATCH)\n'
    + 'El caption ya esta escrito. Tu unica tarea: crear el prompt para Gemini Imagen 3 que mejor visualice la idea del caption.\n\n'
    + 'FORMATO: ' + formatData.label + '\n'
    + 'ESTILO: ' + styleData.label + ' - ' + styleData.desc + '\n\n'
    + 'REGLAS:\n'
    + '- Prompt en INGLES\n'
    + '- Incluir siempre: ' + styleData.gemini_hint + '\n'
    + '- NO incluir texto especifico (Gemini falla con texto exacto)\n'
    + '- Capturar la IDEA del caption visualmente\n'
    + '- Terminar con: high quality, 4K, professional social media content\n\n'
    + 'RESPONDE UNICAMENTE CON:\n'
    + '[PROMPT_GEMINI]\n'
    + '(el prompt completo en ingles, sin nada mas)';

  var body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 350,
    system: systemPrompt,
    messages: [{ role: 'user', content: 'Caption:\n' + caption }]
  };

  var data = await antFetch(body);
  var text = (data.content || []).map(function(b) { return b.text || ''; }).join('');
  var match = text.match(/\[PROMPT_GEMINI\]([\s\S]*?)$/);
  return { geminiPrompt: match ? match[1].trim() : text.trim() };
}

/* ── Gemini: generar imagen ── */
async function vsBatchGetImage(prompt, aspectRatio, key) {
  var resp = await fetch(
    'https://generativelanguage.googleapis.com/v1/models/imagen-3.0-generate-001:predict?key=' + key,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt: prompt }],
        parameters: { sampleCount: 1, aspectRatio: aspectRatio }
      })
    }
  );
  var data = await resp.json();
  if (data.error) throw new Error(data.error.message || 'Error Gemini');
  var pred = (data.predictions || [])[0];
  if (!pred || !pred.bytesBase64Encoded) {
    throw new Error('Gemini no devolvio imagen. Revisa el prompt o las politicas de contenido.');
  }
  return { b64: pred.bytesBase64Encoded, mime: pred.mimeType || 'image/png' };
}

/* ── Progreso ── */
function vsBatchSetProgress(done, total, msg) {
  var pct = total > 0 ? Math.round((done / total) * 100) : 0;
  var bar     = document.getElementById('vs-batch-bar');
  var status  = document.getElementById('vs-batch-status');
  var counter = document.getElementById('vs-batch-counter');
  if (bar)     bar.style.width = pct + '%';
  if (status)  status.textContent = msg;
  if (counter) counter.textContent = done + ' / ' + total;
}

/* ── Tarjeta de resultado ── */
function vsBatchCard(index, state, caption, imgResult, errorMsg) {
  var num   = index + 1;
  var short = (caption || '').slice(0, 100) + ((caption || '').length > 100 ? '...' : '');

  var stateEl = '';
  if (state === 'pending')  stateEl = '<span style="font-size:11px;color:var(--ht);padding:2px 8px;background:var(--sf2);border-radius:20px;border:1px solid var(--bd)">En cola</span>';
  if (state === 'briefing') stateEl = '<span style="font-size:11px;color:var(--purple);padding:2px 8px;background:#F3EFFF;border-radius:20px">Generando brief...</span>';
  if (state === 'imaging')  stateEl = '<span style="font-size:11px;color:#0891B2;padding:2px 8px;background:#ECFEFF;border-radius:20px">Generando imagen...</span>';
  if (state === 'done')     stateEl = '<span style="font-size:11px;color:var(--green);padding:2px 8px;background:#ECFDF5;border-radius:20px">Listo</span>';
  if (state === 'error')    stateEl = '<span style="font-size:11px;color:var(--red);padding:2px 8px;background:#FEF2F2;border-radius:20px">Error</span>';

  var imgCol = '';
  if (state === 'done' && imgResult) {
    var src = 'data:' + imgResult.mime + ';base64,' + imgResult.b64;
    imgCol = '<div style="flex:0 0 140px">'
      + '<img src="' + src + '" style="width:140px;height:140px;object-fit:cover;border-radius:var(--r);border:1px solid var(--bd);display:block" />'
      + '<button onclick="vsBatchDownload(' + index + ')" style="margin-top:6px;width:140px;padding:5px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Descargar</button>'
      + '</div>';
  } else if (state === 'briefing' || state === 'imaging') {
    imgCol = '<div style="flex:0 0 140px;height:140px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2);display:flex;align-items:center;justify-content:center"><div class="sp2"></div></div>';
  } else {
    imgCol = '<div style="flex:0 0 140px;height:140px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2);display:flex;align-items:center;justify-content:center;color:var(--ht);font-size:11px">Imagen</div>';
  }

  var captionCol = '';
  if (state === 'done') {
    captionCol = '<div style="font-size:12px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:160px;overflow-y:auto">' + escHtml(caption || '') + '</div>'
      + '<div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">'
      + '<button onclick="vsBatchCopyCaption(' + index + ')" style="padding:4px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button>'
      + '<button onclick="vsBatchShowFeedback(' + index + ')" id="vs-regen-toggle-' + index + '" style="padding:4px 10px;border:1px solid #FECACA;border-radius:var(--r);font-size:11px;cursor:pointer;background:#FEF2F2;color:var(--red);font-family:\'DM Sans\',sans-serif">No me convence</button>'
      + '</div>'
      + '<div id="vs-feedback-' + index + '" style="display:none;margin-top:8px">'
      + '<textarea id="vs-feedback-text-' + index + '" class="fi" style="min-height:52px;font-size:12px" placeholder="Ej: quiero algo mas abstracto, sin personas, tonos oscuros..."></textarea>'
      + '<button onclick="vsBatchRegenerateOne(' + index + ')" style="margin-top:6px;padding:5px 14px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:11px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Regenerar imagen</button>'
      + '</div>';
  } else if (state === 'error') {
    captionCol = '<div style="font-size:12px;color:var(--red);margin-bottom:6px">' + escHtml(errorMsg || 'Error desconocido') + '</div>'
      + '<div style="font-size:11px;color:var(--ht)">' + escHtml(short) + '</div>';
  } else {
    captionCol = '<div style="font-size:12px;color:var(--ht)">' + escHtml(short) + '</div>';
  }

  return '<div id="vs-batch-card-' + index + '" style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:14px;margin-bottom:10px">'
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">'
    + '<span style="font-size:13px;font-weight:600;color:var(--tx)">Post ' + num + '</span>'
    + stateEl
    + '</div>'
    + '<div style="display:flex;gap:14px;align-items:flex-start">'
    + imgCol
    + '<div style="flex:1;min-width:0">' + captionCol + '</div>'
    + '</div>'
    + '</div>';
}

/* ── Actualizar tarjeta en DOM ── */
function vsBatchUpdateCard(index, state, caption, imgResult, errorMsg) {
  var el = document.getElementById('vs-batch-card-' + index);
  if (!el) return;
  el.outerHTML = vsBatchCard(index, state, caption, imgResult, errorMsg);
  if (state === 'done' && imgResult) {
    if (!window.VS_BATCH_IMGS) window.VS_BATCH_IMGS = {};
    window.VS_BATCH_IMGS[index] = { b64: imgResult.b64, mime: imgResult.mime, caption: caption };
  }
}

function vsBatchDownload(index) {
  var d = window.VS_BATCH_IMGS && window.VS_BATCH_IMGS[index];
  if (!d) return;
  var ext = (d.mime || '').includes('png') ? 'png' : 'jpg';
  var a = document.createElement('a');
  a.href = 'data:' + d.mime + ';base64,' + d.b64;
  a.download = 'proximorol-batch-post' + (index + 1) + '-' + Date.now() + '.' + ext;
  a.click();
}

function vsBatchCopyCaption(index) {
  var d = window.VS_BATCH_IMGS && window.VS_BATCH_IMGS[index];
  if (!d || !d.caption) return;
  navigator.clipboard.writeText(d.caption).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = d.caption; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
}

function vsBatchStop() {
  VS_BATCH_STOP = true;
  var stopBtn = document.getElementById('vs-batch-stop-btn');
  if (stopBtn) { stopBtn.disabled = true; stopBtn.textContent = 'Deteniendo...'; }
}

/* ── Mostrar/ocultar formulario de feedback en tarjeta ── */
function vsBatchShowFeedback(index) {
  var feedbackDiv = document.getElementById('vs-feedback-' + index);
  var toggleBtn   = document.getElementById('vs-regen-toggle-' + index);
  if (!feedbackDiv) return;
  var visible = feedbackDiv.style.display !== 'none';
  feedbackDiv.style.display = visible ? 'none' : 'block';
  if (toggleBtn) toggleBtn.textContent = visible ? 'No me convence' : 'Cancelar';
  if (!visible) {
    var ta = document.getElementById('vs-feedback-text-' + index);
    if (ta) ta.focus();
  }
}

/* ── Regenerar imagen de una tarjeta con feedback ── */
async function vsBatchRegenerateOne(index) {
  var feedbackEl = document.getElementById('vs-feedback-text-' + index);
  var feedback   = feedbackEl ? feedbackEl.value.trim() : '';
  var key = (typeof CFG !== 'undefined') ? CFG.geminiKey : '';
  if (!key) { alert('Configura tu Gemini API Key en Settings.'); return; }

  var d = window.VS_BATCH_IMGS && window.VS_BATCH_IMGS[index];
  var caption = d ? d.caption : '';

  /* Bloquear botón */
  var regenBtn = document.querySelector('#vs-feedback-' + index + ' button');
  if (regenBtn) { regenBtn.disabled = true; regenBtn.textContent = 'Regenerando...'; }

  /* Actualizar la miniatura con spinner mientras genera */
  var card = document.getElementById('vs-batch-card-' + index);
  if (card) {
    var imgDiv = card.querySelector('img');
    if (imgDiv) {
      imgDiv.style.opacity = '0.3';
      imgDiv.style.filter  = 'blur(2px)';
    }
  }

  try {
    var intelligence = vsGetIntelligenceContext();
    var styleData    = VS_STYLES[VS_STYLE];
    var formatData   = VS_FORMATS[VS_FORMAT];

    var systemPrompt = intelligence + '\n\n'
      + 'VISUAL STUDIO - REGENERACION CON FEEDBACK\n'
      + 'La imagen anterior no convencio. Genera un nuevo prompt para Gemini Imagen 3 aplicando el feedback.\n\n'
      + 'FORMATO: ' + formatData.label + '\n'
      + 'ESTILO BASE: ' + styleData.label + ' - ' + styleData.desc + '\n\n'
      + 'FEEDBACK DEL USUARIO: ' + (feedback || 'Regenerar con variacion diferente') + '\n\n'
      + 'REGLAS: prompt en INGLES, incluir: ' + styleData.gemini_hint + ', terminar con: high quality, 4K, professional social media content\n\n'
      + 'RESPONDE UNICAMENTE CON:\n[PROMPT_GEMINI]\n(el prompt nuevo aplicando el feedback)';

    var body = {
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Caption: ' + caption + '\nFeedback: ' + (feedback || 'Variar el concepto visual') }]
    };

    var data = await antFetch(body);
    var text  = (data.content || []).map(function(b) { return b.text || ''; }).join('');
    var match = text.match(/\[PROMPT_GEMINI\]([\s\S]*?)$/);
    var newPrompt = match ? match[1].trim() : text.trim();

    var imgResult = await vsBatchGetImage(newPrompt, formatData.gemini, key);
    vsBatchUpdateCard(index, 'done', caption, imgResult, null);

  } catch(e) {
    if (regenBtn) { regenBtn.disabled = false; regenBtn.textContent = 'Regenerar imagen'; }
    var c = document.getElementById('vs-batch-card-' + index);
    if (c) {
      var img = c.querySelector('img');
      if (img) { img.style.opacity = '1'; img.style.filter = ''; }
    }
    alert('Error al regenerar: ' + e.message);
  }
}

/* ═══════════════════════════════════════════════
   CONTROLES
   ═══════════════════════════════════════════════ */
function vsSetMode(m) {
  VS_MODE = m;
  window.VS_BATCH_IMGS = {};
  var el = document.getElementById('vs-main');
  if (el) vsRender(el);
}

function vsSetFormat(f) {
  VS_FORMAT = f;
  var el = document.getElementById('vs-main');
  if (el) vsRender(el);
}

function vsSetStyle(s) {
  VS_STYLE = s;
  var el = document.getElementById('vs-main');
  if (el) vsRender(el);
}

function vsSetBatchStyle(s) {
  VS_STYLE = s;
  var inputEl = document.getElementById('vs-batch-input');
  var savedText = inputEl ? inputEl.value : '';
  var el = document.getElementById('vs-main');
  if (el) {
    vsRender(el);
    var newInput = document.getElementById('vs-batch-input');
    if (newInput && savedText) newInput.value = savedText;
  }
}

/* ═══════════════════════════════════════════════
   SINGLE — Brief
   ═══════════════════════════════════════════════ */
async function vsGenerateBrief() {
  var conceptEl = document.getElementById('vs-concept');
  var concept   = conceptEl ? conceptEl.value.trim() : '';
  if (!concept) { alert('Escribe el concepto o tema del post.'); return; }

  var btn = document.getElementById('vs-brief-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando brief...'; }

  var step2 = document.getElementById('vs-step2');
  if (step2) step2.innerHTML = '<div class="ld"><div class="sp2"></div>Claude esta creando el brief creativo...</div>';

  try {
    var intelligence = vsGetIntelligenceContext();
    var styleData    = VS_STYLES[VS_STYLE];
    var formatData   = VS_FORMATS[VS_FORMAT];

    var systemPrompt = intelligence + '\n\n'
      + 'VISUAL STUDIO - DIRECTOR CREATIVO\n'
      + 'Convierte el concepto en: (1) brief creativo, (2) prompt Gemini Imagen 3, (3) caption Instagram.\n\n'
      + 'FORMATO: ' + formatData.label + ' (' + formatData.w + 'x' + formatData.h + 'px)\n'
      + 'ESTILO: ' + styleData.label + ' - ' + styleData.desc + '\n\n'
      + 'REGLAS PROMPT: en INGLES, incluir: ' + styleData.gemini_hint + ', terminar con: high quality, 4K, professional social media content\n\n'
      + 'FORMATO DE RESPUESTA EXACTO:\n'
      + '[BRIEF]\nConcepto visual: ...\nPaleta: ...\nComposicion: ...\nTexto a incluir: ...\nMood: ...\n\n'
      + '[PROMPT_GEMINI]\n(prompt completo en ingles)\n\n'
      + '[CAPTION]\n(caption completo para Instagram siguiendo la voz de marca)';

    var data = await antFetch({
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Concepto: ' + concept }]
    });

    var text = (data.content || []).map(function(b) { return b.text || ''; }).join('');
    var briefMatch   = text.match(/\[BRIEF\]([\s\S]*?)(?=\[PROMPT_GEMINI\]|$)/);
    var promptMatch  = text.match(/\[PROMPT_GEMINI\]([\s\S]*?)(?=\[CAPTION\]|$)/);
    var captionMatch = text.match(/\[CAPTION\]([\s\S]*?)$/);

    VS_BRIEF      = briefMatch   ? briefMatch[1].trim()   : text;
    VS_IMG_PROMPT = promptMatch  ? promptMatch[1].trim()  : '';
    VS_CAPTION    = captionMatch ? captionMatch[1].trim() : '';
    vsSave();

    var hasKey = !!(typeof CFG !== 'undefined' && CFG.geminiKey);
    var step2el = document.getElementById('vs-step2');
    if (step2el) {
      var html = '';
      if (VS_BRIEF) {
        html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Brief creativo</span><span class="bg bg-p">Claude</span></div>'
          + '<div style="margin-top:10px;font-size:13px;line-height:1.7;color:var(--tx);white-space:pre-wrap">' + escHtml(VS_BRIEF) + '</div></div>';
      }
      if (VS_IMG_PROMPT) {
        html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Prompt para Gemini</span><span class="bg bg-b">Editable</span></div>'
          + '<div style="margin-top:10px"><textarea id="vs-img-prompt" class="fi" style="min-height:90px;font-size:12px;font-family:monospace;line-height:1.5">' + escHtml(VS_IMG_PROMPT) + '</textarea></div>'
          + '<div style="margin-top:10px;display:flex;gap:10px;align-items:center">'
          + '<button onclick="vsGenerateImage()" id="vs-gen-img-btn" style="padding:9px 18px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif' + (!hasKey ? ';opacity:.5' : '') + '" ' + (!hasKey ? 'disabled' : '') + '>Generar imagen con Gemini</button>'
          + '<span style="font-size:11px;color:var(--ht)">Gemini Imagen 3 - ' + VS_FORMATS[VS_FORMAT].label + '</span>'
          + '</div></div>';
      }
      if (VS_CAPTION) {
        html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Caption generado</span><span class="bg bg-g">Instagram</span></div>'
          + '<div style="margin-top:10px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:280px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
          + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button>'
          + '</div>';
      }
      step2el.innerHTML = html;
    }

  } catch(e) {
    var step2err = document.getElementById('vs-step2');
    if (step2err) step2err.innerHTML = '<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B"><strong>Error:</strong> ' + escHtml(e.message) + '</div>';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generar brief + prompt'; }
  }
}

/* ═══════════════════════════════════════════════
   SINGLE — Generar imagen
   ═══════════════════════════════════════════════ */
async function vsGenerateImage() {
  var promptEl = document.getElementById('vs-img-prompt');
  var prompt   = promptEl ? promptEl.value.trim() : VS_IMG_PROMPT;
  if (!prompt) { alert('No hay prompt. Genera el brief primero.'); return; }

  var key = (typeof CFG !== 'undefined') ? CFG.geminiKey : '';
  if (!key) { alert('Configura tu Gemini API Key en Settings.'); return; }

  var btn = document.getElementById('vs-gen-img-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando imagen...'; }

  var previewEl = document.getElementById('vs-img-preview');
  if (previewEl) previewEl.innerHTML = '<div class="ld"><div class="sp2"></div>Gemini Imagen 3 esta generando... (~10-20s)</div>';

  try {
    var imgResult = await vsBatchGetImage(prompt, VS_FORMATS[VS_FORMAT].gemini, key);
    VS_IMG_B64  = imgResult.b64;
    VS_IMG_MIME = imgResult.mime;
    vsSave();
    if (previewEl) previewEl.innerHTML = vsRenderResult(true);
    var captionArea = document.getElementById('vs-caption-area');
    if (captionArea && VS_CAPTION) {
      captionArea.innerHTML = '<div style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:300px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
        + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button>';
    }
  } catch(e) {
    if (previewEl) previewEl.innerHTML = '<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B"><strong>Error Gemini:</strong> ' + escHtml(e.message) + '</div>';
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'Generar imagen con Gemini'; }
  }
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function vsRenderResult(animate) {
  if (!VS_IMG_B64) return '';
  var src  = 'data:' + VS_IMG_MIME + ';base64,' + VS_IMG_B64;
  var anim = animate ? 'animation:fadeIn .4s ease;' : '';
  return '<div style="' + anim + '">'
    + '<img src="' + src + '" style="width:100%;border-radius:var(--r);border:1px solid var(--bd);display:block" />'
    + '<div style="margin-top:8px;display:flex;gap:6px">'
    + '<button onclick="vsDownloadImage()" style="flex:1;padding:7px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Descargar imagen</button>'
    + '<button onclick="vsGenerateImage()" style="padding:7px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt)" title="Regenerar">&#x1F504;</button>'
    + '</div></div>';
}

function vsDownloadImage() {
  if (!VS_IMG_B64) return;
  var ext = VS_IMG_MIME.includes('png') ? 'png' : 'jpg';
  var a   = document.createElement('a');
  a.href  = 'data:' + VS_IMG_MIME + ';base64,' + VS_IMG_B64;
  a.download = 'proximorol-ig-' + VS_FORMAT.replace(':', 'x') + '-' + Date.now() + '.' + ext;
  a.click();
}

function vsCopyCaption() {
  if (!VS_CAPTION) return;
  navigator.clipboard.writeText(VS_CAPTION).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = VS_CAPTION; document.body.appendChild(ta); ta.select();
    document.execCommand('copy'); document.body.removeChild(ta);
  });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
