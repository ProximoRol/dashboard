/* ═══════════════════════════════════════════════════════════════
   BUDGET V2 — Presupuesto configurable desde cero
   Carga DESPUÉS de budget.js. Sobreescribe renderBudgetPage.
   ═══════════════════════════════════════════════════════════════ */

/* Guardar referencia a la función original ANTES de sobreescribir.
   IMPORTANTE: usar variable asignada (no function declaration) para evitar
   que el hoisting de JS haga que _bgtOrigRender se apunte a sí misma. */
const _bgtOrigRender = (typeof renderBudgetPage === 'function') ? renderBudgetPage : null;

const BGT2_KEY    = 'pr_budget_v2';
const BGT2_ACT    = 'eco_actual_v2';
const BGT2_MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const BGT2_COLORS = ['#DC2626','#7C3AED','#2563EB','#059669','#D97706','#0891B2','#BE185D','#65A30D'];

/* ── Persistencia ── */
function bgt2Load(){ try{return JSON.parse(localStorage.getItem(BGT2_KEY)||'null');}catch(_){return null;} }
function bgt2Save(cfg){ localStorage.setItem(BGT2_KEY,JSON.stringify(cfg)); bgt2SyncGlobal(cfg); }
function bgt2LoadActuals(){ try{return JSON.parse(localStorage.getItem(BGT2_ACT)||'{}');}catch(_){return{};} }
function bgt2SaveActuals(o){ localStorage.setItem(BGT2_ACT,JSON.stringify(o)); }

/* ── Sync BGT_DATA global (que usa todo budget.js) ── */
function bgt2SyncGlobal(cfg){
  if(!cfg||!window.BGT_DATA) return;
  const catColors={};
  cfg.categories.forEach(c=>{catColors[c.name]=c.color;});
  const rows=cfg.lines.map(l=>{
    const cat=cfg.categories.find(c=>c.id===l.catId);
    return{cat:cat?cat.name:'Otros',name:l.name,vals:[...(l.vals||Array(12).fill(0))]};
  });
  const monthlyTotals=Array(12).fill(0);
  rows.forEach(r=>r.vals.forEach((v,i)=>{monthlyTotals[i]+=(v||0);}));
  BGT_DATA.rows=rows;
  BGT_DATA.monthlyTotals=monthlyTotals;
  BGT_DATA.annualTotal=monthlyTotals.reduce((a,b)=>a+b,0);
  BGT_DATA.catColors=catColors;
  BGT_DATA.months=BGT2_MONTHS;
}

/* ══ NUEVA renderBudgetPage — asignada a variable (no function declaration)
   para que el hoisting no la ponga por encima de la captura del original ══ */
renderBudgetPage = function(){
  const cfg=bgt2Load();
  if(!cfg){ bgt2ShowSetup(); return; }

  /* 1. Sincronizar BGT_DATA */
  bgt2SyncGlobal(cfg);

  /* 2. Ocultar wizard */
  const sw=document.getElementById('bgt2-setup');
  if(sw) sw.style.display='none';

  /* 3. Mostrar divs de contenido */
  ['budget-insights-wrap','budget-bar-chart','budget-ytd-bars','budget-detail-table']
    .forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='';});

  /* 4. Toolbar */
  bgt2EnsureToolbar(cfg);

  /* 5. Llamar render original (budget.js) dentro de doble rAF */
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    try{
      if(typeof _bgtOrigRender==='function') _bgtOrigRender();
    }catch(err){ console.error('[Budget] render error:', err); }
  }));

  /* 6. Patch upload buttons */
  setTimeout(()=>bgt2PatchUpload(cfg),100);
};

/* ── Toolbar ── */
function bgt2EnsureToolbar(cfg){
  const page=document.getElementById('page-budget'); if(!page) return;
  let tb=document.getElementById('bgt2-tb');
  if(!tb){
    tb=document.createElement('div'); tb.id='bgt2-tb';
    const sh=page.querySelector('.sh');
    if(sh) sh.insertAdjacentElement('afterend',tb);
    else page.insertBefore(tb,page.firstChild);
  }
  const annual=(cfg.lines||[]).reduce((s,l)=>s+(l.vals||[]).reduce((a,b)=>a+(b||0),0),0);
  tb.style.cssText='display:flex;gap:8px;align-items:center;margin-bottom:14px;padding:10px 14px;background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);flex-wrap:wrap';
  tb.innerHTML=`
    <span style="font-size:12px;font-weight:500;color:var(--tx)">${cfg.categories.length} categorías · ${cfg.lines.length} líneas</span>
    <span style="font-size:12px;color:var(--mt)">Anual: <strong>${(cfg.currency||'£')}${Math.round(annual).toLocaleString()}</strong></span>
    <div style="margin-left:auto;display:flex;gap:6px;flex-wrap:wrap">
      <button onclick="bgt2ShowActualsModal()" class="btn-s" style="background:var(--blue)">✏️ Gastos reales</button>
      <button onclick="bgt2StartEdit()" style="padding:7px 13px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">⚙️ Editar presupuesto</button>
      <button onclick="if(confirm('¿Resetear todo el presupuesto y los gastos reales?')){localStorage.removeItem('${BGT2_KEY}');localStorage.removeItem('${BGT2_ACT}');location.reload()}" style="padding:7px 10px;border:1px solid #FECACA;border-radius:var(--r);font-size:11px;cursor:pointer;background:none;color:var(--red);font-family:inherit">Resetear</button>
    </div>`;
}

