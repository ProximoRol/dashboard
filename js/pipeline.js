/* ═══════════════════════════════════════════════
   PIPELINE — Monday.com, Opportunities
   Depends on: core.js
   ═══════════════════════════════════════════════ */

/* ── INSTANTLY ── */
async function loadInstantly(){
  setNB('inst','...');
  try{
    // Fetch all campaigns (up to 100)
    // Instantly API - try v2 (Bearer token) first, then v1 (api_key param)
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:';
    
    // Instantly v2 API — try direct first (supports CORS), proxy as last resort
    let r;
    const URL_V2 = 'https://api.instantly.ai/api/v2/campaigns?limit=100';
    const hdrs = {'Authorization':'Bearer '+CFG.instantly,'Content-Type':'application/json'};

    // 1. Try v2 direct (no proxy) — works when Instantly CORS headers are present
    try {
      r = await fetch(URL_V2, {headers: hdrs});
    } catch(e){ r = null; console.warn('Instantly v2 direct failed:', e.message); }

    // 2. Try v2 via proxy if direct fails
    if(!r || !r.ok){
      try {
        r = await fetch(`https://corsproxy.io/?${encodeURIComponent(URL_V2)}`, {headers: hdrs});
      } catch(e){ r = null; console.warn('Instantly v2 proxy failed:', e.message); }
    }

    // 3. Try v1 only for legacy inst_... keys
    if((!r || !r.ok) && CFG.instantly.startsWith('inst_')){
      const URL_V1 = `https://api.instantly.ai/api/v1/campaign/list?api_key=${CFG.instantly}&limit=100&skip=0`;
      try {
        r = await fetch(isLocal ? `https://corsproxy.io/?${encodeURIComponent(URL_V1)}` : URL_V1);
      } catch(e){ r = null; }
    }

    if(!r || !r.ok){
      const status = r ? r.status : 'network error';
      throw new Error(`API ${status} — regenerate your API key in Instantly → Settings → Integrations`);
    }
    const data = await r.json();
    // v2 returns {items:[...]}, v1 returns array directly
    const camps = Array.isArray(data) ? data : (data.items || data.campaigns || data.data || []);
    if(!Array.isArray(camps)) throw new Error('Unexpected response: '+JSON.stringify(data).slice(0,100));
    setNB('inst','live');

    // ── Aggregate metrics ─────────────────────────────────
    const agg = camps.reduce((a,c)=>{
      const st = c.campaign_stats || {};
      a.sent        += st.emails_sent_count         || 0;
      a.opens       += st.unique_opens_count        || 0;
      a.replies     += st.reply_count               || 0;
      a.bounces     += st.bounce_count              || 0;
      a.unsubs      += st.unsubscribed_count        || 0;
      a.leads       += st.new_leads_contacted_count || 0;
      return a;
    },{sent:0,opens:0,replies:0,bounces:0,unsubs:0,leads:0});

    window._INST_AGG = agg;
    const delivered  = agg.sent - agg.bounces;
    const openRate   = agg.sent   > 0 ? (agg.opens  /agg.sent  *100) : 0;
    const replyRate  = agg.sent   > 0 ? (agg.replies/agg.sent  *100) : 0;
    const bounceRate = agg.sent   > 0 ? (agg.bounces/agg.sent  *100) : 0;
    const delivRate  = agg.sent   > 0 ? (delivered  /agg.sent  *100) : 0;
    const clickToReply= agg.opens > 0 ? (agg.replies/agg.opens *100) : 0;

    // ── 6 KPI cards ───────────────────────────────────────
    const kpis = [
      {l:'Emails sent',   v:agg.sent.toLocaleString(),     sub:'Total across all campaigns'},
      {l:'Delivered',     v:delivered.toLocaleString(),    sub:delivRate.toFixed(1)+'% delivery rate',  col: delivRate>=95?'var(--green)':delivRate>=90?'var(--amber)':'var(--red)'},
      {l:'Unique opens',  v:agg.opens.toLocaleString(),    sub:openRate.toFixed(1)+'% open rate',       col: openRate>=30?'var(--green)':openRate>=15?'var(--amber)':'var(--red)'},
      {l:'Replies',       v:agg.replies.toLocaleString(),  sub:replyRate.toFixed(1)+'% reply rate',     col: replyRate>=5?'var(--green)':replyRate>=2?'var(--amber)':'var(--red)'},
      {l:'Bounces',       v:agg.bounces.toLocaleString(),  sub:bounceRate.toFixed(1)+'% bounce rate',   col: bounceRate<=3?'var(--green)':bounceRate<=8?'var(--amber)':'var(--red)'},
      {l:'Unsubscribes',  v:agg.unsubs.toLocaleString(),   sub:'Total opt-outs'},
    ];
    document.getElementById('inst-kpis').innerHTML = kpis.map(k=>
      `<div class="kpi">
        <div class="kl">${k.l}</div>
        <div class="kv">${k.v}</div>
        <div class="ks" style="color:${k.col||'var(--ht)'}">${k.sub}</div>
      </div>`).join('');

    // Overview widget
    document.getElementById('ov-inst').innerHTML =
      `<div class="sg">
        <div class="sb2"><div class="sv">${agg.sent.toLocaleString()}</div><div class="slb">Sent</div></div>
        <div class="sb2"><div class="sv">${openRate.toFixed(1)}%</div><div class="slb">Open rate</div></div>
        <div class="sb2"><div class="sv">${replyRate.toFixed(1)}%</div><div class="slb">Reply rate</div></div>
        <div class="sb2"><div class="sv">${bounceRate.toFixed(1)}%</div><div class="slb">Bounce</div></div>
      </div>`;

    // ── Auto-generated insights ───────────────────────────
    const activeCamps  = camps.filter(c=>c.status===1);
    const withStats    = camps.filter(c=>(c.campaign_stats?.emails_sent_count||0)>50);
    const bestReply    = withStats.sort((a,b)=>(b.campaign_stats.reply_count/b.campaign_stats.emails_sent_count)-(a.campaign_stats.reply_count/a.campaign_stats.emails_sent_count))[0];
    const bestOpen     = withStats.sort((a,b)=>(b.campaign_stats.unique_opens_count/b.campaign_stats.emails_sent_count)-(a.campaign_stats.unique_opens_count/a.campaign_stats.emails_sent_count))[0];
    const highBounce   = withStats.filter(c=>(c.campaign_stats.bounce_count/c.campaign_stats.emails_sent_count)>0.08);

    const insights = [];

    // Health score
    const health = Math.round(Math.min(100, delivRate*0.3 + Math.min(openRate,50)*0.4 + Math.min(replyRate*5,30)*0.3));
    const healthCol = health>=70?'#059669':health>=45?'#D97706':'#DC2626';
    const healthLbl = health>=70?'Healthy':'Needs attention';
    insights.push({
      ic:'📊', col:healthCol, bg: health>=70?'#E1F5EE':health>=45?'#FFFBEB':'#FEF2F2',
      title:'Campaign health score',
      val: health+'/100 — '+healthLbl,
      sub: `Delivery ${delivRate.toFixed(0)}% · Open ${openRate.toFixed(0)}% · Reply ${replyRate.toFixed(0)}%`
    });

    // Opener→Reply conversion
    if(agg.opens>0) insights.push({
      ic:'🎯', col:'#2563EB', bg:'#EFF6FF',
      title:'Openers who replied',
      val: clickToReply.toFixed(1)+'% conversion',
      sub: `${agg.replies.toLocaleString()} replies from ${agg.opens.toLocaleString()} opens`
    });

    // Best performing
    if(bestReply){
      const br = (bestReply.campaign_stats.reply_count/bestReply.campaign_stats.emails_sent_count*100).toFixed(1);
      insights.push({
        ic:'🏆', col:'#059669', bg:'#F0FDF4',
        title:'Best reply rate',
        val: bestReply.name.length>30 ? bestReply.name.slice(0,28)+'…' : bestReply.name,
        sub: br+'% reply rate · '+bestReply.campaign_stats.reply_count+' replies'
      });
    }

    // Bounce warning
    if(highBounce.length>0) insights.push({
      ic:'⚠️', col:'#DC2626', bg:'#FEF2F2',
      title:'High bounce campaigns',
      val: highBounce.length+' campaign'+(highBounce.length>1?'s':'')+' above 8%',
      sub: 'Review list quality: '+highBounce.map(c=>c.name.split(' ').slice(0,3).join(' ')).join(', ')
    });

    // Active campaigns
    insights.push({
      ic:'⚡', col:'#7C3AED', bg:'#F5F3FF',
      title:'Active campaigns',
      val: activeCamps.length+' of '+camps.length+' running',
      sub: 'Total leads contacted: '+(agg.leads||agg.sent).toLocaleString()
    });

    document.getElementById('inst-insights').innerHTML = insights.map(ins=>
      `<div style="background:${ins.bg};border-radius:var(--rl);padding:12px 14px;display:flex;gap:10px;align-items:flex-start">
        <div style="font-size:18px;flex-shrink:0">${ins.ic}</div>
        <div>
          <div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:${ins.col};margin-bottom:2px">${ins.title}</div>
          <div style="font-size:13px;font-weight:500;color:${ins.col};margin-bottom:2px">${ins.val}</div>
          <div style="font-size:11px;color:var(--mt)">${ins.sub}</div>
        </div>
      </div>`).join('');

    // ── Engagement funnel ─────────────────────────────────
    const funSteps = [
      {l:'Sent',       v:agg.sent,     pct:100,                                      col:'#7C3AED'},
      {l:'Delivered',  v:delivered,    pct:agg.sent>0?delivered/agg.sent*100:0,       col:'#2563EB'},
      {l:'Opened',     v:agg.opens,    pct:agg.sent>0?agg.opens/agg.sent*100:0,       col:'#1D9E75'},
      {l:'Replied',    v:agg.replies,  pct:agg.sent>0?agg.replies/agg.sent*100:0,     col:'#059669'},
    ];
    document.getElementById('inst-funnel').innerHTML = funSteps.map((f,i)=>`
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:${i<3?'14px':'4px'}">
        <div style="width:90px;text-align:right;font-size:12px;color:var(--mt);flex-shrink:0">${f.l}</div>
        <div style="flex:1;height:28px;background:var(--sf2);border-radius:4px;overflow:hidden;position:relative">
          <div style="height:100%;width:${Math.max(f.pct,0).toFixed(1)}%;background:${f.col};border-radius:4px;transition:width .5s;display:flex;align-items:center;padding:0 8px">
            <span style="font-size:11px;font-weight:500;color:white;white-space:nowrap">${f.v.toLocaleString()}</span>
          </div>
        </div>
        <div style="width:44px;text-align:right;font-size:11px;color:var(--mt);flex-shrink:0">${f.pct.toFixed(1)}%</div>
      </div>`).join('');

    // ── Open rate bar chart ───────────────────────────────
    const top8 = [...withStats]
      .sort((a,b)=>(b.campaign_stats.unique_opens_count/b.campaign_stats.emails_sent_count)-(a.campaign_stats.unique_opens_count/a.campaign_stats.emails_sent_count))
      .slice(0,8);
    if(top8.length>0){
      const labels = top8.map(c=>c.name.length>20?c.name.slice(0,18)+'…':c.name);
      const oRates = top8.map(c=>parseFloat((c.campaign_stats.unique_opens_count/c.campaign_stats.emails_sent_count*100).toFixed(1)));
      const rRates = top8.map(c=>parseFloat((c.campaign_stats.reply_count/c.campaign_stats.emails_sent_count*100).toFixed(1)));
      mkC('inst-chart','bar',
        {labels,datasets:[
          {label:'Open rate %',  data:oRates, backgroundColor:'rgba(29,158,117,.7)', borderRadius:3, borderWidth:0},
          {label:'Reply rate %', data:rRates, backgroundColor:'rgba(37,99,235,.7)',  borderRadius:3, borderWidth:0},
        ]},
        {indexAxis:'y',scales:{
          x:{ticks:{color:TC,font:{size:10},callback:v=>v+'%'},grid:{color:GC}},
          y:{ticks:{color:TC,font:{size:10}},grid:{color:'transparent'}}
        },plugins:{legend:{labels:{color:TC,font:{size:10},boxWidth:10}}}}
      );
    }

    // ── Campaign table ────────────────────────────────────
    const sorted = [...camps].sort((a,b)=>(b.campaign_stats?.emails_sent_count||0)-(a.campaign_stats?.emails_sent_count||0));
    document.getElementById('inst-c').innerHTML =
      `<table class="dt"><thead><tr>
        <th>Campaign</th><th>Sent</th><th>Delivered</th><th>Opens</th><th>Open %</th>
        <th>Replies</th><th>Reply %</th><th>Bounces</th><th>Status</th>
      </tr></thead><tbody>`
      +sorted.map(c=>{
        const st  = c.campaign_stats || {};
        const snt = st.emails_sent_count    || 0;
        const opn = st.unique_opens_count   || 0;
        const rpl = st.reply_count          || 0;
        const bnc = st.bounce_count         || 0;
        const dlv = snt - bnc;
        const oR  = snt>0?(opn/snt*100).toFixed(1)+'%':'—';
        const rR  = snt>0?(rpl/snt*100).toFixed(1)+'%':'—';
        const bR  = snt>0?(bnc/snt*100).toFixed(1)+'%':'—';
        const bCol= bnc/snt>0.08?'var(--red)':bnc/snt>0.03?'var(--amber)':'var(--mt)';
        const sLbl= c.status===1?'Active':c.status===2?'Paused':'Draft';
        const sCol= c.status===1?'var(--green)':c.status===2?'var(--amber)':'var(--ht)';
        return `<tr>
          <td><span class="tm">${c.name||'Untitled'}</span></td>
          <td>${snt.toLocaleString()}</td>
          <td>${dlv.toLocaleString()}</td>
          <td>${opn.toLocaleString()}</td>
          <td style="font-weight:500">${oR}</td>
          <td>${rpl.toLocaleString()}</td>
          <td style="font-weight:500;color:${rpl/snt>0.05?'var(--green)':'var(--mt)'}">${rR}</td>
          <td style="color:${bCol}">${bnc.toLocaleString()}</td>
          <td><span style="color:${sCol};font-weight:500">${sLbl}</span></td>
        </tr>`;}).join('')
      +'</tbody></table>';

  }catch(e){
    setNB('inst','off');
    const isLocalErr = e.message.toLowerCase().includes('fetch') || e.message.toLowerCase().includes('cors') || e.message.toLowerCase().includes('failed');
    const msg = isLocalErr
      ? 'CORS blocked — the proxy is temporarily unavailable. See deploy instructions below or try refreshing.'
      : e.message;
    document.getElementById('inst-kpis').innerHTML = `<div class="notice" style="padding:12px;grid-column:1/-1"><strong>Instantly error:</strong> ${msg}</div>`;
    document.getElementById('ov-inst').innerHTML = `<div class="notice" style="padding:8px"><strong>Instantly</strong> — check API key</div>`;
    throw e;
  }
}


