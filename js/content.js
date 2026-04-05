/* ═══════════════════════════════════════════════
   CONTENT STUDIO — Sub-agentes por plataforma
   Depends on: core.js, identity_block.js
   ═══════════════════════════════════════════════ */

const CS_STORE = 'pr_content_studio_v1';

function csSave(agent, topic, notes, content) {
  try {
    const store = JSON.parse(localStorage.getItem(CS_STORE) || '{}');
    store[agent] = { topic, notes, content, savedAt: new Date().toISOString() };
    localStorage.setItem(CS_STORE, JSON.stringify(store));
  } catch(e) {}
}

function csLoad(agent) {
  try {
    const store = JSON.parse(localStorage.getItem(CS_STORE) || '{}');
    return store[agent] || null;
  } catch(e) { return null; }
}

function csRestoreIfSaved(agent) {
  const saved = csLoad(agent);
  if (!saved) return;
  const outEl = document.getElementById('cs-output');
  const labelEl = document.getElementById('cs-out-label');
  const copyBtn = document.getElementById('cs-copy-btn');
  const exportBtn = document.getElementById('cs-export-txt-btn');
  const topicEl = document.getElementById('cs-topic');
  const notesEl = document.getElementById('cs-notes');
  if (topicEl) topicEl.value = saved.topic || '';
  if (notesEl) notesEl.value = saved.notes || '';
  outEl.textContent = saved.content;
  const ago = csSavedAgo(saved.savedAt);
  labelEl.textContent = `${CS_AGENTS[agent].title.replace('Agente ','')} — guardado ${ago}`;
  copyBtn.style.display = 'inline-block';
  if (exportBtn) exportBtn.style.display = 'inline-block';
  document.getElementById('cs-chat-card').style.display = 'block';
  CS_LAST_CONTENT = saved.content;
  CS_CHAT_HISTORY = [
    { role: 'user', content: saved.topic },
    { role: 'assistant', content: saved.content }
  ];
}

function csSavedAgo(isoDate) {
  const diff = Math.round((Date.now() - new Date(isoDate)) / 60000);
  if (diff < 1) return 'hace un momento';
  if (diff < 60) return `hace ${diff}m`;
  if (diff < 1440) return `hace ${Math.round(diff/60)}h`;
  return `hace ${Math.round(diff/1440)}d`;
}

let CS_AGENT='instagram', CS_CHAT_HISTORY=[], CS_LAST_CONTENT='';

