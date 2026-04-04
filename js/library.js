/* ═══════════════════════════════════════════════════════════════
   CONTENT LIBRARY v2 — Biblioteca + Sistema inteligente de contexto
   
   3 modos para obtener contenido del sitio web:
   A (Opción A) — Web search en tiempo real: solo cuando el usuario lo pide
   B (Opción B) — Importar URL: se fetchea una vez, se guarda para siempre
   C (Opción C) — Sync semanal: botón sincroniza todo el sitio, válido 7 días
   
   El co-pilot pregunta antes de gastar dinero en búsquedas en tiempo real.
   ═══════════════════════════════════════════════════════════════ */

const LIB_KEY      = 'pr_content_library_v1';
const LIB_SITE_KEY = 'pr_site_snapshot_v1';

const LIB_CHANNELS = {
  linkedin  : { label:'LinkedIn',          icon:'💼', color:'#2563EB', bg:'#EFF6FF' },
  instagram : { label:'Instagram',         icon:'📸', color:'#BE185D', bg:'#FDF2F8' },
  blog      : { label:'Blog / Web',        icon:'📝', color:'#059669', bg:'#ECFDF5' },
  ads       : { label:'Ads (Google/Meta)', icon:'📢', color:'#D97706', bg:'#FFFBEB' },
  mailing   : { label:'Mailing',           icon:'📧', color:'#7C3AED', bg:'#F5F3FF' },
  tiktok    : { label:'TikTok / YouTube',  icon:'🎬', color:'#DC2626', bg:'#FEF2F2' },
  otro      : { label:'Otro',              icon:'📄', color:'#6B7280', bg:'#F9FAFB' },
};
const LIB_AGENT_MAP = {
  instagram:'instagram',linkedin:'linkedin',newsletter:'mailing',youtube:'tiktok',ads:'ads'
};

/* ── CRUD ── */
function libLoad(){try{return JSON.parse(localStorage.getItem(LIB_KEY)||'[]');}catch(_){return[];}}
function libSave(i){localStorage.setItem(LIB_KEY,JSON.stringify(i));}
function libAdd(item){const i=libLoad();i.unshift({...item,id:'lib_'+Date.now()});libSave(i);return i[0];}
function libUpdate(id,patch){const i=libLoad();const x=i.findIndex(a=>a.id===id);if(x!==-1){i[x]={...i[x],...patch};libSave(i);}}
function libDelete(id){libSave(libLoad().filter(i=>i.id!==id));}

/* ── Site snapshot ── */
function libGetSnapshot(){try{const r=localStorage.getItem(LIB_SITE_KEY);return r?JSON.parse(r):null;}catch(_){return null;}}
function libSaveSnapshot(data){localStorage.setItem(LIB_SITE_KEY,JSON.stringify({ts:Date.now(),data,date:new Date().toLocaleDateString('es-ES',{day:'numeric',month:'long',year:'numeric'})}));}
function libSnapshotAge(){const s=libGetSnapshot();if(!s)return null;return Math.floor((Date.now()-s.ts)/(24*60*60*1000));}
function libSnapshotIsStale(){const a=libSnapshotAge();return a===null||a>7;}

/* ══════════════════════════════════════
   HELPER — Fetch HTML via CORS proxy
   Sin AbortSignal (causa el bug), con
   fallback robusto si el proxy falla
══════════════════════════════════════ */
async function libFetchHtml(url) {
  /* Proxies en orden de fiabilidad */
  const proxies = [
    `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
    `https://corsproxy.io/?${encodeURIComponent(url)}`,
  ];
  for (const proxyUrl of proxies) {
    try {
      const r = await fetch(proxyUrl); /* Sin AbortSignal — era la causa del bug */
      if (!r.ok) continue;
      const raw = await r.text(); /* Leer UNA SOLA VEZ como texto */
      /* allorigins devuelve JSON {contents:"..."}, corsproxy devuelve HTML directo */
      let html = raw;
      try { const j = JSON.parse(raw); html = j.contents || j.body || raw; } catch(_){}
      if (!html || html.length < 100) continue;
      /* Limpiar HTML */
      const clean = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[\s\S]*?<\/nav>/gi, '')
        .replace(/<footer[\s\S]*?<\/footer>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      if (clean.length > 100) return clean.slice(0, 6000);
    } catch(_) { continue; } /* Silencioso — probar el siguiente */
  }
  return null; /* null = proxy falló, activar fallback */
}