/* ── MONDAY ── */
function showBoardSelector(boards, containerId){
  const el = document.getElementById(containerId);
  if(!el) return;
  el.innerHTML = `<div class="notice" style="grid-column:1/-1;text-align:left;padding:16px">
    <strong style="display:block;margin-bottom:8px">Select your Opportunity board:</strong>
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      ${boards.map(b=>`<button onclick="selectOppBoard('${b.id}','${b.name.replace(/'/g,"\'")}')" 
        style="padding:6px 12px;border:1px solid var(--bd2);border-radius:var(--r);background:var(--sf2);color:var(--tx);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif">
        ${b.name} <span style="color:var(--ht)">(${b.items_count||0})</span>
      </button>`).join('')}
    </div>
  </div>`;
}

function selectOppBoard(boardId, boardName){
  CFG._oppsBoardId = boardId;
  localStorage.setItem(CK, JSON.stringify(CFG));
  setNB('opps','...');
  const el = document.getElementById('opps-stages');
  if(el) el.innerHTML = `<div class="ld" style="grid-column:1/-1"><div class="sp2"></div>Loading ${boardName}…</div>`;
  loadOpportunities(boardId).catch(e=>{setNB('opps','off');console.error('Opps:',e);
    document.getElementById('opps-stages').innerHTML=`<div class="notice" style="grid-column:1/-1;color:var(--red)"><strong>Error loading board</strong>${e.message}</div>`;
  });
}