/* ── Patch upload card ── */
function bgt2PatchUpload(cfg){
  document.querySelectorAll('input[type="file"][onchange*="budgetUploadActual"]').forEach(inp=>{
    inp.onchange=e=>bgt2ImportActualsFile(e.target,new Date().getMonth(),cfg,()=>{
      requestAnimationFrame(()=>requestAnimationFrame(()=>renderBudgetPage()));
    });
  });
  window.downloadExpenseTemplate=()=>bgt2DownloadActualsTemplate(cfg);
}
function bgt2DownloadActualsTemplate(cfg){
  let csv='Categoría,Línea,Importe,Mes\n';
  cfg.categories.forEach(cat=>{
    cfg.lines.filter(l=>l.catId===cat.id).forEach(l=>{
      csv+=`"${cat.name}","${l.name}",0,"Ene"\n`;
    });
  });
  csv+='\nMESES VÁLIDOS:\n'+BGT2_MONTHS.join(',')+'\n';
  const b=new Blob([csv],{type:'text/csv'});
  const u=URL.createObjectURL(b);
  const a=document.createElement('a');
  a.href=u;a.download='gastos_plantilla.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
}

/* ══════════════════════════════
   WIZARD DE SETUP
══════════════════════════════ */
let BGT2_WZ={step:1,categories:[],lines:[]};

function bgt2InjectCSS(){
  if(document.getElementById('bgt2-css')) return;
  const s=document.createElement('style');s.id='bgt2-css';
  s.textContent=`
    .bgt2-pill{padding:5px 13px;border-radius:20px;font-size:11px;font-weight:500;white-space:nowrap;background:var(--sf2);color:var(--ht)}
    .bgt2-pill.on{background:var(--gp);color:var(--green)}
    .bgt2-pill.done{background:var(--gp);color:var(--green);opacity:.6}
    .bgt2-cr,.bgt2-lr{display:flex;gap:8px;align-items:center;padding:8px 10px;background:var(--sf2);border:1px solid var(--bd);border-radius:var(--r);margin-bottom:6px}
    .bgt2-lr{border-radius:0;border:none;border-bottom:1px solid var(--bd);background:transparent}
    .bgt2-mi{width:68px;padding:4px 6px;border:1px solid var(--bd2);border-radius:6px;font-size:12px;text-align:right;background:var(--sf);color:var(--tx);outline:none;font-family:inherit}
    .bgt2-mi:focus{border-color:var(--green)}
    .bgt2-ai{padding:3px 6px;border:1px solid transparent;border-radius:5px;font-size:12px;text-align:right;background:transparent;color:var(--tx);outline:none;font-family:inherit;width:88px}
    .bgt2-ai:hover,.bgt2-ai:focus{border-color:var(--bd2);background:var(--sf2)}`;
  document.head.appendChild(s);
}

function bgt2ShowSetup(){
  const page=document.getElementById('page-budget'); if(!page) return;
  ['budget-insights-wrap','budget-bar-chart','budget-ytd-bars','budget-detail-table']
    .forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  document.getElementById('bgt2-tb')?.remove();
  let sw=document.getElementById('bgt2-setup');
  if(!sw){
    sw=document.createElement('div');sw.id='bgt2-setup';
    const sh=page.querySelector('.sh');
    if(sh) sh.insertAdjacentElement('afterend',sw);
    else page.appendChild(sw);
  }
  sw.style.display='block';
  bgt2InjectCSS();
  BGT2_WZ={step:1,categories:[],lines:[]};
  bgt2DrawWizard(1);
}

function bgt2DrawWizard(step){
  BGT2_WZ.step=step;
  const el=document.getElementById('bgt2-setup'); if(!el) return;
  const pills=['Categorías','Líneas','Importes'].map((l,i)=>
    `<div class="bgt2-pill ${i+1===step?'on':i+1<step?'done':''}">${i+1}. ${l}</div>`
  ).join('<div style="height:2px;flex:1;background:var(--bd2);border-radius:1px;margin:auto;min-width:16px"></div>');

  el.innerHTML=`
    <div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:22px;max-width:720px">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;flex-wrap:wrap">${pills}</div>
      <div id="bgt2-wbody"></div>
    </div>`;

  if(step===1) document.getElementById('bgt2-wbody').innerHTML=bgt2S1();
  if(step===2) document.getElementById('bgt2-wbody').innerHTML=bgt2S2();
  if(step===3) document.getElementById('bgt2-wbody').innerHTML=bgt2S3();
}