/* ══════════════════════════════════════
   OPCIÓN C — SYNC SEMANAL
   Intenta CORS proxy → si falla, usa el
   conocimiento de Claude sobre el sitio
   (siempre funciona, sin errores de red)
══════════════════════════════════════ */
async function libSyncSite(silent){
  if(!CFG?.ak){if(!silent)alert('Necesitas la API key de Anthropic en Settings.');return;}
  const btn=document.getElementById('lib-sync-btn');
  if(btn){btn.disabled=true;btn.textContent='⟳ Sincronizando…';}
  try{
    /* Intento 1: CORS proxy para leer el sitio real */
    const homeText = await libFetchHtml('https://www.proximorol.com/')
                  || await libFetchHtml('https://proximorol.com/');
    const sitemapText = await libFetchHtml('https://www.proximorol.com/sitemap.xml').catch(()=>null) || '';

    /* Construir prompt: con datos reales si los hay, con conocimiento del modelo si no */
    const prompt = homeText
      ? `Analiza el contenido real de proximorol.com y extrae información estructurada.

HOMEPAGE (contenido real):
${homeText.slice(0,3500)}
${sitemapText ? '\nSITEMAP:\n' + sitemapText.slice(0,1000) : ''}

Extrae páginas, blog, servicios, keywords presentes y keywords ausentes importantes para el nicho.`

      : `Basándote en tu conocimiento de entrenamiento sobre proximorol.com:
Es un servicio de coaching de entrevistas para profesionales hispanohablantes.
Describe las páginas que probablemente tiene, servicios, y keywords que usa vs las que debería usar.
Sé específico basándote en lo que sabes del negocio.`;

    const fullPrompt = prompt + `\n\nDevuelve SOLO JSON válido sin markdown:\n{"pages":[{"url":"","title":"","description":"","keywords":[]}],"blog":{"exists":true,"posts":[{"url":"","title":"","summary":""}]},"services":[],"mainKeywords":[],"missingKeywords":[],"summary":"descripción en 2-3 frases","source":"${homeText?'live':'knowledge'}"}`;

    const data = await antFetch({
      model:'claude-haiku-4-5-20251001', max_tokens:2000,
      messages:[{role:'user', content:fullPrompt}]
    });

    const raw=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
    const m=raw.match(/\{[\s\S]*\}/);
    if(!m) throw new Error('Respuesta inesperada del modelo. Inténtalo de nuevo.');
    const parsed=JSON.parse(m[0]);
    libSaveSnapshot(parsed);

    if(!silent){
      const src = parsed.source==='live' ? '🌐 Datos en tiempo real' : '🧠 Conocimiento del modelo';
      const pC=parsed.pages?.length||0, bC=parsed.blog?.posts?.length||0;
      alert(`✅ Sitio sincronizado (${src}).\n${pC} páginas · ${bC} posts encontrados.\nEl co-pilot ya conoce proximorol.com.`);
    }
    if(document.getElementById('page-library')?.classList.contains('active')) renderLibraryPage();

  }catch(err){
    if(!silent) alert('Error al sincronizar: '+err.message);
    console.warn('Sync failed:',err);
  }finally{
    if(btn){btn.disabled=false;btn.textContent='🔄 Sincronizar sitio';}
  }
}

/* ══════════════════════════════════════
   OPCIÓN B — FETCH DE URL INDIVIDUAL
   CORS proxy → texto → Claude analiza
   Si proxy falla → modo manual (paste)
══════════════════════════════════════ */
async function libFetchAndSaveUrl(url,channel,title){
  if(!CFG?.ak) throw new Error('Necesitas la API key de Anthropic en Settings.');
  if(!url) throw new Error('URL vacía');

  /* Intentar obtener el contenido via proxy */
  const pageText = await libFetchHtml(url);

  if(!pageText){
    /* Proxy falló — lanzar error especial para que el modal muestre "pegar manualmente" */
    throw new Error('CORS_FAILED');
  }

  const prompt = `Analiza este contenido de página web:

URL: ${url}
CONTENIDO:
${pageText.slice(0,4500)}

Devuelve SOLO JSON válido sin markdown:
{"title":"título","description":"descripción breve","mainContent":"texto principal relevante máx 800 palabras sin nav ni footer","keywords":["palabra","clave"],"publishDate":"fecha o null","contentType":"blog_post|landing_page|service_page|other"}`;

  const data = await antFetch({model:'claude-haiku-4-5-20251001', max_tokens:1200, messages:[{role:'user',content:prompt}]});
  const raw=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim();
  const m=raw.match(/\{[\s\S]*\}/);
  if(!m) throw new Error('No se pudo procesar el contenido');
  const parsed=JSON.parse(m[0]);

  return libAdd({
    channel:channel||'blog', title:title||parsed.title||url,
    content:parsed.mainContent||pageText.slice(0,800),
    url, keywords:parsed.keywords||[], contentType:parsed.contentType,
    status:'published',
    publishedAt:parsed.publishDate?new Date(parsed.publishDate).toISOString():new Date().toISOString(),
    createdAt:new Date().toISOString(), source:'url_fetch', fetchedAt:new Date().toISOString()
  });
}

