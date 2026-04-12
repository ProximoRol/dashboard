/* ═══════════════════════════════════════════════════════════════
   VISUAL STUDIO UI — Solo interfaz
   Claude briefs via backend proxy. DALL-E via dalle-proxy.
   Depends on: core.js (apiFetch, API_BASE)
   ═══════════════════════════════════════════════════════════════ */

const VS_STORE     = 'pr_visual_studio_v1';
const VS_REF_STORE = 'pr_vs_refs_v1';

/* ── Estado ── */
let VS_MODE       = 'single';
let VS_FORMAT     = '1:1';
let VS_STYLE      = 'fondo';
let VS_BRIEF      = '';
let VS_IMG_PROMPT = '';
let VS_CAPTION    = '';
let VS_IMG_B64    = '';
let VS_IMG_MIME   = 'image/png';
let VS_BATCH_RUNNING = false;
let VS_BATCH_STOP    = false;
let VS_REFS_OPEN     = null;

const VS_STYLES = {
  fondo:          { label:'Fondo limpio',        color:'#E8F4F8', textColor:'#1E6B8C', desc:'Fondo con atmosfera y espacio vacio. Añades texto en Canva.', prompt_guide:'clean editorial background, soft warm bokeh, professional atmosphere, large empty negative space for text overlay, no people, no text, minimal', ref_prompts:['Minimal warm office bokeh background, beige and cream tones, large empty center space, editorial, no people','Abstract soft blue gradient background, professional modern, empty space, clean minimal, no text','Blurred coworking space background, natural window light, neutral warm tones, copy space top, clean','Morning light through window, soft white bokeh, warm minimal, empty professional space, no objects'] },
  escena:         { label:'Escena laboral',      color:'#EDF2FF', textColor:'#3B5BDB', desc:'Persona en entrevista u oficina. Espacio lateral para texto.', prompt_guide:'photorealistic professional scene, person in job interview or modern office, natural window light, shallow depth of field, editorial photography, empty space one side for text overlay, no text in image', ref_prompts:['Professional woman in job interview, modern office, natural light, shallow dof, copy space right, editorial','Confident man at laptop in modern office, warm light, candid editorial style, copy space left','Two professionals in meeting, handshake, blurred background, copy space above, photorealistic','Professional looking forward, clean office background, soft bokeh, editorial portrait, copy space right'] },
  detalle:        { label:'Detalle / Textura',   color:'#FFF9DB', textColor:'#854D0E', desc:'Objeto o textura con mood. Ideal para carrusel o slide de apoyo.', prompt_guide:'close-up detail shot, professional workspace object, moody cinematic lighting, shallow depth of field, muted tones, large copy space, no text, no charts', ref_prompts:['Notebook and pen on clean desk, moody warm light, shallow dof, muted tones, copy space top','Coffee cup and open laptop, morning office light, clean minimal desk, copy space right','Hand writing notes, close up, warm tones, blurred background, editorial, copy space above','Business phone and glasses on clean white desk, top down view, minimal, cool tones, copy space'] },
  caricatura:     { label:'Caricatura / Flat',   color:'#FFF0F6', textColor:'#C2255C', desc:'Ilustracion flat design. Personaje simple, colores solidos.', prompt_guide:'flat vector illustration, simple professional character, clean solid color background, bold colors, modern cartoon style, no text, clean lines', ref_prompts:['Flat vector illustration, confident professional character at desk, simple bold colors, clean background, modern cartoon','Flat design illustration, job interview scene, simple geometric shapes, bright primary colors, minimal cartoon','Vector character in office, flat illustration, clean bold lines, professional, two color palette','Cartoon professional figure, flat design, solid color background, modern illustration, clean simple shapes'] },
  simbolos:       { label:'Simbolos / Iconos',   color:'#F3F0FF', textColor:'#6741D9', desc:'Iconografia abstracta. Un concepto, un simbolo, fondo limpio.', prompt_guide:'abstract icon composition, simple bold symbol, flat minimal design, two colors maximum, clean white or solid background, no text, no charts', ref_prompts:['Abstract upward arrow and person silhouette, minimal flat design, single bold color, white background, clean','Simple icon composition, briefcase and star symbol, flat design, two colors only, clean minimal','Geometric shapes suggesting growth, abstract minimal, bold single color, large empty space','Abstract check mark and ladder symbol, flat bold design, professional, simple clean composition'] },
  cinematografico:{ label:'Cinematografico',      color:'#1A1A2E', textColor:'#A9C4E8', desc:'Iluminacion dramatica, tonos oscuros. Impacto visual fuerte.', prompt_guide:'dramatic cinematic scene, dark moody tones, orange and teal color grade, professional atmosphere, high contrast, copy space, film photography aesthetic', ref_prompts:['Dramatic cinematic office at night, dark moody tones, orange rim light, professional, copy space left','Silhouette of professional against dramatic window, high contrast cinematic, copy space right','Moody professional portrait, dark background, single dramatic light source, cinematic, copy space','Dark office environment, warm vs cold light contrast, cinematic depth, film aesthetic, copy space'] },
  editorial:      { label:'Editorial / Revista', color:'#F8F9FA', textColor:'#343A40', desc:'Estetica de revista de negocios. Limpio, elegante, presencia.', prompt_guide:'magazine editorial style photography, clean white or light background, professional high fashion aesthetic, bold clean composition, copy space, sharp focus', ref_prompts:['Magazine editorial portrait, professional woman, clean white background, fashion photography, copy space right','Editorial flat lay, professional accessories on white marble, overhead shot, clean minimal, copy space','Business magazine cover style, professional man, clean light background, editorial photography, copy space top','Editorial style portrait, confident professional, neutral background, magazine quality, copy space left'] },
  acuarela:       { label:'Acuarela / Arte',     color:'#F0FFF4', textColor:'#276749', desc:'Ilustracion artistica pintada a mano. Suave, humano, cercano.', prompt_guide:'soft watercolor illustration, hand painted artistic style, gentle pastel colors, professional subject, white paper texture, large copy space, no text', ref_prompts:['Soft watercolor illustration, professional figure working, gentle blue and green tones, hand painted, white space','Watercolor abstract background, soft professional mood, pastel blues and peach, artistic, large copy space','Hand painted watercolor scene, desk and coffee elements, soft warm tones, artistic editorial, copy space','Watercolor portrait style, professional person, soft dreamy pastel colors, artistic, copy space top'] },
  tech:           { label:'Tech / Futurista',    color:'#0D1117', textColor:'#58A6FF', desc:'Estetica digital oscura. Ideal para contenido de innovacion o datos.', prompt_guide:'futuristic tech background, dark deep space, subtle blue digital lines, professional modern, copy space center, clean minimal tech aesthetic, no text', ref_prompts:['Futuristic dark background, subtle blue geometric lines, professional tech, copy space center, minimal','Dark modern tech aesthetic, clean dark surface, blue purple accent glow, copy space, minimal','Digital professional environment, dark background, subtle glowing grid, blue tones, copy space','Futuristic dark office concept, glowing screen light, cool blue tones, copy space, editorial'] },
  abstracto:      { label:'Abstracto / Geo',     color:'#FFF5F5', textColor:'#C92A2A', desc:'Formas geometricas en movimiento. Energia, dinamismo, claridad.', prompt_guide:'abstract geometric shapes composition, bold two color palette, clean professional, dynamic modern design, large copy space for text, no text in image', ref_prompts:['Bold abstract geometric background, overlapping circles, red and white palette, professional, copy space','Minimal geometric shapes, clean two color composition, dynamic angles, modern professional, copy space center','Abstract bold shapes, coral and cream palette, editorial geometric, clean large copy space','Geometric abstract composition, bold overlapping forms, professional modern palette, copy space right'] }
};

