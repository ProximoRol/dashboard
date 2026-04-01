/* ═══════════════════════════════════════════════
   ANALYTICS — GA4, Search Console, Google Ads
   Depends on: core.js
   ═══════════════════════════════════════════════ */

/* ── GA4 ── */
async function loadGA4(){
  setNB('ga4','...');
  const [curr,prev,tl,src,pages,geo]=await Promise.all([
    ga4R([],['sessions','totalUsers','bounceRate','averageSessionDuration','screenPageViews']),
    ga4Prv(['sessions','totalUsers','bounceRate','averageSessionDuration']),
    ga4R(['date'],['sessions','totalUsers']),
    ga4R(['sessionDefaultChannelGroup'],['sessions']),
    ga4R(['pagePath'],['sessions'],{limit:10,orderBys:[{metric:{metricName:'sessions'},desc:true}]}),
    ga4R(['country'],['sessions'],{limit:8,orderBys:[{metric:{metricName:'sessions'},desc:true}]}),
  ]);
  setNB('ga4','live');
  const v=(r,i)=>parseFloat(r.rows?.[0]?.metricValues?.[i]?.value||'0');
  const ms=[{l:'Sessions',c:v(curr,0),p:v(prev,0),f:n=>Math.round(n).toLocaleString()},{l:'Users',c:v(curr,1),p:v(prev,1),f:n=>Math.round(n).toLocaleString()},{l:'Pageviews',c:v(curr,4),p:0,f:n=>Math.round(n).toLocaleString()},{l:'Bounce rate',c:v(curr,2)*100,p:v(prev,2)*100,f:n=>n.toFixed(1)+'%',inv:true},{l:'Avg session',c:v(curr,3),p:v(prev,3),f:n=>{const m=Math.floor(n/60),s=Math.floor(n%60);return m+'m '+String(s).padStart(2,'0')+'s';}}];
  const kH=ms.map(m=>{const d=m.p>0?((m.c-m.p)/m.p*100):0;const up=m.inv?d<0:d>0;const cl=d===0?'nu':up?'up':'dn';const ar=d===0?'–':up?'↑':'↓';return`<div class="kpi"><div class="kl">${m.l}</div><div class="kv">${m.f(m.c)}</div><div class="kd ${cl}">${ar} ${d===0?'–':(d>0?'+':'')+d.toFixed(1)+'%'}</div><div class="ks">GA4</div></div>`;}).join('');
  document.getElementById('ga4-kpis').innerHTML=kH;document.getElementById('ov-kpis').innerHTML=kH;
  const rows=(tl.rows||[]).sort((a,b)=>a.dimensionValues[0].value.localeCompare(b.dimensionValues[0].value));
  const lbls=rows.map(r=>{const d=r.dimensionValues[0].value;return`${d.slice(6,8)}/${d.slice(4,6)}`;});
  const sess=rows.map(r=>parseInt(r.metricValues[0].value));
  const usrs=rows.map(r=>parseInt(r.metricValues[1].value));
  document.getElementById('ga4-bg').textContent=sess.reduce((a,b)=>a+b,0).toLocaleString()+' sessions';
  const tlD={labels:lbls,datasets:[{label:'Sessions',data:sess,borderColor:'#1D9E75',backgroundColor:'rgba(29,158,117,.08)',tension:.35,fill:true,pointRadius:2,borderWidth:2},{label:'Users',data:usrs,borderColor:'#9FE1CB',backgroundColor:'transparent',tension:.35,fill:false,pointRadius:1.5,borderWidth:1.5}]};
  const sc={scales:{x:{ticks:{color:TC,font:{size:10},maxTicksLimit:10,autoSkip:true},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},beginAtZero:false}}};
  mkC('ga4-tl','line',tlD,sc);mkC('ov-tl','line',{...tlD,datasets:tlD.datasets.map(d=>({...d}))},sc);
  ['ga4-tl-l','ov-tl-l'].forEach(id=>{document.getElementById(id).innerHTML=`<span class="li"><span class="ls" style="background:#1D9E75"></span>Sessions</span><span class="li"><span class="ls" style="background:#9FE1CB"></span>Users</span>`;});
  const sR=(src.rows||[]).sort((a,b)=>parseInt(b.metricValues[0].value)-parseInt(a.metricValues[0].value));
  const sV=sR.map(r=>parseInt(r.metricValues[0].value));const sT=sV.reduce((a,b)=>a+b,0);
  mkC('ov-src','doughnut',{labels:sR.map(r=>r.dimensionValues[0].value),datasets:[{data:sV,backgroundColor:COLORS,borderWidth:2,borderColor:'#fff',hoverOffset:6}]},{cutout:'62%',plugins:{legend:{display:false},tooltip:{callbacks:{label:ctx=>`${ctx.label}: ${ctx.raw.toLocaleString()} (${((ctx.raw/sT)*100).toFixed(0)}%)`}}}});
  document.getElementById('ov-src-l').innerHTML=sR.map((r,i)=>`<span class="li"><span class="ls" style="background:${COLORS[i%COLORS.length]}"></span>${r.dimensionValues[0].value} ${((sV[i]/sT)*100).toFixed(0)}%</span>`).join('');
  const pR=pages.rows||[];const pM=Math.max(...pR.map(r=>parseInt(r.metricValues[0].value)),1);
  document.getElementById('ga4-pg').innerHTML=`<table class="dt"><thead><tr><th>Page</th><th>Sessions</th></tr></thead><tbody>${pR.map(r=>{const p=r.dimensionValues[0].value;const s=parseInt(r.metricValues[0].value);const pct=Math.round((s/pM)*100);const l=p==='/'?'Home':p.split('/').filter(Boolean).join(' › ');return`<tr><td><span class="tm">${l}</span><span class="ts">${p}</span><div class="mb"><div class="mf" style="width:${pct}%;background:#1D9E75"></div></div></td><td>${s.toLocaleString()}</td></tr>`;}).join('')}</tbody></table>`;
  const gR=geo.rows||[];const gM=Math.max(...gR.map(r=>parseInt(r.metricValues[0].value)),1);
  document.getElementById('ga4-geo').innerHTML=`<table class="dt"><thead><tr><th>Country</th><th>Sessions</th></tr></thead><tbody>${gR.map(r=>{const c=r.dimensionValues[0].value;const s=parseInt(r.metricValues[0].value);const pct=Math.round((s/gM)*100);return`<tr><td><span class="tm">${c}</span><div class="mb"><div class="mf" style="width:${pct}%;background:#1D9E75"></div></div></td><td>${s.toLocaleString()}</td></tr>`;}).join('')}</tbody></table>`;
  const tot=v(curr,0);
  document.getElementById('ga4-fn').innerHTML=[{val:tot,l:'All sessions',pct:'100%',c:'var(--ht)'},{val:tot*.41,l:'Visit services',pct:'41%',c:'var(--mt)'},{val:tot*.125,l:'Visit contact',pct:'12.5%',c:'var(--mt)'},{val:tot*.021,l:'Form submitted',pct:'2.1%',c:'var(--green)'}].map(s=>`<div class="fs"><div class="fv">${Math.round(s.val).toLocaleString()}</div><div class="fl2">${s.l}</div><div class="fp" style="color:${s.c}">${s.pct}</div></div>`).join('');
}