/* ══════════════════════════════════════
   OPCIÓN A — REAL-TIME (cuando usuario lo pide)
   Usa proxy si disponible, fallback a Claude knowledge
══════════════════════════════════════ */
async function libRealtimeSearch(query){
  if(!CFG?.ak) return null;
  try{
    const homeText = await libFetchHtml('https://www.proximorol.com/');
    const context = homeText
      ? `Contenido actual de proximorol.com:\n${homeText.slice(0,2500)}`
      : `Usando conocimiento de entrenamiento sobre proximorol.com (coaching de entrevistas España/LATAM)`;
    const data = await antFetch({
      model:'claude-haiku-4-5-20251001', max_tokens:500,
      messages:[{role:'user',content:`${context}\n\nPregunta: ${query}\n\nResponde en español, máximo 250 palabras, datos concretos.`}]
    });
    return(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('').trim()||null;
  }catch(_){return null;}
}

/* ══════════════════════════════════════
   SISTEMA INTELIGENTE DE ROUTING
   Llamado por el co-pilot antes de responder
══════════════════════════════════════ */
function libBuildCopilotContext(){
  const lines=[];
  const items=libLoad().filter(i=>i.status==='published');
  if(items.length>0){
    const byChannel={};
    items.forEach(i=>{if(!byChannel[i.channel])byChannel[i.channel]=[];byChannel[i.channel].push(i);});
    lines.push('## CONTENIDO PUBLICADO (biblioteca local)');
    Object.entries(byChannel).forEach(([ch,list])=>{
      const cfg=LIB_CHANNELS[ch];
      lines.push(`\n### ${cfg?.label||ch} (${list.length} piezas)`);
      list.slice(0,5).forEach(item=>{
        const date=item.publishedAt?new Date(item.publishedAt).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'}):new Date(item.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'short'});
        const preview=(item.content||'').slice(0,250).replace(/\n/g,' ');
        lines.push(`- [${date}] **${item.title||'Sin título'}**: ${preview}${item.content?.length>250?'…':''}`);
        if(item.url)lines.push(`  URL: ${item.url}`);
        if(item.keywords?.length)lines.push(`  Keywords: ${item.keywords.slice(0,5).join(', ')}`);
      });
      if(list.length>5)lines.push(`  … y ${list.length-5} piezas más`);
    });
  }
  const snap=libGetSnapshot();
  if(snap?.data){
    const age=libSnapshotAge();
    lines.push(`\n## SITIO WEB PROXIMOROL.COM (sync hace ${age===0?'hoy':age+' días'})`);
    if(snap.data.summary)lines.push(snap.data.summary);
    if(snap.data.pages?.length){
      lines.push('\nPáginas principales:');
      snap.data.pages.slice(0,6).forEach(p=>lines.push(`- ${p.url}: ${p.title}${p.description?' — '+p.description.slice(0,80):''}`));
    }
    if(snap.data.blog?.exists&&snap.data.blog.posts?.length){
      lines.push('\nBlog — posts recientes:');
      snap.data.blog.posts.slice(0,5).forEach(p=>lines.push(`- ${p.title}${p.url?' ('+p.url+')':''}`));
    }
    if(snap.data.mainKeywords?.length)lines.push('\nKeywords en el sitio: '+snap.data.mainKeywords.join(', '));
    if(snap.data.missingKeywords?.length)lines.push('Keywords ausentes (gaps reales): '+snap.data.missingKeywords.join(', '));
    if(libSnapshotIsStale())lines.push('\n⚠ El sync del sitio tiene más de 7 días. Actualízalo en la Biblioteca.');
  }else{
    lines.push('\n## SITIO WEB — Sin sincronizar');
    lines.push('No tengo el contenido de proximorol.com. Para obtenerlo: Biblioteca → "Sincronizar sitio" (~$0.03, válido 7 días).');
  }
  if(lines.length<=2)return null;
  lines.push('\nBasa tus respuestas sobre el sitio en estos datos reales. Si la información es insuficiente, dilo y sugiere qué sync haría falta.');
  return lines.join('\n');
}

function libGetContextStatus(){
  const items=libLoad().filter(i=>i.status==='published');
  const snap=libGetSnapshot();
  return{hasLibrary:items.length>0,libraryCount:items.length,hasSnapshot:!!snap,snapshotAge:libSnapshotAge(),snapshotStale:libSnapshotIsStale(),hasAnyContext:items.length>0||!!snap};
}

/* Llamada por el co-pilot para decidir si preguntar al usuario */
function libShouldAskForWebSearch(userMsg){
  const status=libGetContextStatus();
  const m=userMsg.toLowerCase();
  const needsFresh=/publicad[oa] ayer|publicad[oa] hoy|ayer publiqué|acabas? de publicar|recién publicad|indexad|aparezco en google|posicion.*hoy|ranking.*hoy|indexa.*hoy/.test(m);
  const asksAboutSite=/mi (web|pagina|sitio|blog)|proximorol\.com|la (web|pagina|homepage)|nuestro (sitio|blog)/.test(m);
  if(needsFresh)return{type:'realtime',message:'⚡ Esta pregunta parece necesitar datos en tiempo real de tu sitio web.\n\n¿Quieres que busque ahora mismo en proximorol.com? (~$0.03 de crédito API)\n\nResponde **"sí busca"** para confirmarlo, o **"no, responde con lo que tienes"** para usar el contexto guardado.',extractQuery:userMsg};
  if(asksAboutSite&&!status.hasAnyContext)return{type:'sync_needed',message:'📊 No tengo el contenido de tu sitio web guardado todavía.\n\nTengo dos opciones:\n- **"Sincronizar ahora"** → Analizo todo proximorol.com y lo guardo para siempre (~$0.03, luego gratis)\n- **"Responde igual"** → Te respondo con mi conocimiento del mercado, sin ver el sitio\n\n¿Cuál prefieres?'};
  if(asksAboutSite&&status.snapshotStale)return{type:'sync_stale',message:`📅 Mi información del sitio tiene **${status.snapshotAge} días** de antigüedad.\n\n¿Quieres que la actualice antes de responder? (~$0.03) o ¿continúo con lo que tengo?`};
  return null;
}

function libParseUserConfirmation(msg){
  const m=msg.toLowerCase();
  if(/sí|si|busca|actualiz|sync|sincroniz|adelante|hazlo|yes|claro|por favor/.test(m))return'yes';
  if(/no|igual|sin buscar|lo que tienes|responde?.* igual|directo/.test(m))return'no';
  return null;
}

/* ══════════════════════════════════════
   UI — Página de biblioteca
══════════════════════════════════════ */
let LIB_FILTER={channel:'all',status:'all',search:'',sort:'newest'};
let LIB_CHANNEL_VIEW='all';

function renderLibraryPage(){
  const page=document.getElementById('page-library');if(!page)return;
  const items=libLoad();
  const snap=libGetSnapshot();
  const snapshotAge=libSnapshotAge();
  const counts={};items.forEach(i=>{counts[i.channel]=(counts[i.channel]||0)+1;});
  const totalPub=items.filter(i=>i.status==='published').length;
  const totalDraft=items.filter(i=>i.status==='draft').length;

  const tabs=[{id:'all',label:'Todo',count:items.length},...Object.entries(LIB_CHANNELS).map(([id,cfg])=>({id,label:cfg.label,icon:cfg.icon,count:counts[id]||0}))]
    .map(t=>`<button class="lib-tab ${t.id===LIB_CHANNEL_VIEW?'active':''}" onclick="LIB_CHANNEL_VIEW='${t.id}';LIB_FILTER.channel='${t.id}';renderLibraryPage()">${t.icon?t.icon+' ':''}${t.label}${t.count>0?`<span class="lib-tab-count">${t.count}</span>`:''}</button>`).join('');

  const syncColor=libSnapshotIsStale()?'var(--green)':'var(--sf2)';
  const syncTextColor=libSnapshotIsStale()?'white':'var(--mt)';
  const syncBorder=libSnapshotIsStale()?'none':'1px solid var(--bd2)';

  page.innerHTML=`
    <div class="sh"><span class="sl">Biblioteca de Contenido</span><div class="sln"></div></div>

    <!-- Sync bar -->
    <div style="display:flex;gap:10px;align-items:center;padding:10px 14px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);margin-bottom:14px;flex-wrap:wrap">
      <div style="flex:1;min-width:180px">
        <div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:2px">🌐 Sitio web — proximorol.com</div>
        <div style="font-size:11px;color:var(--mt)">${snap?`Último sync: ${snap.date||'—'} · hace ${snapshotAge===0?'hoy':snapshotAge+' días'} ${libSnapshotIsStale()?'· <span style="color:var(--amber)">⚠ Desactualizado (>7 días)</span>':'· <span style="color:var(--green)">✓ Al día</span>'}`:
'Sin sincronizar — el co-pilot no conoce el contenido de tu sitio'}</div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        <button id="lib-sync-btn" onclick="libSyncSite(false)" style="padding:7px 13px;border:${syncBorder};border-radius:var(--r);font-size:12px;cursor:pointer;background:${syncColor};color:${syncTextColor};font-family:inherit;font-weight:500">🔄 Sincronizar sitio</button>
        <button onclick="libShowUrlFetch()" style="padding:7px 13px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">🌐 Importar URL</button>
        ${snap?`<button onclick="if(confirm('¿Borrar el sync del sitio?')){localStorage.removeItem('${LIB_SITE_KEY}');renderLibraryPage();}" style="padding:7px 8px;border:1px solid #FECACA;border-radius:var(--r);font-size:11px;cursor:pointer;background:none;color:var(--red);font-family:inherit">×</button>`:''}
      </div>
    </div>

    <!-- Stats -->
    <div style="display:flex;gap:10px;margin-bottom:14px;flex-wrap:wrap">
      <div style="background:var(--gp);border:1px solid #9FE1CB;border-radius:var(--r);padding:8px 14px;display:flex;gap:8px;align-items:center"><span>✅</span><div><div style="font-size:18px;font-weight:600;color:var(--green);line-height:1">${totalPub}</div><div style="font-size:10px;color:var(--green)">Publicados</div></div></div>
      <div style="background:var(--ap);border:1px solid #FDE68A;border-radius:var(--r);padding:8px 14px;display:flex;gap:8px;align-items:center"><span>📝</span><div><div style="font-size:18px;font-weight:600;color:var(--amber);line-height:1">${totalDraft}</div><div style="font-size:10px;color:var(--amber)">Borradores</div></div></div>
      <div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:8px 14px;display:flex;gap:8px;align-items:center"><span>📚</span><div><div style="font-size:18px;font-weight:600;color:var(--tx);line-height:1">${items.length}</div><div style="font-size:10px;color:var(--ht)">Total</div></div></div>
      ${snap?.data?.pages?.length?`<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--r);padding:8px 14px;display:flex;gap:8px;align-items:center"><span>🌐</span><div><div style="font-size:18px;font-weight:600;color:var(--tx);line-height:1">${snap.data.pages.length}</div><div style="font-size:10px;color:var(--ht)">Págs. web</div></div></div>`:''}
    </div>

    <!-- Channel tabs -->
    <div style="display:flex;gap:4px;overflow-x:auto;margin-bottom:14px;padding-bottom:2px;scrollbar-width:none">${tabs}</div>

    <!-- Filters -->
    <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:14px">
      <input id="lib-search" type="text" placeholder="🔍 Buscar en toda la biblioteca..." value="${LIB_FILTER.search}"
        oninput="LIB_FILTER.search=this.value;libRenderItems()"
        style="flex:1;min-width:180px;padding:8px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;background:var(--sf2);color:var(--tx);outline:none"/>
      <select onchange="LIB_FILTER.status=this.value;libRenderItems()" style="padding:7px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf2);color:var(--tx);cursor:pointer">
        <option value="all">Todos los estados</option>
        <option value="published">✅ Publicado</option>
        <option value="draft">📝 Borrador</option>
      </select>
      <select onchange="LIB_FILTER.sort=this.value;libRenderItems()" style="padding:7px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf2);color:var(--tx);cursor:pointer">
        <option value="newest">Más reciente</option>
        <option value="oldest">Más antiguo</option>
        <option value="published_first">Publicados primero</option>
      </select>
      <button onclick="libShowAddModal()" class="btn-s" style="padding:7px 14px">+ Añadir</button>
    </div>

    <div id="lib-items-wrap"></div>`;

  libRenderItems();
}

function libRenderItems(){
  const wrap=document.getElementById('lib-items-wrap');if(!wrap)return;
  let items=libLoad();
  if(LIB_FILTER.channel!=='all')items=items.filter(i=>i.channel===LIB_FILTER.channel);
  if(LIB_FILTER.status!=='all')items=items.filter(i=>i.status===LIB_FILTER.status);
  if(LIB_FILTER.search.trim()){const q=LIB_FILTER.search.toLowerCase();items=items.filter(i=>(i.title||'').toLowerCase().includes(q)||(i.content||'').toLowerCase().includes(q)||(i.url||'').toLowerCase().includes(q));}
  if(LIB_FILTER.sort==='oldest')items.sort((a,b)=>new Date(a.createdAt)-new Date(b.createdAt));
  else if(LIB_FILTER.sort==='published_first')items.sort((a,b)=>a.status==='published'?-1:1);
  else items.sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt));

  if(!items.length){
    wrap.innerHTML=`<div style="text-align:center;padding:3rem;color:var(--ht)"><div style="font-size:36px;margin-bottom:12px">📚</div><div style="font-size:14px;font-weight:500;margin-bottom:6px">${LIB_FILTER.search?'Sin resultados':'Sin contenido todavía'}</div><div style="font-size:12px">${LIB_FILTER.search?'Prueba con otra búsqueda':'Sincroniza el sitio, importa una URL, o genera contenido en el Content Studio.'}</div></div>`;
    return;
  }

  if(LIB_CHANNEL_VIEW==='all'&&!LIB_FILTER.search.trim()&&LIB_FILTER.status==='all'){
    const groups={};items.forEach(i=>{if(!groups[i.channel])groups[i.channel]=[];groups[i.channel].push(i);});
    wrap.innerHTML=Object.entries(groups).map(([ch,list])=>{const cfg=LIB_CHANNELS[ch]||LIB_CHANNELS.otro;return`<div style="margin-bottom:20px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><span style="font-size:16px">${cfg.icon}</span><span style="font-size:13px;font-weight:600;color:${cfg.color}">${cfg.label}</span><span style="font-size:11px;color:var(--ht)">${list.length} ${list.length===1?'pieza':'piezas'}</span></div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">${list.map(item=>libCardHTML(item)).join('')}</div></div>`;}).join('');
  }else{
    wrap.innerHTML=`<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px">${items.map(item=>libCardHTML(item)).join('')}</div>`;
  }
}