/* Paso 1: Categorías */
function bgt2S1(){
  const r=BGT2_WZ.categories.map((c,i)=>`
    <div class="bgt2-cr">
      <input type="color" value="${c.color}" oninput="BGT2_WZ.categories[${i}].color=this.value"
        style="width:30px;height:30px;padding:0;border:none;border-radius:6px;cursor:pointer"/>
      <input class="fi" value="${c.name}" placeholder="Nombre de la categoría"
        oninput="BGT2_WZ.categories[${i}].name=this.value" style="flex:1;font-size:13px"/>
      <button onclick="BGT2_WZ.categories.splice(${i},1);bgt2DrawWizard(1)"
        style="background:none;border:none;color:var(--red);cursor:pointer;font-size:16px;padding:2px 6px">×</button>
    </div>`).join('');

  /* Botón de importar solo si hay datos existentes y el wizard está vacío */
  const canImport = typeof BGT_DATA !== 'undefined' && BGT_DATA.rows && BGT_DATA.rows.length > 0 && BGT2_WZ.categories.length === 0;

  return`
    <div style="font-size:13px;font-weight:600;margin-bottom:4px">Define las categorías de gasto</div>
    <div style="font-size:12px;color:var(--mt);margin-bottom:14px">Agrupa tus gastos: Marketing, Herramientas, Diseño, etc.</div>
    ${canImport ? `
    <div style="background:var(--bp);border:1px solid #BFDBFE;border-radius:var(--r);padding:12px 14px;margin-bottom:14px;display:flex;gap:10px;align-items:center">
      <div style="flex:1">
        <div style="font-size:12px;font-weight:600;color:var(--blue);margin-bottom:2px">💡 Tienes un presupuesto existente</div>
        <div style="font-size:11px;color:var(--blue)">Puedes importarlo y editarlo aquí en lugar de empezar desde cero.</div>
      </div>
      <button onclick="bgt2ImportFromBGTData()" style="padding:7px 14px;background:var(--blue);color:white;border:none;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;font-family:inherit;white-space:nowrap">
        Importar existente →
      </button>
    </div>` : ''}
    ${r}
    <button onclick="BGT2_WZ.categories.push({id:'c'+Date.now(),name:'',color:'${BGT2_COLORS[BGT2_WZ.categories.length%8]}'});bgt2DrawWizard(1)"
      style="width:100%;padding:8px;border:1.5px dashed var(--bd2);border-radius:var(--r);background:none;color:var(--mt);cursor:pointer;font-size:12px;margin-top:4px;font-family:inherit">
      + Añadir categoría
    </button>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:18px;padding-top:14px;border-top:1px solid var(--bd)">
      <button onclick="bgt2UseTemplate()" style="padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">
        Usar plantilla Próximo Rol
      </button>
      <button onclick="bgt2N1()" class="btn-s" style="padding:8px 18px">Siguiente → Líneas</button>
    </div>`;
}
function bgt2N1(){
  const v=BGT2_WZ.categories.filter(c=>c.name.trim());
  if(!v.length){alert('Añade al menos una categoría.');return;}
  BGT2_WZ.categories=v.map(c=>({...c,name:c.name.trim()}));
  bgt2DrawWizard(2);
}

/* Paso 2: Líneas */
function bgt2S2(){
  let h=`<div style="font-size:13px;font-weight:600;margin-bottom:4px">Añade las líneas de gasto</div>
    <div style="font-size:12px;color:var(--mt);margin-bottom:14px">Cada línea es un proveedor o concepto dentro de la categoría.</div>`;
  BGT2_WZ.categories.forEach(cat=>{
    const lines=BGT2_WZ.lines.filter(l=>l.catId===cat.id);
    h+=`<div style="margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:7px;margin-bottom:7px">
        <span style="width:9px;height:9px;border-radius:50%;background:${cat.color};display:inline-block;flex-shrink:0"></span>
        <span style="font-size:12px;font-weight:600;color:${cat.color}">${cat.name}</span>
      </div>
      <div style="border:1px solid var(--bd);border-radius:var(--r);overflow:hidden">
        ${lines.map(l=>{const gi=BGT2_WZ.lines.indexOf(l);return`
          <div class="bgt2-lr">
            <input class="fi" value="${l.name}" placeholder="Nombre (ej: Google Ads)"
              oninput="BGT2_WZ.lines[${gi}].name=this.value" style="flex:1;font-size:12px"/>
            <button onclick="BGT2_WZ.lines.splice(${gi},1);bgt2DrawWizard(2)"
              style="background:none;border:none;color:var(--ht);cursor:pointer;font-size:14px;padding:2px 6px">×</button>
          </div>`}).join('')}
        <div style="padding:6px 10px">
          <button onclick="BGT2_WZ.lines.push({id:'l'+Date.now(),catId:'${cat.id}',name:'',vals:Array(12).fill(0)});bgt2DrawWizard(2)"
            style="font-size:11px;color:var(--mt);background:none;border:none;cursor:pointer;font-family:inherit">
            + Añadir línea
          </button>
        </div>
      </div>
    </div>`;
  });
  h+=`<div style="display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid var(--bd)">
    <button onclick="bgt2DrawWizard(1)" style="padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:none;font-family:inherit">← Atrás</button>
    <button onclick="bgt2N2()" class="btn-s" style="padding:8px 18px">Siguiente → Importes</button>
  </div>`;
  return h;
}
function bgt2N2(){
  const v=BGT2_WZ.lines.filter(l=>l.name.trim());
  if(!v.length){alert('Añade al menos una línea.');return;}
  BGT2_WZ.lines=v.map(l=>({...l,name:l.name.trim(),vals:l.vals||Array(12).fill(0)}));
  bgt2DrawWizard(3);
}