const VS_FORMATS = {
  '1:1':  { label: 'Feed (1:1)',      w: 1080, h: 1080, dalleSize: '1024x1024' },
  '9:16': { label: 'Story (9:16)',    w: 1080, h: 1920, dalleSize: '1024x1792' },
  '4:5':  { label: 'Portrait (4:5)', w: 1080, h: 1350, dalleSize: '1024x1792' }
};

function vsLoadRefs() { try { var s = localStorage.getItem(VS_REF_STORE); return s ? JSON.parse(s) : {}; } catch(e) { return {}; } }
function vsSaveRefs(data) { try { localStorage.setItem(VS_REF_STORE, JSON.stringify(data)); } catch(e) {} }
function vsGetStyleRefs(key) { var refs = vsLoadRefs(); return refs[key] || []; }
function vsSetStyleRef(key, index, refData) { var refs = vsLoadRefs(); if (!refs[key]) refs[key] = [null, null, null, null]; refs[key][index] = refData; vsSaveRefs(refs); }

function vsGetIntelligenceContext() {
  var parts = [];
  try { var brand = (typeof biGetContext === 'function') ? biGetContext() : ''; if (brand) parts.push(brand); } catch(e) {}
  try { var kwRows = Array.from(document.querySelectorAll('#kw-table tbody tr')).slice(0, 5); var kws = kwRows.map(function(r) { return r.cells[0] ? r.cells[0].textContent.trim() : ''; }).filter(Boolean); if (kws.length) parts.push('TOP KEYWORDS:\n' + kws.map(function(k){ return '- '+k; }).join('\n')); } catch(e) {}
  return parts.join('\n\n');
}

function vsSave() { try { localStorage.setItem(VS_STORE, JSON.stringify({ format: VS_FORMAT, style: VS_STYLE, brief: VS_BRIEF, imgPrompt: VS_IMG_PROMPT, caption: VS_CAPTION, imgB64: VS_IMG_B64, imgMime: VS_IMG_MIME, savedAt: new Date().toISOString() })); } catch(e) {} }
function vsLoadSaved() { try { var s = localStorage.getItem(VS_STORE); return s ? JSON.parse(s) : null; } catch(e) { return null; } }

function loadVisualStudio() {
  var el = document.getElementById('vs-main');
  if (!el) return;
  var saved = vsLoadSaved();
  if (saved) { VS_FORMAT = saved.format || '1:1'; VS_STYLE = saved.style || 'fondo'; VS_BRIEF = saved.brief || ''; VS_IMG_PROMPT = saved.imgPrompt || ''; VS_CAPTION = saved.caption || ''; VS_IMG_B64 = saved.imgB64 || ''; VS_IMG_MIME = saved.imgMime || 'image/png'; if (!VS_STYLES[VS_STYLE]) VS_STYLE = Object.keys(VS_STYLES)[0]; }
  vsRender(el);
}