async function loadMonday(){
  setNB('mon','...');setNB('opps','...');
  // First get all boards
  const data=await monQ(`{ boards(limit:50){id name state items_count} }`);
  const boards=data.boards||[];
  setNB('mon','live');
  const total=boards.reduce((a,b)=>a+(b.items_count||0),0);
  document.getElementById('mon-kpis').innerHTML=[{l:'Boards',v:boards.length},{l:'Total items',v:total.toLocaleString()},{l:'Active boards',v:boards.filter(b=>b.state==='active').length}].map(m=>`<div class="kpi"><div class="kl">${m.l}</div><div class="kv">${m.v}</div><div class="ks">Monday.com</div></div>`).join('');
  document.getElementById('mon-b').innerHTML=`<table class="dt"><thead><tr><th>Board</th><th>Items</th><th>Status</th></tr></thead><tbody>${boards.map(b=>`<tr><td><span class="tm">${b.name}</span></td><td>${(b.items_count||0).toLocaleString()}</td><td><span style="color:${b.state==='active'?'var(--green)':'var(--ht)'};font-weight:500">${b.state}</span></td></tr>`).join('')}</tbody></table>`;

  // Save boards list globally for manual selection
  window._MON_BOARDS = boards;
  
  // Auto-detect: try exact "Opportunity" first, then fuzzy
  // Hardcoded: Próximo Rol Opportunity board ID
  const oppsBoardId = '1678993739';
  CFG._oppsBoardId = oppsBoardId;
  loadOpportunities(oppsBoardId).catch(e=>{
    setNB('opps','off');
    console.error('Opps:',e);
    showBoardSelector(boards,'opps-stages');
  });
}

