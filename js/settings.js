/* ═══════════════════════════════════════════════
   SETTINGS — Panel de configuración de APIs
   Depends on: core.js (CFG, CK, loadAll)
   Extracted from budget.js — Issue #2
   ═══════════════════════════════════════════════ */

function buildSettings(){
  const pfs=[
    {id:'anthropic',icon:'🤖',name:'Anthropic API Key — IA (obligatorio para buscadores)',bg:'#F5F3FF',fields:[{k:'ak',l:'API Key',ph:'sk-ant-api03-…',hint:'<a href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com</a> → API Keys → Create Key'}]},
    {id:'g',icon:'📊',name:'Google — GA4 + GSC + Ads',bg:'#FEF2F2',fields:[{k:'clientId',l:'OAuth Client ID',ph:'123456789.apps.googleusercontent.com',hint:'<a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud</a> → Credentials'},{k:'ga4',l:'GA4 Property ID',ph:'properties/529427059'},{k:'gsc',l:'Search Console URL (optional)',ph:'https://www.proximorol.com/'},{k:'ads',l:'Google Ads Customer ID (optional)',ph:'559-870-7352'},{k:'adsToken',l:'Developer Token (optional)',ph:'ABcDeFgH1234567890',hint:'<a href="https://ads.google.com/aw/apicenter" target="_blank">Google Ads</a> → Tools → API Center → Developer token'}]},
    {id:'li',icon:'💼',name:'LinkedIn',bg:'#EFF6FF',fields:[{k:'liId',l:'App Client ID',ph:'LinkedIn Client ID',hint:'<a href="https://www.linkedin.com/developers/apps" target="_blank">LinkedIn Developers</a> → tu app → Auth'},{k:'liSecret',l:'App Client Secret',ph:'••••••••••••••••',hint:'LinkedIn Developers → tu app → Auth → Client Secret'},{k:'liOrg',l:'Organization URN',ph:'urn:li:organization:12345678',hint:'Formato <strong>urn:li:organization:NÚMEROS</strong> — el ID numérico aparece en la URL de tu página de empresa'},{k:'liToken',l:'Access Token',ph:'AQX... (generado con el botón OAuth)',hint:'<button class="btn-s" style="font-size:11px;padding:4px 10px;margin-top:4px" onclick="liStartOAuth()">🔗 Conectar con LinkedIn OAuth</button> — guarda Client ID + Secret primero, luego haz clic aquí'}]},
    {id:'inst',icon:'📧',name:'Mailing masivo (Instantly)',bg:'#F5F3FF',fields:[{k:'instantly',l:'API Key',ph:'inst_xxxxxxxxxxxx',hint:'<a href="https://app.instantly.ai/app/settings/integrations" target="_blank">Instantly</a> → API'}]},
    {id:'mon',icon:'🏢',name:'CRM',bg:'#ECFEFF',fields:[{k:'monday',l:'API Token',ph:'eyJhbGciOiJ…',hint:'<a href="https://monday.com/apps/manage/tokens" target="_blank">Monday</a> → Developers'}]},
    {id:'hunter',icon:'🎯',name:'Hunter.io — Prospecting universitario',bg:'#FFF7ED',fields:[{k:'hunter',l:'API Key',ph:'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',hint:'<a href="https://hunter.io/api-keys" target="_blank">hunter.io/api-keys</a> — Plan gratuito: 50 búsquedas/mes'}]},
    {id:'meta',icon:'📸',name:'Instagram / Facebook',bg:'#FFF0F9',fields:[{k:'metaToken',l:'Access Token',ph:'EAAxxxxxxx…',hint:'<a href="https://developers.facebook.com/tools/explorer" target="_blank">Graph API Explorer</a> → Selecciona "Proximorol Dashboard" → Generate Access Token'},{k:'metaIgId',l:'Instagram Account ID',ph:'17841439267939398',hint:'Tu Instagram Business Account ID'},{k:'metaPageId',l:'Facebook Page ID (opcional)',ph:'1092607287263365',hint:'ID de tu página de Facebook — para métricas de Facebook'}]},
  ];
  document.getElementById('stg').innerHTML=pfs.map(pf=>{
    const conn=pf.id==='g'?!!(CFG.clientId&&CFG.ga4):pf.id==='anthropic'?!!CFG.ak:pf.fields.some(f=>CFG[f.k]);
    const flds=pf.fields.map(f=>`<div class="fl"><label class="fl-l">${f.l}</label><input class="fi" id="sf-${f.k}" value="${(CFG[f.k]||'')}" placeholder="${f.ph}" ${f.k==='ak'?'type="password"':''}/>${f.hint?`<div class="fh">${f.hint}</div>`:''}</div>`).join('');
    return`<div class="sc2"><div class="scH" onclick="tgS('${pf.id}')"><div class="sico" style="background:${pf.bg}">${pf.icon}</div><div style="flex:1;font-size:13px;font-weight:500">${pf.name}</div><span style="font-size:11px;color:${conn?'var(--green)':'var(--ht)'}">${conn?'● Configurado':'○ Sin configurar'}</span><svg style="width:16px;height:16px;color:var(--ht);transition:transform .2s;margin-left:8px" id="sch-${pf.id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div><div class="sbdy" id="sbd-${pf.id}">${flds}<div class="sa"><button class="btn-s" onclick="svS('${pf.id}')">Guardar</button><button class="btn-c" onclick="clrS('${pf.id}')">Borrar</button></div></div></div>`;
  }).join('');
}

function tgS(id){
  const b=document.getElementById('sbd-'+id);
  const c=document.getElementById('sch-'+id);
  const o=b.classList.toggle('op');
  if(c) c.style.transform=o?'rotate(90deg)':'';
}

function svS(id){
  const m={anthropic:{ak:'sf-ak'},g:{clientId:'sf-clientId',ga4:'sf-ga4',gsc:'sf-gsc',ads:'sf-ads',adsToken:'sf-adsToken'},li:{liId:'sf-liId',liSecret:'sf-liSecret',liOrg:'sf-liOrg',liToken:'sf-liToken'},inst:{instantly:'sf-instantly'},mon:{monday:'sf-monday'},hunter:{hunter:'sf-hunter'},meta:{metaToken:'sf-metaToken',metaIgId:'sf-metaIgId',metaPageId:'sf-metaPageId'}};
  Object.entries(m[id]||{}).forEach(([k,eid])=>{
    const el=document.getElementById(eid);
    if(el){let v=el.value.trim();if(k==='ga4'&&v&&!v.startsWith('properties/'))v='properties/'+v;CFG[k]=v;}
  });
  localStorage.setItem(CK,JSON.stringify(CFG));
  buildSettings();
  loadAll();
  tgS(id);
  const t=document.createElement('div');t.className='toast';t.textContent='✓ Guardado — recargando datos';document.body.appendChild(t);setTimeout(()=>t.remove(),2500);
}

function clrS(id){
  const m={anthropic:['ak'],g:['clientId','ga4','gsc','ads'],li:['liId','liSecret','liOrg','liToken'],inst:['instantly'],mon:['monday'],hunter:['hunter'],meta:['metaToken','metaIgId','metaPageId']};
  (m[id]||[]).forEach(k=>CFG[k]='');
  localStorage.setItem(CK,JSON.stringify(CFG));
  buildSettings();
  loadAll();
}