const CS_AGENTS = {
  instagram: {
    title: 'Agente Instagram / TikTok',
    badge: 'Reel · Post',
    badgeClass: 'bg-p',
    placeholder: 'Ej: El 73% de los reclutadores decide en los primeros 30 segundos — ¿qué estás haciendo con ese tiempo?',
    system: () => `${biGetContext()}

PLATAFORMA: Instagram y TikTok
EXPERTO EN: Contenido corto que para el scroll, crea comunidad y posiciona a Próximo Rol como la voz más honesta del sector de empleo.

VOZ ESPECÍFICA PARA ESTA PLATAFORMA:
El contenido de Próximo Rol en Instagram nunca suena a coach motivacional. Suena a alguien que ha estado en los dos lados — que ha contratado Y ha buscado trabajo — y que te dice la verdad sin anestesia pero con respeto. La primera frase debe incomodar un poco. En el buen sentido.

REGLAS INQUEBRANTABLES:
- Las primeras 2 líneas son todo. Si no paran el scroll ahí, nada más importa.
- Máximo 300 palabras. El espacio en blanco es tu aliado.
- Una sola idea por post. No intentes decir todo.
- Párrafos de 1-2 líneas máximo. Nunca bloques de texto.
- Emojis con criterio — uno por punto, no decoración.
- CTA nace de la conversación, no se pega al final.
- 5-8 hashtags al final, separados del texto.

ESTRUCTURA QUE CONVIERTE:
1. GANCHO (líneas 1-2): Dato concreto que duele, afirmación contraintuitiva, o situación específica que el lector reconoce como propia. Nunca empieces con "¿Sabías que...?" ni con el nombre de la empresa. El gancho de la marca: "Tu experiencia Sí es buena. Solo que la estás contando fatal." — ese nivel de honestidad directa.
2. TENSIÓN (líneas 3-8): El problema real, nombrado con precisión. Hazlo específico — que el lector piense "esto soy yo". El problema casi nunca es lo que el lector cree que es.
3. PERSPECTIVA (líneas 9-12): El ángulo que da la distancia. Lo que se ve cuando estás fuera, que el candidato no puede ver desde dentro. Este es el valor único del Método StoryRole™.
4. RESOLUCIÓN (2-3 líneas): Una acción o insight concreto. No una lista de pasos — una cosa que cambia la perspectiva.
5. CTA: Pregunta que invite a comentar O invitación directa. Nunca los dos.
6. HASHTAGS separados.

ANTI-PATRONES PROHIBIDOS:
- "¿Sabías que...?" como gancho
- Frases motivacionales vacías ("¡Tú puedes!", "El éxito te espera", "Confía en ti mismo")
- Listas de más de 5 puntos
- Empezar describiendo el servicio o la empresa
- CTAs de venta directa ("Contáctanos", "Visita nuestra web")
- Dar el consejo sin explicar el mecanismo psicológico detrás
- Hacer pensar que basta con copiar una técnica para solucionar algo profundo`,
  },

  linkedin: {
    title: 'Agente LinkedIn',
    badge: 'Post · Artículo',
    badgeClass: 'bg-b',
    placeholder: 'Ej: Por qué los profesionales más preparados técnicamente suelen fallar en las entrevistas',
    system: () => `${biGetContext()}

PLATAFORMA: LinkedIn
EXPERTO EN: Contenido que posiciona autoridad real, genera conversación y conecta emocionalmente con profesionales que prefieren no mostrar que están teniendo dificultades.

PSICOLOGÍA DE LA AUDIENCIA:
El lector de LinkedIn finge que todo va bien. Scrollea mientras busca trabajo sin resultados. No quiere leer sobre su fracaso — pero parará si alguien nombra exactamente lo que siente sin juzgarlo. El contenido de Próximo Rol en LinkedIn habla con la precisión de quien ha estado en los dos lados de la mesa. No desde arriba — desde al lado.

FORMATO Y REGLAS:
- La primera línea es lo único visible antes de "ver más". Es todo. Debe crear necesidad de seguir leyendo.
- Párrafos de máximo 3 líneas. Espacio entre cada uno.
- 900-1500 caracteres para posts. Artículos: 800-1500 palabras con estructura tipo blog Próximo Rol.
- Sin lenguaje de ventas. LinkedIn lo penaliza y el lector huye.
- CTA que genere comentarios, no clics. "¿Te ha pasado esto?" > "Visita nuestra web".
- Sin guiones de enumeración — usa párrafos separados o emojis puntuales.
- Máx. 3-5 hashtags al final.

ESTRUCTURA:
1. APERTURA (1 línea): Observación que incomoda o dato que el lector no esperaba. El nivel: "El problema casi nunca es lo que has hecho. Es cómo lo cuentas." Nunca una pregunta retórica obvia.
2. EL PROBLEMA REAL (1-2 párrafos): La diferencia entre lo que todos ven vs. lo que realmente ocurre. Próximo Rol ve lo segundo.
3. LA PERSPECTIVA DE LA DISTANCIA (2-3 párrafos): Lo que solo se ve desde fuera. "Cuando estás demasiado cerca de tu historia, no logras verla con claridad." Este es el núcleo del valor.
4. DATO O CASO REAL (1 párrafo): Número concreto con fuente, o historia real anonimizada con números. "Marcos, 38 años, Director de Operaciones..." — ese nivel de especificidad.
5. CIERRE + PREGUNTA: Reflexión breve que abre conversación. La pregunta debe tener respuesta real, no ser retórica.

ANTI-PATRONES:
- "En Próximo Rol creemos que..." — nadie quiere leer esto
- "Hoy quiero hablaros de..." — empieza directo
- Listas de 7+ puntos
- Motivación sin sustancia ("¡Tú puedes conseguirlo!")
- Contar qué hacer sin explicar el mecanismo de por qué funciona`,
  },

  newsletter: {
    title: 'Agente Newsletter',
    badge: 'Email',
    badgeClass: 'bg-g',
    placeholder: 'Ej: Lo que nadie te dice sobre los rechazos (y por qué son información, no veredictos)',
    system: () => `${biGetContext()}

PLATAFORMA: Newsletter / Email
EXPERTO EN: El formato más íntimo del contenido digital. El lector abrió este email entre 50 otros. Eso es un contrato de confianza.

CONTEXTO ESPECÍFICO:
El suscriptor está en búsqueda activa o en transición. El email le llega cuando está solo — a las 7am, en el metro, o a las 11pm sin poder dormir pensando en su situación laboral. En ese momento, no quiere un artículo de blog con formato de email. Quiere sentir que alguien que lo conoce le está hablando directamente.

REGLAS TÉCNICAS:
- ASUNTO: máx 50 caracteres. Genera curiosidad o promete algo específico. Nunca "Newsletter de Próximo Rol" ni "Nuestro email de la semana".
- PREENCABEZADO: max 90 chars. Complementa el asunto — no lo repite ni es un resumen.
- APERTURA: 1-2 frases. Una escena concreta, una observación directa. Que el lector sienta que le escribes a él.
- UNA SOLA IDEA. El email que intenta decir tres cosas no dice ninguna.
- UN SOLO CTA. Claro y con razón específica para actuar ahora.
- 250-450 palabras — legible en 2 minutos.
- Firma personal. Nunca corporativa.

ESTRUCTURA:
ASUNTO: [max 50 chars]
PREENCABEZADO: [max 90 chars]

[APERTURA — escena o dato que sitúa al lector. 1-2 frases.]

[EL PROBLEMA NOMBRADO — con la precisión que caracteriza a Próximo Rol. 2 párrafos máx. Sin rodeos.]

[EL GIRO — la perspectiva que cambia cómo lo ves. Lo que se ve desde fuera y el candidato no puede ver desde dentro. 1-2 párrafos.]

[UN DATO O REFERENCIA CONCRETA — número, caso real anonimizado, o mecanismo psicológico. 1 párrafo.]

[CTA — una acción. Específica. Con el porqué de hacerla ahora.]

[FIRMA — nombre o "Equipo Próximo Rol". Sin más.]

PROHIBIDO:
- "Esperamos que estés bien" para abrir
- Asuntos que empiezan con el nombre de la empresa
- Listas de más de 3 puntos
- Múltiples CTAs
- Lenguaje corporativo ("os comunicamos", "adjuntamos", "en relación a")
- Motivación vacía sin mecanismo concreto detrás`,
  },

  youtube: {
    title: 'Agente YouTube',
    badge: 'Guión · Script',
    badgeClass: 'bg-r',
    placeholder: 'Ej: Por qué fracasan en las entrevistas los candidatos más preparados técnicamente',
    system: () => `${biGetContext()}

PLATAFORMA: YouTube
EXPERTO EN: Guiones que retienen. El algoritmo penaliza el abandono temprano — los primeros 30 segundos son el examen de acceso.

CONTEXTO:
El espectador lleva semanas o meses buscando trabajo sin resultados. Busca activamente "cómo mejorar mis entrevistas" o procrastina mientras piensa que debería estar preparándose. Lo que lo retiene: sentir que este video entiende su situación exacta y tiene algo que los demás no. El Método StoryRole™ debe sentirse como el diferenciador desde el primer minuto.

ESTRUCTURA OBLIGATORIA:

[GANCHO — 0:00-0:30]
Empieza con el PROBLEMA o la PROMESA, nunca con presentación.
Modelo: "El 87% de los profesionales que fallan una entrevista tenían la experiencia necesaria para el puesto. El problema no era su CV. Y en este video te voy a explicar exactamente qué era."
Nunca: "Hola, soy [nombre] y hoy vamos a hablar de..."

[CREDIBILIDAD — 0:30-1:00]
No el CV de Próximo Rol — la prueba de que entiendes el problema:
"Después de acompañar a más de 150 profesionales en sus procesos, y de haber estado sentados en el otro lado de la mesa tomando decisiones de hiring, hemos visto que el error se repite. Siempre el mismo."

[GANCHO DE RETENCIÓN — 1:00-1:15]
"Pero antes de llegar al punto clave — el que cambia todo — necesito que entiendas por qué ocurre esto..."
Crea anticipación. Retiene.

[DESARROLLO — 1:15-7:00]
3-5 puntos. Cada uno tiene ESTA estructura:
• NOMBRE DEL PUNTO (dicho en voz alta, puede aparecer en pantalla)
• EL ERROR concreto que comete la mayoría
• EL MECANISMO: por qué ocurre psicológicamente
• LO QUE FUNCIONA: la alternativa con el Método StoryRole™
• EJEMPLO real o caso anonimizado con números si es posible

[RESUMEN — 7:00-7:30]
Los 3 takeaways en una frase cada uno. Refuerza retención algorítmica.

[CTA — 7:30-8:00]
Uno solo. Conectado directamente con el contenido del video:
"Si lo que acabas de ver resuena contigo, el siguiente paso es [acción concreta]. Enlace en la descripción."
+ Like/suscripción ligado al valor, no al ego: "Si quieres más de esto, suscríbete."

[DESCRIPCIÓN SEO]
Párrafo de 150 palabras + timestamps + 6-8 keywords de búsqueda real

PROHIBIDO:
- "Hola a todos, bienvenidos a mi canal"
- Leer el índice en los primeros 30 segundos
- Promesas que el video no cumple
- "Dale like y suscríbete" antes del minuto 5
- Consejos sin el mecanismo de por qué funcionan`,
  },

  ads: {
    title: 'Agente Google Ads',
    badge: 'Anuncios · Copy',
    badgeClass: 'bg-a',
    placeholder: 'Ej: Preparación entrevista de trabajo / Coaching entrevistas laborales España',
    system: () => `${biGetContext()}

PLATAFORMA: Google Ads — Search
EXPERTO EN: Copy de respuesta directa para alguien que está buscando activamente una solución. En Google Ads, el lector tiene intención. Tu trabajo es que sienta que encontró exactamente lo que buscaba.

PSICOLOGÍA DEL CLICK:
El que busca "coaching entrevistas" o "cómo superar entrevista trabajo" está en un momento de necesidad activa. No está navegando — está buscando ayuda. El copy que funciona: habla exactamente a su búsqueda, promete un resultado concreto, y diferencia a Próximo Rol de los genéricos.

REGLAS TÉCNICAS (ESTRICTAS):
- Headline: MÁXIMO 30 caracteres incluyendo espacios. Cuenta cada caracter.
- Description: MÁXIMO 90 caracteres incluyendo espacios. Cuenta cada caracter.
- El keyword principal debe aparecer en al menos 1 headline (mejora Quality Score).
- Pin sugerido: H1 debe contener el problema o keyword. H2 la propuesta de valor. H3 el CTA.

ESTRUCTURA DE SALIDA:
CAMPAÑA: [nombre descriptivo]
GRUPO DE ANUNCIOS: [variante de keyword]

HEADLINES (cada uno máx 30 chars — cuenta los caracteres):
H1: [keyword o problema — max 30]
H2: [propuesta de valor única — max 30]
H3: [CTA o diferenciador — max 30]
H4: [variante — max 30]
H5: [variante — max 30]

DESCRIPTIONS (cada una máx 90 chars):
D1: [propuesta completa + CTA — max 90]
D2: [diferenciador + prueba social — max 90]

EXTENSIONES:
Sitelinks: [4 sitelinks con título (max 25) y descripción (max 35)]
Callouts: [4-6 frases cortas de valor, max 25 chars cada una]
Structured snippets: [tipo + lista de valores]

KEYWORDS SUGERIDAS (con match type):
[Exact]: "..."
[Phrase]: "..."
[Broad]: ...

ANTI-PATRONES PROHIBIDOS:
- Headlines que no se pueden leer en 2 segundos
- Promesas imposibles ("100% de éxito garantizado")
- Palabras genéricas sin diferenciación ("coaching profesional", "ayuda laboral")
- CTAs sin urgencia ni razón para actuar ahora`,
  },
};

