/* ═══════════════════════════════════════════════
   CORE — Auth, globals, init, nav, utils, API
   ═══════════════════════════════════════════════ */

// ── PASSWORD GATE ──
// Password is never stored in plain text — only its SHA-256 hash lives here.
// To change password: compute sha256 of new password and replace PW_HASH.
const PW_HASH = 'bb883758bd3589bd2fcbe86de4f34db5543bc85e7ede7b740ad9a7a91aed57f0';
const PW_KEY  = 'pr_dash_v2';
if(localStorage.getItem(PW_KEY) === PW_HASH){
  const el = document.getElementById('pw-gate');
  if(el) el.style.display = 'none';
}

async function hashStr(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,'0')).join('');
}

async function checkPw(){
  const val = document.getElementById('pw-input').value;
  const hash = await hashStr(val);
  if(hash === PW_HASH){
    localStorage.setItem(PW_KEY, PW_HASH);
    document.getElementById('pw-gate').style.display='none';
  } else {
    const err = document.getElementById('pw-err');
    err.textContent = 'Contraseña incorrecta. Inténtalo de nuevo.';
    document.getElementById('pw-input').value='';
    document.getElementById('pw-input').focus();
    setTimeout(()=>err.textContent='', 3000);
  }
}





const CK='eco_v3';
const COLORS=['#1D9E75','#2563EB','#D97706','#DC2626','#7C3AED','#0891B2','#059669','#BE185D'];
const TC='#A8A8AC',GC='rgba(0,0,0,0.05)';
const MONTHS=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const TITLES={guide:'Guía del dashboard',ov:'Overview',report:'Monthly Report',ga4:'Google Analytics 4',gsc:'Search Console',ads:'Google Ads',kwi:'Keyword Intelligence',seo:'SEO Intelligence',li:'LinkedIn',inst:'Mailing masivo',ig:'Instagram / Facebook',opps:'Opportunities Pipeline',mon:'CRM',budget:'Budget & Costs',settings:'Settings',content:'Content Studio',audit:'Content Audit',prosp:'Prospecting — Alianzas universitarias'};
let CFG={},TOKEN=null;
const CH={};

/* ── ANTHROPIC API HELPER ──
   Central function for ALL calls to the Anthropic API.
   Adds required headers automatically and throws detailed errors. */
async function antFetch(body){
  if(!CFG.ak){
    throw new Error('API Key de Anthropic no configurada.\n→ Ve a ⚙️ Settings → "Anthropic API Key" y pega tu clave sk-ant-...\nPuedes crear una en: console.anthropic.com/settings/keys');
  }
  const resp = await fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'x-api-key': CFG.ak,
      'anthropic-version':'2023-06-01',
      'anthropic-dangerous-direct-browser-access':'true'
    },
    body: JSON.stringify(body)
  });
  if(!resp.ok){
    let detail = '';
    try { const e=await resp.json(); detail = e?.error?.message||JSON.stringify(e); } catch(_){}
    const hints = {
      401:'API Key inválida o expirada. Verifica tu clave en Settings.',
      403:'Acceso denegado. Verifica que la clave tenga permisos de escritura.',
      429:'Límite de peticiones alcanzado. Espera unos segundos e inténtalo de nuevo.',
      500:'Error interno de Anthropic. Inténtalo de nuevo en unos minutos.',
      529:'Anthropic está sobrecargado. Inténtalo en unos minutos.',
    };
    throw new Error(`HTTP ${resp.status} — ${hints[resp.status]||'Error desconocido'}\nDetalle: ${detail}`);
  }
  return resp.json();
}

