/* ═══════════════════════════════════════════════════════════════
   VISUAL STUDIO — Generador de contenido visual para Instagram
   Depends on: core.js, identity_block.js
   ═══════════════════════════════════════════════════════════════ */

const VS_STORE = 'pr_visual_studio_v1';

/* ── Estado del módulo ── */
let VS_FORMAT     = '1:1';
let VS_STYLE      = 'tipografico';
let VS_BRIEF      = '';
let VS_IMG_PROMPT = '';
let VS_CAPTION    = '';
let VS_IMG_B64    = '';
let VS_IMG_MIME   = 'image/png';

/* ── Estilos visuales disponibles ── */
const VS_STYLES = {
  tipografico: {
    label: 'Bold / Tipográfico',
    icon: '✏️',
    desc: 'Texto impactante como protagonista. Fondo limpio, tipografía grande. Ideal para frases, datos y ganchos.',
    gemini_hint: 'Bold typography as the hero, clean minimal background, strong contrast, modern sans-serif font, professional coaching brand aesthetic, Instagram feed post'
  },
  minimalista: {
    label: 'Minimalista',
    icon: '⬜',
    desc: 'Espacios en blanco, paleta limitada. Transmite sofisticación y claridad.',
    gemini_hint: 'Minimalist design, lots of white space, limited color palette (2-3 colors), subtle geometric elements, premium feel, clean and modern'
  },
  datos: {
    label: 'Datos / Infografía',
    icon: '📊',
    desc: 'Estadísticas y cifras visualizadas. Autoridad a través de números concretos.',
    gemini_hint: 'Data visualization infographic style, clean charts or stats layout, professional color scheme, easy to read numbers and percentages, modern flat design'
  },
  fotografico: {
    label: 'Fotográfico',
    icon: '📸',
    desc: 'Imagen realista de persona o escena laboral con texto superpuesto.',
    gemini_hint: 'Realistic professional photography style, office or interview setting, natural lighting, authentic candid feel, with space for text overlay, editorial quality'
  }
};

/* ── Formatos ── */
const VS_FORMATS = {
  '1:1':  { label: 'Feed (1:1)',    w: 1080, h: 1080, gemini: '1:1' },
  '9:16': { label: 'Story (9:16)', w: 1080, h: 1920, gemini: '9:16' },
  '4:5':  { label: 'Portrait (4:5)', w: 1080, h: 1350, gemini: '4:5' }
};

/* ═══════════════════════════════════════════════
   INTELIGENCIA CRUZADA — Lee otros módulos
   ═══════════════════════════════════════════════ */
function vsGetIntelligenceContext() {
  var parts = [];

  /* 1. Brand identity — siempre disponible */
  try {
    var brand = (typeof biGetContext === 'function') ? biGetContext() : '';
    if (brand) parts.push(brand);
  } catch(e) {}

  /* 2. Top keywords del módulo Intelligence (si está cargado en DOM) */
  try {
    var kwRows = Array.from(document.querySelectorAll('#kw-table tbody tr')).slice(0, 5);
    var keywords = kwRows.map(function(r) {
      return r.cells[0] ? r.cells[0].textContent.trim() : '';
    }).filter(Boolean);
    if (keywords.length > 0) {
      parts.push('TOP KEYWORDS ACTIVOS (usa estos temas cuando sea relevante):\n' + keywords.map(function(k) { return '• ' + k; }).join('\n'));
    }
  } catch(e) {}

  /* 3. Métricas Instagram (si el módulo está cargado) */
  try {
    var igKpis = document.querySelectorAll('#ig-main .kc');
    var igMetrics = [];
    igKpis.forEach(function(kpi) {
      var val = kpi.querySelector('.kv');
      var lbl = kpi.querySelector('.kl');
      if (val && lbl) igMetrics.push(lbl.textContent.trim() + ': ' + val.textContent.trim());
    });
    if (igMetrics.length > 0) {
      parts.push('MÉTRICAS ACTUALES DE INSTAGRAM:\n' + igMetrics.slice(0, 4).join(' | '));
    }
  } catch(e) {}

  /* 4. Recomendaciones de Intelligence (si hay) */
  try {
    var recTitles = Array.from(document.querySelectorAll('.rec-title')).slice(0, 3)
      .map(function(el) { return el.textContent.trim(); }).filter(Boolean);
    if (recTitles.length > 0) {
      parts.push('PRIORIDADES ESTRATÉGICAS ACTIVAS:\n' + recTitles.map(function(t) { return '• ' + t; }).join('\n'));
    }
  } catch(e) {}

  return parts.join('\n\n');
}