// Global data store for opportunities
let _OPP_DATA = [];
let _OPP_ACTIVE_SOURCES = new Set();
let _OPP_ALL_SOURCES = [];

async function loadOpportunities(boardId){
  setNB('opps','live');
  const stagesEl = document.getElementById('opps-stages');
  if(stagesEl) stagesEl.innerHTML='<div class="ld" style="grid-column:1/-1"><div class="sp2"></div>Loading opportunities…</div>';

  // Get columns
  const colData = await monQ('{ boards(ids:['+boardId+']){ columns{id title type} } }');
  const columns = colData.boards?.[0]?.columns||[];

  // Paginate all items
  let allItems=[], cursor=null, pg=0;
  while(pg<20){
    const cp = cursor ? ', cursor:"'+cursor+'"' : '';
    const q = '{ boards(ids:['+boardId+']){ items_page(limit:100'+cp+'){ cursor items{ id name created_at column_values{id text value column{title type}} } } } }';
    const d = await monQ(q);
    const pd = d.boards?.[0]?.items_page||{};
    allItems = [...allItems,...(pd.items||[])];
    cursor = pd.cursor||null; pg++;
    if(!cursor||!pd.items?.length) break;
  }
  console.log('Loaded', allItems.length, 'opportunities');

  // Parse
  _OPP_DATA = allItems.map(item=>{
    let stage='',source='',amount=0;
    item.column_values.forEach(cv=>{
      const title=(cv.column?.title||'').toLowerCase().trim();
      const type=cv.column?.type||'';
      const text=cv.text||'';
      if((type==='color'||type==='status'||title.includes('stage')||title.includes('status'))&&!stage&&text) stage=text;
      if((title==='opps source'||title==='opp source'||title==='source'||title.includes('opps source'))&&!source) source=text;
      if((type==='numeric'||title.includes('deal')||title.includes('value')||title.includes('amount'))&&!amount){const n=parseFloat((text||'').replace(/[^0-9.-]/g,''));if(n>0)amount=n;}
    });
    return{id:item.id,name:item.name,created:new Date(item.created_at),stage,source:source||'Not specified',amount};
  });

  // Build source list
  const srcSet = new Set(_OPP_DATA.map(i=>i.source));
  _OPP_ALL_SOURCES = [...srcSet].sort();
  _OPP_ACTIVE_SOURCES = new Set(_OPP_ALL_SOURCES); // all active initially

  buildSrcFilterPills();
  renderOppCharts();
}