/* Paso 3: Importes */
function bgt2S3(){
  const lines=BGT2_WZ.lines.filter(l=>l.name.trim());
  let trows='';
  BGT2_WZ.categories.forEach(cat=>{
    const cl=lines.filter(l=>l.catId===cat.id); if(!cl.length) return;
    trows+=`<tr><td colspan="${BGT2_MONTHS.length+2}" style="padding:7px 10px;font-size:11px;font-weight:600;color:${cat.color};background:${cat.color}12">${cat.name}</td></tr>`;
    cl.forEach(l=>{
      const gi=BGT2_WZ.lines.indexOf(l);
      const tot=(l.vals||Array(12).fill(0)).reduce((a,b)=>a+(b||0),0);
      trows+=`<tr style="border-bottom:1px solid var(--bd)">
        <td style="padding:6px 10px;font-size:12px;min-width:160px">${l.name}</td>
        ${BGT2_MONTHS.map((_,mi)=>`
          <td style="padding:4px 2px;text-align:right;min-width:58px">
            <input type="number" min="0" step="1" value="${l.vals?.[mi]||''}" placeholder="0" class="bgt2-mi"
              oninput="BGT2_WZ.lines[${gi}].vals[${mi}]=parseFloat(this.value)||0;
                       this.closest('tr').querySelector('.bgt2-rt').textContent='£'+BGT2_WZ.lines[${gi}].vals.reduce((a,b)=>a+(b||0),0).toLocaleString()"/>
          </td>`).join('')}
        <td style="padding:6px 10px;text-align:right;font-weight:600;color:${cat.color};min-width:60px" class="bgt2-rt">£${tot.toLocaleString()}</td>
      </tr>`;
    });
  });

  return`
    <div style="font-size:13px;font-weight:600;margin-bottom:4px">Introduce los importes mensuales</div>
    <div style="font-size:12px;color:var(--mt);margin-bottom:12px">Puedes dejar en 0 y completar después, o importar desde Excel.</div>
    <div style="display:flex;gap:8px;margin-bottom:12px;padding:10px 12px;background:var(--sf2);border-radius:var(--r);flex-wrap:wrap;align-items:center">
      <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 13px;background:var(--green);color:white;border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer">
        📥 Importar desde Excel
        <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="bgt2ImportSetupFile(this)"/>
      </label>
      <button onclick="bgt2DlTemplate()" style="padding:6px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:none;color:var(--mt);font-family:inherit">Descargar plantilla CSV</button>
    </div>
    <div style="overflow-x:auto;margin-bottom:14px">
      <table style="border-collapse:collapse;font-size:11px;min-width:750px;width:100%">
        <thead><tr style="background:var(--sf2)">
          <th style="padding:8px 10px;text-align:left;color:var(--mt)">Línea</th>
          ${BGT2_MONTHS.map(m=>`<th style="padding:8px 4px;text-align:right;color:var(--ht)">${m}</th>`).join('')}
          <th style="padding:8px 10px;text-align:right;color:var(--mt)">Total</th>
        </tr></thead>
        <tbody>${trows}</tbody>
      </table>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:14px;padding-top:14px;border-top:1px solid var(--bd)">
      <button onclick="bgt2DrawWizard(2)" style="padding:7px 14px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;cursor:pointer;background:none;font-family:inherit">← Atrás</button>
      <button onclick="bgt2FinishWizard()" class="btn-s" style="padding:9px 22px;font-size:13px">✓ Guardar presupuesto</button>
    </div>`;
}

function bgt2DlTemplate(){
  const l=BGT2_WZ.lines.filter(l=>l.name.trim());
  let csv='Categoría,Línea,'+BGT2_MONTHS.join(',')+'\n';
  BGT2_WZ.categories.forEach(cat=>{
    l.filter(ln=>ln.catId===cat.id).forEach(ln=>{
      csv+=`"${cat.name}","${ln.name}",${(ln.vals||Array(12).fill(0)).join(',')}\n`;
    });
  });
  const b=new Blob([csv],{type:'text/csv'});
  const u=URL.createObjectURL(b);
  const a=document.createElement('a');a.href=u;a.download='presupuesto_plantilla.csv';
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(u);
}