/* ═══════════════════════════════════════════════
   PERSISTENCIA
   ═══════════════════════════════════════════════ */
function vsSave() {
  try {
    localStorage.setItem(VS_STORE, JSON.stringify({
      format: VS_FORMAT,
      style: VS_STYLE,
      brief: VS_BRIEF,
      imgPrompt: VS_IMG_PROMPT,
      caption: VS_CAPTION,
      imgB64: VS_IMG_B64,
      imgMime: VS_IMG_MIME,
      savedAt: new Date().toISOString()
    }));
  } catch(e) {}
}

function vsLoadSaved() {
  try {
    var s = localStorage.getItem(VS_STORE);
    return s ? JSON.parse(s) : null;
  } catch(e) { return null; }
}

/* ═══════════════════════════════════════════════
   ENTRY POINT
   ═══════════════════════════════════════════════ */
function loadVisualStudio() {
  var el = document.getElementById('vs-main');
  if (!el) return;

  var saved = vsLoadSaved();
  if (saved) {
    VS_FORMAT     = saved.format     || '1:1';
    VS_STYLE      = saved.style      || 'tipografico';
    VS_BRIEF      = saved.brief      || '';
    VS_IMG_PROMPT = saved.imgPrompt  || '';
    VS_CAPTION    = saved.caption    || '';
    VS_IMG_B64    = saved.imgB64     || '';
    VS_IMG_MIME   = saved.imgMime    || 'image/png';
  }

  vsRender(el);
}

/* ═══════════════════════════════════════════════
   RENDER PRINCIPAL
   ═══════════════════════════════════════════════ */