function vsRender(el) {
  var hasKey = !!(typeof CFG !== 'undefined' && CFG.openaiKey);
  var hasAnthropic = !!(typeof CFG !== 'undefined' && CFG.ak);
  var warnings = '';
  if (!hasAnthropic) warnings += '<div style="background:#FEF2F2;border:1px solid #FECACA;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#991B1B;margin-bottom:12px"><strong>Anthropic API Key no configurada.</strong> <button onclick="showP(\'settings\',null)" style="margin-left:6px;padding:2px 8px;border:1px solid #DC2626;border-radius:4px;background:white;font-size:11px;cursor:pointer;color:#991B1B">Settings</button></div>';
  if (!hasKey) warnings += '<div style="background:#FFFBEB;border:1px solid #FDE68A;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#92400E;margin-bottom:12px"><strong>OpenAI API Key no configurada</strong> — necesaria para generar imagenes. <button onclick="showP(\'settings\',null)" style="margin-left:6px;padding:2px 8px;border:1px solid #D97706;border-radius:4px;background:white;font-size:11px;cursor:pointer;color:#92400E">Settings</button></div>';
  var singleActive = VS_MODE === 'single' ? 'background:var(--purple);color:white;border-color:var(--purple);' : 'background:var(--sf2);color:var(--mt);border-color:var(--bd2);';
  var batchActive  = VS_MODE === 'batch'  ? 'background:var(--purple);color:white;border-color:var(--purple);' : 'background:var(--sf2);color:var(--mt);border-color:var(--bd2);';
  var header = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;flex-wrap:wrap;gap:10px"><div><h2 style="font-size:16px;font-weight:600;color:var(--tx);margin:0">Visual Studio</h2><p style="font-size:12px;color:var(--ht);margin:3px 0 0">Genera fondos para Instagram y edita el texto en Canva</p></div><div style="display:flex;gap:4px;background:var(--sf2);padding:3px;border-radius:var(--r)"><button onclick="vsSetMode(\'single\')" style="' + singleActive + 'border:1px solid;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Post individual</button><button onclick="vsSetMode(\'batch\')" style="' + batchActive + 'border:1px solid;border-radius:6px;padding:6px 16px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Batch (5-6 posts)</button></div></div>';
  var content = VS_MODE === 'batch' ? vsBatchPanel(hasKey) : vsSinglePanel(hasKey);
  el.innerHTML = warnings + header + content;
}

function vsRenderStyleCardStrip(context) {
  return Object.keys(VS_STYLES).map(function(key) {
    var s = VS_STYLES[key]; var refs = vsGetStyleRefs(key); var firstRef = refs[0]; var isActive = VS_STYLE === key;
    var border = isActive ? '2px solid var(--purple)' : '1px solid var(--bd)'; var shadow = isActive ? 'box-shadow:0 0 0 3px rgba(124,58,237,.15);' : '';
    var thumb = firstRef && firstRef.b64 ? '<div style="width:100%;height:80px;border-radius:6px 6px 0 0;overflow:hidden"><img src="data:' + firstRef.mime + ';base64,' + firstRef.b64 + '" style="width:100%;height:100%;object-fit:cover" /></div>' : '<div style="width:100%;height:80px;border-radius:6px 6px 0 0;background:' + s.color + ';display:flex;align-items:center;justify-content:center;font-size:10px;color:' + s.textColor + ';opacity:.6">Sin preview</div>';
    var refsCount = refs.filter(function(r){ return r && r.b64; }).length;
    var refsBadge = refsCount === 4 ? '<span style="font-size:9px;color:var(--green);background:#ECFDF5;padding:1px 5px;border-radius:10px;border:1px solid #BBF7D0">4 refs</span>' : refsCount > 0 ? '<span style="font-size:9px;color:var(--amber);background:#FFFBEB;padding:1px 5px;border-radius:10px;border:1px solid #FDE68A">' + refsCount + '/4</span>' : '<span style="font-size:9px;color:var(--ht);background:var(--sf2);padding:1px 5px;border-radius:10px;border:1px solid var(--bd)">Sin refs</span>';
    return '<div onclick="vsSelectStyle(\'' + key + '\',\'' + context + '\')" style="cursor:pointer;border:' + border + ';border-radius:var(--r);overflow:hidden;' + shadow + 'transition:all .15s;flex:0 0 110px;min-width:110px">' + thumb + '<div style="padding:7px 8px"><div style="font-size:11px;font-weight:600;color:var(--tx);margin-bottom:2px">' + s.label + '</div><div style="font-size:10px;color:var(--ht);line-height:1.3;margin-bottom:4px">' + s.desc.slice(0,40) + '...</div>' + refsBadge + '</div></div>';
  }).join('');
}

function vsRenderRefsPanel(key) {
  var s = VS_STYLES[key]; var refs = vsGetStyleRefs(key); var hasKey = !!(typeof CFG !== 'undefined' && CFG.openaiKey);
  var thumbs = [0,1,2,3].map(function(i) { var ref = refs[i]; var img = ref && ref.b64 ? '<img src="data:' + ref.mime + ';base64,' + ref.b64 + '" style="width:100%;height:100%;object-fit:cover;border-radius:4px;display:block" />' : '<div style="width:100%;height:100%;border-radius:4px;background:' + s.color + ';display:flex;align-items:center;justify-content:center;font-size:10px;color:' + s.textColor + ';opacity:.6">Ref ' + (i+1) + '</div>'; return '<div style="position:relative;flex:1;min-width:0;aspect-ratio:1;cursor:pointer"><div style="width:100%;height:100%">' + img + '</div><div id="vs-ref-spin-' + key + '-' + i + '" style="display:none;position:absolute;inset:0;background:rgba(255,255,255,.7);border-radius:4px;align-items:center;justify-content:center"><div class="sp2"></div></div><button onclick="vsRegenerateOneRef(\'' + key + '\',' + i + ')" title="Regenerar" style="position:absolute;top:3px;right:3px;width:20px;height:20px;background:rgba(0,0,0,.5);color:white;border:none;border-radius:50%;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">&#x21BA;</button></div>'; }).join('');
  var loadedCount = refs.filter(function(r){ return r && r.b64; }).length; var btnLabel = loadedCount === 0 ? 'Generar 4 referencias' : 'Regenerar todas'; var btnDisabled = !hasKey ? 'disabled style="opacity:.5;cursor:not-allowed"' : '';
  return '<div style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;flex-wrap:wrap;gap:8px"><div><span style="font-size:12px;font-weight:600;color:var(--tx)">' + s.label + ' — Referencias visuales</span><div style="font-size:11px;color:var(--ht);margin-top:1px">' + s.desc + '</div></div><button onclick="vsGenerateStyleRefs(\'' + key + '\')" id="vs-gen-refs-btn-' + key + '" ' + btnDisabled + ' style="padding:5px 12px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:11px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' + btnLabel + '</button></div><div style="display:flex;gap:8px">' + thumbs + '</div><div style="margin-top:8px;font-size:10px;color:var(--ht);line-height:1.4">Las referencias se usan como contexto al generar nuevas imagenes.</div></div>';
}

function vsSelectStyle(key, context) { VS_STYLE = key; vsSave(); vsRefreshStyleCards(); vsRefreshRefsPanel(key); }
function vsRefreshRefsPanel(key) { var panel = document.getElementById('vs-refs-panel'); if (panel) panel.innerHTML = vsRenderRefsPanel(key); }
function vsRefreshStyleCards() { var grid = document.querySelector('.vs-style-cards-row'); if (!grid) return; grid.innerHTML = vsRenderStyleCardStrip(VS_MODE === 'batch' ? 'batch' : 'single'); }

async function vsGenerateStyleRefs(key) {
  var s = VS_STYLES[key]; var apiKey = (typeof CFG !== 'undefined') ? CFG.openaiKey : '';
  if (!apiKey) { alert('Configura tu OpenAI API Key en Settings.'); return; }
  var btn = document.getElementById('vs-gen-refs-btn-' + key); if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }
  for (var i = 0; i < 4; i++) { var spinEl = document.getElementById('vs-ref-spin-' + key + '-' + i); if (spinEl) spinEl.style.display = 'flex'; try { var result = await vsCallDalle(s.ref_prompts[i] + ', high quality, professional photography', '1024x1024', apiKey); vsSetStyleRef(key, i, { b64: result.b64, mime: result.mime, prompt: s.ref_prompts[i], createdAt: new Date().toISOString() }); } catch(e) { console.warn('Ref ' + i + ' error:', e.message); } if (spinEl) spinEl.style.display = 'none'; if (i < 3) await new Promise(function(r){ setTimeout(r, 800); }); }
  vsRefreshRefsPanel(key); vsRefreshStyleCards(); if (btn) { btn.disabled = false; btn.textContent = 'Regenerar todas'; }
}