function bgt2ImportSetupFile(input){
  const file=input.files[0];if(!file)return;
  const rd=new FileReader();
  rd.onload=e=>{
    try{
      let rows;
      if(file.name.endsWith('.csv')){
        rows=new TextDecoder().decode(e.target.result).split('\n').filter(r=>r.trim()).map(r=>{
          const res=[];let cur='',inQ=false;
          for(const ch of r.replace('\r','')){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){res.push(cur.trim());cur='';}else cur+=ch;}
          res.push(cur.trim());return res;
        });
      }else{const wb=XLSX.read(e.target.result,{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});}
      const isH=rows[0]&&(String(rows[0][0]).toLowerCase().includes('categ')||String(rows[0][0]).toLowerCase().includes('categ'));
      const data=isH?rows.slice(1):rows;
      let n=0;
      data.forEach(r=>{
        if(!r[0]||!r[1])return;
        const cn=String(r[0]).trim(),ln=String(r[1]).trim();
        const vals=Array.from({length:12},(_,i)=>parseFloat(r[i+2])||0);
        let cat=BGT2_WZ.categories.find(c=>c.name.toLowerCase()===cn.toLowerCase());
        if(!cat){cat={id:'c'+Date.now()+n,name:cn,color:BGT2_COLORS[BGT2_WZ.categories.length%8]};BGT2_WZ.categories.push(cat);}
        let line=BGT2_WZ.lines.find(l=>l.catId===cat.id&&l.name.toLowerCase()===ln.toLowerCase());
        if(!line){line={id:'l'+Date.now()+n,catId:cat.id,name:ln,vals:Array(12).fill(0)};BGT2_WZ.lines.push(line);}
        line.vals=vals;n++;
      });
      alert(`✓ ${n} líneas importadas.`);bgt2DrawWizard(3);
    }catch(err){alert('Error: '+err.message);}
  };
  rd.readAsArrayBuffer(file);
}

function bgt2FinishWizard(){
  const cfg={version:2,currency:'£',year:new Date().getFullYear(),
    categories:BGT2_WZ.categories,lines:BGT2_WZ.lines.filter(l=>l.name.trim())};
  bgt2Save(cfg);
  ['budget-insights-wrap','budget-bar-chart','budget-ytd-bars','budget-detail-table']
    .forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='';});
  const s=document.getElementById('bgt2-setup');if(s)s.style.display='none';
  renderBudgetPage();
}

function bgt2ImportFromBGTData(){
  if(typeof BGT_DATA==='undefined'||!BGT_DATA.rows||!BGT_DATA.catColors) return;
  const cats=Object.entries(BGT_DATA.catColors).map(([name,color],i)=>({
    id:'c_imp_'+i, name, color
  }));
  const lines=BGT_DATA.rows.map((row,i)=>{
    const cat=cats.find(c=>c.name===row.cat);
    return{id:'l_imp_'+i, catId:cat?cat.id:cats[0]?.id, name:row.name, vals:[...(row.vals||Array(12).fill(0))]};
  });
  BGT2_WZ={step:1, categories:cats, lines};
  bgt2DrawWizard(1);
}

function bgt2UseTemplate(){
  BGT2_WZ.categories=[
    {id:'c1',name:'Marketing Digital',color:'#DC2626'},
    {id:'c2',name:'Herramientas & Software',color:'#7C3AED'},
    {id:'c3',name:'Diseño & Contenido',color:'#2563EB'},
    {id:'c4',name:'Outreach & Ventas',color:'#059669'},
    {id:'c5',name:'Otros',color:'#D97706'},
  ];
  BGT2_WZ.lines=[
    {id:'l1',catId:'c1',name:'Google Ads',vals:Array(12).fill(0)},
    {id:'l2',catId:'c1',name:'LinkedIn Ads',vals:Array(12).fill(0)},
    {id:'l3',catId:'c1',name:'Meta / Instagram Ads',vals:Array(12).fill(0)},
    {id:'l4',catId:'c1',name:'Email marketing (Instantly)',vals:Array(12).fill(0)},
    {id:'l5',catId:'c2',name:'Claude / IA',vals:Array(12).fill(20)},
    {id:'l6',catId:'c2',name:'Canva Pro',vals:Array(12).fill(13)},
    {id:'l7',catId:'c2',name:'CRM (Monday.com)',vals:Array(12).fill(0)},
    {id:'l8',catId:'c3',name:'Diseñador freelance',vals:Array(12).fill(0)},
    {id:'l9',catId:'c3',name:'Fotos & Vídeo',vals:Array(12).fill(0)},
    {id:'l10',catId:'c4',name:'LinkedIn Premium',vals:Array(12).fill(40)},
    {id:'l11',catId:'c4',name:'Hunter.io',vals:Array(12).fill(0)},
    {id:'l12',catId:'c5',name:'Otros',vals:Array(12).fill(0)},
  ];
  bgt2DrawWizard(1);
}