function vsRender(el) {
  var hasKey = !!(typeof CFG !== 'undefined' && CFG.geminiKey);
  var hasAnthropic = !!(typeof CFG !== 'undefined' && CFG.ak);

  var formatBtns = Object.keys(VS_FORMATS).map(function(k) {
    var f = VS_FORMATS[k];
    var active = VS_FORMAT === k ? 'background:var(--purple);color:white;border-color:var(--purple);' : 'background:var(--sf2);color:var(--mt);';
    return '<button onclick="vsSetFormat(\'' + k + '\')" style="' + active + 'border:1px solid var(--bd2);border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' + f.label + '</button>';
  }).join('');

  var styleBtns = Object.keys(VS_STYLES).map(function(k) {
    var s = VS_STYLES[k];
    var active = VS_STYLE === k
      ? 'border-color:var(--purple);background:var(--sf2);'
      : 'border-color:var(--bd);background:transparent;';
    return '<button onclick="vsSetStyle(\'' + k + '\')" style="' + active + 'border:1px solid;border-radius:var(--r);padding:8px 12px;font-size:12px;cursor:pointer;text-align:left;font-family:\'DM Sans\',sans-serif;color:var(--tx)">'
      + '<span style="font-size:16px;display:block;margin-bottom:3px">' + s.icon + '</span>'
      + '<span style="font-weight:500;font-size:12px">' + s.label + '</span>'
      + '</button>';
  }).join('');

  /* No-key warning */
  var geminiWarning = !hasKey
    ? '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#92400E;margin-bottom:16px">'
      + '⚠️ <strong>Gemini API Key no configurada.</strong> Puedes generar el brief creativo con Claude, pero la generaci&oacute;n de imagen requiere la clave de Gemini.'
      + ' <button onclick="showP(\'settings\',null)" style="margin-left:8px;padding:3px 10px;border:1px solid #D97706;border-radius:4px;background:white;font-size:11px;cursor:pointer;color:#92400E">Ir a Settings &rarr;</button>'
      + '</div>'
    : '';

  var anthropicWarning = !hasAnthropic
    ? '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#991B1B;margin-bottom:16px">'
      + '&#x26A0;&#xFE0F; <strong>Anthropic API Key no configurada.</strong> Necesaria para generar el brief creativo.'
      + ' <button onclick="showP(\'settings\',null)" style="margin-left:8px;padding:3px 10px;border:1px solid #DC2626;border-radius:4px;background:white;font-size:11px;cursor:pointer;color:#991B1B">Ir a Settings &rarr;</button>'
      + '</div>'
    : '';

  /* Context chips */
  var hasIG = document.querySelectorAll('#ig-main .kc').length > 0;
  var hasKW = document.querySelectorAll('#kw-table tbody tr').length > 0;
  var chips = '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;background:var(--purple-soft,#F3EFFF);color:var(--purple)">&#x1F516; Identidad de marca</span> '
    + (hasKW ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;background:#ECFDF5;color:var(--green)">&#x1F50D; Keywords activas</span> ' : '')
    + (hasIG ? '<span style="display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:500;background:#FFF0F9;color:#BE185D">&#x1F4F8; M&eacute;tricas IG</span> ' : '');

  /* Previous result */
  var prevResult = VS_IMG_B64
    ? vsRenderResult(false)
    : '<div style="display:flex;align-items:center;justify-content:center;height:180px;color:var(--ht);font-size:13px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2)">La imagen generada aparecer&aacute; aqu&iacute;</div>';

  var prevCaption = VS_CAPTION
    ? '<div id="vs-caption-box" style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:300px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
    + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">&#x1F4CB; Copiar caption</button>'
    : '<div style="display:flex;align-items:center;justify-content:center;height:80px;color:var(--ht);font-size:13px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2)">El caption aparecer&aacute; aqu&iacute;</div>';

  var prevBriefSection = VS_BRIEF
    ? '<div class="cd" style="margin-bottom:16px">'
      + '<div class="ch"><span class="ct">&#x1F4DD; Brief creativo generado</span><span class="bg bg-p">Claude</span></div>'
      + '<div id="vs-brief-content" style="margin-top:10px;font-size:13px;line-height:1.7;color:var(--tx);white-space:pre-wrap">' + escHtml(VS_BRIEF) + '</div>'
      + '</div>'
    : '';

  var prevPromptSection = VS_IMG_PROMPT
    ? '<div class="cd" style="margin-bottom:16px">'
      + '<div class="ch"><span class="ct">&#x2728; Prompt para Gemini</span><span class="bg bg-b">Editable</span></div>'
      + '<div style="margin-top:10px"><textarea id="vs-img-prompt" class="fi" style="min-height:80px;font-size:12px;font-family:monospace;line-height:1.5">' + escHtml(VS_IMG_PROMPT) + '</textarea></div>'
      + '<div style="margin-top:10px;display:flex;gap:8px;align-items:center">'
      + '<button onclick="vsGenerateImage()" id="vs-gen-img-btn" style="padding:9px 18px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif;' + (!hasKey ? 'opacity:.5;cursor:not-allowed;' : '') + '" ' + (!hasKey ? 'disabled' : '') + '>&#x1F5BC; Generar imagen</button>'
      + '<span style="font-size:11px;color:var(--ht)">Gemini Imagen 3 &middot; ' + VS_FORMATS[VS_FORMAT].label + '</span>'
      + '</div>'
      + '</div>'
    : '';

  el.innerHTML = anthropicWarning + geminiWarning

    /* ── HEADER ── */
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:8px">'
    + '<div>'
    + '<h2 style="font-size:16px;font-weight:600;color:var(--tx);margin:0">&#x1F3A8; Visual Studio</h2>'
    + '<p style="font-size:12px;color:var(--ht);margin:3px 0 0">Concepto &rarr; Brief &rarr; Imagen &rarr; Caption &middot; Para Instagram</p>'
    + '</div>'
    + '<div style="display:flex;gap:6px;flex-wrap:wrap">' + formatBtns + '</div>'
    + '</div>'

    /* ── CONTEXTO ACTIVO ── */
    + '<div style="margin-bottom:16px;display:flex;align-items:center;gap:8px;flex-wrap:wrap">'
    + '<span style="font-size:11px;color:var(--ht);font-weight:500">Contexto activo:</span>'
    + chips
    + '</div>'

    /* ── PASO 1: INPUT ── */
    + '<div class="cd" style="margin-bottom:16px">'
    + '<div class="ch"><span class="ct">Paso 1 &mdash; Concepto del post</span><span class="bg bg-p">Claude genera el brief</span></div>'
    + '<div style="margin-top:12px">'
    + '<label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:6px">Tema o concepto</label>'
    + '<textarea id="vs-concept" class="fi" style="min-height:70px" placeholder="Ej: El 73% de los reclutadores decide en los primeros 30 segundos. Qu\u00e9 hace tu perfil en ese tiempo.">' + escHtml(VS_BRIEF ? '' : '') + '</textarea>'
    + '</div>'
    + '<div style="margin-top:12px">'
    + '<label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:8px">Estilo visual</label>'
    + '<div style="display:flex;gap:8px;flex-wrap:wrap">' + styleBtns + '</div>'
    + '</div>'
    + '<div style="margin-top:12px">'
    + '<button onclick="vsGenerateBrief()" id="vs-brief-btn" style="padding:9px 20px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">&#x2728; Generar brief + prompt</button>'
    + '</div>'
    + '</div>'

    /* ── PASO 2: BRIEF + PROMPT ── */
    + '<div id="vs-step2">'
    + prevBriefSection
    + prevPromptSection
    + '</div>'

    /* ── PASO 3: RESULTADO ── */
    + '<div class="cd">'
    + '<div class="ch"><span class="ct">Resultado</span><span class="bg bg-g">Imagen + Caption</span></div>'
    + '<div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap">'
    + '<div id="vs-img-preview" style="flex:1;min-width:220px">' + prevResult + '</div>'
    + '<div id="vs-caption-area" style="flex:1;min-width:220px">' + prevCaption + '</div>'
    + '</div>'
    + '</div>';
}

/* ═══════════════════════════════════════════════
   CONTROLES DE FORMATO Y ESTILO
   ═══════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════
   PASO 1 — CLAUDE: Brief + Prompt + Caption
   ═══════════════════════════════════════════════ */
async function vsGenerateBrief() {
  var conceptEl = document.getElementById('vs-concept');
  var concept = conceptEl ? conceptEl.value.trim() : '';
  if (!concept) {
    alert('Escribe el concepto o tema del post antes de continuar.');
    return;
  }

  var btn = document.getElementById('vs-brief-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando brief...'; }

  var step2 = document.getElementById('vs-step2');
  if (step2) {
    step2.innerHTML = '<div class="ld"><div class="sp2"></div>Claude est&aacute; creando el brief creativo&hellip;</div>';
  }

  try {
    var intelligence = vsGetIntelligenceContext();
    var styleData = VS_STYLES[VS_STYLE];
    var formatData = VS_FORMATS[VS_FORMAT];

    var systemPrompt = intelligence + '\n\n'
      + '═══════════════════════════════════════════════\n'
      + 'VISUAL STUDIO — DIRECTOR CREATIVO\n'
      + '═══════════════════════════════════════════════\n'
      + 'Eres el director creativo de Próximo Rol. Tu trabajo es convertir un concepto en:\n'
      + '1. Un brief creativo claro para el diseñador\n'
      + '2. Un prompt optimizado para Gemini Imagen 3\n'
      + '3. El caption final para Instagram\n\n'
      + 'FORMATO DE LA PIEZA: ' + formatData.label + ' (' + formatData.w + 'x' + formatData.h + 'px)\n'
      + 'ESTILO VISUAL: ' + styleData.label + ' — ' + styleData.desc + '\n\n'
      + 'REGLAS PARA EL PROMPT DE IMAGEN:\n'
      + '- El prompt debe ser en INGLÉS (Gemini funciona mejor)\n'
      + '- Incluir siempre: ' + styleData.gemini_hint + '\n'
      + '- NO incluir texto específico en la imagen (Gemini falla con texto preciso)\n'
      + '- Si el estilo es tipográfico, indicar "placeholder text area" para el texto\n'
      + '- Terminar siempre con: high quality, 4K, professional social media content\n\n'
      + 'FORMATO DE RESPUESTA (exactamente este orden):\n'
      + '[BRIEF]\n'
      + 'Concepto visual: (1-2 frases que describan la imagen)\n'
      + 'Paleta: (3 colores específicos con hex o nombre)\n'
      + 'Composición: (descripción de layout)\n'
      + 'Texto a incluir: (copy exacto si hay texto en imagen, o "ninguno")\n'
      + 'Mood: (3 adjetivos)\n\n'
      + '[PROMPT_GEMINI]\n'
      + '(el prompt completo en inglés, listo para usar)\n\n'
      + '[CAPTION]\n'
      + '(el caption completo para Instagram, siguiendo la voz de marca)';

    var body = {
      model: 'claude-opus-4-5',
      max_tokens: 1200,
      system: systemPrompt,
      messages: [{ role: 'user', content: 'Concepto: ' + concept }]
    };

    var data = await antFetch(body);
    var text = (data.content || []).map(function(b) { return b.text || ''; }).join('');

    /* Parse sections */
    var briefMatch = text.match(/\[BRIEF\]([\s\S]*?)(?=\[PROMPT_GEMINI\]|$)/);
    var promptMatch = text.match(/\[PROMPT_GEMINI\]([\s\S]*?)(?=\[CAPTION\]|$)/);
    var captionMatch = text.match(/\[CAPTION\]([\s\S]*?)$/);

    VS_BRIEF      = briefMatch   ? briefMatch[1].trim()   : text;
    VS_IMG_PROMPT = promptMatch  ? promptMatch[1].trim()  : '';
    VS_CAPTION    = captionMatch ? captionMatch[1].trim() : '';

    vsSave();

    /* Render step 2 */
    var hasKey = !!(typeof CFG !== 'undefined' && CFG.geminiKey);
    var step2el = document.getElementById('vs-step2');
    if (step2el) {
      step2el.innerHTML = ''

        + '<div class="cd" style="margin-bottom:16px">'
        + '<div class="ch"><span class="ct">&#x1F4DD; Brief creativo</span><span class="bg bg-p">Claude</span></div>'
        + '<div style="margin-top:10px;font-size:13px;line-height:1.7;color:var(--tx);white-space:pre-wrap">' + escHtml(VS_BRIEF) + '</div>'
        + '</div>'

        + (VS_IMG_PROMPT
          ? '<div class="cd" style="margin-bottom:16px">'
            + '<div class="ch"><span class="ct">&#x2728; Prompt para Gemini</span><span class="bg bg-b">Editable</span></div>'
            + '<div style="margin-top:10px"><textarea id="vs-img-prompt" class="fi" style="min-height:90px;font-size:12px;font-family:monospace;line-height:1.5">' + escHtml(VS_IMG_PROMPT) + '</textarea></div>'
            + '<div style="margin-top:10px;display:flex;gap:10px;align-items:center">'
            + '<button onclick="vsGenerateImage()" id="vs-gen-img-btn" style="padding:9px 18px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif;' + (!hasKey ? 'opacity:.5;cursor:not-allowed;' : '') + '" ' + (!hasKey ? 'disabled title="Configura tu Gemini API Key en Settings"' : '') + '>&#x1F5BC; Generar imagen con Gemini</button>'
            + '<span style="font-size:11px;color:var(--ht)">Gemini Imagen 3 &middot; ' + VS_FORMATS[VS_FORMAT].label + '</span>'
            + '</div>'
            + '</div>'
          : '')

        + (VS_CAPTION
          ? '<div class="cd" style="margin-bottom:16px">'
            + '<div class="ch"><span class="ct">&#x1F4AC; Caption generado</span><span class="bg bg-g">Instagram</span></div>'
            + '<div style="margin-top:10px">'
            + '<div id="vs-caption-box" style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:280px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
            + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">&#x1F4CB; Copiar caption</button>'
            + '</div>'
            + '</div>'
          : '');
    }

  } catch(e) {
    var step2err = document.getElementById('vs-step2');
    if (step2err) {
      step2err.innerHTML = '<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B">'
        + '<strong>Error al generar brief:</strong> ' + escHtml(e.message)
        + '</div>';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '\u2728 Generar brief + prompt'; }
  }
}

/* ═══════════════════════════════════════════════
   PASO 2 — GEMINI IMAGEN 3: Generar imagen
   ═══════════════════════════════════════════════ */
async function vsGenerateImage() {
  var promptEl = document.getElementById('vs-img-prompt');
  var prompt = promptEl ? promptEl.value.trim() : VS_IMG_PROMPT;
  if (!prompt) { alert('No hay prompt para la imagen. Genera el brief primero.'); return; }

  var key = (typeof CFG !== 'undefined') ? CFG.geminiKey : '';
  if (!key) {
    alert('Configura tu Gemini API Key en Settings para generar imágenes.');
    return;
  }

  var btn = document.getElementById('vs-gen-img-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando imagen...'; }

  var previewEl = document.getElementById('vs-img-preview');
  if (previewEl) {
    previewEl.innerHTML = '<div class="ld"><div class="sp2"></div>Gemini Imagen 3 est&aacute; generando&hellip; (~10-20s)</div>';
  }

  try {
    var aspectRatio = VS_FORMATS[VS_FORMAT] ? VS_FORMATS[VS_FORMAT].gemini : '1:1';

    var resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=' + key,
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

    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error));

    var prediction = (data.predictions || [])[0];
    if (!prediction || !prediction.bytesBase64Encoded) {
      throw new Error('Gemini no devolvió imagen. Revisa que el prompt no viole las políticas de contenido.');
    }

    VS_IMG_B64  = prediction.bytesBase64Encoded;
    VS_IMG_MIME = prediction.mimeType || 'image/png';
    vsSave();

    /* Render result */
    if (previewEl) {
      previewEl.innerHTML = vsRenderResult(true);
    }

    /* Also update caption area if present */
    var captionArea = document.getElementById('vs-caption-area');
    if (captionArea && VS_CAPTION) {
      captionArea.innerHTML = '<div id="vs-caption-box" style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:300px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div>'
        + '<button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">&#x1F4CB; Copiar caption</button>';
    }

  } catch(e) {
    if (previewEl) {
      previewEl.innerHTML = '<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B">'
        + '<strong>Error Gemini:</strong> ' + escHtml(e.message)
        + '<br><small>Verifica tu API Key en Settings y que el prompt no contenga contenido restringido.</small>'
        + '</div>';
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '\uD83D\uDDBC Generar imagen con Gemini'; }
  }
}