async function vsRegenerateOneRef(key, index) {
  var s = VS_STYLES[key]; var apiKey = (typeof CFG !== 'undefined') ? CFG.openaiKey : '';
  if (!apiKey) { alert('Configura tu OpenAI API Key en Settings.'); return; }
  var spinEl = document.getElementById('vs-ref-spin-' + key + '-' + index); if (spinEl) spinEl.style.display = 'flex';
  try { var result = await vsCallDalle(s.ref_prompts[index] + ', high quality, professional photography', '1024x1024', apiKey); vsSetStyleRef(key, index, { b64: result.b64, mime: result.mime, prompt: s.ref_prompts[index], createdAt: new Date().toISOString() }); vsRefreshRefsPanel(key); vsRefreshStyleCards(); } catch(e) { alert('Error: ' + e.message); }
  if (spinEl) spinEl.style.display = 'none';
}

async function vsCallDalle(prompt, size, key) {
  var data = await apiFetch('/api/dalle-proxy', { method: 'POST', body: { prompt: prompt, size: size, quality: 'standard', response_format: 'b64_json' } });
  if (data.error) throw new Error(data.error);
  if (!data.b64) throw new Error('DALL-E no devolvio imagen.');
  return { b64: data.b64, mime: 'image/png' };
}

function vsSinglePanel(hasKey) {
  var formatBtns = Object.keys(VS_FORMATS).map(function(k) { var f = VS_FORMATS[k]; var active = VS_FORMAT === k ? 'background:var(--purple);color:white;border-color:var(--purple);' : 'background:var(--sf2);color:var(--mt);'; return '<button onclick="vsSetFormat(\'' + k + '\')" style="' + active + 'border:1px solid var(--bd2);border-radius:var(--r);padding:6px 14px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' + f.label + '</button>'; }).join('');
  var step2Html = '';
  if (VS_BRIEF) step2Html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Brief creativo</span><span class="bg bg-p">Claude</span></div><div style="margin-top:10px;font-size:13px;line-height:1.7;color:var(--tx);white-space:pre-wrap">' + escHtml(VS_BRIEF) + '</div></div>';
  if (VS_IMG_PROMPT) step2Html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Prompt DALL-E 3</span><span class="bg bg-b">Editable</span></div><div style="margin-top:10px"><textarea id="vs-img-prompt" class="fi" style="min-height:70px;font-size:12px;font-family:monospace;line-height:1.5">' + escHtml(VS_IMG_PROMPT) + '</textarea></div><div style="margin-top:10px;display:flex;gap:10px;align-items:center"><button onclick="vsGenerateImage()" id="vs-gen-img-btn" style="padding:9px 18px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif' + (!hasKey?';opacity:.5':'') + '" ' + (!hasKey?'disabled':'') + '>Generar imagen</button><span style="font-size:11px;color:var(--ht)">DALL-E 3 - ' + VS_FORMATS[VS_FORMAT].label + '</span></div></div>';
  if (VS_CAPTION) step2Html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Caption</span><span class="bg bg-g">Instagram</span></div><div style="margin-top:10px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:200px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div><button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button></div>';
  var prevResult = VS_IMG_B64 ? vsRenderResult(false) : '<div style="display:flex;align-items:center;justify-content:center;height:160px;color:var(--ht);font-size:13px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2)">La imagen aparecera aqui</div>';
  return '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Paso 1 - Concepto</span><span class="bg bg-p">Claude genera el brief</span></div><div style="margin-top:12px"><label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:6px">Formato</label><div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px">' + formatBtns + '</div><label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-bottom:6px">Tema o concepto</label><textarea id="vs-concept" class="fi" style="min-height:70px" placeholder="Ej: El 73% de los reclutadores decide en los primeros 30 segundos."></textarea><label style="font-size:12px;font-weight:500;color:var(--mt);display:block;margin-top:14px;margin-bottom:8px">Estilo visual</label><div class="vs-style-cards-row" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px">' + vsRenderStyleCardStrip('single') + '</div><div id="vs-refs-panel" style="margin-top:10px">' + vsRenderRefsPanel(VS_STYLE) + '</div><div style="margin-top:14px"><button onclick="vsGenerateBrief()" id="vs-brief-btn" style="padding:9px 20px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">Generar brief + prompt</button></div></div></div><div id="vs-step2">' + step2Html + '</div><div class="cd"><div class="ch"><span class="ct">Resultado</span><span class="bg bg-g">Fondo para Canva</span></div><div style="margin-top:12px;display:flex;gap:16px;flex-wrap:wrap"><div id="vs-img-preview" style="flex:1;min-width:220px">' + prevResult + '</div><div id="vs-caption-area" style="flex:1;min-width:220px">' + (VS_CAPTION ? '<div style="background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:260px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div><button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button>' : '<div style="display:flex;align-items:center;justify-content:center;height:80px;color:var(--ht);font-size:13px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2)">El caption aparecera aqui</div>') + '</div></div></div>';
}

