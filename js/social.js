/* ═══════════════════════════════════════════════
   SOCIAL — LinkedIn, Instantly
   Depends on: core.js
   ═══════════════════════════════════════════════ */

/* ── LINKEDIN ── */
/* ── LINKEDIN OAUTH ── */
function liStartOAuth(){
  const cid = CFG.liId;
  if(!cid){alert('Guarda primero el App Client ID en Settings → LinkedIn');return;}
  const redirect = encodeURIComponent(location.href.split('?')[0]);
  const scope = encodeURIComponent('r_organization_social r_organization_followers r_basicprofile');
  const state = Math.random().toString(36).slice(2);
  localStorage.setItem('li_oauth_state', state);
  const url = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${cid}&redirect_uri=${redirect}&scope=${scope}&state=${state}`;
  window.location.href = url;
}

async function liHandleOAuthCallback(){
  const params = new URLSearchParams(location.search);
  const code = params.get('code');
  const state = params.get('state');
  const storedState = localStorage.getItem('li_oauth_state');
  if(!code || state !== storedState) return;
  localStorage.removeItem('li_oauth_state');
  // Remove code from URL cleanly
  window.history.replaceState({},'',location.pathname);
  if(!CFG.liId || !CFG.liSecret){
    alert('Faltan Client ID o Client Secret en Settings → LinkedIn. Pégalos y vuelve a intentar el OAuth.');
    return;
  }
  const t=document.createElement('div');t.className='toast';t.textContent='🔄 Intercambiando código por token LinkedIn...';document.body.appendChild(t);
  try{
    // Exchange code for access token via CORS proxy (required since LinkedIn token endpoint blocks direct browser calls)
    const redirect = location.href.split('?')[0];
    const body = `grant_type=authorization_code&code=${code}&redirect_uri=${encodeURIComponent(redirect)}&client_id=${CFG.liId}&client_secret=${CFG.liSecret}`;
    const resp = await fetch('https://www.linkedin.com/oauth/v2/accessToken',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});
    if(!resp.ok) throw new Error('Token exchange failed: '+resp.status);
    const data = await resp.json();
    if(data.access_token){
      CFG.liToken = data.access_token;
      localStorage.setItem(CK, JSON.stringify(CFG));
      t.textContent='✅ LinkedIn conectado correctamente';
      setTimeout(()=>t.remove(),3000);
      buildSettings();
      loadLinkedIn();
    } else {
      throw new Error(data.error_description || 'No access_token en respuesta');
    }
  } catch(e){
    t.textContent='❌ Error OAuth: '+e.message;
    setTimeout(()=>t.remove(),5000);
  }
}

async function loadLinkedIn(){
  setNB('li','...');
  const scOpts={scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC}}}};

  // ── NO TOKEN: manual data entry mode ──
  if(!CFG.liToken){
    setNB('li','man');
    liRenderManualMode();
    return;
  }

  const token = CFG.liToken;
  const org = CFG.liOrg || '';
  const orgEnc = encodeURIComponent(org);
  const headers = {'Authorization':'Bearer '+token,'LinkedIn-Version':'202401'};

  // Date range: last 8 months
  const now = new Date();
  const monthLabels=[], monthStarts=[], monthEnds=[];
  for(let i=7;i>=0;i--){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    monthLabels.push(d.toLocaleString('default',{month:'short'}));
    monthStarts.push(d.getTime());
    const end = new Date(d.getFullYear(), d.getMonth()+1, 0, 23, 59, 59);
    monthEnds.push(end.getTime());
  }

  try{
    // ── 1. TOTAL FOLLOWERS ──
    let totalFollowers = 0, newThisMonth = 0;
    try{
      const fResp = await fetch(`https://api.linkedin.com/v2/networkSizes/${orgEnc}?edgeType=CompanyFollowedByMember`,{headers});
      if(fResp.ok){const fd=await fResp.json();totalFollowers=fd.firstDegreeSize||0;}
    }catch(e){}

    // ── 2. FOLLOWER STATS BY MONTH ──
    let followersByMonth = new Array(8).fill(0);
    try{
      const startMs = monthStarts[0];
      const endMs = monthEnds[7];
      const fsUrl = `https://api.linkedin.com/v2/organizationalEntityFollowerStatistics?q=organizationalEntity&organizationalEntity=${orgEnc}&timeIntervals.timeGranularityType=MONTH&timeIntervals.timeRange.start=${startMs}&timeIntervals.timeRange.end=${endMs}`;
      const fsResp = await fetch(fsUrl,{headers});
      if(fsResp.ok){
        const fsData = await fsResp.json();
        const items = fsData.elements||[];
        items.forEach(item=>{
          const ts = item.timeRange?.start;
          if(!ts) return;
          const idx = monthStarts.findIndex(s=>Math.abs(s-ts)<86400000*5);
          if(idx>=0) followersByMonth[idx] = item.followerGains?.organicFollowerGain||0;
        });
        if(totalFollowers===0 && items.length>0){
          let running = 0;
          items.forEach(i=>running+=(i.followerGains?.organicFollowerGain||0));
          totalFollowers = running;
        }
        newThisMonth = followersByMonth[7];
        // Convert gains to cumulative for chart
        let cum = totalFollowers - followersByMonth.reduce((a,b)=>a+b,0);
        followersByMonth = followersByMonth.map(g=>{cum+=g;return cum;});
      }
    }catch(e){}

    // ── 3. SHARE STATS — IMPRESSIONS, CLICKS, ENGAGEMENT ──
    let impByMonth=new Array(8).fill(0), clicksByMonth=new Array(8).fill(0), engByMonth=new Array(8).fill(0);
    let totalImpressions=0, totalClicks=0, avgEngagement=0;
    try{
      const ssUrl = `https://api.linkedin.com/v2/organizationalEntityShareStatistics?q=organizationalEntity&organizationalEntity=${orgEnc}&timeIntervals.timeGranularityType=MONTH`;
      const ssResp = await fetch(ssUrl,{headers});
      if(ssResp.ok){
        const ssData = await ssResp.json();
        const items = ssData.elements||[];
        items.forEach(item=>{
          const ts = item.timeRange?.start;
          const idx = ts ? monthStarts.findIndex(s=>Math.abs(s-ts)<86400000*5) : -1;
          const imp = item.totalShareStatistics?.impressionCount||0;
          const cli = item.totalShareStatistics?.clickCount||0;
          const eng = item.totalShareStatistics?.engagement||0;
          totalImpressions += imp;
          totalClicks += cli;
          if(idx>=0){impByMonth[idx]=imp;clicksByMonth[idx]=cli;engByMonth[idx]=parseFloat((eng*100).toFixed(2));}
        });
        const engVals = engByMonth.filter(v=>v>0);
        avgEngagement = engVals.length ? (engVals.reduce((a,b)=>a+b,0)/engVals.length).toFixed(2) : 0;
      }
    }catch(e){}

    // ── 4. RECENT POSTS ──
    let topPostsHtml = '<p style="color:var(--ht);font-size:12px;text-align:center;padding:1rem">No se pudieron cargar los posts</p>';
    let totalPosts = 0;
    try{
      const pUrl = `https://api.linkedin.com/v2/shares?q=owners&owners=${orgEnc}&sharesPerOwner=10&count=10`;
      const pResp = await fetch(pUrl,{headers});
      if(pResp.ok){
        const pData = await pResp.json();
        const posts = pData.elements||[];
        totalPosts = posts.length;
        if(posts.length>0){
          const rows = posts.slice(0,5).map(p=>{
            const text = p.text?.text || p.commentary || '(sin texto)';
            const title = text.length>70 ? text.slice(0,70)+'…' : text;
            const dateMs = p.created?.time || p.lastModified?.time || 0;
            const dateStr = dateMs ? new Date(dateMs).toLocaleDateString('es-ES',{day:'2-digit',month:'short',year:'numeric'}) : '—';
            const stats = p.totalShareStatistics || {};
            const imp = (stats.impressionCount||0).toLocaleString();
            const cli = stats.clickCount||0;
            const eng = stats.engagement ? (stats.engagement*100).toFixed(1)+'%' : '—';
            return `<tr><td><span class="tm">${title}</span><span class="ts">${dateStr}</span></td><td>${imp}</td><td>${cli}</td><td>${eng}</td></tr>`;
          }).join('');
          topPostsHtml = `<table class="dt"><thead><tr><th>Post</th><th>Impresiones</th><th>Clicks</th><th>Engagement</th></tr></thead><tbody>${rows}</tbody></table>`;
        }
      }
    }catch(e){}

    // ── RENDER KPIs ──
    setNB('li','live');
    document.getElementById('li-kpis').innerHTML=[
      {l:'Total followers',v:totalFollowers.toLocaleString(),d:`+${newThisMonth} este mes`,cl:newThisMonth>=0?'up':'dn'},
      {l:'Posts cargados',v:totalPosts,d:'últimos 10 posts',cl:'up'},
      {l:'Total impresiones',v:totalImpressions.toLocaleString(),d:'período seleccionado',cl:'up'},
      {l:'Avg engagement',v:avgEngagement+'%',d:'promedio mensual',cl:parseFloat(avgEngagement)>=3?'up':'dn'},
    ].map(m=>`<div class="kpi"><div class="kl">${m.l}</div><div class="kv">${m.v}</div><div class="kd ${m.cl}">${m.d}</div><div class="ks">LinkedIn · Live API</div></div>`).join('');

    document.getElementById('ov-li').innerHTML=`<div class="sg">
      <div class="sb2"><div class="sv">${totalFollowers.toLocaleString()}</div><div class="slb">Followers</div></div>
      <div class="sb2"><div class="sv">+${newThisMonth}</div><div class="slb">Nuevos</div></div>
      <div class="sb2"><div class="sv">${totalImpressions.toLocaleString()}</div><div class="slb">Impresiones</div></div>
      <div class="sb2"><div class="sv">${totalClicks.toLocaleString()}</div><div class="slb">Clics</div></div>
    </div>`;

    // ── CHARTS ──
    mkC('li-fol','line',{labels:monthLabels,datasets:[{label:'Followers',data:followersByMonth,borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,.08)',tension:.4,fill:true,pointRadius:3,borderWidth:2}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:false}}});
    mkC('li-post','bar',{labels:monthLabels,datasets:[{label:'Impresiones',data:impByMonth,backgroundColor:'rgba(37,99,235,.15)',borderColor:'#2563EB',borderWidth:1.5,borderRadius:4},{label:'Clics',data:clicksByMonth,backgroundColor:'rgba(29,158,117,.15)',borderColor:'#1D9E75',borderWidth:1.5,borderRadius:4}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:true}}});
    mkC('li-imp','bar',{labels:monthLabels,datasets:[{label:'Nuevos followers',data:followersByMonth.map((_,i,a)=>i===0?0:a[i]-a[i-1]),backgroundColor:'rgba(37,99,235,.15)',borderColor:'#2563EB',borderWidth:1.5,borderRadius:4}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:true}}});
    mkC('li-eng','line',{labels:monthLabels,datasets:[{label:'Engagement %',data:engByMonth,borderColor:'#D97706',backgroundColor:'rgba(217,119,6,.08)',tension:.4,fill:true,pointRadius:3,borderWidth:2}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:false,ticks:{...scOpts.scales.y.ticks,callback:v=>v+'%'}}}});

    document.getElementById('li-posts-t').innerHTML = topPostsHtml;

  } catch(err){
    setNB('li','err');
    const errMsg = `<p style="color:var(--red);font-size:12px;padding:1rem;text-align:center">❌ Error cargando LinkedIn: ${err.message}<br><span style="color:var(--ht)">Verifica que el Access Token sea válido y tenga permisos r_organization_social</span></p>`;
    ['li-kpis','li-posts-t'].forEach(id=>{const el=document.getElementById(id);if(el)el.innerHTML=errMsg;});
  }
}