/* ── INIT ── */
function init(){
  const s=localStorage.getItem(CK);
  if(s)CFG=JSON.parse(s);
  const m={clientId:'i-cid',ga4:'i-ga4',gsc:'i-gsc',ads:'i-ads',adsToken:'i-adstoken',liId:'i-liid',liOrg:'i-liorg',instantly:'i-inst',monday:'i-mon',hunter:'i-hunter',metaToken:'i-metatoken',metaIgId:'i-metaigid',metaPageId:'i-metapageid'};
  Object.entries(m).forEach(([k,id])=>{const el=document.getElementById(id);if(el&&CFG[k])el.value=CFG[k];});
  // Handle LinkedIn OAuth callback (code in URL after redirect)
  if(location.search.includes('code=')&&location.search.includes('state=')){
    const s2=localStorage.getItem(CK);if(s2)CFG=JSON.parse(s2);
    if(CFG.clientId&&CFG.ga4){document.getElementById('ob').style.display='none';document.getElementById('app').style.display='block';buildSettings();}
    liHandleOAuthCallback();
  }
  updOB();
  if(!CFG.clientId||!CFG.ga4)setTimeout(()=>tpf('g'),100);
  setTimeout(compLoadSuggestions, 200);
}

/* ── ONBOARDING ── */
function tpf(id){document.getElementById('pb-'+id).classList.toggle('op');document.getElementById('cv-'+id).classList.toggle('op');}
function saveG(){
  const cid=document.getElementById('i-cid').value.trim();
  const ga4=document.getElementById('i-ga4').value.trim();
  if(!cid||!ga4){document.getElementById('ob-err').textContent='Client ID and GA4 Property ID are required.';document.getElementById('ob-err').style.display='block';return;}
  CFG.clientId=cid;CFG.ga4=ga4.startsWith('properties/')?ga4:'properties/'+ga4;
  CFG.gsc=document.getElementById('i-gsc').value.trim();CFG.ads=document.getElementById('i-ads').value.trim();
  sv();tpf('g');
}
function savePF(id){
  const m={li:['liId','i-liid','liOrg','i-liorg'],inst:['instantly','i-inst'],mon:['monday','i-mon'],hunter:['hunter','i-hunter']};
  const f=m[id];if(f.length===4){CFG[f[0]]=document.getElementById(f[1]).value.trim();CFG[f[2]]=document.getElementById(f[3]).value.trim();}
  else CFG[f[0]]=document.getElementById(f[1]).value.trim();
  sv();tpf(id);
}
function clearPF(id){const m={li:['liId','liOrg'],inst:['instantly'],mon:['monday']};(m[id]||[]).forEach(k=>CFG[k]='');sv();}
function saveMeta(){CFG.metaToken=document.getElementById('i-metatoken')?.value.trim()||'';CFG.metaIgId=document.getElementById('i-metaigid')?.value.trim()||'';CFG.metaPageId=document.getElementById('i-metapageid')?.value.trim()||'';sv();tpf('meta');}
function clearMeta(){CFG.metaToken='';CFG.metaIgId='';CFG.metaPageId='';sv();}
function sv(){localStorage.setItem(CK,JSON.stringify(CFG));updOB();}
function updOB(){
  const pfs=[{id:'g',ok:!!(CFG.clientId&&CFG.ga4),lbl:CFG.clientId?'Configured':'Not set'},{id:'li',ok:!!(CFG.liId&&CFG.liOrg),lbl:CFG.liId?'Configured':'Optional'},{id:'inst',ok:!!CFG.instantly,lbl:CFG.instantly?'Configured':'Optional'},{id:'mon',ok:!!CFG.monday,lbl:CFG.monday?'Configured':'Optional'},{id:'meta',ok:!!(CFG.metaToken&&CFG.metaIgId),lbl:(CFG.metaToken&&CFG.metaIgId)?'Configured':'Optional'}];
  let c=0;pfs.forEach(p=>{const pill=document.getElementById('pp-'+p.id);const card=document.getElementById('pc-'+p.id);if(pill){pill.textContent=p.lbl;pill.className='sp '+(p.ok?'sp-ok':'sp-sk');}if(card)card.classList.toggle('ok',p.ok);if(p.ok)c++;});
  document.getElementById('ob-cnt').textContent=c;const btn=document.getElementById('btn-l');const ok=c>0||(CFG.clientId&&CFG.ga4);btn.disabled=!ok;
}