function vsBatchPanel(hasKey) {
  var formatBtns = Object.keys(VS_FORMATS).map(function(k) { var f = VS_FORMATS[k]; var active = VS_FORMAT === k ? 'background:var(--purple);color:white;border-color:var(--purple);' : 'background:var(--sf2);color:var(--mt);'; return '<button onclick="vsSetFormat(\'' + k + '\')" style="' + active + 'border:1px solid var(--bd2);border-radius:var(--r);padding:5px 12px;font-size:12px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif">' + f.label + '</button>'; }).join('');
  return '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Batch - Generacion en serie</span><span class="bg bg-p">Claude + DALL-E 3</span></div><div style="margin-top:14px"><div style="background:#F3EFFF;border:1px solid #DDD6FE;border-radius:var(--r);padding:10px 14px;font-size:12px;color:#5B21B6;margin-bottom:14px;line-height:1.6"><strong>Como usar:</strong> Pega los captions separados por <code style="background:#EDE9FE;padding:1px 5px;border-radius:3px">---</code></div><textarea id="vs-batch-input" class="fi" style="min-height:220px;font-size:12px;line-height:1.6" placeholder="Caption 1...\n\n---\n\nCaption 2..."></textarea><div style="display:flex;gap:20px;flex-wrap:wrap;margin-top:14px"><div><label style="font-size:11px;font-weight:500;color:var(--ht);display:block;margin-bottom:6px;text-transform:uppercase">Formato</label><div style="display:flex;gap:6px">' + formatBtns + '</div></div></div><label style="font-size:11px;font-weight:500;color:var(--ht);display:block;margin-top:14px;margin-bottom:8px;text-transform:uppercase">Estilo visual</label><div class="vs-style-cards-row" style="display:flex;gap:8px;overflow-x:auto;padding-bottom:8px">' + vsRenderStyleCardStrip('batch') + '</div><div id="vs-refs-panel" style="margin-top:10px">' + vsRenderRefsPanel(VS_STYLE) + '</div><div style="margin-top:16px;display:flex;gap:10px;align-items:center"><button onclick="vsBatchGenerate()" id="vs-batch-btn" style="padding:10px 24px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif' + (!hasKey?';opacity:.5':'') + '" ' + (!hasKey?'disabled':'') + '>Generar todos</button><button onclick="vsBatchStop()" id="vs-batch-stop-btn" style="display:none;padding:10px 16px;background:#FEF2F2;color:var(--red);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;cursor:pointer;font-family:\'DM Sans\',sans-serif">Detener</button><span style="font-size:11px;color:var(--ht)">~15 seg por post</span></div></div></div><div id="vs-batch-progress" style="display:none;margin-bottom:16px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:12px 14px"><div style="display:flex;justify-content:space-between;margin-bottom:8px"><span id="vs-batch-status" style="font-size:12px;font-weight:500;color:var(--tx)">Iniciando...</span><span id="vs-batch-counter" style="font-size:11px;color:var(--ht)">0/0</span></div><div style="height:4px;background:var(--sf2);border-radius:2px;overflow:hidden"><div id="vs-batch-bar" style="height:100%;background:var(--purple);border-radius:2px;width:0%;transition:width .4s"></div></div></div><div id="vs-batch-results"></div>';
}