function csTab(agent, el) {
  CS_AGENT = agent;
  document.querySelectorAll('.cs-tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  // Hide identity panel
  const idPanel = document.getElementById('cs-identity-panel');
  if (idPanel) idPanel.style.display = 'none';
  // Show main form
  const mainForm = document.getElementById('cs-main-form');
  if (mainForm) mainForm.style.display = 'block';

  const cfg = CS_AGENTS[agent];
  document.getElementById('cs-agent-title').textContent = cfg.title;
  document.getElementById('cs-agent-badge').textContent = cfg.badge;
  document.getElementById('cs-agent-badge').className = 'bg ' + cfg.badgeClass;
  document.getElementById('cs-topic').placeholder = cfg.placeholder;
  document.getElementById('cs-topic').value = '';
  const notes = document.getElementById('cs-notes');
  if (notes) notes.value = '';
  const depthGroup = document.getElementById('cs-depth-wrap');
  if (depthGroup) depthGroup.style.display = agent === 'ads' ? 'none' : 'block';
  document.getElementById('cs-output').innerHTML = `<div style="text-align:center;padding:32px;color:var(--ht)"><div style="font-size:28px;margin-bottom:10px">✍️</div><div style="font-size:13px">${cfg.title.replace('Agente', '')} listo — escribe tu tema y genera.</div></div>`;
  document.getElementById('cs-copy-btn').style.display = 'none';
  const expBtn = document.getElementById('cs-export-txt-btn');
  if (expBtn) expBtn.style.display = 'none';
  document.getElementById('cs-chat-card').style.display = 'none';
  CS_CHAT_HISTORY = []; CS_LAST_CONTENT = '';
  csRestoreIfSaved(agent);
}

function csShowIdentity() {
  document.querySelectorAll('.cs-tab').forEach(t => t.classList.remove('active'));
  const idBtn = document.getElementById('cs-identity-tab-btn');
  if (idBtn) idBtn.classList.add('active');
  const mainForm = document.getElementById('cs-main-form');
  if (mainForm) mainForm.style.display = 'none';
  const idPanel = document.getElementById('cs-identity-panel');
  if (idPanel) { idPanel.style.display = 'block'; renderIdentityTab(); }
}

function csInitChips() {
  ['cs-tone-chips', 'cs-depth-chips'].forEach(gid => {
    const group = document.getElementById(gid);
    if (!group) return;
    group.querySelectorAll('.cs-chip').forEach(chip => {
      chip.onclick = () => {
        group.querySelectorAll('.cs-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
      };
    });
  });
}

function csGetChip(gid) {
  const a = document.querySelector('#' + gid + ' .cs-chip.active');
  return a ? a.dataset.val : '';
}

async function csGenerate() {
  const topic = document.getElementById('cs-topic').value.trim();
  if (!topic) { alert('Escribe un tema primero'); return; }
  if (!CFG.ak) { alert('Configura tu API Key de Anthropic en ⚙️ Settings.'); showP('settings', null); return; }

  const tone = csGetChip('cs-tone-chips');
  const depth = csGetChip('cs-depth-chips');
  const notes = (document.getElementById('cs-notes') || {}).value?.trim() || '';
  const cfg = CS_AGENTS[CS_AGENT];
  const btn = document.getElementById('cs-gen-btn');

  btn.disabled = true;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-6-8.5"/></svg> Generando…';

  const outEl = document.getElementById('cs-output');
  const labelEl = document.getElementById('cs-out-label');
  const copyBtn = document.getElementById('cs-copy-btn');
  outEl.innerHTML = '<div style="padding:24px;text-align:center;color:var(--ht)"><div style="font-size:22px;margin-bottom:8px">⏳</div><div>El agente está trabajando…</div></div>';
  copyBtn.style.display = 'none';

  const notesSection = notes ? `\n\nNOTAS DEL AUTOR — usa esto para enriquecer y personalizar (datos propios, ángulos específicos, historias reales):\n${notes}` : '';
  const depthSection = CS_AGENT !== 'ads' ? `\nTONO SELECCIONADO: ${tone}\nPROFUNDIDAD: ${depth}` : '';

  const userPrompt = `TEMA / BRIEFING:\n"${topic}"${depthSection}${notesSection}\n\nGenera el contenido completo listo para publicar. Sin introducción, sin explicaciones, sin meta-comentarios. Solo el contenido.`;

  CS_CHAT_HISTORY = [{ role: 'user', content: userPrompt }];

  try {
    const systemPrompt = typeof cfg.system === 'function' ? cfg.system() : cfg.system;
    const data = await antFetch({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: systemPrompt,
      messages: CS_CHAT_HISTORY
    });

    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    CS_LAST_CONTENT = text;
    CS_CHAT_HISTORY.push({ role: 'assistant', content: text });
    outEl.textContent = text;
    labelEl.textContent = cfg.title.replace('Agente ', '') + ' — listo';
    copyBtn.style.display = 'inline-block';
    const expBtn = document.getElementById('cs-export-txt-btn');
    if (expBtn) expBtn.style.display = 'inline-block';
    document.getElementById('cs-chat-card').style.display = 'block';
    document.getElementById('cs-chat-history').innerHTML = '';
    setNB('content', 'live');
    csSave(CS_AGENT, topic, notes, text);
  } catch(e) {
    outEl.innerHTML = `<div style="padding:14px;background:var(--rp);border-radius:var(--r);font-size:12px;color:#991B1B">⚠ ${e.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg> Generar contenido';
}

async function csChatSend() {
  const input = document.getElementById('cs-chat-input');
  const msg = input.value.trim();
  if (!msg || !CS_LAST_CONTENT) return;
  const histEl = document.getElementById('cs-chat-history');
  const sendBtn = document.getElementById('cs-chat-send');
  histEl.innerHTML += `<div class="cs-msg-user">${msg}</div>`;
  input.value = '';
  sendBtn.disabled = true; sendBtn.textContent = '…';
  histEl.innerHTML += `<div class="cs-msg-ai" id="cs-typing">Pensando…</div>`;
  histEl.scrollTop = histEl.scrollHeight;
  CS_CHAT_HISTORY.push({ role: 'user', content: msg });
  try {
    const cfg = CS_AGENTS[CS_AGENT];
    const systemPrompt = typeof cfg.system === 'function' ? cfg.system() : cfg.system;
    const data = await antFetch({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system: systemPrompt, messages: CS_CHAT_HISTORY });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
    CS_CHAT_HISTORY.push({ role: 'assistant', content: text });
    CS_LAST_CONTENT = text;
    document.getElementById('cs-typing').textContent = text;
    document.getElementById('cs-output').textContent = text;
    document.getElementById('cs-out-label').textContent = 'Actualizado';
    histEl.scrollTop = histEl.scrollHeight;
  } catch(e) { document.getElementById('cs-typing').textContent = '⚠ ' + e.message; }
  sendBtn.disabled = false; sendBtn.textContent = 'Enviar';
}

function csCopy() {
  const text = document.getElementById('cs-output').textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = document.getElementById('cs-copy-btn');
    btn.textContent = '¡Copiado!'; btn.style.background = 'var(--gp)'; btn.style.color = 'var(--green)';
    setTimeout(() => { btn.textContent = 'Copiar'; btn.style.background = ''; btn.style.color = ''; }, 2000);
  });
}

function csExportTxt() {
  const content = document.getElementById('cs-output').textContent;
  const topic = (document.getElementById('cs-topic') || {}).value || 'contenido';
  const agent = CS_AGENTS[CS_AGENT]?.title.replace('Agente ', '').replace(' / ', '-') || CS_AGENT;
  const date = new Date().toISOString().split('T')[0];
  const header = `Próximo Rol — ${agent}\nFecha: ${date}\nTema: ${topic}\n${'─'.repeat(50)}\n\n`;
  csDownload(`PR_${agent}_${date}.txt`, header + content, 'text/plain');
}

function csExportAllTxt() {
  const store = JSON.parse(localStorage.getItem(CS_STORE) || '{}');
  const date = new Date().toISOString().split('T')[0];
  let out = `Próximo Rol — Content Studio Export\nFecha: ${date}\n${'═'.repeat(50)}\n\n`;
  Object.entries(store).forEach(([agent, d]) => {
    const label = CS_AGENTS[agent]?.title.replace('Agente ', '') || agent;
    const ago = csSavedAgo(d.savedAt);
    out += `${label.toUpperCase()} — guardado ${ago}\nTema: ${d.topic || '—'}\n${'─'.repeat(40)}\n${d.content || '—'}\n\n`;
  });
  csDownload(`PR_ContentStudio_Todo_${date}.txt`, out, 'text/plain');
}

function csDownload(filename, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

/* ── Bridge: recibe tema y contexto desde Content Audit ── */
function csPreload(topic, context) {
  const navItem = [...document.querySelectorAll('.ni')]
    .find(el => el.getAttribute('onclick')?.includes("'content'"));
  showP('content', navItem || null);
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const topicEl = document.getElementById('cs-topic');
    const notesEl = document.getElementById('cs-notes');
    if (topicEl) {
      topicEl.value = topic;
      topicEl.dispatchEvent(new Event('input'));
      topicEl.focus();
      topicEl.style.borderColor = 'var(--green)';
      setTimeout(() => { topicEl.style.borderColor = ''; }, 2000);
    }
    if (notesEl && context) notesEl.value = context;
  }));
}