function bgt2StartEdit(){
  const cfg=bgt2Load();if(!cfg)return;

  /* Cargar datos existentes en el wizard ANTES de abrir la UI */
  BGT2_WZ={step:1,
    categories:cfg.categories.map(c=>({...c})),
    lines:cfg.lines.map(l=>({...l,vals:[...l.vals]}))
  };

  /* Setup UI — igual que bgt2ShowSetup() pero SIN resetear BGT2_WZ */
  const page=document.getElementById('page-budget');if(!page)return;
  ['budget-insights-wrap','budget-bar-chart','budget-ytd-bars','budget-detail-table']
    .forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='none';});
  document.getElementById('bgt2-tb')?.remove();
  let sw=document.getElementById('bgt2-setup');
  if(!sw){
    sw=document.createElement('div');sw.id='bgt2-setup';
    const sh=page.querySelector('.sh');
    if(sh) sh.insertAdjacentElement('afterend',sw);
    else page.appendChild(sw);
  }
  sw.style.display='block';
  bgt2InjectCSS();
  bgt2DrawWizard(1);

  /* Override finish para guardar los cambios de vuelta */
  const orig=bgt2FinishWizard;
  window.bgt2FinishWizard=()=>{
    const updated={...cfg,categories:BGT2_WZ.categories,lines:BGT2_WZ.lines.filter(l=>l.name.trim())};
    bgt2Save(updated);
    ['budget-insights-wrap','budget-bar-chart','budget-ytd-bars','budget-detail-table']
      .forEach(id=>{const e=document.getElementById(id);if(e)e.style.display='';});
    const s=document.getElementById('bgt2-setup');if(s)s.style.display='none';
    window.bgt2FinishWizard=orig;
    renderBudgetPage();
  };
}