function buildSrcFilterPills(){
  const container = document.getElementById('src-filter-pills');
  if(!container) return;
  container.innerHTML = _OPP_ALL_SOURCES.map(src=>{
    const active = _OPP_ACTIVE_SOURCES.has(src);
    return '<span class="filter-pill '+(active?'active':'inactive')+'" onclick="toggleSrcFilter(\''+src.replace(/'/g,"\\'")+'\')" title="'+src+'">'+
      (src.length>20?src.slice(0,18)+'…':src)+'</span>';
  }).join('');
}

function toggleSrcFilter(src){
  if(_OPP_ACTIVE_SOURCES.has(src)) _OPP_ACTIVE_SOURCES.delete(src);
  else _OPP_ACTIVE_SOURCES.add(src);
  buildSrcFilterPills();
  renderOppCharts();
}

function clearOppFilters(){
  _OPP_ACTIVE_SOURCES = new Set(_OPP_ALL_SOURCES);
  document.getElementById('stage-filter').value='all';
  document.getElementById('year-filter').value='2026';
  buildSrcFilterPills();
  renderOppCharts();
}

function getFilteredOpps(){
  const stageF = document.getElementById('stage-filter')?.value||'all';
  const yearF  = document.getElementById('year-filter')?.value||'2026';
  const catStage=(s)=>{if(!s)return'other';const sl=s.toLowerCase();if(sl.includes('won')||sl.includes('closed won'))return'won';if(sl.includes('lost')||sl.includes('closed lost'))return'lost';if(sl.includes('proposal')||sl.includes('quote'))return'proposal';if(sl.includes('discovery')||sl.includes('qualify'))return'discovery';return'other';};
  return _OPP_DATA.filter(i=>{
    if(!_OPP_ACTIVE_SOURCES.has(i.source)) return false;
    if(stageF!=='all' && catStage(i.stage)!==stageF) return false;
    if(yearF!=='all' && i.created.getFullYear()!==parseInt(yearF)) return false;
    return true;
  });
}

function renderOppCharts(){
  const parsed = getFilteredOpps();
  const yr = parseInt(document.getElementById('year-filter')?.value||'2026');
  const catStage=(s)=>{if(!s)return'other';const sl=s.toLowerCase();if(sl.includes('won')||sl.includes('closed won'))return'won';if(sl.includes('lost')||sl.includes('closed lost'))return'lost';if(sl.includes('proposal')||sl.includes('quote'))return'proposal';if(sl.includes('discovery')||sl.includes('qualify'))return'discovery';return'other';};
  const stages={discovery:[],proposal:[],won:[],lost:[],other:[]};
  parsed.forEach(i=>{stages[catStage(i.stage)].push(i);});
  const totalAmt=parsed.reduce((a,i)=>a+i.amount,0);

  // Stage cards
  const stageDef=[
    {key:'discovery',label:'Discovery',cls:'sc-disc',color:'#2563EB'},
    {key:'proposal',label:'Proposal',cls:'sc-prop',color:'#D97706'},
    {key:'won',label:'Won',cls:'sc-won',color:'#1D9E75'},
    {key:'lost',label:'Lost',cls:'sc-lost',color:'#DC2626'},
    {key:'other',label:'Active',cls:'sc-disc',color:'#0891B2'},
  ];
  const stagesEl=document.getElementById('opps-stages');
  if(stagesEl) stagesEl.innerHTML=stageDef.map(s=>{
    const its=stages[s.key];if(!its.length)return'';
    const amt=its.reduce((a,i)=>a+i.amount,0);
    return'<div class="stage-card '+s.cls+'"><div class="sc-val" style="color:'+s.color+'">'+its.length+'</div><div class="sc-lbl" style="color:'+s.color+'">'+s.label+'</div>'+(amt>0?'<div class="sc-amt">'+fmtGBP(amt)+'</div>':'')+'</div>';
  }).join('');

  // Overview
  const ovEl=document.getElementById('ov-opps');
  if(ovEl) ovEl.innerHTML='<div class="sg">'
    +'<div class="sb2"><div class="sv" style="color:var(--teal)">'+parsed.length+'</div><div class="slb">Total</div></div>'
    +'<div class="sb2"><div class="sv" style="color:#2563EB">'+stages.discovery.length+'</div><div class="slb">Discovery</div></div>'
    +'<div class="sb2"><div class="sv" style="color:#D97706">'+stages.proposal.length+'</div><div class="slb">Proposal</div></div>'
    +'<div class="sb2"><div class="sv" style="color:#1D9E75">'+stages.won.length+'</div><div class="slb">Won</div></div>'
    +'</div>'+(totalAmt>0?'<p style="font-size:11px;font-weight:500;color:var(--green);margin-top:6px;text-align:center">Pipeline: '+fmtGBP(totalAmt)+'</p>':'');

  // Monthly by stage
  const yearFilt = yr || 2026;
  mkC('opps-monthly','bar',{labels:MONTHS_SHORT,datasets:[
    {label:'Discovery',data:Array.from({length:12},(_,m)=>stages.discovery.filter(i=>i.created.getFullYear()===yearFilt&&i.created.getMonth()===m).length),backgroundColor:'rgba(37,99,235,.75)',borderRadius:3,stack:'s'},
    {label:'Proposal', data:Array.from({length:12},(_,m)=>stages.proposal.filter(i=>i.created.getFullYear()===yearFilt&&i.created.getMonth()===m).length),backgroundColor:'rgba(217,119,6,.75)',borderRadius:3,stack:'s'},
    {label:'Won',      data:Array.from({length:12},(_,m)=>stages.won.filter(i=>i.created.getFullYear()===yearFilt&&i.created.getMonth()===m).length),backgroundColor:'rgba(29,158,117,.75)',borderRadius:3,stack:'s'},
    {label:'Lost',     data:Array.from({length:12},(_,m)=>stages.lost.filter(i=>i.created.getFullYear()===yearFilt&&i.created.getMonth()===m).length),backgroundColor:'rgba(220,38,38,.75)',borderRadius:3,stack:'s'},
    {label:'Other',    data:Array.from({length:12},(_,m)=>stages.other.filter(i=>i.created.getFullYear()===yearFilt&&i.created.getMonth()===m).length),backgroundColor:'rgba(8,145,178,.5)',borderRadius:3,stack:'s'},
  ]},{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC},stacked:true},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},stacked:true,beginAtZero:true}},plugins:{legend:{display:true,position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}}}});

  // Monthly by source (top 6 sources)
  const activeSrcs=[..._OPP_ACTIVE_SOURCES].filter(s=>s!=='Not specified').slice(0,6);
  const srcColors=['rgba(37,99,235,.75)','rgba(29,158,117,.75)','rgba(217,119,6,.75)','rgba(124,58,237,.75)','rgba(8,145,178,.75)','rgba(220,38,38,.75)'];
  mkC('opps-monthly-src','bar',{labels:MONTHS_SHORT,datasets:activeSrcs.map((src,i)=>({
    label:src,
    data:Array.from({length:12},(_,m)=>parsed.filter(p=>p.source===src&&p.created.getFullYear()===yearFilt&&p.created.getMonth()===m).length),
    backgroundColor:srcColors[i%srcColors.length],borderRadius:3,stack:'s'
  })).concat([{
    label:'Not specified',
    data:Array.from({length:12},(_,m)=>parsed.filter(p=>p.source==='Not specified'&&p.created.getFullYear()===yearFilt&&p.created.getMonth()===m).length),
    backgroundColor:'rgba(160,159,152,.4)',borderRadius:3,stack:'s'
  }])},{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC},stacked:true},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},stacked:true,beginAtZero:true}},plugins:{legend:{display:true,position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}}}});

  // Source donut
  const srcCounts={};
  parsed.forEach(i=>{const src=i.source||'Not specified';srcCounts[src]=(srcCounts[src]||0)+1;});
  const srcEntries=Object.entries(srcCounts).sort((a,b)=>b[1]-a[1]);
  mkC('opps-src','doughnut',{labels:srcEntries.map(e=>e[0]),datasets:[{data:srcEntries.map(e=>e[1]),backgroundColor:COLORS,borderWidth:2,borderColor:'#fff',hoverOffset:8}]},{cutout:'60%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>ctx.label+': '+ctx.raw+' ('+((ctx.raw/parsed.length)*100).toFixed(0)+'%)'}}}});
  const srcLegEl=document.getElementById('opps-src-l');
  if(srcLegEl) srcLegEl.innerHTML=srcEntries.map((e,i)=>'<span class="li" style="cursor:pointer" onclick="toggleSrcFilter(\''+e[0].replace(/'/g,"\\'")+'\')"><span class="ls" style="background:'+COLORS[i%COLORS.length]+';'+(!_OPP_ACTIVE_SOURCES.has(e[0])?'opacity:.3':'')+'"></span><span style="'+(!_OPP_ACTIVE_SOURCES.has(e[0])?'opacity:.4':'')+'">'+e[0]+' — '+e[1]+' ('+((e[1]/parsed.length)*100).toFixed(0)+'%)</span></span>').join('');

  // Amount chart
  const mAmts=Array.from({length:12},(_,m)=>parsed.filter(i=>i.created.getFullYear()===yearFilt&&i.created.getMonth()===m).reduce((a,i)=>a+i.amount,0));
  if(mAmts.some(v=>v>0)){
    mkC('opps-amt','bar',{labels:MONTHS_SHORT,datasets:[{label:'Amount',data:mAmts,backgroundColor:'rgba(29,158,117,.15)',borderColor:'#1D9E75',borderWidth:1.5,borderRadius:4}]},{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10},callback:v=>fmtGBP(v)},grid:{color:GC},beginAtZero:true}}});
  }

  // Render table
  renderOppTable();
}