function libCardHTML(item){
  const ch=LIB_CHANNELS[item.channel]||LIB_CHANNELS.otro;
  const date=new Date(item.createdAt).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric'});
  const preview=(item.content||'').slice(0,180).replace(/</g,'&lt;').replace(/\n/g,' ');
  const isPub=item.status==='published';
  const pubDate=item.publishedAt?new Date(item.publishedAt).toLocaleDateString('es-ES',{day:'numeric',month:'short'}):null;
  const srcLabel=item.source==='url_fetch'?'🌐':item.source==='content_studio'?'✍️':'✏️';
  return`<div class="lib-card" style="border-left:3px solid ${ch.color}">
    <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:6px;margin-bottom:7px">
      <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;flex:1;min-width:0">
        <span style="font-size:10px;padding:2px 7px;border-radius:20px;background:${ch.bg};color:${ch.color};font-weight:600;white-space:nowrap">${ch.icon} ${ch.label}</span>
        <span style="font-size:10px;padding:2px 6px;border-radius:20px;font-weight:500;${isPub?'background:var(--gp);color:var(--green)':'background:var(--ap);color:var(--amber)'}">${isPub?'✅':'📝'}</span>
        <span style="font-size:10px;color:var(--ht)">${srcLabel}</span>
      </div>
      <div style="display:flex;gap:3px;flex-shrink:0">
        ${!isPub?`<button onclick="libMarkPublished('${item.id}')" style="padding:2px 7px;background:var(--green);color:white;border:none;border-radius:5px;font-size:10px;font-weight:500;cursor:pointer;font-family:inherit">Publicar</button>`:''}
        <button onclick="libShowDetail('${item.id}')" style="padding:2px 6px;border:1px solid var(--bd2);border-radius:5px;font-size:10px;cursor:pointer;background:none;color:var(--mt);font-family:inherit">Ver</button>
        <button onclick="if(confirm('¿Eliminar?')){libDelete('${item.id}');libRenderItems()}" style="padding:2px 5px;border:none;font-size:12px;cursor:pointer;background:none;color:var(--ht)">×</button>
      </div>
    </div>
    ${item.title?`<div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${item.title.replace(/</g,'&lt;')}</div>`:''}
    <div style="font-size:11px;color:var(--mt);line-height:1.5;overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical">${preview}${item.content?.length>180?'…':''}</div>
    <div style="display:flex;align-items:center;gap:6px;margin-top:7px;flex-wrap:wrap">
      <span style="font-size:10px;color:var(--ht)">${date}</span>
      ${pubDate?`<span style="font-size:10px;color:var(--green)">Pub: ${pubDate}</span>`:''}
      ${item.url?`<a href="${item.url}" target="_blank" style="font-size:10px;color:var(--blue);text-decoration:none;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:100px">${item.url.replace('https://','').replace('http://','')}</a>`:''}
    </div>
  </div>`;
}