/* ══════════════════════════════
   MODAL GASTOS REALES
══════════════════════════════ */
function bgt2ShowActualsModal(){
  const cfg=bgt2Load();if(!cfg)return;
  /* selM expuesto en window para que los onclicks inline puedan actualizarlo */
  window._bgt2SelM = new Date().getMonth();
  const MMAP={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11,
    jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};

  document.getElementById('bgt2-modal')?.remove();
  const ov=document.createElement('div');
  ov.id='bgt2-modal';
  ov.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:9999;display:flex;align-items:center;justify-content:center;padding:16px';
  ov.onclick=e=>{if(e.target===ov)ov.remove();};

  function draw(){
    /* Sincronizar con el valor global que pueden modificar los onclicks */
    const selM = window._bgt2SelM;
    /* Exponer draw globalmente para que los onclicks puedan llamarla */
    window._bgt2Draw = draw;

    const actuals=bgt2LoadActuals();
    window._bgt2a=actuals;
    const rows=cfg.categories.map(cat=>{
      const lines=cfg.lines.filter(l=>l.catId===cat.id&&l.name.trim());
      if(!lines.length)return'';
      return`<tr><td colspan="3" style="padding:7px 12px;font-size:11px;font-weight:600;color:${cat.color};background:${cat.color}12">${cat.name}</td></tr>`+
      lines.map(l=>{
        const target=l.vals?.[selM]||0;
        const key=`${cat.name}|${l.name}|${selM}`;
        const actual=parseFloat(actuals[key]||0);
        const over=actual>target&&target>0;
        return`<tr style="border-bottom:1px solid var(--bd)">
          <td style="padding:7px 12px;font-size:12px">${l.name}</td>
          <td style="padding:7px 8px;text-align:right;font-size:11px;color:var(--ht)">${target?'£'+target.toLocaleString():'—'}</td>
          <td style="padding:5px 12px;text-align:right">
            <div style="display:flex;align-items:center;justify-content:flex-end;gap:4px">
              <input type="number" min="0" step="0.01" value="${actual||''}" placeholder="0"
                class="bgt2-ai" style="border:1px solid ${over?'var(--red)':'var(--bd2)'};border-radius:6px;background:var(--sf2)"
                onchange="(function(k,v){const a=window._bgt2a;const n=parseFloat(v)||0;if(n===0)delete a[k];else a[k]=n;window.localStorage.setItem('${BGT2_ACT}',JSON.stringify(a));})('${cat.name}|${l.name}|'+window._bgt2SelM,this.value)"
                onfocus="this.select()"/>
              ${actual>0?`<button onclick="(function(){const a=window._bgt2a;delete a['${cat.name}|${l.name}|'+window._bgt2SelM];window.localStorage.setItem('${BGT2_ACT}',JSON.stringify(a));window._bgt2Draw();})()" title="Borrar" style="background:none;border:none;color:var(--ht);cursor:pointer;font-size:14px;padding:2px 4px;line-height:1">×</button>`:'<span style="width:20px;display:inline-block"></span>'}
            </div>
          </td>
        </tr>`;
      }).join('');
    }).join('');

    ov.innerHTML=`
      <div style="background:var(--sf);border-radius:var(--rl);width:590px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.18)">
        <div style="display:flex;align-items:center;gap:8px;padding:13px 16px;border-bottom:1px solid var(--bd);flex-shrink:0;flex-wrap:wrap">
          <span style="font-size:14px;font-weight:600">Gastos reales</span>
          <div style="display:flex;gap:3px;flex-wrap:wrap">
            ${BGT2_MONTHS.map((m,i)=>`<span style="padding:3px 9px;border-radius:20px;font-size:11px;cursor:pointer;${i===selM?'background:var(--green);color:white':'background:var(--sf2);color:var(--mt)'}" onclick="window._bgt2SelM=${i};window._bgt2Draw()">${m}</span>`).join('')}
          </div>
          <button onclick="document.getElementById('bgt2-modal').remove()" style="background:none;border:none;cursor:pointer;color:var(--ht);font-size:18px;margin-left:auto;padding:4px">×</button>
        </div>
        <div style="overflow-y:auto;flex:1">
          <table style="width:100%;border-collapse:collapse">
            <thead><tr style="background:var(--sf2);font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:var(--ht);font-weight:600">
              <th style="padding:8px 12px;text-align:left">Línea</th>
              <th style="padding:8px 8px;text-align:right">Presupuestado</th>
              <th style="padding:8px 12px;text-align:right">Gasto real £</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        <div style="padding:12px 16px;border-top:1px solid var(--bd);display:flex;justify-content:space-between;align-items:center;flex-shrink:0;flex-wrap:wrap;gap:8px">
          <label style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:var(--gp);color:var(--green);border-radius:var(--r);font-size:12px;font-weight:500;cursor:pointer;border:1px solid var(--gp)">
            📥 Importar Excel
            <input type="file" accept=".xlsx,.xls,.csv" style="display:none" onchange="bgt2ImportActualsFile(this,window._bgt2SelM,cfg,window._bgt2Draw)"/>
          </label>
          <button onclick="document.getElementById('bgt2-modal').remove();requestAnimationFrame(()=>requestAnimationFrame(()=>renderBudgetPage()))" class="btn-s">✓ Cerrar y actualizar</button>
        </div>

        <!-- Gastos adicionales -->
        <div style="border-top:2px solid var(--bd2);padding:14px 16px;flex-shrink:0">
          <div style="font-size:11px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px">Gastos adicionales (no presupuestados)</div>
          <div id="bgt2-libre-list">
            ${(()=>{
              const libre=JSON.parse(localStorage.getItem('eco_libre_v1')||'[]')
                .filter(e=>e.month===selM);
              if(!libre.length) return '<div style="font-size:12px;color:var(--ht);padding:4px 0 8px">Sin entradas manuales este mes.</div>';
              return libre.map(e=>`
                <div style="display:flex;gap:8px;align-items:center;padding:5px 0;border-bottom:1px solid var(--bd)">
                  <span style="flex:1;font-size:12px;color:var(--tx)">${e.desc||'—'}</span>
                  <span style="font-size:12px;font-weight:500;color:var(--tx)">£${(e.amount||0).toLocaleString()}</span>
                  <button onclick="bgt2DeleteLibre('${e.id}',window._bgt2Draw)" style="background:none;border:none;color:var(--ht);cursor:pointer;font-size:15px;padding:2px 5px">×</button>
                </div>`).join('');
            })()}
          </div>
          <div style="display:flex;gap:6px;margin-top:8px;flex-wrap:wrap">
            <input id="bgt2-libre-desc" type="text" placeholder="Descripción (ej: Impuesto trimestral)"
              style="flex:1;min-width:140px;padding:6px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf2);color:var(--tx);font-family:inherit"/>
            <input id="bgt2-libre-amt" type="number" min="0" step="0.01" placeholder="£ importe"
              style="width:100px;padding:6px 10px;border:1px solid var(--bd2);border-radius:var(--r);font-size:12px;background:var(--sf2);color:var(--tx);font-family:inherit;text-align:right"/>
            <button onclick="bgt2AddLibre(window._bgt2SelM,window._bgt2Draw)" class="btn-s" style="white-space:nowrap">+ Añadir</button>
          </div>
        </div>
      </div>`;
  }
  draw();
  document.body.appendChild(ov);
}