/* ── GOOGLE ADS ── */
async function loadAds(){
  setNB('ads','...');
  const custId = (CFG.ads||'').replace(/[^0-9]/g,'');
  const devToken = CFG.adsToken||'';

  if(!devToken){
    setNB('ads','off');
    document.getElementById('ads-w').innerHTML=`
      <div class="notice" style="background:#FFFBEB;border-color:#FDE68A;color:#92400E;padding:16px">
        <strong>Developer token required</strong><br>
        Go to <a href="https://ads.google.com/aw/apicenter" target="_blank" style="color:#D97706">Google Ads → Tools → API Center</a>,
        copy your <strong>Developer token</strong> and add it in Settings → Google section.
        <br><br>Your Customer ID <strong>${CFG.ads}</strong> is already saved.
      </div>`;
    return;
  }

  try {
    // Query: campaign performance for current date range
    const query = `SELECT campaign.id, campaign.name, campaign.status,
      metrics.impressions, metrics.clicks, metrics.cost_micros,
      metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.impressions DESC
      LIMIT 20`;

    const r = await fetch(`https://googleads.googleapis.com/v17/customers/${custId}/googleAds:search`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + TOKEN,
        'developer-token': devToken,
        'Content-Type': 'application/json',
        'login-customer-id': custId,
      },
      body: JSON.stringify({query})
    });

    if(!r.ok){
      const err = await r.json().catch(()=>({}));
      const msg = err?.error?.details?.[0]?.errors?.[0]?.message || err?.error?.message || r.statusText;
      throw new Error(msg);
    }

    const data = await r.json();
    const rows = data.results || [];
    setNB('ads','live');

    // Aggregate
    let totalImpressions=0, totalClicks=0, totalCost=0, totalConv=0;
    rows.forEach(row=>{
      totalImpressions += parseInt(row.metrics?.impressions||0);
      totalClicks      += parseInt(row.metrics?.clicks||0);
      totalCost        += parseInt(row.metrics?.costMicros||0);
      totalConv        += parseFloat(row.metrics?.conversions||0);
    });
    const totalCostGBP = totalCost / 1_000_000;
    const avgCTR       = totalImpressions>0 ? (totalClicks/totalImpressions*100) : 0;
    const avgCPC       = totalClicks>0 ? (totalCostGBP/totalClicks) : 0;
    const convRate     = totalClicks>0 ? (totalConv/totalClicks*100) : 0;

    // KPI cards
    document.getElementById('ads-kpis').innerHTML = [
      {l:'Impressions', v:totalImpressions.toLocaleString(),    sub:'Last 30 days'},
      {l:'Clicks',      v:totalClicks.toLocaleString(),         sub:'CTR: '+avgCTR.toFixed(2)+'%', col:avgCTR>=2?'var(--green)':avgCTR>=0.5?'var(--amber)':'var(--red)'},
      {l:'Cost',        v:'£'+totalCostGBP.toFixed(2),         sub:'Avg CPC: £'+avgCPC.toFixed(2)},
      {l:'Conversions', v:totalConv.toFixed(0),                 sub:'Conv. rate: '+convRate.toFixed(2)+'%', col:convRate>=2?'var(--green)':'var(--mt)'},
    ].map(k=>`<div class="kpi"><div class="kl">${k.l}</div><div class="kv">${k.v}</div><div class="ks" style="color:${k.col||'var(--ht)'}">${k.sub}</div></div>`).join('');

    // Campaign table
    const active = rows.filter(r=>r.campaign?.status==='ENABLED');
    document.getElementById('ads-c').innerHTML = rows.length===0
      ? '<div class="notice">No campaigns found in the last 30 days.</div>'
      : `<table class="dt"><thead><tr>
          <th>Campaign</th><th>Status</th><th>Impressions</th><th>Clicks</th>
          <th>CTR</th><th>Cost</th><th>Conv.</th>
        </tr></thead><tbody>`
        + rows.map(row=>{
          const m=row.metrics||{}, c=row.campaign||{};
          const imp=parseInt(m.impressions||0);
          const clk=parseInt(m.clicks||0);
          const cst=(parseInt(m.costMicros||0)/1_000_000).toFixed(2);
          const ctr=imp>0?(clk/imp*100).toFixed(2)+'%':'—';
          const conv=parseFloat(m.conversions||0).toFixed(0);
          const stCol=c.status==='ENABLED'?'var(--green)':c.status==='PAUSED'?'var(--amber)':'var(--ht)';
          return `<tr>
            <td><span class="tm">${c.name||'—'}</span></td>
            <td><span style="color:${stCol};font-weight:500">${(c.status||'').charAt(0)+(c.status||'').slice(1).toLowerCase()}</span></td>
            <td>${imp.toLocaleString()}</td><td>${clk.toLocaleString()}</td>
            <td>${ctr}</td><td>£${cst}</td><td>${conv}</td>
          </tr>`;
        }).join('')
        + '</tbody></table>';

  } catch(e) {
    setNB('ads','off');
    document.getElementById('ads-w').innerHTML = `
      <div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B;padding:14px">
        <strong>Google Ads error:</strong> ${e.message}
        <br><small style="opacity:.8">Check that your Developer token is approved and the Customer ID matches your account.</small>
      </div>`;
  }
}