/* ── LAUNCH ── */
function launch(){
  const sc='https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.profile';
  google.accounts.oauth2.initTokenClient({client_id:CFG.clientId,scope:sc,callback:async r=>{
    if(r.error){const e=document.getElementById('ob-err');e.textContent='OAuth error: '+r.error;e.style.display='block';return;}
    TOKEN=r.access_token;
    try{const u=await gF('https://www.googleapis.com/oauth2/v3/userinfo');const n=(u.name||'User').split(' ')[0];document.getElementById('sb-nm').textContent=n;document.getElementById('sb-av').textContent=n.charAt(0);}catch(e){}
    document.getElementById('ob').style.display='none';document.getElementById('app').style.display='block';
    buildSettings();loadAll();
    // Show Guide as entry page
    setTimeout(()=>{
      document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
      document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
      const guidePage = document.getElementById('page-guide');
      if(guidePage) guidePage.classList.add('active');
      const guideNav = document.querySelector('.ni[onclick*="\'guide\'"]');
      if(guideNav) guideNav.classList.add('active');
      document.getElementById('top-t').textContent = 'Guía del dashboard';
      if(typeof renderGuidePage === 'function') renderGuidePage();
    }, 300);
  }}).requestAccessToken();
}

/* ── NAV ── */
function showP(id,el){
  // 1. Hide all pages
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  document.querySelectorAll('.ni').forEach(n=>n.classList.remove('active'));
  
  // 2. Show target page
  const page = document.getElementById('page-'+id);
  if(page) page.classList.add('active');
  if(el) el.classList.add('active');
  document.getElementById('top-t').textContent=TITLES[id]||id;
  
  // 3. Hide date picker popup
  hideDatePicker();

  // Guide page renders immediately — no charts needed
  if(id==='guide'){ if(typeof renderGuidePage==='function') renderGuidePage(); return; }
  if(id==='prosp'){ if(typeof renderProspectingPage==='function') renderProspectingPage(); return; }

  // 4. Render charts after TWO animation frames (ensures browser has painted)
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      if(id==='ov'){
        renderOverview();
      } else if(id==='ig'){
        loadInstagram().catch(e=>{setNB('ig','err');console.error('Instagram:',e);});
      } else if(id==='guide'){
        renderGuidePage();
      } else if(id==='ga4'){
        loadGA4Intelligence();
      } else if(id==='budget'){
        renderBudgetPage();
      } else if(id==='kwi'){
        renderKWIPage();
      } else if(id==='seo'){
        renderSEOPage();
      } else if(id==='report'){
        setNB('rep','live');
        renderReport();
      } else if(id==='content'){
        setNB('content','live');
        csInitChips();
      } else if(id==='audit'){
        renderAuditPage();
      } else if(id==='opps' && _OPP_DATA.length>0){
        renderOppCharts();
      }
      // Resize all charts
      setTimeout(()=>Object.values(CH).forEach(c=>{try{c.resize();}catch(e){}}), 100);
    });
  });
}

function setD(d,btn){setPreset(d,btn);}
function setNB(id,st){const el=document.getElementById('nb-'+id);if(!el)return;el.textContent=st==='live'?'Live':st==='pend'?'Soon':st==='man'?'Manual':st==='err'?'Error':'—';el.className='nb '+(st==='live'?'nb-live':st==='pend'?'nb-pend':st==='man'?'nb-pend':'nb-off');}
function nc(nm,id){const el=document.getElementById(id);if(el)el.innerHTML=`<div class="notice"><strong>${nm} not connected</strong>Add credentials in Settings.<button class="cbtn" onclick="showP('settings',null)">Open Settings →</button></div>`;}

/* ── API ── */
function fD(d){return d.toISOString().split('T')[0];}
// ── DATE RANGE SYSTEM ──────────────────────────────────────
let DAYS = 28;
let DATE_FROM = null;
let DATE_TO   = null;