/* ── Import actuals from file ── */
function bgt2ImportActualsFile(input,monthIdx,cfg,callback){
  const file=input.files[0];if(!file)return;
  const MMAP={ene:0,feb:1,mar:2,abr:3,may:4,jun:5,jul:6,ago:7,sep:8,oct:9,nov:10,dic:11,
    jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
  const rd=new FileReader();
  rd.onload=e=>{
    try{
      let rows;
      if(file.name.endsWith('.csv')){
        rows=new TextDecoder().decode(e.target.result).split('\n').filter(r=>r.trim()).map(r=>{
          const res=[];let cur='',inQ=false;
          for(const ch of r.replace('\r','')){if(ch==='"'){inQ=!inQ;}else if(ch===','&&!inQ){res.push(cur.trim());cur='';}else cur+=ch;}
          res.push(cur.trim());return res;
        });
      }else{const wb=XLSX.read(e.target.result,{type:'array'});rows=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{header:1});}
      const h=rows[0]?rows[0].map(x=>String(x).toLowerCase()):[];
      const isS=h.some(x=>x.includes('categ')||x.includes('línea')||x.includes('linea'));
      const data=isS?rows.slice(1):rows;
      const actuals=bgt2LoadActuals();
      let n=0;
      data.forEach(r=>{
        if(!r[0])return;
        let cn,ln,amount,mIdx;
        if(isS&&r.length>=3){
          cn=String(r[0]).trim();ln=String(r[1]).trim();
          amount=parseFloat(String(r[2]).replace(/[^0-9.-]/g,''))||0;
          const ms=r[3]?String(r[3]).toLowerCase().slice(0,3):null;
          mIdx=ms&&MMAP[ms]!==undefined?MMAP[ms]:monthIdx;
        }else{
          const desc=String(r[0]).trim();
          amount=parseFloat(String(r[1]||0).replace(/[^0-9.-]/g,''))||0;
          const ms=r[2]?String(r[2]).toLowerCase().slice(0,3):null;
          mIdx=ms&&MMAP[ms]!==undefined?MMAP[ms]:monthIdx;
          let best=null,bestCat=null,bestSc=0;
          cfg.categories.forEach(cat=>{cfg.lines.filter(l=>l.catId===cat.id).forEach(l=>{
            const sc=bgt2Sim(desc.toLowerCase(),l.name.toLowerCase());
            if(sc>bestSc){bestSc=sc;best=l;bestCat=cat;}
          });});
          if(bestSc>=0.3&&best&&bestCat){cn=bestCat.name;ln=best.name;}
          else{const oc=cfg.categories.find(c=>c.name.toLowerCase().includes('otro'))||cfg.categories.at(-1);
            const ol=cfg.lines.find(l=>l.catId===oc?.id&&l.name.toLowerCase().includes('otro'))||cfg.lines.find(l=>l.catId===oc?.id);
            cn=oc?.name||'Otros';ln=ol?.name||'Otros';}
        }
        if(amount>0&&cn&&ln){const k=`${cn}|${ln}|${mIdx}`;actuals[k]=(actuals[k]||0)+amount;n++;}
      });
      bgt2SaveActuals(actuals);
      window._bgt2a=actuals;
      alert(`✓ ${n} gastos importados.`);
      if(callback)callback();
    }catch(err){alert('Error: '+err.message);}
  };
  rd.readAsArrayBuffer(file);
}

function bgt2Sim(a,b){
  const wa=new Set(a.split(/\s+/).filter(w=>w.length>2));
  const wb=new Set(b.split(/\s+/).filter(w=>w.length>2));
  if(!wa.size||!wb.size)return 0;
  return[...wa].filter(w=>wb.has(w)).length/Math.max(wa.size,wb.size);
}

/* ── Gastos libres (no presupuestados) ── */
function bgt2AddLibre(month, redrawFn) {
  const desc = document.getElementById('bgt2-libre-desc')?.value.trim();
  const amt  = parseFloat(document.getElementById('bgt2-libre-amt')?.value || 0);
  if (!desc || !amt) { alert('Escribe una descripción e importe.'); return; }
  const entries = JSON.parse(localStorage.getItem('eco_libre_v1') || '[]');
  entries.push({ id: 'lib_' + Date.now(), desc, amount: amt, month });
  localStorage.setItem('eco_libre_v1', JSON.stringify(entries));
  /* También guardar en eco_actual_v2 para que el P&L lo lea como OpEx */
  const actuals = JSON.parse(localStorage.getItem('eco_actual_v2') || '{}');
  actuals[`_libre|${desc}|${month}`] = (actuals[`_libre|${desc}|${month}`] || 0) + amt;
  localStorage.setItem('eco_actual_v2', JSON.stringify(actuals));
  document.getElementById('bgt2-libre-desc').value = '';
  document.getElementById('bgt2-libre-amt').value = '';
  if (redrawFn) redrawFn();
}

function bgt2DeleteLibre(id, redrawFn) {
  let entries = JSON.parse(localStorage.getItem('eco_libre_v1') || '[]');
  const entry = entries.find(e => e.id === id);
  entries = entries.filter(e => e.id !== id);
  localStorage.setItem('eco_libre_v1', JSON.stringify(entries));
  /* Eliminar también de eco_actual_v2 */
  if (entry) {
    const actuals = JSON.parse(localStorage.getItem('eco_actual_v2') || '{}');
    const key = `_libre|${entry.desc}|${entry.month}`;
    delete actuals[key];
    localStorage.setItem('eco_actual_v2', JSON.stringify(actuals));
  }
  if (redrawFn) redrawFn();
}

/* ── Init: sincronizar BGT_DATA al arrancar ── */
(function(){
  function trySync(n){
    if(window.BGT_DATA){const cfg=bgt2Load();if(cfg)bgt2SyncGlobal(cfg);}
    else if(n<20)setTimeout(()=>trySync(n+1),250);
  }
  setTimeout(()=>trySync(0),300);
})();