/* ── LINKEDIN MANUAL MODE ── */
const LI_MAN_KEY = 'pr_li_manual_v1';
function liGetManualData(){try{return JSON.parse(localStorage.getItem(LI_MAN_KEY)||'{}');}catch(e){return {};}}
function liSaveManualData(d){localStorage.setItem(LI_MAN_KEY, JSON.stringify(d));}

function liRenderManualMode(){
  const d = liGetManualData();
  const months = ['Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar'];
  const scOpts={scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC}}}};

  const kpiEl = document.getElementById('li-kpis');
  if(kpiEl) kpiEl.innerHTML = [
    {l:'Total followers', v:d.totalFollowers||'—', d2:'manual'},
    {l:'Nuevos este mes',  v:d.newThisMonth||'—',  d2:'manual'},
    {l:'Impresiones (mes)',v:d.impThisMonth||'—',  d2:'manual'},
    {l:'Engagement rate',  v:(d.engThisMonth||'—')+(d.engThisMonth?'%':''), d2:'manual'},
  ].map(m=>'<div class="kpi"><div class="kl">'+m.l+'</div><div class="kv">'+m.v+'</div><div class="kd up">'+m.d2+'</div><div class="ks">LinkedIn \xb7 Modo manual</div></div>').join('');

  const ovEl = document.getElementById('ov-li');
  if(ovEl) ovEl.innerHTML = '<div class="sg">'
    +'<div class="sb2"><div class="sv">'+(d.totalFollowers||'\u2014')+'</div><div class="slb">Followers</div></div>'
    +'<div class="sb2"><div class="sv">'+(d.newThisMonth?'+'+d.newThisMonth:'\u2014')+'</div><div class="slb">Nuevos</div></div>'
    +'<div class="sb2"><div class="sv">'+(d.impThisMonth||'\u2014')+'</div><div class="slb">Impresiones</div></div>'
    +'<div class="sb2"><div class="sv">'+(d.clicksThisMonth||'\u2014')+'</div><div class="slb">Clics</div></div>'
    +'</div><p style="font-size:11px;color:var(--amber);margin-top:8px;text-align:center">\u23f3 API pendiente de aprobaci\xf3n \xb7 datos manuales</p>';

  const fol = d.monthlyFollowers   || new Array(8).fill(0);
  const imp = d.monthlyImpressions || new Array(8).fill(0);
  const cli = d.monthlyClicks      || new Array(8).fill(0);
  const eng = d.monthlyEngagement  || new Array(8).fill(0);
  const newF = fol.map((_,i)=>i===0?0:Math.max(0,fol[i]-fol[i-1]));

  mkC('li-fol','line',{labels:months,datasets:[{label:'Followers',data:fol,borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,.08)',tension:.4,fill:true,pointRadius:3,borderWidth:2}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:false}}});
  mkC('li-post','bar',{labels:months,datasets:[{label:'Impresiones',data:imp,backgroundColor:'rgba(29,158,117,.15)',borderColor:'#1D9E75',borderWidth:1.5,borderRadius:4},{label:'Clics',data:cli,backgroundColor:'rgba(37,99,235,.15)',borderColor:'#2563EB',borderWidth:1.5,borderRadius:4}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:true}}});
  mkC('li-imp','bar',{labels:months,datasets:[{label:'Nuevos followers',data:newF,backgroundColor:'rgba(37,99,235,.15)',borderColor:'#2563EB',borderWidth:1.5,borderRadius:4}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:true}}});
  mkC('li-eng','line',{labels:months,datasets:[{label:'Engagement %',data:eng,borderColor:'#D97706',backgroundColor:'rgba(217,119,6,.08)',tension:.4,fill:true,pointRadius:3,borderWidth:2}]},{...scOpts,scales:{...scOpts.scales,y:{...scOpts.scales.y,beginAtZero:false,ticks:{...scOpts.scales.y.ticks,callback:v=>v+'%'}}}});

  const postsEl = document.getElementById('li-posts-t');
  if(postsEl){
    const posts = d.posts || [];
    let html = '<div style="margin-bottom:12px">'
      +'<div style="display:flex;gap:8px;align-items:center;margin-bottom:10px;flex-wrap:wrap">'
      +'<span style="font-size:11px;color:var(--ht);font-weight:500">DATOS MANUALES</span>'
      +'<button onclick="liOpenManualModal()" class="btn-s" style="font-size:11px;padding:4px 12px">\u270f\ufe0f Editar datos</button>'
      +'<span style="font-size:11px;color:var(--amber)">\u23f3 API en aprobaci\xf3n (14 d\xedas aprox.)</span>'
      +'</div>';
    if(posts.length){
      html += '<table class="dt"><thead><tr><th>Post</th><th>Impresiones</th><th>Clics</th><th>Engagement</th></tr></thead><tbody>';
      posts.forEach(function(p){
        html += '<tr><td><span class="tm">'+(p.title||'\u2014')+'</span><span class="ts">'+(p.date||'')+'</span></td>'
              +'<td>'+(p.imp||0)+'</td><td>'+(p.cli||0)+'</td><td>'+(p.eng||'\u2014')+(p.eng?'%':'')+'</td></tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;padding:1.5rem;color:var(--ht);font-size:12px">Sin posts \u2014 haz clic en Editar datos para agregar</div>';
    }
    html += '</div>';
    postsEl.innerHTML = html;
  }
}

function liOpenManualModal(){
  const d = liGetManualData();
  const months8 = ['Ago','Sep','Oct','Nov','Dic','Ene','Feb','Mar'];
  const fol = d.monthlyFollowers   || new Array(8).fill('');
  const imp = d.monthlyImpressions || new Array(8).fill('');
  const cli = d.monthlyClicks      || new Array(8).fill('');
  const eng = d.monthlyEngagement  || new Array(8).fill('');
  const posts = d.posts || [{title:'',date:'',imp:'',cli:'',eng:''},{title:'',date:'',imp:'',cli:'',eng:''},{title:'',date:'',imp:'',cli:'',eng:''}];

  function inp(id,val,ph,type){type=type||'text';return '<input class="fi" id="'+id+'" value="'+(val||'')+'" placeholder="'+ph+'" type="'+type+'" style="width:100%">';}
  function minp(cls,i,val,ph,type){type=type||'number';return '<input class="fi '+cls+'" data-i="'+i+'" value="'+(val||'')+'" placeholder="'+ph+'" type="'+type+'" style="padding:4px 6px;text-align:center;width:64px">';}

  let monthRows = '<tr><td style="padding:6px 8px;font-size:11px;font-weight:500;color:var(--mt)">Followers</td>'
    + fol.map(function(v,i){return '<td style="padding:4px">'+minp('li-mfol',i,v,'0')+'</td>';}).join('') + '</tr>'
    + '<tr><td style="padding:6px 8px;font-size:11px;font-weight:500;color:var(--mt)">Impresiones</td>'
    + imp.map(function(v,i){return '<td style="padding:4px">'+minp('li-mimp',i,v,'0')+'</td>';}).join('') + '</tr>'
    + '<tr><td style="padding:6px 8px;font-size:11px;font-weight:500;color:var(--mt)">Clics</td>'
    + cli.map(function(v,i){return '<td style="padding:4px">'+minp('li-mcli',i,v,'0')+'</td>';}).join('') + '</tr>'
    + '<tr><td style="padding:6px 8px;font-size:11px;font-weight:500;color:var(--mt)">Eng%</td>'
    + eng.map(function(v,i){return '<td style="padding:4px">'+minp('li-meng',i,v,'0','text')+'</td>';}).join('') + '</tr>';

  let postRows = posts.slice(0,5).map(function(p,i){
    return '<div style="display:grid;grid-template-columns:2fr 1fr 60px 60px 60px;gap:6px;margin-bottom:6px">'
      +'<input class="fi lim-pt" data-i="'+i+'" value="'+(p.title||'')+'" placeholder="T\xedtulo del post">'
      +'<input class="fi lim-pd" data-i="'+i+'" value="'+(p.date||'')+'" placeholder="Mar 10, 2026">'
      +'<input class="fi lim-pi" data-i="'+i+'" value="'+(p.imp||'')+'" placeholder="Imp" type="number">'
      +'<input class="fi lim-pc" data-i="'+i+'" value="'+(p.cli||'')+'" placeholder="Cli" type="number">'
      +'<input class="fi lim-pe" data-i="'+i+'" value="'+(p.eng||'')+'" placeholder="%" type="number" step="0.1">'
      +'</div>';
  }).join('');

  const modal = document.createElement('div');
  modal.id = 'li-manual-modal';
  modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:1rem';
  modal.innerHTML = '<div style="background:var(--sf);border-radius:var(--rl);padding:24px;max-width:720px;width:100%;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.2)">'
    +'<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">'
    +'<div><div style="font-weight:600;font-size:15px">\u270f\ufe0f Datos LinkedIn \u2014 Entrada Manual</div>'
    +'<div style="font-size:11px;color:var(--amber);margin-top:2px">\u23f3 Temporal hasta aprobaci\xf3n de la API (\u223c14 d\xedas)</div></div>'
    +'<button onclick="document.getElementById(\'li-manual-modal\').remove()" style="background:var(--sf2);border:none;border-radius:50%;width:28px;height:28px;cursor:pointer;font-size:14px">\u00d7</button>'
    +'</div>'
    +'<div style="font-size:10px;font-weight:700;color:var(--ht);letter-spacing:.06em;margin-bottom:8px">DATOS ACTUALES (MES EN CURSO)</div>'
    +'<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">'
    +'<div><label style="font-size:11px;color:var(--ht);display:block;margin-bottom:4px">Total followers</label>'+inp('lim-tfol',d.totalFollowers,'412','number')+'</div>'
    +'<div><label style="font-size:11px;color:var(--ht);display:block;margin-bottom:4px">Nuevos este mes</label>'+inp('lim-new',d.newThisMonth,'12','number')+'</div>'
    +'<div><label style="font-size:11px;color:var(--ht);display:block;margin-bottom:4px">Impresiones mes</label>'+inp('lim-imp',d.impThisMonth,'1890','number')+'</div>'
    +'<div><label style="font-size:11px;color:var(--ht);display:block;margin-bottom:4px">Clics mes</label>'+inp('lim-cli',d.clicksThisMonth,'48','number')+'</div>'
    +'<div><label style="font-size:11px;color:var(--ht);display:block;margin-bottom:4px">Engagement % mes</label>'+inp('lim-eng',d.engThisMonth,'3.2','number')+'</div>'
    +'<div><label style="font-size:11px;color:var(--ht);display:block;margin-bottom:4px">Posts publicados</label>'+inp('lim-posts',d.postsThisMonth,'6','number')+'</div>'
    +'</div>'
    +'<div style="font-size:10px;font-weight:700;color:var(--ht);letter-spacing:.06em;margin-bottom:8px">SERIE HIST\xd3RICA (8 meses)</div>'
    +'<div style="overflow-x:auto;margin-bottom:16px"><table style="width:100%;border-collapse:collapse;font-size:12px">'
    +'<thead><tr><th style="text-align:left;padding:6px 8px;color:var(--ht);font-size:10px;border-bottom:1px solid var(--bd)">M\xc9TRICA</th>'
    +months8.map(function(m){return '<th style="text-align:center;padding:6px 4px;color:var(--ht);font-size:10px;border-bottom:1px solid var(--bd)">'+m+'</th>';}).join('')
    +'</tr></thead><tbody>'+monthRows+'</tbody></table></div>'
    +'<div style="font-size:10px;font-weight:700;color:var(--ht);letter-spacing:.06em;margin-bottom:8px">TOP POSTS (hasta 5)</div>'
    +'<div style="font-size:10px;color:var(--ht);margin-bottom:6px">T\xedtulo \u00b7 Fecha \u00b7 Impresiones \u00b7 Clics \u00b7 Engagement%</div>'
    + postRows
    +'<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:16px">'
    +'<button onclick="document.getElementById(\'li-manual-modal\').remove()" class="btn-s" style="background:var(--sf);color:var(--tx);border:1px solid var(--bd2)">Cancelar</button>'
    +'<button onclick="liSaveManualModal()" class="btn-s">\U0001f4be Guardar y actualizar</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function liSaveManualModal(){
  function getArr(cls){return [...document.querySelectorAll('.'+cls)].map(function(el){return parseFloat(el.value)||0;});}
  const data = {
    totalFollowers:    parseInt(document.getElementById('lim-tfol').value)||0,
    newThisMonth:      parseInt(document.getElementById('lim-new').value)||0,
    impThisMonth:      parseInt(document.getElementById('lim-imp').value)||0,
    clicksThisMonth:   parseInt(document.getElementById('lim-cli').value)||0,
    engThisMonth:      parseFloat(document.getElementById('lim-eng').value)||0,
    postsThisMonth:    parseInt(document.getElementById('lim-posts').value)||0,
    monthlyFollowers:   getArr('li-mfol'),
    monthlyImpressions: getArr('li-mimp'),
    monthlyClicks:      getArr('li-mcli'),
    monthlyEngagement:  getArr('li-meng'),
    posts: [0,1,2,3,4].map(function(i){
      return {
        title: (document.querySelector('.lim-pt[data-i="'+i+'"]')||{}).value||'',
        date:  (document.querySelector('.lim-pd[data-i="'+i+'"]')||{}).value||'',
        imp:   parseInt((document.querySelector('.lim-pi[data-i="'+i+'"]')||{}).value)||0,
        cli:   parseInt((document.querySelector('.lim-pc[data-i="'+i+'"]')||{}).value)||0,
        eng:   parseFloat((document.querySelector('.lim-pe[data-i="'+i+'"]')||{}).value)||0,
      };
    }).filter(function(p){return p.title;})
  };
  liSaveManualData(data);
  document.getElementById('li-manual-modal').remove();
  const t=document.createElement('div');t.className='toast';t.textContent='\u2705 Datos LinkedIn actualizados';document.body.appendChild(t);setTimeout(function(){t.remove();},2000);
  liRenderManualMode();
}

/* ── COMPETITOR ANALYSIS ── */
const COMP_SUGGESTIONS = {
  'España':    ['Michael Page España','Hays España','Randstad España','InfoJobs','Adecco España','Spring Professional','LHH España','Lee Hecht Harrison'],
  'México':    ['OCC Mundial','OCCMundial','Manpower México','Grupo Heidrick México','PageGroup México','Michael Page México','Crehana','Computrabajo'],
  'Argentina': ['Bumeran','ZonaJobs','Manpower Argentina','Adecco Argentina','Mandomedio','PageGroup Argentina','Consultora Bayton'],
  'Colombia':  ['Computrabajo Colombia','El Empleo','Manpower Colombia','Adecco Colombia','Spring Colombia','Hays Colombia'],
  'Chile':     ['Trabajando.com','Laborum Chile','Manpower Chile','Michael Page Chile','LHH Chile','Randstad Chile'],
  'UK':        ['Reed Recruitment','Michael Page UK','Hays UK','Robert Half UK','Totaljobs','CV-Library','The Dots'],
  'Global':    ['LinkedIn Talent Solutions','Michael Page','Hays','Robert Half','Indeed','Glassdoor','Spencer Stuart'],
};

let compDepth = 'quick';

function setCompDepth(d, btn){
  compDepth = d;
  document.querySelectorAll('#comp-analysis-card .btn-s[id^="comp-depth"]').forEach(b=>{
    b.style.background = 'var(--sf)'; b.style.color = 'var(--tx)'; b.style.border = '1px solid var(--bd2)';
  });
  btn.style.background = 'var(--green)'; btn.style.color = 'white'; btn.style.border = 'none';
  document.getElementById('comp-depth-hint').textContent = d==='quick' ? 'Resumen ejecutivo · ~20 seg' : 'Análisis profundo · búsquedas múltiples · ~45 seg';
}

function compLoadSuggestions(){
  const country = document.getElementById('comp-country').value;
  const sug = COMP_SUGGESTIONS[country] || [];
  const el = document.getElementById('comp-suggestions');
  if(!sug.length){ el.innerHTML = '<span style="font-size:11px;color:var(--ht)">Sin sugerencias para este mercado</span>'; return; }
  el.innerHTML = sug.slice(0,6).map(s=>`
    <button onclick="compAddSuggestion('${s}')" style="font-size:11px;padding:4px 10px;border:1px solid var(--bd2);border-radius:20px;background:var(--sf2);color:var(--tx);cursor:pointer;transition:all .15s" 
      onmouseover="this.style.background='var(--gp)';this.style.borderColor='var(--green)';this.style.color='var(--green)'" 
      onmouseout="this.style.background='var(--sf2)';this.style.borderColor='var(--bd2)';this.style.color='var(--tx)'">${s}</button>
  `).join('');
}

function compAddSuggestion(name){
  const inputs = document.querySelectorAll('.comp-name');
  for(let inp of inputs){ if(!inp.value.trim()){ inp.value = name; inp.style.borderColor='var(--green)'; setTimeout(()=>inp.style.borderColor='',1500); return; } }
  const t=document.createElement('div');t.className='toast';t.textContent='Ya tienes 3 competidores cargados';document.body.appendChild(t);setTimeout(()=>t.remove(),2000);
}

function showCompTab(tab, btn){
  ['profiles','patterns','recommendations','more-competitors'].forEach(t=>{
    const el=document.getElementById('comp-tab-'+t); if(el) el.style.display = t===tab?'block':'none';
  });
  document.querySelectorAll('.comp-tab').forEach(b=>{ b.style.color='var(--ht)'; b.style.borderBottomColor='transparent'; b.style.fontWeight='400'; });
  btn.style.color='var(--tx)'; btn.style.borderBottomColor='var(--green)'; btn.style.fontWeight='500';
}

async function runCompetitorAnalysis(){
  const competitors = [...document.querySelectorAll('.comp-name')].map(i=>i.value.trim()).filter(Boolean);
  if(!competitors.length){ alert('Escribe al menos un competidor para analizar'); return; }
  if(!CFG.ak){ alert('Necesitas configurar tu Anthropic API Key en Settings para usar esta función'); return; }

  const country = document.getElementById('comp-country').value;
  const btn = document.getElementById('comp-btn');
  btn.disabled = true; btn.innerHTML = '<span>⏳</span> <span>Analizando...</span>';

  const results = document.getElementById('comp-results');
  const loading = document.getElementById('comp-loading');
  const cards = document.getElementById('comp-cards');
  const errEl = document.getElementById('comp-error');
  results.style.display = 'block'; loading.style.display = 'block'; cards.style.display = 'none'; errEl.style.display = 'none';

  // Animated progress
  let progress = 0;
  const bar = document.getElementById('comp-progress-bar');
  const msgs = ['🔍 Buscando perfil LinkedIn de competidores...','📊 Analizando estrategia de contenidos...','🧠 Detectando patrones y tendencias...','🎯 Generando recomendaciones para Próximo Rol...'];
  let msgIdx = 0;
  const progressInterval = setInterval(()=>{
    progress = Math.min(progress + (compDepth==='quick'?4:2), 88);
    bar.style.width = progress+'%';
    if(progress % 22 === 0 && msgIdx < msgs.length){ document.getElementById('comp-loading-msg').textContent = msgs[msgIdx++]; }
  }, 600);

  try{
    const systemPrompt = `Eres un estratega experto en marketing de contenidos B2C para el sector de coaching profesional y recursos humanos en ${country}. Tienes acceso a búsqueda web para investigar empresas en tiempo real.

Tu misión: analizar la presencia en LinkedIn de los competidores indicados de "Próximo Rol" (coaching profesional para búsqueda de empleo en España y LATAM) y entregar un análisis estratégico accionable.

RESPONDE ÚNICAMENTE CON UN OBJETO JSON VÁLIDO. Sin texto antes ni después. Sin markdown. Sin bloques de código.

Estructura exacta requerida:
{
  "competitors": [
    {
      "name": "nombre empresa",
      "country_focus": "mercado principal",
      "estimated_followers": "número aproximado",
      "posting_frequency": "X posts por semana",
      "content_themes": ["tema1","tema2","tema3"],
      "top_formats": ["formato1","formato2"],
      "tone": "descripción del tono de comunicación",
      "what_works": ["logro1 con detalle específico","logro2","logro3"],
      "weaknesses": ["debilidad1","debilidad2"],
      "key_insight": "insight más importante en 1 frase"
    }
  ],
  "cross_analysis": {
    "common_patterns": ["patrón común 1","patrón común 2","patrón común 3"],
    "content_gaps": ["brecha que nadie cubre 1","brecha 2"],
    "winning_tactics": ["táctica efectiva en el sector 1","táctica 2","táctica 3"],
    "market_trends": "tendencia principal del mercado en ${country} en 2025-2026"
  },
  "recommendations": [
    {
      "priority": "alta",
      "action": "acción concreta y específica",
      "rationale": "por qué funcionará para Próximo Rol",
      "format": "formato de contenido recomendado",
      "frequency": "con qué frecuencia"
    }
  ],
  "suggested_competitors": {
    "description": "otros competidores relevantes que no fueron analizados",
    "names": ["empresa1","empresa2","empresa3","empresa4"]
  }
}`;

    const depth = compDepth === 'deep' 
      ? `Haz búsquedas web exhaustivas para cada competidor: busca su LinkedIn, sus posts recientes, artículos sobre ellos, su estrategia de contenidos. Analiza mínimo 3 fuentes por competidor.`
      : `Haz una búsqueda web por competidor para obtener información actualizada de su presencia en LinkedIn y estrategia de contenidos.`;

    const userPrompt = `Analiza estos competidores de Próximo Rol en LinkedIn para el mercado de ${country}:
${competitors.map((c,i)=>`${i+1}. ${c}`).join('\n')}

Contexto de Próximo Rol:
- Servicio de coaching profesional para búsqueda de empleo (CV, entrevistas, narrativa profesional)
- Método propio: StoryRole™
- Mercados: España y LATAM (México, Argentina, Colombia, Chile)
- Segmento: profesionales mid-senior
- LinkedIn propio: 412 seguidores, en crecimiento
- Diferenciador: herramienta AI Scanner de CV + coaches especialistas

${depth}

Devuelve SOLO el JSON. Sin explicaciones adicionales.`;

    const resp = await antFetch({
      model: 'claude-sonnet-4-20250514',
      max_tokens: compDepth==='deep' ? 4000 : 2500,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      system: systemPrompt,
      messages: [{ role:'user', content: userPrompt }]
    });

    clearInterval(progressInterval);
    bar.style.width = '100%';

    // Extract JSON from response (may have tool_use blocks before final text)
    const textBlocks = resp.content.filter(b=>b.type==='text');
    const rawText = textBlocks.map(b=>b.text).join('');
    const clean = rawText.replace(/```json|```/g,'').trim();
    
    let data;
    try { data = JSON.parse(clean); }
    catch(e){ 
      // Try to extract JSON from text
      const match = clean.match(/\{[\s\S]*\}/);
      if(match) data = JSON.parse(match[0]);
      else throw new Error('No se pudo parsear la respuesta de Claude. Intenta de nuevo.');
    }

    loading.style.display = 'none';
    cards.style.display = 'block';
    renderCompetitorResults(data, competitors, country);

  } catch(err){
    clearInterval(progressInterval);
    loading.style.display = 'none';
    errEl.style.display = 'block';
    document.getElementById('comp-error-msg').textContent = err.message;
  } finally {
    btn.disabled = false; btn.innerHTML = '<span>🔍</span> <span>Analizar competidores</span>';
  }
}

function renderCompetitorResults(data, queried, country){
  const colors = ['var(--green)','var(--blue)','var(--amber)'];
  const bgs = ['var(--gp)','var(--bp)','var(--ap)'];

  // ── TAB 1: PERFILES ──
  const competitors = data.competitors || [];
  document.getElementById('comp-tab-profiles').innerHTML = competitors.length ? competitors.map((c,i)=>`
    <div style="border:1px solid var(--bd);border-radius:var(--r);padding:16px;margin-bottom:12px;border-left:3px solid ${colors[i%3]}">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div>
          <div style="font-weight:600;font-size:14px">${c.name}</div>
          <div style="font-size:11px;color:var(--ht);margin-top:2px">${c.country_focus||country} · ${c.estimated_followers||'—'} seguidores · ${c.posting_frequency||'—'}</div>
        </div>
        <div style="background:${bgs[i%3]};color:${colors[i%3]};font-size:11px;padding:4px 10px;border-radius:20px;font-weight:500">Comp. ${i+1}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--ht);letter-spacing:.05em;margin-bottom:6px">TEMAS DE CONTENIDO</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${(c.content_themes||[]).map(t=>`<span style="background:var(--sf2);border-radius:20px;padding:2px 8px;font-size:11px">${t}</span>`).join('')}</div>
        </div>
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--ht);letter-spacing:.05em;margin-bottom:6px">FORMATOS TOP</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px">${(c.top_formats||[]).map(f=>`<span style="background:var(--sf2);border-radius:20px;padding:2px 8px;font-size:11px">${f}</span>`).join('')}</div>
        </div>
      </div>
      <div style="font-size:11px;color:var(--mt);margin-bottom:10px;font-style:italic">🗣 Tono: ${c.tone||'—'}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--green);letter-spacing:.05em;margin-bottom:6px">✅ QUÉ LES FUNCIONA</div>
          ${(c.what_works||[]).map(w=>`<div style="font-size:12px;color:var(--tx);padding:3px 0;border-bottom:1px solid var(--bd)">• ${w}</div>`).join('')}
        </div>
        <div>
          <div style="font-size:10px;font-weight:600;color:var(--red);letter-spacing:.05em;margin-bottom:6px">⚠ DEBILIDADES</div>
          ${(c.weaknesses||[]).map(w=>`<div style="font-size:12px;color:var(--tx);padding:3px 0;border-bottom:1px solid var(--bd)">• ${w}</div>`).join('')}
        </div>
      </div>
      ${c.key_insight ? `<div style="margin-top:12px;background:${bgs[i%3]};border-radius:var(--r);padding:10px 12px;font-size:12px;font-weight:500;color:${colors[i%3]}">💡 ${c.key_insight}</div>` : ''}
    </div>
  `).join('') : '<p style="color:var(--ht);font-size:12px;text-align:center;padding:2rem">No se encontraron datos de competidores</p>';

  // ── TAB 2: PATRONES ──
  const ca = data.cross_analysis || {};
  document.getElementById('comp-tab-patterns').innerHTML = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div style="background:var(--gp);border-radius:var(--r);padding:14px">
        <div style="font-size:10px;font-weight:700;color:var(--green);letter-spacing:.06em;margin-bottom:8px">📊 PATRONES COMUNES</div>
        ${(ca.common_patterns||[]).map(p=>`<div style="font-size:12px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,.06);color:var(--tx)">→ ${p}</div>`).join('')}
      </div>
      <div style="background:var(--rp);border-radius:var(--r);padding:14px">
        <div style="font-size:10px;font-weight:700;color:var(--red);letter-spacing:.06em;margin-bottom:8px">🕳 BRECHAS SIN CUBRIR</div>
        ${(ca.content_gaps||[]).map(g=>`<div style="font-size:12px;padding:4px 0;border-bottom:1px solid rgba(220,38,38,.1);color:var(--tx)">→ ${g}</div>`).join('')}
      </div>
    </div>
    <div style="background:var(--bp);border-radius:var(--r);padding:14px;margin-bottom:12px">
      <div style="font-size:10px;font-weight:700;color:var(--blue);letter-spacing:.06em;margin-bottom:8px">🏆 TÁCTICAS GANADORAS DEL SECTOR</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px">
        ${(ca.winning_tactics||[]).map(t=>`<div style="background:white;border-radius:8px;padding:8px 10px;font-size:12px;display:flex;gap:6px;align-items:flex-start"><span>⚡</span><span>${t}</span></div>`).join('')}
      </div>
    </div>
    ${ca.market_trends ? `<div style="background:var(--pp);border-radius:var(--r);padding:14px"><div style="font-size:10px;font-weight:700;color:var(--purple);letter-spacing:.06em;margin-bottom:6px">🌍 TENDENCIA DEL MERCADO ${country.toUpperCase()}</div><div style="font-size:13px;color:var(--tx)">${ca.market_trends}</div></div>` : ''}
  `;

  // ── TAB 3: RECOMENDACIONES ──
  const recs = data.recommendations || [];
  const priColors = {alta:'var(--red)',media:'var(--amber)',baja:'var(--green)'};
  const priEmojis = {alta:'🔴',media:'🟡',baja:'🟢'};
  document.getElementById('comp-tab-recommendations').innerHTML = `
    <div style="margin-bottom:12px;padding:12px;background:var(--pp);border-radius:var(--r);border-left:3px solid var(--purple)">
      <div style="font-size:11px;font-weight:600;color:var(--purple);margin-bottom:4px">🎯 PLAN DE ACCIÓN PARA PRÓXIMO ROL</div>
      <div style="font-size:12px;color:var(--mt)">Basado en el análisis de ${competitors.length} competidor${competitors.length>1?'es':''} en ${country}. Ordenado por impacto potencial.</div>
    </div>
    ${recs.map((r,i)=>`
      <div style="border:1px solid var(--bd);border-radius:var(--r);padding:14px;margin-bottom:10px;position:relative">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;gap:8px;flex-wrap:wrap">
          <div style="font-weight:600;font-size:13px;flex:1">${priEmojis[r.priority]||'•'} ${r.action}</div>
          <span style="font-size:10px;padding:3px 8px;border-radius:20px;background:${priColors[r.priority]||'var(--ht)'};color:white;white-space:nowrap;font-weight:600">${(r.priority||'').toUpperCase()}</span>
        </div>
        <div style="font-size:12px;color:var(--mt);margin-bottom:8px">${r.rationale}</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${r.format?`<span style="font-size:11px;background:var(--sf2);padding:3px 8px;border-radius:20px">📝 ${r.format}</span>`:''}
          ${r.frequency?`<span style="font-size:11px;background:var(--sf2);padding:3px 8px;border-radius:20px">🔄 ${r.frequency}</span>`:''}
        </div>
      </div>
    `).join('') || '<p style="color:var(--ht);text-align:center;padding:1rem">Sin recomendaciones generadas</p>'}
    <button onclick="exportCompAnalysis()" class="btn-s" style="width:100%;margin-top:8px;font-size:12px;padding:8px">📋 Copiar resumen al portapapeles</button>
  `;

  // ── TAB 4: MÁS COMPETIDORES ──
  const more = data.suggested_competitors || {};
  const allSuggestions = COMP_SUGGESTIONS[document.getElementById('comp-country').value] || [];
  const alreadyAnalyzed = new Set(queried.map(q=>q.toLowerCase()));
  const freshSugs = (more.names||[]).filter(n=>!alreadyAnalyzed.has(n.toLowerCase()));
  const countrySugs = allSuggestions.filter(n=>!alreadyAnalyzed.has(n.toLowerCase()) && !freshSugs.map(f=>f.toLowerCase()).includes(n.toLowerCase()));
  document.getElementById('comp-tab-more-competitors').innerHTML = `
    ${more.description ? `<p style="font-size:12px;color:var(--mt);margin-bottom:12px">${more.description}</p>` : ''}
    ${freshSugs.length ? `
      <div style="margin-bottom:16px">
        <div style="font-size:10px;font-weight:700;color:var(--ht);letter-spacing:.06em;margin-bottom:8px">🤖 SUGERIDOS POR IA (relevantes para tu análisis)</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${freshSugs.map(n=>`<button onclick="compAddAndRun('${n}')" style="font-size:12px;padding:6px 12px;border:1px solid var(--bd2);border-radius:20px;background:var(--sf2);cursor:pointer;display:flex;align-items:center;gap:4px" onmouseover="this.style.background='var(--gp)';this.style.borderColor='var(--green)'" onmouseout="this.style.background='var(--sf2)';this.style.borderColor='var(--bd2)'">${n} <span style="font-size:10px;color:var(--ht)">+ analizar</span></button>`).join('')}
        </div>
      </div>
    ` : ''}
    ${countrySugs.length ? `
      <div>
        <div style="font-size:10px;font-weight:700;color:var(--ht);letter-spacing:.06em;margin-bottom:8px">📍 OTROS EN ${(document.getElementById('comp-country').value||'').toUpperCase()}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px">
          ${countrySugs.map(n=>`<button onclick="compAddSuggestion('${n}')" style="font-size:11px;padding:4px 10px;border:1px solid var(--bd2);border-radius:20px;background:var(--sf2);cursor:pointer" onmouseover="this.style.background='var(--bp)'" onmouseout="this.style.background='var(--sf2)'">${n}</button>`).join('')}
        </div>
        <p style="font-size:11px;color:var(--ht);margin-top:8px">Haz clic para agregar a los inputs y luego vuelve a analizar</p>
      </div>
    ` : ''}
  `;

  // Activate tab
  showCompTab('profiles', document.querySelector('.comp-tab'));
}

function compAddAndRun(name){
  compAddSuggestion(name);
  setTimeout(runCompetitorAnalysis, 200);
}

function exportCompAnalysis(){
  const tabs = ['comp-tab-profiles','comp-tab-patterns','comp-tab-recommendations'];
  let text = '=== ANÁLISIS DE COMPETIDORES LinkedIn — Próximo Rol ===\n\n';
  tabs.forEach(id=>{const el=document.getElementById(id);if(el)text+=el.innerText+'\n\n---\n\n';});
  navigator.clipboard.writeText(text).then(()=>{
    const t=document.createElement('div');t.className='toast';t.textContent='✅ Resumen copiado al portapapeles';document.body.appendChild(t);setTimeout(()=>t.remove(),2500);
  }).catch(()=>alert(text));
}