function vsBatchParse(text) { return text.split(/\n\s*---\s*\n/).map(function(s){ return s.trim(); }).filter(function(s){ return s.length > 10; }); }

async function vsBatchGenerate() {
  var inputEl = document.getElementById('vs-batch-input'); if (!inputEl || !inputEl.value.trim()) { alert('Pega al menos un caption.'); return; }
  var captions = vsBatchParse(inputEl.value); if (!captions.length) { alert('Separa cada caption con ---'); return; }
  var key = (typeof CFG !== 'undefined') ? CFG.openaiKey : ''; if (!key) { alert('Configura tu OpenAI API Key en Settings.'); return; }
  VS_BATCH_RUNNING = true; VS_BATCH_STOP = false; if (!window.VS_BATCH_IMGS) window.VS_BATCH_IMGS = {};
  var btn = document.getElementById('vs-batch-btn'); var stopBtn = document.getElementById('vs-batch-stop-btn'); var progDiv = document.getElementById('vs-batch-progress'); var resDiv = document.getElementById('vs-batch-results');
  if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; } if (stopBtn) stopBtn.style.display = 'inline-block'; if (progDiv) progDiv.style.display = 'block';
  if (resDiv) resDiv.innerHTML = captions.map(function(cap, i){ return vsBatchCard(i, 'pending', cap, null, null); }).join('');
  var formatData = VS_FORMATS[VS_FORMAT];
  for (var i = 0; i < captions.length; i++) {
    if (VS_BATCH_STOP) break;
    vsBatchSetProgress(i, captions.length, 'Generando prompt ' + (i+1) + '/' + captions.length);
    vsBatchUpdateCard(i, 'briefing', captions[i], null, null);
    try { var promptResult = await vsBatchGetPrompt(captions[i], VS_STYLES[VS_STYLE], formatData); if (VS_BATCH_STOP) break; vsBatchSetProgress(i, captions.length, 'Generando imagen ' + (i+1) + '/' + captions.length); vsBatchUpdateCard(i, 'imaging', captions[i], null, null); var imgResult = await vsCallDalle(promptResult.prompt, formatData.dalleSize, key); vsBatchUpdateCard(i, 'done', captions[i], imgResult, null); } catch(e) { vsBatchUpdateCard(i, 'error', captions[i], null, e.message); }
    if (i < captions.length - 1 && !VS_BATCH_STOP) await new Promise(function(r){ setTimeout(r, 1000); });
  }
  VS_BATCH_RUNNING = false; vsBatchSetProgress(captions.length, captions.length, VS_BATCH_STOP ? 'Detenido' : 'Completado');
  if (btn) { btn.disabled = false; btn.textContent = 'Generar todos'; } if (stopBtn) stopBtn.style.display = 'none';
}

async function vsBatchGetPrompt(caption, styleData, formatData) {
  var refs = vsGetStyleRefs(VS_STYLE); var refContext = refs.filter(function(r){ return r&&r.prompt; }).slice(0,2).map(function(r){ return '- ' + r.prompt; }).join('\n');
  var data = await apiFetch('/api/claude-proxy', { method:'POST', body:{ module:'visual', action:'batch-brief', payload:{ caption: caption.slice(0,250), style: VS_STYLE, refContext: refContext } } });
  return { prompt: (data.prompt || '').trim() };
}

function vsBatchSetProgress(done, total, msg) { var pct = total > 0 ? Math.round((done/total)*100) : 0; var bar = document.getElementById('vs-batch-bar'); if (bar) bar.style.width = pct + '%'; var st = document.getElementById('vs-batch-status'); if (st) st.textContent = msg; var ct = document.getElementById('vs-batch-counter'); if (ct) ct.textContent = done + '/' + total; }