function sD(){
  if(DATE_FROM) return DATE_FROM;
  const d=new Date(); d.setDate(d.getDate()-DAYS); return fD(d);
}
function eD(){
  return DATE_TO || fD(new Date());
}

function setPreset(days, btnEl){
  DAYS=days; DATE_FROM=null; DATE_TO=null;
  document.querySelectorAll('.dp').forEach(b=>b.classList.remove('active'));
  if(btnEl) btnEl.classList.add('active');
  const cBtn=document.getElementById('dp-custom');
  if(cBtn) cBtn.innerHTML='<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> Custom';
  hideDatePicker();
  loadAll();
}

function toggleDatePicker(){
  const p=document.getElementById('date-picker-popup');
  if(!p) return;
  const isHidden = p.style.display==='none'||!p.style.display;
  p.style.display = isHidden ? 'block' : 'none';
  if(isHidden){
    document.getElementById('date-from').value = sD();
    document.getElementById('date-to').value   = eD();
  }
}
function hideDatePicker(){
  const p=document.getElementById('date-picker-popup');
  if(p) p.style.display='none';
}

function setQuickRange(type){
  const now=new Date(); const yr=now.getFullYear();
  let from, to=fD(now);
  if(type==='ytd') from=yr+'-01-01';
  else if(type==='q1'){from=yr+'-01-01';to=yr+'-03-31';}
  else if(type==='q2'){from=yr+'-04-01';to=yr+'-06-30';}
  else if(type==='last30'){const d=new Date();d.setDate(d.getDate()-30);from=fD(d);}
  else if(type==='last90'){const d=new Date();d.setDate(d.getDate()-90);from=fD(d);}
  const df=document.getElementById('date-from');
  const dt=document.getElementById('date-to');
  if(df) df.value=from;
  if(dt) dt.value=to;
}