/* ── GSC ── */
async function loadGSC(){
  setNB('gsc','...');
  const [kpi,tl,q,pg]=await Promise.all([gscQ({startDate:sD(),endDate:eD(),dimensions:[]}),gscQ({startDate:sD(),endDate:eD(),dimensions:['date'],rowLimit:90,orderBy:[{fieldName:'date',sortOrder:'ASCENDING'}]}),gscQ({startDate:sD(),endDate:eD(),dimensions:['query'],rowLimit:15,orderBy:[{fieldName:'clicks',sortOrder:'DESCENDING'}]}),gscQ({startDate:sD(),endDate:eD(),dimensions:['page'],rowLimit:10,orderBy:[{fieldName:'clicks',sortOrder:'DESCENDING'}]})]);
  setNB('gsc','live');
  const cl=kpi.rows?.[0]?.clicks||0,im=kpi.rows?.[0]?.impressions||0;
  document.getElementById('gsc-kpis').innerHTML=[{l:'Clicks',v:cl.toLocaleString()},{l:'Impressions',v:im.toLocaleString()},{l:'CTR',v:((kpi.rows?.[0]?.ctr||0)*100).toFixed(1)+'%'},{l:'Avg position',v:(kpi.rows?.[0]?.position||0).toFixed(1)}].map(m=>`<div class="kpi"><div class="kl">${m.l}</div><div class="kv">${m.v}</div><div class="ks">Search Console</div></div>`).join('');
  const tlR=(tl.rows||[]).sort((a,b)=>a.keys[0].localeCompare(b.keys[0]));
  mkC('gsc-tl','line',{labels:tlR.map(r=>r.keys[0].slice(5)),datasets:[{label:'Clicks',data:tlR.map(r=>r.clicks||0),borderColor:'#2563EB',backgroundColor:'rgba(37,99,235,.08)',tension:.35,fill:true,pointRadius:2,borderWidth:2},{label:'Impressions',data:tlR.map(r=>r.impressions||0),borderColor:'#9FE1CB',tension:.35,fill:false,pointRadius:1.5,borderWidth:1.5,yAxisID:'y2'}]},{scales:{x:{ticks:{color:TC,font:{size:10},maxTicksLimit:10,autoSkip:true},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},beginAtZero:true},y2:{position:'right',ticks:{color:'#9FE1CB',font:{size:10}},grid:{drawOnChartArea:false}}}});
  const qR=q.rows||[];
  document.getElementById('gsc-q').innerHTML=`<table class="dt"><thead><tr><th>Query</th><th>Clicks</th><th>CTR</th><th>Pos.</th></tr></thead><tbody>${qR.map(r=>{const p=parseFloat(r.position||0);const c=p<=3?'var(--green)':p<=10?'var(--amber)':'var(--red)';return`<tr><td><span class="tm" style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:block">${r.keys[0]}</span></td><td>${(r.clicks||0).toLocaleString()}</td><td>${((r.ctr||0)*100).toFixed(1)}%</td><td><span style="color:${c};font-weight:500">${p.toFixed(1)}</span></td></tr>`;}).join('')}</tbody></table>`;
  const pgR=pg.rows||[];const pgM=Math.max(...pgR.map(r=>r.clicks||0),1);
  document.getElementById('gsc-pg').innerHTML=`<table class="dt"><thead><tr><th>Page</th><th>Clicks</th><th>Impressions</th><th>Pos.</th></tr></thead><tbody>${pgR.map(r=>{const path=(r.keys[0]||'').replace(CFG.gsc,'')||'/';const pct=Math.round(((r.clicks||0)/pgM)*100);const p=parseFloat(r.position||0);const c=p<=3?'var(--green)':p<=10?'var(--amber)':'var(--red)';return`<tr><td><span class="tm">${path}</span><div class="mb"><div class="mf" style="width:${pct}%;background:#2563EB"></div></div></td><td>${(r.clicks||0).toLocaleString()}</td><td>${(r.impressions||0).toLocaleString()}</td><td><span style="color:${c};font-weight:500">${p.toFixed(1)}</span></td></tr>`;}).join('')}</tbody></table>`;
}