function vsBatchCard(index, state, caption, imgResult, errorMsg) {
  var num = index + 1;
  var stateEl = state === 'pending' ? '<span style="font-size:11px;color:var(--ht);padding:2px 8px;background:var(--sf2);border-radius:20px;border:1px solid var(--bd)">En cola</span>' : state === 'briefing' ? '<span style="font-size:11px;color:var(--purple);padding:2px 8px;background:#F3EFFF;border-radius:20px">Generando prompt...</span>' : state === 'imaging' ? '<span style="font-size:11px;color:#0891B2;padding:2px 8px;background:#ECFEFF;border-radius:20px">Generando imagen...</span>' : state === 'done' ? '<span style="font-size:11px;color:var(--green);padding:2px 8px;background:#ECFDF5;border-radius:20px">Listo</span>' : '<span style="font-size:11px;color:var(--red);padding:2px 8px;background:#FEF2F2;border-radius:20px">Error</span>';
  var imgCol = state === 'done' && imgResult ? '<div style="flex:0 0 140px"><img src="data:' + imgResult.mime + ';base64,' + imgResult.b64 + '" style="width:140px;height:140px;object-fit:cover;border-radius:var(--r);border:1px solid var(--bd)" /><button onclick="vsBatchDownload(' + index + ')" style="margin-top:6px;width:140px;padding:5px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Descargar</button></div>' : (state === 'briefing' || state === 'imaging') ? '<div style="flex:0 0 140px;height:140px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2);display:flex;align-items:center;justify-content:center"><div class="sp2"></div></div>' : '<div style="flex:0 0 140px;height:140px;background:var(--sf2);border-radius:var(--r);border:1px dashed var(--bd2);display:flex;align-items:center;justify-content:center;color:var(--ht);font-size:11px">Imagen</div>';
  var captionCol = state === 'done' ? '<div style="font-size:12px;line-height:1.6;color:var(--tx);white-space:pre-wrap;max-height:110px;overflow-y:auto">' + escHtml((caption||'').slice(0,200)) + '</div><div style="display:flex;gap:6px;margin-top:6px"><button onclick="vsBatchCopyCaption(' + index + ')" style="padding:4px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button></div>' : state === 'error' ? '<div style="font-size:12px;color:var(--red)">' + escHtml(errorMsg||'Error') + '</div>' : '<div style="font-size:12px;color:var(--ht)">' + escHtml((caption||'').slice(0,100)) + '</div>';
  return '<div id="vs-batch-card-' + index + '" style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:14px;margin-bottom:10px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><span style="font-size:13px;font-weight:600;color:var(--tx)">Post ' + num + '</span>' + stateEl + '</div><div style="display:flex;gap:14px;align-items:flex-start">' + imgCol + '<div style="flex:1;min-width:0">' + captionCol + '</div></div></div>';
}

function vsBatchUpdateCard(index, state, caption, imgResult, errorMsg) { var el = document.getElementById('vs-batch-card-' + index); if (!el) return; el.outerHTML = vsBatchCard(index, state, caption, imgResult, errorMsg); if (state === 'done' && imgResult) { if (!window.VS_BATCH_IMGS) window.VS_BATCH_IMGS = {}; window.VS_BATCH_IMGS[index] = { b64: imgResult.b64, mime: imgResult.mime, caption: caption }; } }
function vsBatchDownload(index) { var d = window.VS_BATCH_IMGS && window.VS_BATCH_IMGS[index]; if (!d) return; var a = document.createElement('a'); a.href = 'data:' + d.mime + ';base64,' + d.b64; a.download = 'proximorol-batch-' + (index+1) + '-' + Date.now() + '.png'; a.click(); }
function vsBatchCopyCaption(index) { var d = window.VS_BATCH_IMGS && window.VS_BATCH_IMGS[index]; if (!d || !d.caption) return; navigator.clipboard.writeText(d.caption).catch(function(){ var ta = document.createElement('textarea'); ta.value = d.caption; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }); }
function vsBatchStop() { VS_BATCH_STOP = true; var btn = document.getElementById('vs-batch-stop-btn'); if (btn) { btn.disabled = true; btn.textContent = 'Deteniendo...'; } }