/* ═══════════════════════════════════════════════
   RENDER RESULTADO — Imagen generada
   ═══════════════════════════════════════════════ */
function vsRenderResult(animate) {
  if (!VS_IMG_B64) return '';
  var src = 'data:' + VS_IMG_MIME + ';base64,' + VS_IMG_B64;
  var anim = animate ? 'animation:fadeIn .4s ease;' : '';
  return '<div style="' + anim + '">'
    + '<img src="' + src + '" style="width:100%;border-radius:var(--r);border:1px solid var(--bd);display:block" alt="Imagen generada" />'
    + '<div style="margin-top:8px;display:flex;gap:6px">'
    + '<button onclick="vsDownloadImage()" style="flex:1;padding:7px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">&#x2B07; Descargar imagen</button>'
    + '<button onclick="vsRegenerateImage()" style="padding:7px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif" title="Regenerar con el mismo prompt">&#x1F504;</button>'
    + '</div>'
    + '</div>';
}

/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */
function vsDownloadImage() {
  if (!VS_IMG_B64) return;
  var a = document.createElement('a');
  a.href = 'data:' + VS_IMG_MIME + ';base64,' + VS_IMG_B64;
  var ext = VS_IMG_MIME.includes('png') ? 'png' : 'jpg';
  a.download = 'proximorol-ig-' + VS_FORMAT.replace(':', 'x') + '-' + Date.now() + '.' + ext;
  a.click();
}

function vsRegenerateImage() {
  vsGenerateImage();
}

function vsCopyCaption() {
  if (!VS_CAPTION) return;
  navigator.clipboard.writeText(VS_CAPTION).then(function() {
    var btn = document.activeElement;
    var orig = btn.textContent;
    btn.textContent = '\u2713 Copiado';
    setTimeout(function() { btn.textContent = orig; }, 2000);
  }).catch(function() {
    var ta = document.createElement('textarea');
    ta.value = VS_CAPTION;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function escHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