function libMarkPublished(id){
  const url=prompt('URL donde se publicó (opcional):')||'';
  libUpdate(id,{status:'published',publishedAt:new Date().toISOString(),url:url.trim()||null});
  libRenderItems();
}

function libShowDetail(id){
  const item=libLoad().find(i=>i.id===id);if(!item)return;
  const ch=LIB_CHANNELS[item.channel]||LIB_CHANNELS.otro;
  const isPub=item.status==='published';
  document.getElementById('lib-detail-modal')?.remove();
  const ov=document.createElement('div');
  ov.id='lib-detail-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  ov.innerHTML=`<div style="background:var(--sf);border-radius:var(--rl);width:620px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18)">
    <div style="display:flex;align-items:center;gap:8px;padding:13px 16px;border-bottom:1px solid var(--bd);flex-shrink:0">
      <span style="font-size:12px;padding:2px 9px;border-radius:20px;background:${ch.bg};color:${ch.color};font-weight:600">${ch.icon} ${ch.label}</span>
      <span style="font-size:10px;padding:2px 7px;border-radius:20px;font-weight:500;${isPub?'background:var(--gp);color:var(--green)':'background:var(--ap);color:var(--amber)'}">${isPub?'✅ Publicado':'📝 Borrador'}</span>
      <button onclick="document.getElementById('lib-detail-modal').remove()" style="background:none;border:none;cursor:pointer;color:var(--ht);font-size:18px;margin-left:auto">×</button>
    </div>
    <div style="overflow-y:auto;flex:1;padding:16px">
      ${item.title?`<div style="font-size:15px;font-weight:600;margin-bottom:8px">${item.title.replace(/</g,'&lt;')}</div>`:''}
      ${item.url?`<div style="font-size:11px;margin-bottom:10px"><a href="${item.url}" target="_blank" style="color:var(--blue)">${item.url}</a></div>`:''}
      <div style="background:var(--sf2);border-radius:var(--r);padding:14px;font-size:13px;line-height:1.75;white-space:pre-wrap;color:var(--tx);max-height:380px;overflow-y:auto">${(item.content||'').replace(/</g,'&lt;')}</div>
      ${item.keywords?.length?`<div style="margin-top:8px;font-size:11px;color:var(--ht)">Keywords: ${item.keywords.join(', ')}</div>`:''}
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--bd);display:flex;gap:8px;flex-shrink:0">
      <button onclick="navigator.clipboard.writeText(this.closest('[style*=overflow:hidden]').querySelector('[style*=pre-wrap]').textContent);this.textContent='¡Copiado!';setTimeout(()=>this.textContent='Copiar',2000)"
        style="padding:6px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">Copiar</button>
      ${!isPub?`<button onclick="libMarkPublished('${item.id}')" class="btn-s">✓ Marcar publicado</button>`:''}
      <button onclick="libDelete('${item.id}');document.getElementById('lib-detail-modal').remove();libRenderItems()"
        style="padding:6px 12px;border:1px solid #FECACA;border-radius:var(--r);font-size:11px;cursor:pointer;background:none;color:var(--red);margin-left:auto;font-family:inherit">Eliminar</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

