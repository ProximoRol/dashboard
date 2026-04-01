/* ═══════════════════════════════════════════════
   CONTENT STUDIO — Sub-agentes por plataforma
   Depends on: core.js (CFG, antFetch, setNB)
   ═══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════
   CONTENT STUDIO
   ══════════════════════════════════════════════════════ */
let CS_AGENT='instagram',CS_CHAT_HISTORY=[],CS_LAST_CONTENT='';
const CS_AGENTS={
  instagram:{title:'Agente Instagram / TikTok',badge:'Reel · Post',badgeClass:'bg-p',placeholder:'Ej: El 73% de los reclutadores descarta candidatos en los primeros 30 segundos',
    system:`Eres el agente especialista en Instagram y TikTok de Próximo Rol, servicio de coaching de entrevistas para profesionales en España, UK y LATAM.
REGLAS: El gancho en las primeras 2 líneas es crítico. Máximo 300 palabras. Párrafos de 1-2 líneas. Listas con emojis. CTA claro al final. 5-8 hashtags relevantes.
ESTRUCTURA: 1) GANCHO (dato impactante o pregunta) 2) DESARROLLO (3-5 puntos con datos) 3) CTA 4) HASHTAGS
Marca con [VERIFICAR] datos que no puedas confirmar con certeza.`},
  linkedin:{title:'Agente LinkedIn',badge:'Artículo · Post',badgeClass:'bg-b',placeholder:'Ej: Por qué los profesionales más cualificados suelen fallar en las entrevistas',
    system:`Eres el agente especialista en LinkedIn de Próximo Rol, servicio de coaching de entrevistas para profesionales en España, UK y LATAM.
REGLAS: Primera línea debe crear curiosidad. Párrafos cortos (1-3 líneas). Evitar lenguaje de ventas. CTA que genere comentarios. 800-1200 caracteres óptimo.
ESTRUCTURA: 1) APERTURA (dato sorprendente o experiencia) 2) CONTEXTO (problema real vs creencia) 3) INSIGHTS con datos 4) CIERRE con pregunta para comentarios
Marca con [VERIFICAR] datos que no puedas confirmar.`},
  newsletter:{title:'Agente Newsletter',badge:'Email',badgeClass:'bg-g',placeholder:'Ej: El error de preparación que comete el 90% de los candidatos',
    system:`Eres el agente especialista en Newsletter de Próximo Rol, servicio de coaching de entrevistas para profesionales en España, UK y LATAM.
REGLAS: Asunto corto y curioso (máx 50 chars). Tono personal e íntimo. Un solo CTA. 300-500 palabras. Párrafos cortos.
ESTRUCTURA: 1) ASUNTO 2) PREENCABEZADO 3) APERTURA personal 4) NÚCLEO con valor real 5) CTA único 6) FIRMA breve
Marca con [VERIFICAR] datos que no puedas confirmar.`},
  youtube:{title:'Agente YouTube',badge:'Guión · Script',badgeClass:'bg-r',placeholder:'Ej: Los 5 errores de entrevista que cometen incluso los candidatos más preparados',
    system:`Eres el agente especialista en YouTube de Próximo Rol, servicio de coaching de entrevistas para profesionales en España, UK y LATAM.
REGLAS: Primeros 30 segundos críticos para retención. Gancho con promesa específica. Patrón: Gancho → Credibilidad → Desarrollo → Resumen → CTA.
ESTRUCTURA: [GANCHO 0:00-0:30] [CREDIBILIDAD 0:30-1:00] [DESARROLLO 1:00-7:00 con 3-5 puntos numerados] [RESUMEN 7:00-8:00] [CTA 8:00-8:30] [DESCRIPCIÓN SEO]
Marca con [VERIFICAR] datos que no puedas confirmar.`}
};

function csTab(agent,el){
  CS_AGENT=agent;
  document.querySelectorAll('.cs-tab').forEach(t=>t.classList.remove('active'));
  el.classList.add('active');
  const cfg=CS_AGENTS[agent];
  document.getElementById('cs-agent-title').textContent=cfg.title;
  document.getElementById('cs-agent-badge').textContent=cfg.badge;
  document.getElementById('cs-agent-badge').className='bg '+cfg.badgeClass;
  document.getElementById('cs-topic').placeholder=cfg.placeholder;
}

function csInitChips(){
  ['cs-tone-chips','cs-depth-chips'].forEach(gid=>{
    const group=document.getElementById(gid);
    if(!group)return;
    group.querySelectorAll('.cs-chip').forEach(chip=>{
      chip.onclick=()=>{
        group.querySelectorAll('.cs-chip').forEach(c=>c.classList.remove('active'));
        chip.classList.add('active');
      };
    });
  });
}