async function vsGenerateBrief() {
  var conceptEl = document.getElementById('vs-concept'); var concept = conceptEl ? conceptEl.value.trim() : ''; if (!concept) { alert('Escribe el concepto.'); return; }
  var btn = document.getElementById('vs-brief-btn'); if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }
  var step2 = document.getElementById('vs-step2'); if (step2) step2.innerHTML = '<div class="ld"><div class="sp2"></div>Claude esta creando el brief...</div>';
  try {
    var refs = vsGetStyleRefs(VS_STYLE); var refContext = refs.filter(function(r){ return r&&r.prompt; }).slice(0,2).map(function(r){ return '- '+r.prompt; }).join('\n');
    var data = await apiFetch('/api/claude-proxy', { method:'POST', body:{ module:'visual', action:'single-brief', payload:{ concept: concept, style: VS_STYLE, format: VS_FORMAT, refContext: refContext } } });
    VS_BRIEF = data.brief || ''; VS_IMG_PROMPT = data.imgPrompt || ''; VS_CAPTION = data.caption || ''; vsSave();
    var hasKey = !!(typeof CFG !== 'undefined' && CFG.openaiKey); var step2el = document.getElementById('vs-step2');
    if (step2el) { var html = ''; if (VS_BRIEF) html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Brief</span><span class="bg bg-p">Claude</span></div><div style="margin-top:10px;font-size:13px;line-height:1.7;color:var(--tx);white-space:pre-wrap">' + escHtml(VS_BRIEF) + '</div></div>'; if (VS_IMG_PROMPT) html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Prompt DALL-E</span><span class="bg bg-b">Editable</span></div><div style="margin-top:10px"><textarea id="vs-img-prompt" class="fi" style="min-height:70px;font-size:12px;font-family:monospace">' + escHtml(VS_IMG_PROMPT) + '</textarea></div><div style="margin-top:10px"><button onclick="vsGenerateImage()" id="vs-gen-img-btn" style="padding:9px 18px;background:var(--purple);color:white;border:none;border-radius:var(--r);font-size:13px;font-weight:500;cursor:pointer;font-family:\'DM Sans\',sans-serif' + (!hasKey?';opacity:.5':'') + '" ' + (!hasKey?'disabled':'') + '>Generar imagen</button></div></div>'; if (VS_CAPTION) html += '<div class="cd" style="margin-bottom:16px"><div class="ch"><span class="ct">Caption</span><span class="bg bg-g">Instagram</span></div><div style="margin-top:10px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);padding:12px;font-size:13px;line-height:1.6;white-space:pre-wrap;max-height:200px;overflow-y:auto">' + escHtml(VS_CAPTION) + '</div><button onclick="vsCopyCaption()" style="margin-top:8px;padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Copiar caption</button></div>'; step2el.innerHTML = html; }
  } catch(e) { var s2 = document.getElementById('vs-step2'); if (s2) s2.innerHTML = '<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B"><strong>Error:</strong> ' + escHtml(e.message) + '</div>'; }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Generar brief + prompt'; } }
}

async function vsGenerateImage() {
  var promptEl = document.getElementById('vs-img-prompt'); var prompt = promptEl ? promptEl.value.trim() : VS_IMG_PROMPT; if (!prompt) { alert('No hay prompt.'); return; }
  var key = (typeof CFG !== 'undefined') ? CFG.openaiKey : ''; if (!key) { alert('Configura tu OpenAI API Key en Settings.'); return; }
  var btn = document.getElementById('vs-gen-img-btn'); if (btn) { btn.disabled = true; btn.textContent = 'Generando...'; }
  var previewEl = document.getElementById('vs-img-preview'); if (previewEl) previewEl.innerHTML = '<div class="ld"><div class="sp2"></div>DALL-E 3 generando imagen...</div>';
  try { var imgResult = await vsCallDalle(prompt, VS_FORMATS[VS_FORMAT].dalleSize, key); VS_IMG_B64 = imgResult.b64; VS_IMG_MIME = imgResult.mime; vsSave(); if (previewEl) previewEl.innerHTML = vsRenderResult(true); }
  catch(e) { if (previewEl) previewEl.innerHTML = '<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B"><strong>Error:</strong> ' + escHtml(e.message) + '</div>'; }
  finally { if (btn) { btn.disabled = false; btn.textContent = 'Generar imagen'; } }
}

function vsSetMode(m) { VS_MODE = m; window.VS_BATCH_IMGS = {}; var el = document.getElementById('vs-main'); if (el) vsRender(el); }
function vsSetFormat(f) { VS_FORMAT = f; if (!VS_BATCH_RUNNING) { var inputEl = document.getElementById('vs-batch-input'); var savedText = inputEl ? inputEl.value : ''; var el = document.getElementById('vs-main'); if (el) vsRender(el); var newInput = document.getElementById('vs-batch-input'); if (newInput && savedText) newInput.value = savedText; } }

function vsRenderResult(animate) { if (!VS_IMG_B64) return ''; var src = 'data:' + VS_IMG_MIME + ';base64,' + VS_IMG_B64; return '<div' + (animate ? ' style="animation:fadeIn .4s ease"' : '') + '><img src="' + src + '" style="width:100%;border-radius:var(--r);border:1px solid var(--bd);display:block" /><div style="margin-top:8px;display:flex;gap:6px"><button onclick="vsDownloadImage()" style="flex:1;padding:7px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Descargar</button><button onclick="vsGenerateImage()" style="padding:7px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt)" title="Regenerar">&#x21BA;</button></div></div>'; }
function vsDownloadImage() { if (!VS_IMG_B64) return; var a = document.createElement('a'); a.href = 'data:' + VS_IMG_MIME + ';base64,' + VS_IMG_B64; a.download = 'proximorol-vs-' + Date.now() + '.png'; a.click(); }
function vsCopyCaption() { if (!VS_CAPTION) return; navigator.clipboard.writeText(VS_CAPTION).catch(function(){ var ta = document.createElement('textarea'); ta.value = VS_CAPTION; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); }); }
function escHtml(str) { return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