function libShowUrlFetch(){
  document.getElementById('lib-url-modal')?.remove();
  const ov=document.createElement('div');ov.id='lib-url-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  const chOpts=Object.entries(LIB_CHANNELS).map(([id,cfg])=>`<option value="${id}" ${id==='blog'?'selected':''}>${cfg.icon} ${cfg.label}</option>`).join('');
  ov.innerHTML=`<div style="background:var(--sf);border-radius:var(--rl);width:500px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18)">
    <div style="display:flex;align-items:center;padding:13px 16px;border-bottom:1px solid var(--bd)"><span style="font-size:14px;font-weight:600">Importar desde URL</span><button onclick="document.getElementById('lib-url-modal').remove()" style="background:none;border:none;cursor:pointer;color:var(--ht);font-size:18px;margin-left:auto">×</button></div>
    <div style="padding:16px;display:flex;flex-direction:column;gap:12px">
      <div style="padding:10px 12px;background:var(--gp);border-radius:var(--r);font-size:12px;color:var(--green2)">ℹ La página se lee <strong>una sola vez</strong> y se guarda localmente. Después el co-pilot la lee gratis.</div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">URL de la página</label>
        <input id="lib-url-input" class="fi" placeholder="https://www.proximorol.com/mi-blog-post" type="url"/></div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">Canal</label>
        <select id="lib-url-channel" style="width:100%;padding:8px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;background:var(--sf2);color:var(--tx);cursor:pointer">${chOpts}</select></div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">Título <span style="font-weight:400;text-transform:none">(opcional)</span></label>
        <input id="lib-url-title" class="fi" placeholder="Se detecta automáticamente"/></div>
      <div id="lib-url-status" style="font-size:12px;color:var(--mt);min-height:18px"></div>
      <!-- Fallback manual paste (oculto hasta que falle el proxy) -->
      <div id="lib-url-manual" style="display:none">
        <label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">Pega el contenido de la página aquí</label>
        <textarea id="lib-manual-content" rows="6" placeholder="Copia y pega el texto de la página web aquí..."
          style="width:100%;padding:9px 12px;border:1.5px solid var(--amber);border-radius:var(--r);font-size:12px;background:var(--sf);color:var(--tx);outline:none;resize:vertical;font-family:'DM Sans',sans-serif"></textarea>
        <button onclick="libSaveManualUrl()" class="btn-s" style="margin-top:8px;width:100%">Guardar con este contenido</button>
      </div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--bd);display:flex;gap:8px;justify-content:flex-end">
      <button onclick="document.getElementById('lib-url-modal').remove()" style="padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:none;font-family:inherit">Cancelar</button>
      <button id="lib-fetch-btn" onclick="libDoUrlFetch()" class="btn-s" style="padding:8px 18px">🌐 Importar URL</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

async function libDoUrlFetch(){
  const url=document.getElementById('lib-url-input')?.value?.trim();
  const channel=document.getElementById('lib-url-channel')?.value;
  const title=document.getElementById('lib-url-title')?.value?.trim();
  const statusEl=document.getElementById('lib-url-status');
  const manualWrap=document.getElementById('lib-url-manual');
  if(!url){if(statusEl)statusEl.textContent='⚠ Introduce una URL.';return;}
  if(statusEl)statusEl.textContent='⟳ Leyendo la página…';
  const btn=document.getElementById('lib-fetch-btn');
  if(btn){btn.disabled=true;btn.textContent='⟳ Leyendo…';}
  try{
    await libFetchAndSaveUrl(url,channel,title);
    if(statusEl)statusEl.textContent='✅ Guardado en la biblioteca.';
    setTimeout(()=>{document.getElementById('lib-url-modal')?.remove();if(document.getElementById('page-library')?.classList.contains('active'))libRenderItems();},1200);
  }catch(err){
    if(btn){btn.disabled=false;btn.textContent='🌐 Importar URL';}
    if(err.message==='CORS_FAILED'){
      /* Proxy no disponible → mostrar campo de texto manual */
      if(statusEl)statusEl.innerHTML='⚠ No se pudo leer la URL automáticamente. <strong>Pega el contenido manualmente abajo:</strong>';
      if(manualWrap){
        manualWrap.style.display='block';
        document.getElementById('lib-manual-content')?.focus();
      }
    }else{
      if(statusEl)statusEl.textContent='❌ Error: '+err.message;
    }
  }
}

function libSaveManualUrl(){
  const url=document.getElementById('lib-url-input')?.value?.trim();
  const channel=document.getElementById('lib-url-channel')?.value;
  const title=document.getElementById('lib-url-title')?.value?.trim();
  const content=document.getElementById('lib-manual-content')?.value?.trim();
  if(!content){alert('Pega el contenido de la página primero.');return;}
  libAdd({channel:channel||'blog',title:title||url,content,url:url||null,status:'published',
    publishedAt:new Date().toISOString(),createdAt:new Date().toISOString(),source:'manual'});
  document.getElementById('lib-url-modal')?.remove();
  if(document.getElementById('page-library')?.classList.contains('active'))libRenderItems();
}

function libShowAddModal(prefilledChannel,prefilledContent,prefilledTitle){
  document.getElementById('lib-add-modal')?.remove();
  const ov=document.createElement('div');ov.id='lib-add-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px';
  ov.onclick=e=>{if(e.target===ov)ov.remove();};
  const chOpts=Object.entries(LIB_CHANNELS).map(([id,cfg])=>`<option value="${id}" ${id===(prefilledChannel||'linkedin')?'selected':''}>${cfg.icon} ${cfg.label}</option>`).join('');
  ov.innerHTML=`<div style="background:var(--sf);border-radius:var(--rl);width:540px;max-height:85vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18)">
    <div style="display:flex;align-items:center;padding:13px 16px;border-bottom:1px solid var(--bd);flex-shrink:0"><span style="font-size:14px;font-weight:600">Añadir contenido</span><button onclick="document.getElementById('lib-add-modal').remove()" style="background:none;border:none;cursor:pointer;color:var(--ht);font-size:18px;margin-left:auto">×</button></div>
    <div style="overflow-y:auto;flex:1;padding:16px;display:flex;flex-direction:column;gap:12px">
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">Canal</label>
        <select id="lib-add-channel" style="width:100%;padding:8px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:13px;background:var(--sf2);color:var(--tx);cursor:pointer">${chOpts}</select></div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">Título</label>
        <input id="lib-add-title" class="fi" placeholder="Opcional" value="${prefilledTitle||''}"/></div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">Contenido</label>
        <textarea id="lib-add-content" rows="7" placeholder="Pega aquí el texto..." style="width:100%;padding:9px 12px;border:1.5px solid var(--bd2);border-radius:var(--r);font-size:13px;background:var(--sf);color:var(--tx);outline:none;resize:vertical;font-family:'DM Sans',sans-serif">${prefilledContent||''}</textarea></div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:5px">URL (si está publicado)</label>
        <input id="lib-add-url" class="fi" placeholder="https://..."/></div>
      <div><label style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.05em;display:block;margin-bottom:8px">Estado</label>
        <div style="display:flex;gap:14px"><label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px"><input type="radio" name="lib-add-status" value="draft" checked/> 📝 Borrador</label>
        <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:13px"><input type="radio" name="lib-add-status" value="published"/> ✅ Publicado</label></div></div>
    </div>
    <div style="padding:12px 16px;border-top:1px solid var(--bd);display:flex;gap:8px;justify-content:flex-end;flex-shrink:0">
      <button onclick="document.getElementById('lib-add-modal').remove()" style="padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:none;font-family:inherit">Cancelar</button>
      <button onclick="libSaveFromModal()" class="btn-s" style="padding:8px 18px">Guardar</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}