function csGetChip(gid){
  const a=document.querySelector('#'+gid+' .cs-chip.active');
  return a?a.dataset.val:'';
}

async function csGenerate(){
  const topic=document.getElementById('cs-topic').value.trim();
  if(!topic){alert('Escribe un tema primero');return;}
  if(!CFG.ak){alert('Configura tu API Key de Anthropic en ⚙️ Settings.');showP('settings',null);return;}
  const tone=csGetChip('cs-tone-chips');
  const depth=csGetChip('cs-depth-chips');
  const cfg=CS_AGENTS[CS_AGENT];
  const btn=document.getElementById('cs-gen-btn');
  btn.disabled=true;
  btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-6-8.5"/></svg> Generando…';
  const outEl=document.getElementById('cs-output');
  const labelEl=document.getElementById('cs-out-label');
  const copyBtn=document.getElementById('cs-copy-btn');
  outEl.innerHTML='<div style="padding:24px;text-align:center;color:var(--ht)"><div style="font-size:22px;margin-bottom:8px">⏳</div><div>Generando contenido…</div></div>';
  copyBtn.style.display='none';
  const userPrompt=`NEGOCIO: Próximo Rol — coaching de entrevistas para profesionales en España, UK y LATAM. Web: proximorol.com. Servicios: sesión única, pack completo, acompañamiento total. Audiencia: profesionales 28-45 años.\n\nTAREA: Crea contenido para ${cfg.title.replace('Agente ','')} sobre:\n"${topic}"\n\nTONO: ${tone}\nPROFUNDIDAD: ${depth}\n\nGenera SOLO el contenido listo para publicar, sin introducción ni explicaciones adicionales.`;
  CS_CHAT_HISTORY=[{role:'user',content:userPrompt}];
  try{
    const data=await antFetch({model:'claude-sonnet-4-20250514',max_tokens:1200,system:cfg.system,messages:CS_CHAT_HISTORY});
    const text=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    CS_LAST_CONTENT=text;
    CS_CHAT_HISTORY.push({role:'assistant',content:text});
    outEl.textContent=text;
    labelEl.textContent=cfg.title.replace('Agente ','')+' — listo';
    copyBtn.style.display='inline-block';
    document.getElementById('cs-chat-card').style.display='block';
    document.getElementById('cs-chat-history').innerHTML='';
    setNB('content','live');
  }catch(e){
    outEl.innerHTML=`<div style="padding:14px;background:var(--rp);border-radius:var(--r);font-size:12px;color:#991B1B">⚠ ${e.message}</div>`;
  }
  btn.disabled=false;
  btn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 8 12 12 14 14"/></svg> Generar contenido';
}

async function csChatSend(){
  const input=document.getElementById('cs-chat-input');
  const msg=input.value.trim();
  if(!msg||!CS_LAST_CONTENT)return;
  const histEl=document.getElementById('cs-chat-history');
  const sendBtn=document.getElementById('cs-chat-send');
  histEl.innerHTML+=`<div class="cs-msg-user">${msg}</div>`;
  input.value='';
  sendBtn.disabled=true;sendBtn.textContent='…';
  histEl.innerHTML+=`<div class="cs-msg-ai" id="cs-typing">Pensando…</div>`;
  histEl.scrollTop=histEl.scrollHeight;
  CS_CHAT_HISTORY.push({role:'user',content:msg});
  try{
    const data=await antFetch({model:'claude-sonnet-4-20250514',max_tokens:1200,system:CS_AGENTS[CS_AGENT].system,messages:CS_CHAT_HISTORY});
    const text=(data.content||[]).filter(b=>b.type==='text').map(b=>b.text).join('');
    CS_CHAT_HISTORY.push({role:'assistant',content:text});
    CS_LAST_CONTENT=text;
    document.getElementById('cs-typing').textContent=text;
    document.getElementById('cs-output').textContent=text;
    document.getElementById('cs-out-label').textContent='Actualizado';
    histEl.scrollTop=histEl.scrollHeight;
  }catch(e){document.getElementById('cs-typing').textContent='⚠ '+e.message;}
  sendBtn.disabled=false;sendBtn.textContent='Enviar';
}

function csCopy(){
  const text=document.getElementById('cs-output').textContent;
  navigator.clipboard.writeText(text).then(()=>{
    const btn=document.getElementById('cs-copy-btn');
    btn.textContent='¡Copiado!';btn.style.background='var(--gp)';btn.style.color='var(--green)';
    setTimeout(()=>{btn.textContent='Copiar';btn.style.background='';btn.style.color='';},2000);
  });
}