function applyCustomRange(){
  const from=document.getElementById('date-from')?.value;
  const to=document.getElementById('date-to')?.value;
  if(!from||!to){alert('Please select both dates.');return;}
  DATE_FROM=from; DATE_TO=to;
  document.querySelectorAll('.dp').forEach(b=>b.classList.remove('active'));
  const cBtn=document.getElementById('dp-custom');
  if(cBtn){cBtn.classList.add('active');cBtn.textContent=from.slice(5)+' to '+to.slice(5);}
  hideDatePicker();
  loadAll();
}
// ────────────────────────────────────────────────────────────
async function gF(url,body){
  const o={headers:{'Authorization':'Bearer '+TOKEN,'Content-Type':'application/json'}};
  if(body){o.method='POST';o.body=JSON.stringify(body);}
  const r=await fetch(url,o);
  if(!r.ok){const e=await r.json().catch(()=>({}));throw new Error((e.error&&e.error.message)||r.statusText);}
  return r.json();
}
async function ga4R(dims,mets,extra){
  return gF(`https://analyticsdata.googleapis.com/v1beta/${CFG.ga4}:runReport`,{dateRanges:[{startDate:sD(),endDate:eD()}],dimensions:dims.map(n=>({name:n})),metrics:mets.map(n=>({name:n})),limit:30,...extra});
}
async function ga4Prv(mets){
  const s=new Date();s.setDate(s.getDate()-DAYS*2);const e=new Date();e.setDate(e.getDate()-DAYS);
  return gF(`https://analyticsdata.googleapis.com/v1beta/${CFG.ga4}:runReport`,{dateRanges:[{startDate:fD(s),endDate:fD(e)}],dimensions:[],metrics:mets.map(n=>({name:n})),limit:1});
}
async function gscQ(b){return gF(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(CFG.gsc)}/searchAnalytics/query`,b);}
async function monQ(q){const r=await fetch('https://api.monday.com/v2',{method:'POST',headers:{'Authorization':CFG.monday,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const d=await r.json();if(d.errors)throw new Error(d.errors[0].message);return d.data;}
function mkC(id,type,data,opts){
  const canvas=document.getElementById(id);
  if(!canvas) return;
  if(CH[id]){try{CH[id].destroy();}catch(e){} delete CH[id];}
  
  // Get height from parent wrapper's style (e.g. height:220px)
  const wrapper = canvas.parentElement;
  const wrapperH = wrapper ? parseInt(wrapper.style.height)||220 : 220;
  const wrapperW = wrapper ? wrapper.offsetWidth||600 : 600;
  
  // Set canvas size explicitly — this bypasses responsive sizing issues
  canvas.width  = wrapperW;
  canvas.height = wrapperH;
  canvas.style.width  = '100%';
  canvas.style.height = wrapperH + 'px';
  
  // Build merged options - responsive:false uses canvas w/h directly
  const mergedOpts = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 400 },
    plugins: { legend: { display: false } },
    ...opts
  };
  
  CH[id] = new Chart(canvas, { type, data, options: mergedOpts });
  
  // Also resize after 200ms to catch any layout shifts
  setTimeout(()=>{ try{ CH[id].resize(); }catch(e){} }, 200);
}
function fmtGBP(n){return'£'+Math.round(n).toLocaleString();}

/* ── LOAD ALL ── */
function loadAll(){
  Object.values(CH).forEach(c=>{try{c.destroy();}catch(e){}});
  loadGA4().catch(e=>{
    setNB('ga4','off');
    console.error('GA4:',e);
    const errHtml = `<div style="padding:12px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B;grid-column:1/-1">⚠ GA4 error: ${e.message} — Check that GA4 Property ID is correct and your account has access.</div>`;
    document.getElementById('ga4-kpis').innerHTML = errHtml;
    document.getElementById('ov-kpis').innerHTML = errHtml;
  });
  if(CFG.gsc){
    loadGSC().catch(e=>{
      setNB('gsc','off');
      const errHtml=`<div style="padding:12px;background:var(--rp);border:1px solid #FECACA;border-radius:var(--r);font-size:12px;color:#991B1B;grid-column:1/-1">⚠ Search Console error: ${e.message}<br><small>Make sure <strong>${CFG.gsc}</strong> is verified in Search Console with this Google account.</small></div>`;
      document.getElementById('gsc-kpis').innerHTML=errHtml;
    });
  } else {
    setNB('gsc','off');
    nc('Search Console — add URL in Settings','gsc-kpis');
  }
  CFG.instantly?loadInstantly().catch(()=>setNB('inst','off')):(setNB('inst','off'),nc('Instantly','ov-inst'),nc('Instantly','inst-kpis'));
  if(CFG.monday){
    loadMonday().catch(e=>{setNB('mon','off');setNB('opps','off');console.error('Monday:',e);});
  } else {
    setNB('mon','off');setNB('opps','off');
    nc('Monday.com','ov-opps');nc('Monday.com','opps-stages');
  }
  CFG.liId?loadLinkedIn().catch(()=>setNB('li','off')):(setNB('li','off'),nc('LinkedIn','ov-li'),nc('LinkedIn','li-kpis'));
  if(CFG.metaToken&&CFG.metaIgId){
    loadInstagram().catch(()=>setNB('ig','off'));
  } else {
    setNB('ig','off');
  }
  if(!CFG.ads){
    setNB('ads','off');
    document.getElementById('ads-w').innerHTML='<div class="notice"><strong>Google Ads not connected</strong> — Add your Customer ID in Settings to enable this section.<button class="cbtn" onclick="showP(\'settings\',null)">Open Settings →</button></div>';
  } else {
    setNB('ads','...');
    loadAds().catch(e=>{
      setNB('ads','off');
      document.getElementById('ads-w').innerHTML=`<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B"><strong>Google Ads error:</strong> ${e.message}</div>`;
    });
  }
  setTimeout(()=>{document.getElementById('upd-t').textContent='Updated '+new Date().toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});},3000);
}