function libSaveFromModal(){
  const channel=document.getElementById('lib-add-channel')?.value;
  const title=document.getElementById('lib-add-title')?.value.trim();
  const content=document.getElementById('lib-add-content')?.value.trim();
  const url=document.getElementById('lib-add-url')?.value.trim();
  const status=document.querySelector('input[name="lib-add-status"]:checked')?.value||'draft';
  if(!content){alert('El contenido no puede estar vacío.');return;}
  libAdd({channel,title:title||null,content,url:url||null,status,publishedAt:status==='published'?new Date().toISOString():null,createdAt:new Date().toISOString(),source:'manual'});
  document.getElementById('lib-add-modal').remove();
  if(document.getElementById('page-library')?.classList.contains('active'))libRenderItems();
}

/* Content Studio integration */
function libInjectIntoContentStudio(){
  const check=setInterval(()=>{
    const copyBtn=document.getElementById('cs-copy-btn');if(!copyBtn)return;
    clearInterval(check);
    new MutationObserver(()=>{if(!document.getElementById('lib-cs-save-btn'))libAddStudioButtons();}).observe(copyBtn,{attributes:true,attributeFilter:['style']});
  },500);
}

function libAddStudioButtons(){
  document.getElementById('lib-cs-save-btn')?.remove();document.getElementById('lib-cs-publish-btn')?.remove();
  const copyBtn=document.getElementById('cs-copy-btn');if(!copyBtn?.parentElement)return;
  const saveBtn=document.createElement('button');saveBtn.id='lib-cs-save-btn';saveBtn.innerHTML='📚 Guardar';saveBtn.title='Guardar como borrador';
  saveBtn.style.cssText='padding:4px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);display:none;font-family:inherit';
  saveBtn.onclick=()=>libSaveFromStudio('draft');copyBtn.parentElement.insertBefore(saveBtn,copyBtn.nextSibling);
  const pubBtn=document.createElement('button');pubBtn.id='lib-cs-publish-btn';pubBtn.innerHTML='✅ Publicado';pubBtn.title='Guardar como publicado';
  pubBtn.style.cssText='padding:4px 10px;border:1px solid #9FE1CB;border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--gp);color:var(--green);display:none;font-family:inherit';
  pubBtn.onclick=()=>libSaveFromStudio('published');copyBtn.parentElement.insertBefore(pubBtn,saveBtn.nextSibling);
  new MutationObserver(()=>{const v=copyBtn.style.display!=='none';saveBtn.style.display=v?'inline-block':'none';pubBtn.style.display=v?'inline-block':'none';}).observe(copyBtn,{attributes:true,attributeFilter:['style']});
}