function renderOppTable(){
  const parsed = getFilteredOpps();
  const search = (document.getElementById('opps-search')?.value||'').toLowerCase();
  const catStage=(s)=>{if(!s)return'other';const sl=s.toLowerCase();if(sl.includes('won')||sl.includes('closed won'))return'won';if(sl.includes('lost')||sl.includes('closed lost'))return'lost';if(sl.includes('proposal')||sl.includes('quote'))return'proposal';if(sl.includes('discovery')||sl.includes('qualify'))return'discovery';return'other';};
  const filtered = search ? parsed.filter(i=>i.name.toLowerCase().includes(search)||i.source.toLowerCase().includes(search)||i.stage.toLowerCase().includes(search)) : parsed;
  const sorted = [...filtered].sort((a,b)=>b.created-a.created);
  const badge = document.getElementById('opps-count-badge');
  if(badge) badge.textContent = filtered.length+' opportunities';
  const listEl=document.getElementById('opps-list');
  if(!listEl) return;
  listEl.innerHTML='<table class="dt"><thead><tr><th>Opportunity</th><th>Source</th><th>Stage</th><th>Created</th><th>Amount</th></tr></thead><tbody>'
    +sorted.slice(0,50).map(i=>{
      const sg=catStage(i.stage);
      const sc={won:'var(--green)',lost:'var(--red)',proposal:'var(--amber)',discovery:'var(--blue)',other:'var(--teal)'}[sg];
      return'<tr><td><span class="tm" style="max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">'+i.name+'</span></td>'
        +'<td><span style="font-size:11px;background:var(--tp);color:var(--teal);padding:2px 7px;border-radius:10px;white-space:nowrap">'+(i.source!=='Not specified'?i.source:'—')+'</span></td>'
        +'<td><span style="color:'+sc+';font-weight:500;font-size:11px">'+(i.stage||'—')+'</span></td>'
        +'<td><span class="ts">'+i.created.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})+'</span></td>'
        +'<td>'+(i.amount>0?fmtGBP(i.amount):'—')+'</td></tr>';
    }).join('')
    +'</tbody></table>'+(sorted.length>50?'<p style="font-size:11px;color:var(--ht);margin-top:8px;text-align:center">Showing 50 of '+sorted.length+'</p>':'');
}