function libSaveFromStudio(status){
  const content=document.getElementById('cs-output')?.textContent?.trim();
  const topic=document.getElementById('cs-topic')?.value?.trim();
  if(!content||content.includes('Elige una plataforma')){alert('Genera contenido primero.');return;}
  const ch=LIB_AGENT_MAP[typeof CS_AGENT!=='undefined'?CS_AGENT:'instagram']||'instagram';
  if(status==='published'){
    const url=prompt('URL donde lo publicaste (opcional):')||'';
    libAdd({channel:ch,title:topic||null,content,url:url.trim()||null,status:'published',publishedAt:new Date().toISOString(),createdAt:new Date().toISOString(),source:'content_studio'});
    const btn=document.getElementById('lib-cs-publish-btn');if(btn){btn.textContent='✅ ¡Guardado!';setTimeout(()=>{btn.textContent='✅ Publicado';},2000);}
  }else{
    libAdd({channel:ch,title:topic||null,content,status:'draft',createdAt:new Date().toISOString(),source:'content_studio'});
    const btn=document.getElementById('lib-cs-save-btn');if(btn){btn.textContent='✓ Guardado';setTimeout(()=>{btn.textContent='📚 Guardar';},2000);}
  }
}

/* Init */
(function libInit(){
  const s=document.createElement('style');
  s.textContent=`.lib-tab{padding:6px 13px;border:1px solid var(--bd2);border-radius:20px;font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);white-space:nowrap;font-family:'DM Sans',sans-serif;transition:all .12s;display:inline-flex;align-items:center;gap:4px}.lib-tab:hover{border-color:var(--green);color:var(--green)}.lib-tab.active{background:var(--gp);color:var(--green);border-color:var(--green);font-weight:500}.lib-tab-count{font-size:10px;padding:1px 5px;border-radius:10px;background:rgba(0,0,0,.08);font-weight:600}.lib-card{background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:12px;transition:border-color .12s}.lib-card:hover{border-color:var(--bd2)}`;
  document.head.appendChild(s);

  function init(){
    /* page-library and nav item are already in index.html */
    if(typeof TITLES!=='undefined') TITLES['library']='Biblioteca de contenido';

    /* Hook showP to trigger render when user navigates to library */
    const orig=window.showP;
    window.showP=function(id,el){
      orig.apply(this,arguments);
      if(id==='library') requestAnimationFrame(()=>requestAnimationFrame(()=>renderLibraryPage()));
    };

    libInjectIntoContentStudio();
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init);
  else setTimeout(init,400);
})();
