/* ═══════════════════════════════════════════════
   BUDGET — Budget tracking, costs, ROI
   Depends on: core.js
   ═══════════════════════════════════════════════ */

const BK = 'eco_budget_v1'; // localStorage key for budget/report data

/* ── BUDGET EXCEL ── */
const VENDOR_MAP = {
  'google ads': 'paid_media', 'meta ads': 'paid_media', 'facebook ads': 'paid_media', 'linkedin ads': 'li_ads',
  'canva': 'design', 'maria laar': 'design', 'viviana': 'design', 'designer': 'design', 'freelance design': 'design',
  'instantly': 'email', 'mailchimp': 'email', 'people per hour': 'email', 'google workspace': 'email',
  'ahrefs': 'seo', 'semrush': 'seo', 'moz': 'seo',
  'hubspot': 'tools', 'monday': 'tools', 'slack': 'tools', 'zoom': 'tools',
  'pr': 'events', 'event': 'events', 'conference': 'events',
};
const MONTH_MAP = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11,
  january:0,february:1,march:2,april:3,june:5,july:6,august:7,september:8,october:9,november:10,december:11};

const CATEGORY_MAP = {
  'paid media': 'paid_media', 'design': 'design',
  'email outreach': 'email', 'email internal': 'email', 'email marketing': 'email',
  'seo': 'seo', 'tools': 'tools', 'software': 'tools',
  'events': 'events', 'pr': 'events', 'other': 'other'
};

// ── Budget constants ─────────────────────
const BGT_DATA = {"rows": [{"cat": "Advertising & Campaigns", "name": "Designer", "vals": [0, 760, 360, 360, 550, 550, 550, 550, 550, 550, 550, 550]}, {"cat": "Advertising & Campaigns", "name": "Google Ads", "vals": [152, 226, 750, 750, 750, 750, 750, 750, 750, 750, 750, 750]}, {"cat": "Advertising & Campaigns", "name": "PR Agency", "vals": [2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500, 2500]}, {"cat": "Advertising & Campaigns", "name": "Mailing campaigns", "vals": [0, 680, 350, 250, 250, 250, 250, 250, 250, 250, 250, 250]}, {"cat": "Advertising & Campaigns", "name": "Promoting activities", "vals": [0, 0, 750, 200, 200, 200, 0, 0, 0, 0, 0, 0]}, {"cat": "Advertising & Campaigns", "name": "Other", "vals": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}, {"cat": "Sales Outbound", "name": "Veolia partnership", "vals": [0, 0, 500, 0, 2000, 500, 500, 500, 500, 500, 500, 500]}, {"cat": "Sales Outbound", "name": "Client visits & Events", "vals": [0, 0, 0, 50, 50, 50, 50, 50, 50, 50, 50, 50]}, {"cat": "Sales Outbound", "name": "Current Associations", "vals": [600, 0, 0, 1000, 0, 0, 0, 0, 0, 0, 0, 0]}, {"cat": "Sales Outbound", "name": "Event participation", "vals": [0, 0, 0, 0, 0, 0, 200, 200, 100, 0, 0, 0]}, {"cat": "Sales Outbound", "name": "LinkedIn Premium", "vals": [36, 36, 75, 75, 75, 75, 75, 75, 75, 75, 75, 75]}, {"cat": "Sales Outbound", "name": "New Associations", "vals": [700, 700, 0, 0, 0, 0, 700, 0, 700, 0, 700, 0]}, {"cat": "Sales Outbound", "name": "Other", "vals": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}, {"cat": "Team Meetings", "name": "Food", "vals": [120, 120, 90, 90, 90, 90, 90, 90, 90, 90, 90, 90]}, {"cat": "Team Meetings", "name": "Trainline", "vals": [460, 460, 321, 321, 321, 321, 321, 321, 321, 321, 321, 321]}, {"cat": "Team Meetings", "name": "Other", "vals": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}, {"cat": "Tools", "name": "Mailchimp", "vals": [261, 261, 261, 261, 0, 0, 0, 0, 0, 0, 0, 0]}, {"cat": "Tools", "name": "Canva", "vals": [36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36, 36]}, {"cat": "Tools", "name": "Cognism", "vals": [233, 233, 233, 233, 233, 0, 0, 0, 0, 0, 0, 0]}, {"cat": "Tools", "name": "Copilot / AI", "vals": [0, 0, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]}, {"cat": "Tools", "name": "CRM Monday.com", "vals": [333, 333, 333, 400, 400, 400, 400, 400, 400, 400, 400, 400]}, {"cat": "Tools", "name": "IA Video generation", "vals": [0, 0, 35, 35, 35, 35, 35, 35, 35, 35, 35, 35]}, {"cat": "Tools", "name": "Other", "vals": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]}], "monthlyTotals": [5431, 6345, 6624, 6591, 7520, 5787, 6487, 5787, 6387, 5587, 6287, 5587], "annualTotal": 74420, "catColors": {"Advertising & Campaigns": "#DC2626", "Sales Outbound": "#059669", "Team Meetings": "#0891B2", "Tools": "#7C3AED"}, "months": ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]};
const BGT_AK = 'eco_actual_v2';
const BGT_MK = 'eco_mappings_v1';
// ─────────────────────────────────────────

function getCustomMappings(){ return JSON.parse(localStorage.getItem(BGT_MK)||'{}'); }
function saveCustomMapping(excelLine, bgtLine){
  var m = getCustomMappings();
  m[excelLine.toLowerCase()] = bgtLine;
  localStorage.setItem(BGT_MK, JSON.stringify(m));
}

function downloadExpenseTemplate(){
  var csv = 'Category,Line Item,Vendor / Description,Amount (GBP),Month\n';
  BGT_DATA.rows.slice(0,4).forEach(function(r){
    csv += '"'+r.cat+'","'+r.name+'","Example vendor",0,"Jan"\n';
  });
  csv += '\n--- VALID CATEGORIES ---\n';
  Object.keys(BGT_DATA.catColors).forEach(function(cat){
    var lines = BGT_DATA.rows.filter(function(r){ return r.cat===cat; }).map(function(r){ return r.name; }).join(' / ');
    csv += '"'+cat+'","Lines: '+lines+'"\n';
  });
  csv += '\n--- VALID MONTHS ---\nJan,Feb,Mar,Apr,May,Jun,Jul,Aug,Sep,Oct,Nov,Dec\n';
  var blob = new Blob([csv],{type:'text/csv'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='ProximoRol_Expenses_Template.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function budgetClearActual(){
  if(!confirm('Clear all actual costs? This cannot be undone.')) return;
  localStorage.removeItem(BGT_AK);
  document.querySelectorAll('input[type="file"]').forEach(function(inp){ inp.value=''; });
  var status = document.getElementById('budget-upload-status');
  if(status){ status.textContent='Cleared. Ready to upload again.'; status.style.color='var(--mt)'; }
  var prev = document.getElementById('import-preview');
  if(prev) prev.style.display='none';
  var panel = document.getElementById('unmatched-panel');
  if(panel) panel.style.display='none';
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ renderBudgetPage(); }); });
}

function budgetUploadActual(input){
  var file = input.files[0]; if(!file) return;
  var statusEl = document.getElementById('budget-upload-status');
  var prevEl   = document.getElementById('import-preview');
  var panel    = document.getElementById('unmatched-panel');
  var rowsEl   = document.getElementById('unmatched-rows');
  statusEl.textContent = 'Reading ' + file.name + '...';
  statusEl.style.color = 'var(--mt)';
  if(prevEl) prevEl.style.display = 'none';
  if(panel)  panel.style.display  = 'none';

  var reader = new FileReader();
  reader.onload = function(e){
    try{
      var isCSV = file.name.toLowerCase().slice(-4) === '.csv';
      var rows;
      if(isCSV){
        var text = new TextDecoder().decode(e.target.result);
        rows = text.split('\n').map(function(line){
          line = line.replace('\r','');
          var result=[], cur='', inQ=false;
          for(var ci=0;ci<line.length;ci++){
            var ch=line[ci];
            if(ch==='"'){ inQ=!inQ; }
            else if(ch===','&&!inQ){ result.push(cur.trim()); cur=''; }
            else{ cur+=ch; }
          }
          result.push(cur.trim()); return result;
        }).filter(function(r){ return r.some(function(c){ return c.trim(); }); });
      } else {
        var wb = XLSX.read(new Uint8Array(e.target.result),{type:'array'});
        var shName = wb.SheetNames[0];
        for(var si=0;si<wb.SheetNames.length;si++){
          if(wb.SheetNames[si].toLowerCase().indexOf('expense')>-1){ shName=wb.SheetNames[si]; break; }
        }
        rows = XLSX.utils.sheet_to_json(wb.Sheets[shName],{header:1,defval:''});
      }

      // Find header row
      var hdrRow=-1, cCat=-1, cLine=-1, cAmt=-1, cMon=-1;
      for(var hi=0;hi<Math.min(6,rows.length);hi++){
        var hr = rows[hi].map(function(c){ return String(c).toLowerCase().replace('\r','').trim(); });
        if(hr.indexOf('category') > -1){
          hdrRow = hi;
          hr.forEach(function(c,j){
            if(c==='category')                       cCat=j;
            else if(c==='line item'||c==='line')     cLine=j;
            else if(c.indexOf('amount')>-1)          cAmt=j;
            else if(c==='month')                     cMon=j;
          });
          break;
        }
      }
      if(hdrRow===-1||cCat===-1){
        statusEl.textContent = 'Column "Category" not found. Check your file headers.';
        statusEl.style.color = 'var(--red)'; return;
      }

      var MMAP = {jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11};
      var customMaps = getCustomMappings();
      var LINE_ALIASES = {
        'design':'Designer', 'paid media':'Google Ads',
        'email outreach':'Mailing campaigns', 'email internal':'Mailing campaigns', 'outreach':'Mailing campaigns',
        'inkedpr':'PR Agency', 'inked pr':'PR Agency',
        'linkedin':'LinkedIn Premium',
        'monday':'CRM Monday.com', 'crm':'CRM Monday.com',
        'ai':'Copilot / AI', 'ai video':'IA Video generation',
        'veolia':'Veolia partnership',
        'new associations':'New Associations', 'associations':'Current Associations'
      };
      var validCats = Object.keys(BGT_DATA.catColors);
      var saved = JSON.parse(localStorage.getItem(BGT_AK)||'{}');
      var count=0, otherItems=[], preview=[];

      for(var ri=hdrRow+1; ri<rows.length; ri++){
        var row    = rows[ri];
        var cat    = String(row[cCat]  ||'').replace('\r','').trim();
        var line   = cLine>-1 ? String(row[cLine]||'').replace('\r','').trim() : '';
        var amtStr = cAmt>-1  ? String(row[cAmt] ||'0').replace('\r','').replace('£','').replace(',','').trim() : '0';
        var mRaw   = cMon>-1  ? String(row[cMon] ||'').replace('\r','').toLowerCase().trim().slice(0,3) : '';
        var amt    = parseFloat(amtStr)||0;
        var mIdx   = MMAP[mRaw];

        if(!cat || cat.indexOf('---')===0) continue;
        if(mIdx === undefined) continue;

        // Match category
        var matchedCat = null;
        for(var xi=0;xi<validCats.length;xi++){
          if(validCats[xi].toLowerCase() === cat.toLowerCase()){ matchedCat=validCats[xi]; break; }
        }
        if(!matchedCat){
          for(var xi2=0;xi2<validCats.length;xi2++){
            if(cat.toLowerCase().indexOf(validCats[xi2].toLowerCase().split(' ')[0]) > -1){ matchedCat=validCats[xi2]; break; }
          }
        }
        if(!matchedCat) continue; // truly unknown category

        // Match line name: custom map → alias → exact → partial → "Other"
        var lineLow = line.toLowerCase();
        var catRows = BGT_DATA.rows.filter(function(r){ return r.cat===matchedCat && r.name!=='Other'; });
        var matchedLine = customMaps[lineLow] || LINE_ALIASES[lineLow] || line;

        // Partial match if still not exact
        if(!catRows.some(function(r){ return r.name===matchedLine; })){
          var partial = null;
          for(var pi=0;pi<catRows.length;pi++){
            var rn = catRows[pi].name.toLowerCase();
            if(rn.indexOf(lineLow.split(' ')[0])>-1 || lineLow.indexOf(rn.split(' ')[0])>-1){
              partial = catRows[pi]; break;
            }
          }
          if(partial){ matchedLine = partial.name; }
          else { matchedLine = 'Other'; } // ← fallback to Other
        }

        var isOther = (matchedLine === 'Other');
        var key = matchedCat + '|' + matchedLine + '|' + mIdx;
        saved[key] = (parseFloat(saved[key]||0) + amt);
        count++;

        if(preview.length < 6) preview.push({cat:matchedCat, line:matchedLine, amt:amt,
          month: mRaw.charAt(0).toUpperCase()+mRaw.slice(1), other:isOther});

        // Collect "Other" items for the reassign panel
        if(isOther && line){
          otherItems.push({cat:matchedCat, excelLine:line, amt:amt, month:mRaw, mIdx:mIdx, key:key});
        }
      }

      localStorage.setItem(BGT_AK, JSON.stringify(saved));

      // Status message
      var msg = count + ' rows imported';
      if(otherItems.length > 0) msg += ' · ' + otherItems.length + ' saved as "Other" (reassign below)';
      statusEl.textContent = msg;
      statusEl.style.color = otherItems.length > 0 ? '#D97706' : 'var(--green)';

      // Preview table
      if(prevEl && preview.length > 0){
        prevEl.style.display = 'block';
        var ph = '<div style="font-size:10px;color:var(--ht);margin-bottom:4px">Preview:</div>';
        ph += '<table class="dt" style="font-size:11px"><thead><tr><th>Category</th><th>Line</th><th>Amount</th><th>Month</th></tr></thead><tbody>';
        preview.forEach(function(r){
          ph += '<tr>';
          ph += '<td><span style="font-size:10px;padding:1px 6px;border-radius:10px;background:' + BGT_DATA.catColors[r.cat] + '22;color:' + BGT_DATA.catColors[r.cat] + '">' + r.cat + '</span></td>';
          ph += '<td style="color:var(--' + (r.other?'amber':'tx') + ')">' + r.line + (r.other?' ⚠':'') + '</td>';
          ph += '<td>£' + r.amt.toFixed(2) + '</td>';
          ph += '<td style="color:var(--green);font-weight:500">' + r.month + '</td>';
          ph += '</tr>';
        });
        prevEl.innerHTML = ph + '</tbody></table>';
      }

      // Reassign panel — show if any went to "Other"
      window._otherItems = otherItems;
      if(panel && rowsEl){
        if(otherItems.length > 0){
          var opts = BGT_DATA.rows
            .filter(function(r){ return r.name !== 'Other'; })
            .map(function(r){ return '<option value="' + r.cat + '||' + r.name + '">' + r.cat + ' → ' + r.name + '</option>'; }).join('');
          var ph2 = '';
          otherItems.forEach(function(u, i){
            var color = BGT_DATA.catColors[u.cat];
            ph2 += '<div style="display:grid;grid-template-columns:1fr 1.2fr 1.4fr 0.7fr auto;gap:8px;align-items:center;padding:8px 0;border-bottom:1px solid #FDE68A66;font-size:12px">';
            ph2 += '<div><span style="font-size:10px;padding:2px 7px;border-radius:10px;background:' + color + '22;color:' + color + '">' + u.cat + '</span></div>';
            ph2 += '<div style="font-weight:500;color:var(--tx)">"' + u.excelLine + '"</div>';
            ph2 += '<select id="umatch-' + i + '" onchange="this.style.borderColor=\'var(--green)\'" style="padding:5px 8px;border:1.5px solid var(--bd2);border-radius:var(--r);font-size:11px;font-family:inherit;background:var(--sf);color:var(--tx);outline:none;cursor:pointer">';
            ph2 += '<option value="">— keep as Other —</option>' + opts + '</select>';
            ph2 += '<div style="color:var(--mt);font-size:11px">£' + u.amt.toFixed(2) + ' · ' + u.month.charAt(0).toUpperCase() + u.month.slice(1) + '</div>';
            ph2 += '<button onclick="rememberAndApply(' + i + ')" title="Remember for future uploads" style="padding:4px 8px;background:none;border:1px solid var(--bd2);border-radius:6px;font-size:11px;cursor:pointer;color:var(--ht);white-space:nowrap">💾 Remember</button>';
            ph2 += '</div>';
          });
          rowsEl.innerHTML = ph2;
          panel.style.display = 'block';
        } else {
          panel.style.display = 'none';
        }
      }

      requestAnimationFrame(function(){ requestAnimationFrame(function(){ renderBudgetPage(); }); });
    } catch(err){
      statusEl.textContent = 'Error: ' + err.message;
      statusEl.style.color = 'var(--red)';
      console.error(err);
    }
  };
  reader.readAsArrayBuffer(file);
}

function applyUnmatchedMappings(){
  var items = window._otherItems || [];
  var saved = JSON.parse(localStorage.getItem(BGT_AK)||'{}');
  var applied = 0;
  items.forEach(function(u, i){
    var sel = document.getElementById('umatch-'+i);
    if(!sel || !sel.value) return;
    var parts = sel.value.split('||');
    var newKey = parts[0] + '|' + parts[1] + '|' + u.mIdx;
    var oldAmt = parseFloat(saved[u.key]||0);
    if(oldAmt !== 0){
      delete saved[u.key];
      saved[newKey] = (parseFloat(saved[newKey]||0) + oldAmt);
    }
    applied++;
  });
  localStorage.setItem(BGT_AK, JSON.stringify(saved));
  var panel = document.getElementById('unmatched-panel');
  if(panel) panel.style.display = 'none';
  var status = document.getElementById('budget-upload-status');
  if(status){
    status.textContent = applied > 0 ? '✓ ' + applied + ' items reassigned' : 'No items were reassigned';
    status.style.color = applied > 0 ? 'var(--green)' : 'var(--mt)';
  }
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ renderBudgetPage(); }); });
}

function rememberAndApply(idx){
  var items = window._otherItems || [];
  var u = items[idx];
  var sel = document.getElementById('umatch-'+idx);
  if(!sel || !sel.value || !u) return;
  var parts = sel.value.split('||');
  // Save custom mapping so next upload auto-maps this name
  saveCustomMapping(u.excelLine, parts[1]);
  // Also immediately move the data
  var saved = JSON.parse(localStorage.getItem(BGT_AK)||'{}');
  var newKey = parts[0] + '|' + parts[1] + '|' + u.mIdx;
  var oldAmt = parseFloat(saved[u.key]||0);
  if(oldAmt !== 0){
    delete saved[u.key];
    saved[newKey] = (parseFloat(saved[newKey]||0) + oldAmt);
    u.key = newKey; // update so applyUnmatchedMappings skips it
  }
  localStorage.setItem(BGT_AK, JSON.stringify(saved));
  // Visual feedback
  sel.style.background = '#dcfce7';
  sel.style.borderColor = 'var(--green)';
  sel.disabled = true;
  var btn = document.getElementById('umatch-'+idx).parentElement
    ? document.getElementById('umatch-'+idx).parentElement.querySelector('button') : null;
  if(btn){ btn.textContent = '✓ Saved'; btn.style.color = 'var(--green)'; btn.disabled = true; }
  requestAnimationFrame(function(){ requestAnimationFrame(function(){ renderBudgetPage(); }); });
}



function renderBudgetPage(){
  var NOW=new Date(), CUR_M=NOW.getMonth();
  var actual=JSON.parse(localStorage.getItem(BGT_AK)||'{}');

  function getLineActual(cat,line,m){
    return parseFloat(actual[cat+'|'+line+'|'+m]||0);
  }
  function getCatActual(cat,m){
    return BGT_DATA.rows.filter(function(r){ return r.cat===cat; })
      .reduce(function(s,r){ return s+getLineActual(cat,r.name,m); },0)
      || parseFloat(actual[cat+'_'+m]||0);
  }
  function getMonthTarget(m){ return BGT_DATA.monthlyTotals[m]; }
  function getCatTarget(cat,m){ return BGT_DATA.rows.filter(function(r){ return r.cat===cat; }).reduce(function(a,r){ return a+r.vals[m]; },0); }
  function fmtK(n){ return n>=1000?'£'+Math.round(n/100)/10+'k':'£'+Math.round(n); }

  var cats=Object.keys(BGT_DATA.catColors);
  var ytdMonths=[]; for(var i=0;i<=CUR_M;i++) ytdMonths.push(i);
  var ytdTarget=ytdMonths.reduce(function(a,m){ return a+getMonthTarget(m); },0);
  var ytdActualTotal=0;
  ytdMonths.forEach(function(m){ cats.forEach(function(cat){ ytdActualTotal+=getCatActual(cat,m); }); });
  var ytdVar=ytdActualTotal-ytdTarget;
  var annualTarget=BGT_DATA.annualTotal;
  var remaining=annualTarget-ytdActualTotal;
  var pctUsed=annualTarget>0?Math.round((ytdActualTotal/annualTarget)*100):0;
  var hasActual=ytdActualTotal>0;
  var mTarget=getMonthTarget(CUR_M), mActual=0;
  cats.forEach(function(cat){ mActual+=getCatActual(cat,CUR_M); });
  var mRemaining=mTarget-mActual;
  var topCat=cats[0], topAmt=0;
  cats.forEach(function(cat){
    var a=ytdMonths.reduce(function(s,m){ return s+getCatActual(cat,m); },0)||ytdMonths.reduce(function(s,m){ return s+getCatTarget(cat,m); },0);
    if(a>topAmt){ topAmt=a; topCat=cat; }
  });

  // ── INSIGHT CARDS ──
  var insightEl=document.getElementById('budget-insights-wrap');
  if(insightEl){
    var defs=[
      {bg:'#EFF6FF',bc:'#BFDBFE',ic:'📊',tcol:'#1E40AF',vcol:'#2563EB',
       title:'YTD Actual Spend',val:fmtGBP(ytdActualTotal),
       sub:hasActual?pctUsed+'% of annual budget · target was '+fmtGBP(ytdTarget):'No actuals yet · target to date: '+fmtGBP(ytdTarget)},
      {bg:ytdVar>0?'#FEF2F2':'#E1F5EE',bc:ytdVar>0?'#FECACA':'#9FE1CB',
       ic:ytdVar>0?'🔴':'🟢',tcol:ytdVar>0?'#991B1B':'#0F6E56',vcol:ytdVar>0?'#DC2626':'#1D9E75',
       title:'YTD vs Target',val:(ytdVar>0?'+':'')+fmtGBP(ytdVar),
       sub:ytdVar>0?'Over target — review spend':hasActual?'Under budget — good pace':'Upload actuals to compare'},
      {bg:remaining>=0?'#E1F5EE':'#FEF2F2',bc:remaining>=0?'#9FE1CB':'#FECACA',
       ic:remaining>=0?'💰':'⚠️',tcol:remaining>=0?'#0F6E56':'#991B1B',vcol:remaining>=0?'#1D9E75':'#DC2626',
       title:'Annual Budget Remaining',val:fmtGBP(Math.abs(remaining)),
       sub:remaining>=0?pctUsed+'% of £'+Math.round(annualTarget/1000)+'k used':'Annual budget exceeded'},
      {bg:mRemaining>=0?'#FFFBEB':'#FEF2F2',bc:mRemaining>=0?'#FDE68A':'#FECACA',
       ic:mRemaining>=0?'📅':'🚨',tcol:mRemaining>=0?'#92400E':'#991B1B',vcol:mRemaining>=0?'#D97706':'#DC2626',
       title:BGT_DATA.months[CUR_M]+(mRemaining>=0?' — budget left':' — over budget'),val:fmtGBP(Math.abs(mRemaining)),
       sub:mActual>0?'Spent '+fmtGBP(mActual)+' of '+fmtGBP(mTarget)+' target':'Budget: '+fmtGBP(mTarget)+' · No actuals yet'},
      {bg:'#F0FDF4',bc:'#BBF7D0',ic:'🏆',tcol:'#065F46',vcol:'#059669',
       title:'Top Spend Category',val:topCat,sub:fmtGBP(topAmt)+(hasActual?' actual YTD':' target YTD')},
      {bg:'#F5F3FF',bc:'#DDD6FE',ic:'🎯',tcol:'#4C1D95',vcol:'#7C3AED',
       title:'Annual Target',val:fmtGBP(annualTarget),sub:'Across all '+cats.length+' categories'}
    ];
    // Show "Total imported" card if file has future-month entries
    var allMonthsActual = 0;
    BGT_DATA.months.forEach(function(_,m){ cats.forEach(function(cat){ allMonthsActual += getCatActual(cat,m); }); });
    if(allMonthsActual > ytdActualTotal + 1){
      defs.splice(1, 0, {
        bg:'#F0F9FF', bc:'#BAE6FD', ic:'📥', tcol:'#0369A1', vcol:'#0284C7',
        title:'Total imported (all months)',
        val: fmtGBP(allMonthsActual),
        sub: 'YTD ' + BGT_DATA.months[CUR_M] + ': ' + fmtGBP(ytdActualTotal) + ' · includes future entries'
      });
    }
    var ih='<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px">';
    defs.forEach(function(d){
      ih+='<div style="background:'+d.bg+';border:1px solid '+d.bc+';border-radius:var(--rl);padding:14px;display:flex;gap:12px;align-items:flex-start">';
      ih+='<div style="font-size:22px;line-height:1;flex-shrink:0">'+d.ic+'</div>';
      ih+='<div><div style="font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:'+d.tcol+';margin-bottom:2px">'+d.title+'</div>';
      ih+='<div style="font-size:22px;font-weight:600;line-height:1;color:'+d.vcol+';margin-bottom:4px">'+d.val+'</div>';
      ih+='<div style="font-size:11px;color:'+d.tcol+';opacity:.8">'+d.sub+'</div></div></div>';
    });
    insightEl.innerHTML=ih+'</div>';
  }

  // ── BAR CHART ──
  var barEl=document.getElementById('budget-bar-chart');
  if(barEl){
    var allT=BGT_DATA.monthlyTotals;
    var allA=BGT_DATA.months.map(function(_,m){ var s=0; cats.forEach(function(cat){ s+=getCatActual(cat,m); }); return s; });
    var maxV=Math.max.apply(null,allT.concat(allA).concat([1]));
    var bh='<div style="display:flex;gap:6px;align-items:flex-end;height:180px;padding:0 4px;margin-bottom:6px">';
    BGT_DATA.months.forEach(function(m,i){
      var t=allT[i],a=allA[i];
      var tH=Math.round((t/maxV)*160), aH=a>0?Math.round((a/maxV)*160):0;
      var isOver=a>t&&a>0, isCur=i===CUR_M, isFut=i>CUR_M;
      var aCol=isOver?'rgba(220,38,38,.75)':'rgba(37,99,235,.75)';
      var tCol=isFut?'rgba(29,158,117,.18)':'rgba(29,158,117,.45)';
      bh+='<div style="flex:1;display:flex;flex-direction:column;align-items:center" title="'+m+': Target '+fmtGBP(t)+(a>0?' · Actual '+fmtGBP(a):'')+(a>t&&a>0?' · OVER '+fmtGBP(a-t):'')+'\">';
      bh+='<div style="font-size:9px;font-weight:'+(isCur?700:400)+';color:'+(isOver?'#DC2626':a>0?'#2563EB':'transparent')+';margin-bottom:2px">'+(a>0?fmtK(a):'')+'</div>';
      bh+='<div style="width:100%;display:flex;gap:2px;align-items:flex-end;height:160px">';
      bh+='<div style="flex:1;height:'+tH+'px;background:'+tCol+';border-radius:3px 3px 0 0;min-height:2px"></div>';
      bh+='<div style="flex:1;height:'+aH+'px;background:'+(isFut?'rgba(0,0,0,.05)':aCol)+';border-radius:3px 3px 0 0"></div>';
      bh+='</div>';
      bh+='<div style="font-size:9px;margin-top:3px;font-weight:'+(isCur?700:400)+';color:'+(isCur?'var(--green)':'var(--ht)')+'">'+m+'</div></div>';
    });
    bh+='</div><div style="display:flex;gap:16px;padding:0 4px;font-size:11px;color:var(--mt)">';
    bh+='<span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:8px;background:rgba(29,158,117,.45);border-radius:2px;display:inline-block"></span>Target</span>';
    bh+='<span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:8px;background:rgba(37,99,235,.75);border-radius:2px;display:inline-block"></span>Actual</span>';
    bh+='<span style="display:flex;align-items:center;gap:5px"><span style="width:12px;height:8px;background:rgba(220,38,38,.75);border-radius:2px;display:inline-block"></span>Over budget</span>';
    bh+='</div>';
    barEl.innerHTML=bh;
  }

  // ── YTD CATEGORY BARS ──
  var ytdEl=document.getElementById('budget-ytd-bars');
  if(ytdEl){
    var yh='';
    cats.forEach(function(cat,ci){
      var color=BGT_DATA.catColors[cat];
      var catT=ytdMonths.reduce(function(s,m){ return s+getCatTarget(cat,m); },0);
      var catA=ytdMonths.reduce(function(s,m){ return s+getCatActual(cat,m); },0);
      var pctA=catA>0&&catT>0?Math.round((catA/catT)*100):0;
      var isOver=catA>catT&&catA>0;
      var cid='ytdcat'+ci;
      yh+='<div style="margin-bottom:14px;cursor:pointer" onclick="toggleCatExpand(\''+cid+'\')">';
      yh+='<div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">';
      yh+='<svg id="bgt-arrow-'+cid+'" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="flex-shrink:0;color:var(--ht);transition:transform .2s"><polyline points="9 18 15 12 9 6"/></svg>';
      yh+='<span style="font-size:13px;font-weight:500;flex:1">'+cat+'</span>';
      yh+='<span style="font-size:12px;font-weight:600;color:'+color+'">'+fmtGBP(catT)+'</span>';
      yh+=catA>0?'<span style="font-size:11px;color:'+(isOver?'#DC2626':'#2563EB')+';font-weight:500">Actual: '+fmtGBP(catA)+'</span>':'<span style="font-size:11px;color:var(--ht)">No actuals yet</span>';
      yh+='</div><div style="height:6px;background:var(--sf2);border-radius:4px;overflow:hidden;position:relative">';
      yh+='<div style="height:100%;width:100%;background:'+color+';opacity:.25;border-radius:4px;position:absolute"></div>';
      yh+=catA>0?'<div style="height:100%;width:'+Math.min(pctA,100)+'%;background:'+(isOver?'#DC2626':color)+';opacity:.85;border-radius:4px;position:absolute"></div>':'';
      yh+='</div></div>';
      yh+='<div id="expand-'+cid+'" style="display:none;margin:-8px 0 18px 20px;overflow-x:auto"><table class="dt" style="font-size:11px;min-width:500px"><thead><tr><th style="min-width:150px">Line Item</th>';
      ytdMonths.forEach(function(m){ yh+='<th style="text-align:right;min-width:52px">'+BGT_DATA.months[m]+'</th>'; });
      yh+='<th style="text-align:right;min-width:60px">YTD</th><th style="text-align:right;min-width:60px">Annual</th></tr></thead><tbody>';
      BGT_DATA.rows.filter(function(r){ return r.cat===cat; }).forEach(function(row){
        var lYtdT=ytdMonths.reduce(function(s,m){ return s+row.vals[m]; },0);
        var lAnnual=row.vals.reduce(function(a,b){ return a+b; },0);
        yh+='<tr style="background:'+color+'08"><td style="padding:5px 6px;font-weight:500">'+row.name+'</td>';
        ytdMonths.forEach(function(m){
          var t=row.vals[m], a=getLineActual(cat,row.name,m);
          yh+='<td style="text-align:right;padding:5px 4px">';
          yh+=t>0?'<div style="color:var(--ht);font-size:10px">'+fmtGBP(t)+'</div>':'';
          yh+=a>0?'<div style="color:'+(a>t?'#DC2626':'#2563EB')+';font-size:10px;font-weight:500">'+fmtGBP(a)+'</div>':'';
          yh+='</td>';
        });
        yh+='<td style="text-align:right;padding:5px 4px;font-weight:600;color:'+color+'">'+fmtGBP(lYtdT)+'</td>';
        yh+='<td style="text-align:right;padding:5px 4px;color:var(--mt)">'+fmtGBP(lAnnual)+'</td></tr>';
      });
      yh+='</tbody></table></div>';
    });
    ytdEl.innerHTML=yh;
  }

  // ── FULL DETAIL TABLE ──
  var tblEl=document.getElementById('budget-detail-table');
  if(!tblEl) return;
  var allMonths=BGT_DATA.months;
  var th='<div style="overflow-x:auto"><table class="dt" style="font-size:11px;min-width:900px"><thead><tr style="background:var(--sf2)"><th style="min-width:180px;padding:8px 10px">Category / Line</th>';
  allMonths.forEach(function(m){ th+='<th style="text-align:right;min-width:52px;padding:8px 4px">'+m+'</th>'; });
  th+='<th style="text-align:right;min-width:60px;padding:8px 4px">YTD</th><th style="text-align:right;min-width:68px;padding:8px 10px">Annual</th></tr></thead><tbody>';

  var monthTots=allMonths.map(function(_,m){ return getMonthTarget(m); });
  var actTots=allMonths.map(function(_,m){ var s=0; cats.forEach(function(cat){ s+=getCatActual(cat,m); }); return s; });

  cats.forEach(function(cat){
    var color=BGT_DATA.catColors[cat];
    var catAnnual=BGT_DATA.rows.filter(function(r){ return r.cat===cat; }).reduce(function(s,r){ return s+r.vals.reduce(function(a,b){ return a+b; },0); },0);
    var catYtdT=ytdMonths.reduce(function(s,m){ return s+getCatTarget(cat,m); },0);
    var ci=cats.indexOf(cat);
    th+='<tr style="background:'+color+'12;font-weight:600;cursor:pointer" onclick="toggleCatExpand(\'tblcat'+ci+'\')">';
    th+='<td style="padding:7px 10px;color:'+color+'"><svg id="bgt-arrow-tblcat'+ci+'" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:5px;vertical-align:middle;transition:transform .2s"><polyline points="9 18 15 12 9 6"/></svg>'+cat+'</td>';
    allMonths.forEach(function(_,m){
      var t=getCatTarget(cat,m), a=getCatActual(cat,m);
      th+='<td style="text-align:right;padding:7px 4px">';
      th+=t>0?'<div style="color:'+color+';opacity:.7;font-size:10px">'+fmtGBP(t)+'</div>':'';
      th+=a>0?'<div style="color:'+(a>t?'#DC2626':'#2563EB')+';font-size:10px">'+fmtGBP(a)+'</div>':'';
      th+='</td>';
    });
    th+='<td style="text-align:right;padding:7px 4px;color:'+color+'">'+fmtGBP(catYtdT)+'</td>';
    th+='<td style="text-align:right;padding:7px 10px;color:'+color+'">'+fmtGBP(catAnnual)+'</td></tr>';
    th+='<tr><td colspan="'+(allMonths.length+3)+'" style="padding:0"><div id="expand-tblcat'+ci+'" style="display:block"><table style="width:100%;border-collapse:collapse;font-size:11px">';
    BGT_DATA.rows.filter(function(r){ return r.cat===cat; }).forEach(function(row){
      var lYtdT=ytdMonths.reduce(function(s,m){ return s+row.vals[m]; },0);
      var lAnnual=row.vals.reduce(function(a,b){ return a+b; },0);
      th+='<tr style="border-bottom:1px solid var(--bd)"><td style="padding:5px 10px 5px 26px;min-width:180px">'+row.name+'</td>';
      allMonths.forEach(function(_,m){
        var t=row.vals[m], a=getLineActual(cat,row.name,m);
        th+='<td style="text-align:right;padding:5px 4px;min-width:52px">';
        th+=t>0?'<div style="color:var(--ht);font-size:10px">'+fmtGBP(t)+'</div>':'';
        th+=a>0?'<div style="color:'+(a>t?'#DC2626':'#2563EB')+';font-size:10px;font-weight:500">'+fmtGBP(a)+'</div>':'';
        th+='</td>';
      });
      th+='<td style="text-align:right;padding:5px 4px;color:var(--mt)">'+fmtGBP(lYtdT)+'</td>';
      th+='<td style="text-align:right;padding:5px 10px;color:var(--mt)">'+fmtGBP(lAnnual)+'</td></tr>';
    });
    th+='</table></div></td></tr>';
  });

  // Totals
  th+='<tr style="background:var(--gp);font-weight:600;border-top:2px solid var(--bd2)"><td style="padding:8px 10px;color:var(--green)">TARGET TOTAL</td>';
  allMonths.forEach(function(_,m){ th+='<td style="text-align:right;padding:8px 4px;color:var(--green);font-size:11px">'+fmtGBP(getMonthTarget(m))+'</td>'; });
  th+='<td style="text-align:right;padding:8px 4px;color:var(--green)">'+fmtGBP(ytdTarget)+'</td><td style="text-align:right;padding:8px 10px;color:var(--green);font-weight:700">'+fmtGBP(annualTarget)+'</td></tr>';

  if(hasActual){
    th+='<tr style="background:var(--bp);font-weight:600"><td style="padding:8px 10px;color:var(--blue)">ACTUAL TOTAL</td>';
    allMonths.forEach(function(_,m){ th+='<td style="text-align:right;padding:8px 4px;color:var(--blue);font-size:11px">'+(actTots[m]>0?fmtGBP(actTots[m]):'—')+'</td>'; });
    th+='<td style="text-align:right;padding:8px 4px;color:var(--blue)">'+fmtGBP(ytdActualTotal)+'</td><td style="text-align:right;padding:8px 10px;color:var(--blue)">'+fmtGBP(actTots.reduce(function(a,b){ return a+b; },0))+'</td></tr>';
    th+='<tr style="background:var(--sf2)"><td style="padding:8px 10px;font-weight:600">VARIANCE</td>';
    allMonths.forEach(function(_,m){
      var v=actTots[m]-monthTots[m], fut=m>CUR_M;
      th+='<td style="text-align:right;padding:8px 4px;font-size:11px;font-weight:500;color:'+(fut?'var(--ht)':v>0?'#DC2626':v<0?'#059669':'var(--ht)')+'\">'+(fut||v===0?'—':(v>0?'+':'')+fmtGBP(v))+'</td>';
    });
    var ytdV=ytdActualTotal-ytdTarget;
    th+='<td style="text-align:right;padding:8px 4px;font-weight:600;color:'+(ytdV>0?'#DC2626':'#059669')+'">'+(ytdV>0?'+':'')+fmtGBP(ytdV)+'</td><td></td></tr>';
  }

  tblEl.innerHTML=th+'</tbody></table></div>';
}

function toggleCatExpand(id){
  var el=document.getElementById('expand-'+id);
  var arrow=document.getElementById('bgt-arrow-'+id);
  if(!el) return;
  var open=el.style.display==='none';
  el.style.display=open?'block':'none';
  if(arrow) arrow.style.transform=open?'rotate(90deg)':'';
}

// ════════════════════════════════════════════════
// END BUDGET MODULE
// ════════════════════════════════════════════════


function renderOverview(){
  // ── Channel summary bar ─────────────────────────────────
  const actual   = JSON.parse(localStorage.getItem(BGT_AK)||'{}');
  const cats     = Object.keys(BGT_DATA.catColors);
  const NOW      = new Date();
  const CUR_M    = NOW.getMonth();
  const ytdMonths= Array.from({length:CUR_M+1},(_,i)=>i);

  // YTD actual spend
  let ytdActual = 0;
  cats.forEach(cat=>{
    ytdMonths.forEach(m=>{
      ytdActual += BGT_DATA.rows.filter(r=>r.cat===cat)
        .reduce((s,r)=>s+parseFloat(actual[cat+'|'+r.name+'|'+m]||0),0);
    });
  });
  const ytdTarget = ytdMonths.reduce((s,m)=>s+BGT_DATA.monthlyTotals[m],0);

  // Pipeline value from _OPP_DATA
  let wonAmt=0, activeAmt=0, totalOpps=0;
  if(window._OPP_DATA && _OPP_DATA.length){
    const catStage=s=>{if(!s)return'other';const sl=s.toLowerCase();if(sl.includes('won')||sl.includes('ganada'))return'won';if(sl.includes('lost')||sl.includes('perdida'))return'lost';if(sl.includes('proposal')||sl.includes('cotiz'))return'proposal';return'discovery';};
    _OPP_DATA.forEach(o=>{
      const amt = parseFloat((o.amount||'0').toString().replace(/[£,]/g,''))||0;
      const stage = catStage(o.stage);
      if(stage==='won') wonAmt+=amt;
      if(stage!=='lost'&&stage!=='won') activeAmt+=amt;
      totalOpps++;
    });
  }

  // Instantly stats
  const instSent    = window._INST_AGG?.sent    || 0;
  const instReplies = window._INST_AGG?.replies || 0;
  const instOpens   = window._INST_AGG?.opens   || 0;

  // Channel bar cards
  const channels = [
    {name:'Web (GA4)',   color:'#1D9E75', status:'live',  val:null,               sub:'See GA4 tab'},
    {name:'Email',       color:'#7C3AED', status: instSent>0?'live':'pend',
                         val: instSent>0 ? instSent.toLocaleString()+' sent'    : '—',
                         sub: instSent>0 ? (instOpens/instSent*100).toFixed(1)+'% open rate' : 'Connect Instantly'},
    {name:'LinkedIn',    color:'#2563EB', status:'pend',  val:'1,983',            sub:'Followers · Pending API'},
    {name:'Paid Media',  color:'#D97706', status:'pend',  val:'—',                sub:'Google Ads pending'},
    {name:'Pipeline',    color:'#0891B2', status: totalOpps>0?'live':'pend',
                         val: totalOpps>0 ? totalOpps+' opps'                   : '—',
                         sub: totalOpps>0 ? 'Active: £'+Math.round(activeAmt).toLocaleString() : 'Monday.com'},
    {name:'Spend YTD',   color:'#DC2626', status: ytdActual>0?'live':'pend',
                         val: ytdActual>0 ? '£'+Math.round(ytdActual).toLocaleString() : '—',
                         sub: ytdActual>0 ? Math.round(ytdActual/ytdTarget*100)+'% of budget' : 'Upload expenses'},
  ];

  const barEl = document.getElementById('ov-channel-bar');
  if(barEl) barEl.innerHTML = channels.map(ch=>`
    <div style="background:${ch.color}10;border:1px solid ${ch.color}30;border-radius:var(--rl);padding:12px 14px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px">
        <span style="font-size:11px;font-weight:600;color:${ch.color}">${ch.name}</span>
        <span style="font-size:9px;padding:2px 6px;border-radius:8px;background:${ch.status==='live'?'#E1F5EE':ch.status==='pend'?'#FFFBEB':'#F5F3FF'};color:${ch.status==='live'?'#0F6E56':ch.status==='pend'?'#92400E':'#4C1D95'};font-weight:600;text-transform:uppercase">${ch.status==='live'?'Live':'Pending'}</span>
      </div>
      <div style="font-size:18px;font-weight:600;color:${ch.color};line-height:1.2">${ch.val||'—'}</div>
      <div style="font-size:11px;color:var(--mt);margin-top:2px">${ch.sub}</div>
    </div>`).join('');

  // ── Channel comparison table ────────────────────────────
  const tblEl = document.getElementById('ov-channel-table');
  if(tblEl){
    const rows = [
      {
        ch:'Web (GA4)', icon:'📊', color:'#1D9E75',
        reach:    document.getElementById('ga4-bg')?.textContent||'—',
        engage:   '—', cost: '£'+Math.round(ytdMonths.reduce((s,m)=>s+BGT_DATA.rows.filter(r=>r.cat==='Advertising & Campaigns').reduce((a,r)=>a+r.vals[m],0),0)).toLocaleString(),
        leads:    '—', roi: '—', status:'live'
      },
      {
        ch:'Email outreach', icon:'⚡', color:'#7C3AED',
        reach:   instSent>0?instSent.toLocaleString()+' sent':'—',
        engage:  instSent>0?(instOpens/instSent*100).toFixed(1)+'% open':'—',
        cost:    '£'+Math.round(ytdMonths.reduce((s,m)=>s+BGT_DATA.rows.filter(r=>r.name==='Mailing campaigns'||r.name==='Promoting activities').reduce((a,r)=>a+r.vals[m],0),0)).toLocaleString(),
        leads:   instReplies>0?instReplies+' replies':'—',
        roi:     instReplies>0&&wonAmt>0?'£'+Math.round(wonAmt/Math.max(instReplies,1)).toLocaleString()+'/reply':'—',
        status:  instSent>0?'live':'pend'
      },
      {
        ch:'LinkedIn', icon:'💼', color:'#2563EB',
        reach:   '1,983 followers', engage: '3.2% engagement',
        cost:    '£'+Math.round(ytdMonths.reduce((s,m)=>s+BGT_DATA.rows.filter(r=>r.name==='LinkedIn Premium').reduce((a,r)=>a+r.vals[m],0),0)).toLocaleString(),
        leads:   '—', roi:'—', status:'pend'
      },
      {
        ch:'PR Agency', icon:'📣', color:'#D97706',
        reach:   '—', engage:'—',
        cost:    '£'+Math.round(ytdMonths.reduce((s,m)=>s+BGT_DATA.rows.filter(r=>r.name==='PR Agency').reduce((a,r)=>a+r.vals[m],0),0)).toLocaleString(),
        leads:   '—', roi:'—', status:'live'
      },
      {
        ch:'Paid Media', icon:'🎯', color:'#DC2626',
        reach:   '—', engage:'—',
        cost:    '£'+Math.round(ytdMonths.reduce((s,m)=>s+BGT_DATA.rows.filter(r=>r.name==='Google Ads').reduce((a,r)=>a+r.vals[m],0),0)).toLocaleString(),
        leads:   '—', roi:'—', status:'pend'
      },
    ];

    tblEl.innerHTML = `
      <table class="dt" style="font-size:12px">
        <thead><tr>
          <th style="min-width:140px">Channel</th>
          <th>Reach</th>
          <th>Engagement</th>
          <th>YTD Cost</th>
          <th>Leads / Replies</th>
          <th>Est. ROI</th>
          <th>Status</th>
        </tr></thead>
        <tbody>`
      + rows.map(r=>`<tr>
          <td style="font-weight:500;color:${r.color}"><span style="margin-right:6px">${r.icon}</span>${r.ch}</td>
          <td style="color:var(--mt)">${r.reach}</td>
          <td style="color:var(--mt)">${r.engage}</td>
          <td style="font-weight:500;color:var(--tx)">${r.cost}</td>
          <td style="color:var(--mt)">${r.leads}</td>
          <td style="color:${r.roi!=='—'?'var(--green)':'var(--ht)'};font-weight:${r.roi!=='—'?'500':'400'}">${r.roi}</td>
          <td><span style="font-size:10px;padding:2px 7px;border-radius:8px;background:${r.status==='live'?'#E1F5EE':'#FFFBEB'};color:${r.status==='live'?'#0F6E56':'#92400E'};font-weight:600">${r.status==='live'?'Live':'Pending'}</span></td>
        </tr>`).join('')
      + `</tbody></table>`;
  }

  // ── Cost vs Pipeline bar ────────────────────────────────
  const cpEl = document.getElementById('ov-cost-pipeline');
  if(cpEl){
    const annualBudget = BGT_DATA.annualTotal;
    const pipelineTotal = wonAmt + activeAmt;
    const maxVal = Math.max(annualBudget, pipelineTotal, 1);
    const bars = [
      {l:'Annual budget',   v:annualBudget,  pct:annualBudget/maxVal*100,  col:'#DC2626',  fmt:'£'+Math.round(annualBudget).toLocaleString()},
      {l:'YTD actual spend',v:ytdActual,     pct:ytdActual/maxVal*100,     col:'#D97706',  fmt:'£'+Math.round(ytdActual).toLocaleString()},
      {l:'Active pipeline', v:activeAmt,     pct:activeAmt/maxVal*100,     col:'#0891B2',  fmt: totalOpps>0?'£'+Math.round(activeAmt).toLocaleString():'No data'},
      {l:'Won revenue',     v:wonAmt,        pct:wonAmt/maxVal*100,        col:'#1D9E75',  fmt: totalOpps>0?'£'+Math.round(wonAmt).toLocaleString():'No data'},
    ];
    cpEl.innerHTML = bars.map(b=>`
      <div style="margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px">
          <span style="font-size:12px;color:var(--mt)">${b.l}</span>
          <span style="font-size:12px;font-weight:500;color:${b.col}">${b.fmt}</span>
        </div>
        <div style="height:8px;background:var(--sf2);border-radius:4px;overflow:hidden">
          <div style="height:100%;width:${Math.min(b.pct,100).toFixed(1)}%;background:${b.col};border-radius:4px;transition:width .6s"></div>
        </div>
      </div>`).join('')
      + (totalOpps>0&&ytdActual>0&&wonAmt>0
        ? `<div style="margin-top:16px;padding:10px 12px;background:var(--gp);border-radius:var(--r);font-size:12px">
            <span style="color:var(--green);font-weight:600">Revenue/Cost ratio: </span>
            <span style="color:var(--tx)">${(wonAmt/ytdActual).toFixed(1)}x</span>
            <span style="color:var(--mt);margin-left:8px">(£${Math.round(wonAmt).toLocaleString()} won / £${Math.round(ytdActual).toLocaleString()} spent)</span>
          </div>`
        : '<div style="font-size:11px;color:var(--ht);text-align:center;margin-top:12px">Upload expenses + connect Monday to see ROI</div>');
  }
}


function buildSettings(){
  const pfs=[
    {id:'anthropic',icon:'🤖',name:'Anthropic API Key — IA (obligatorio para buscadores)',bg:'#F5F3FF',fields:[{k:'ak',l:'API Key',ph:'sk-ant-api03-…',hint:'<a href="https://console.anthropic.com/settings/keys" target="_blank">console.anthropic.com</a> → API Keys → Create Key'}]},
    {id:'g',icon:'📊',name:'Google — GA4 + GSC + Ads',bg:'#FEF2F2',fields:[{k:'clientId',l:'OAuth Client ID',ph:'123456789.apps.googleusercontent.com',hint:'<a href="https://console.cloud.google.com/apis/credentials" target="_blank">Google Cloud</a> → Credentials'},{k:'ga4',l:'GA4 Property ID',ph:'properties/529427059'},{k:'gsc',l:'Search Console URL (optional)',ph:'https://www.proximorol.com/'},{k:'ads',l:'Google Ads Customer ID (optional)',ph:'559-870-7352'},{k:'adsToken',l:'Developer Token (optional)',ph:'ABcDeFgH1234567890',hint:'<a href="https://ads.google.com/aw/apicenter" target="_blank">Google Ads</a> → Tools → API Center → Developer token'}]},
    {id:'li',icon:'💼',name:'LinkedIn',bg:'#EFF6FF',fields:[{k:'liId',l:'App Client ID',ph:'LinkedIn Client ID',hint:'<a href="https://www.linkedin.com/developers/apps" target="_blank">LinkedIn Developers</a> → tu app → Auth'},{k:'liSecret',l:'App Client Secret',ph:'••••••••••••••••',hint:'LinkedIn Developers → tu app → Auth → Client Secret'},{k:'liOrg',l:'Organization URN',ph:'urn:li:organization:12345678',hint:'Formato <strong>urn:li:organization:NÚMEROS</strong> — el ID numérico aparece en la URL de tu página de empresa'},{k:'liToken',l:'Access Token',ph:'AQX... (generado con el botón OAuth)',hint:'<button class="btn-s" style="font-size:11px;padding:4px 10px;margin-top:4px" onclick="liStartOAuth()">🔗 Conectar con LinkedIn OAuth</button> — guarda Client ID + Secret primero, luego haz clic aquí'}]},
    {id:'inst',icon:'📧',name:'Mailing masivo (Instantly)',bg:'#F5F3FF',fields:[{k:'instantly',l:'API Key',ph:'inst_xxxxxxxxxxxx',hint:'<a href="https://app.instantly.ai/app/settings/integrations" target="_blank">Instantly</a> → API'}]},
    {id:'mon',icon:'🏢',name:'CRM / HubSpot / Monday',bg:'#ECFEFF',fields:[{k:'monday',l:'API Token',ph:'eyJhbGciOiJ…',hint:'<a href="https://monday.com/apps/manage/tokens" target="_blank">Monday</a> → Developers'}]},
    {id:'hunter',icon:'🎯',name:'Hunter.io — Prospecting universitario',bg:'#FFF7ED',fields:[{k:'hunter',l:'API Key',ph:'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',hint:'<a href="https://hunter.io/api-keys" target="_blank">hunter.io/api-keys</a> — Plan gratuito: 50 búsquedas/mes'}]},
  ];
  document.getElementById('stg').innerHTML=pfs.map(pf=>{
    const conn=pf.id==='g'?!!(CFG.clientId&&CFG.ga4):pf.id==='anthropic'?!!CFG.ak:pf.fields.some(f=>CFG[f.k]);
    const flds=pf.fields.map(f=>`<div class="fl"><label class="fl-l">${f.l}</label><input class="fi" id="sf-${f.k}" value="${(CFG[f.k]||'')}" placeholder="${f.ph}" ${f.k==='ak'?'type="password"':''}/>${f.hint?`<div class="fh">${f.hint}</div>`:''}</div>`).join('');
    return`<div class="sc2"><div class="scH" onclick="tgS('${pf.id}')"><div class="sico" style="background:${pf.bg}">${pf.icon}</div><div style="flex:1;font-size:13px;font-weight:500">${pf.name}</div><span style="font-size:11px;color:${conn?'var(--green)':'var(--ht)'}">${conn?'● Configurado':'○ Sin configurar'}</span><svg style="width:16px;height:16px;color:var(--ht);transition:transform .2s;margin-left:8px" id="sch-${pf.id}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg></div><div class="sbdy" id="sbd-${pf.id}">${flds}<div class="sa"><button class="btn-s" onclick="svS('${pf.id}')">Guardar</button><button class="btn-c" onclick="clrS('${pf.id}')">Borrar</button></div></div></div>`;
  }).join('');
}
function tgS(id){const b=document.getElementById('sbd-'+id);const c=document.getElementById('sch-'+id);const o=b.classList.toggle('op');if(c)c.style.transform=o?'rotate(90deg)':'';}
function svS(id){
  const m={anthropic:{ak:'sf-ak'},g:{clientId:'sf-clientId',ga4:'sf-ga4',gsc:'sf-gsc',ads:'sf-ads',adsToken:'sf-adsToken'},li:{liId:'sf-liId',liSecret:'sf-liSecret',liOrg:'sf-liOrg',liToken:'sf-liToken'},inst:{instantly:'sf-instantly'},mon:{monday:'sf-monday'},hunter:{hunter:'sf-hunter'}};
  Object.entries(m[id]||{}).forEach(([k,eid])=>{const el=document.getElementById(eid);if(el){let v=el.value.trim();if(k==='ga4'&&v&&!v.startsWith('properties/'))v='properties/'+v;CFG[k]=v;}});
  localStorage.setItem(CK,JSON.stringify(CFG));buildSettings();loadAll();tgS(id);
  const t=document.createElement('div');t.className='toast';t.textContent='✓ Guardado — recargando datos';document.body.appendChild(t);setTimeout(()=>t.remove(),2500);
}
function clrS(id){const m={anthropic:['ak'],g:['clientId','ga4','gsc','ads'],li:['liId','liSecret','liOrg','liToken'],inst:['instantly'],mon:['monday'],hunter:['hunter']};(m[id]||[]).forEach(k=>CFG[k]='');localStorage.setItem(CK,JSON.stringify(CFG));buildSettings();loadAll();}


/* ── MONTHLY REPORT ── */
const RK = 'eco_report_v1';
let ACTIVE_MONTH = new Date().getMonth();
const AREAS = ['General','Referral Scheme','Veolia / Biffa','Trade Associations','Overall'];
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function selectMonth(idx, btn){
  ACTIVE_MONTH = idx;
  document.querySelectorAll('#month-selector .dp').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  renderReport();
}

function getReportData(){
  return JSON.parse(localStorage.getItem(RK)||'{}');
}
function saveReport(){
  const data = getReportData();
  const mk = `m${ACTIVE_MONTH}`;
  if(!data[mk]) data[mk]={};
  // Save pipeline rows
  AREAS.forEach((area,i)=>{
    const spend = parseFloat(document.getElementById(`rsp_${i}`)?.value||0)||0;
    const leads = parseInt(document.getElementById(`rld_${i}`)?.value||0)||0;
    const opps  = parseInt(document.getElementById(`rop_${i}`)?.value||0)||0;
    data[mk][`area_${i}`] = {spend, leads, opps};
  });
  // Save notes and extras
  data[mk].notes = document.getElementById('rep-notes')?.value||'';
  data[mk].svc_hits = parseInt(document.getElementById('rep-svc-hits')?.value||0)||0;
  data[mk].conversions = parseInt(document.getElementById('rep-conversions')?.value||0)||0;
  localStorage.setItem(RK, JSON.stringify(data));
  const t=document.createElement('div');t.className='toast';t.textContent='✓ Month data saved';document.body.appendChild(t);setTimeout(()=>t.remove(),2500);
  renderYearTable();
}

function renderReport(){
  const data = getReportData();
  const mk = `m${ACTIVE_MONTH}`;
  const md = data[mk]||{};
  const budget = JSON.parse(localStorage.getItem(BK)||'{}');

  // Pipeline table
  const tbody = document.getElementById('rep-pipeline-body');
  if(tbody){
    tbody.innerHTML = AREAS.map((area,i)=>{
      const saved = md[`area_${i}`]||{};
      const spend = saved.spend||0;
      const leads = saved.leads||0;
      const opps  = saved.opps||0;
      const cpl   = leads>0?(spend/leads).toFixed(0):'—';
      const pipeVal = opps>0?(opps*5000).toLocaleString():'—';
      const isTotal = area==='Overall';
      return `<tr style="${isTotal?'background:var(--gp);font-weight:500':''}">
        <td><span class="tm">${area}</span></td>
        <td><input type="number" id="rsp_${i}" value="${spend||''}" placeholder="0" style="width:90px;padding:5px 8px;border:1px solid var(--bd2);border-radius:6px;background:var(--sf2);color:var(--tx);font-size:12px;font-family:'DM Mono',monospace;text-align:right" ${isTotal?'readonly style="width:90px;padding:5px 8px;border:1px solid var(--bd2);border-radius:6px;background:var(--sf2);color:var(--tx);font-size:12px;font-family:DM Mono,monospace;text-align:right;opacity:.7"':''}/></td>
        <td><input type="number" id="rld_${i}" value="${leads||''}" placeholder="0" style="width:70px;padding:5px 8px;border:1px solid var(--bd2);border-radius:6px;background:var(--sf2);color:var(--tx);font-size:12px;font-family:'DM Mono',monospace;text-align:right"/></td>
        <td><input type="number" id="rop_${i}" value="${opps||''}" placeholder="0" style="width:70px;padding:5px 8px;border:1px solid var(--bd2);border-radius:6px;background:var(--sf2);color:var(--tx);font-size:12px;font-family:'DM Mono',monospace;text-align:right"/></td>
        <td style="text-align:right;font-size:12px;color:var(--mt)">${cpl}</td>
        <td style="text-align:right;font-size:12px;color:var(--green);font-weight:500">${pipeVal!=='—'?'£'+pipeVal:'—'}</td>
      </tr>`;
    }).join('');
  }

  // Channel cards - get budget for this month
  const chSpend = {
    'Paid Media': parseFloat(budget[`paid_media_${ACTIVE_MONTH}`]||0),
    'LinkedIn Ads': parseFloat(budget[`li_ads_${ACTIVE_MONTH}`]||0),
    'Design': parseFloat(budget[`design_${ACTIVE_MONTH}`]||0),
    'Email': parseFloat(budget[`email_${ACTIVE_MONTH}`]||0),
    'Events & PR': parseFloat(budget[`events_${ACTIVE_MONTH}`]||0),
    'Tools': parseFloat(budget[`tools_${ACTIVE_MONTH}`]||0),
  };
  const totalSpend = Object.values(chSpend).reduce((a,b)=>a+b,0);
  const chColors = {'Paid Media':'#FEF2F2','LinkedIn Ads':'#EFF6FF','Design':'#F5F3FF','Email':'#FFFBEB','Events & PR':'#FEF2F2','Tools':'#ECFEFF'};
  const chIcons = {'Paid Media':'📢','LinkedIn Ads':'💼','Design':'🎨','Email':'⚡','Events & PR':'🎪','Tools':'🛠️'};
  const repCards = document.getElementById('rep-channel-cards');
  if(repCards){
    repCards.innerHTML = Object.entries(chSpend).map(([ch,spend])=>`
      <div class="kpi" style="border-left:3px solid var(--green)">
        <div class="kl">${chIcons[ch]} ${ch}</div>
        <div class="kv" style="font-size:20px">${spend>0?fmtGBP(spend):'—'}</div>
        <div class="ks">${spend>0&&totalSpend>0?((spend/totalSpend)*100).toFixed(0)+'% of total':''} · Target budget</div>
      </div>`).join('');
  }

  // Notes & extras
  const notesEl = document.getElementById('rep-notes');
  if(notesEl) notesEl.value = md.notes||'';
  const svcEl = document.getElementById('rep-svc-hits');
  if(svcEl) svcEl.value = md.svc_hits||'';
  const convEl = document.getElementById('rep-conversions');
  if(convEl) convEl.value = md.conversions||'';

  // MoM charts
  renderMoMCharts(data, budget);
  renderYearTable();

  // Sessions by source from GA4 (if available)
  renderRepSessions();
}

function renderMoMCharts(data, budget){
  // Spend MoM
  const spendByMonth = MONTHS_SHORT.map((_,i)=>{
    const mk=`m${i}`;const md=data[mk]||{};
    // sum all areas spend OR use budget
    const budgetTotal = ['paid_media','li_ads','design','email','events','tools','other'].reduce((a,ch)=>a+parseFloat(budget[`${ch}_${i}`]||0),0);
    const manualTotal = AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.spend||0),0);
    return manualTotal>0?manualTotal:budgetTotal;
  });

  const leadsMonth = MONTHS_SHORT.map((_,i)=>{const md=data[`m${i}`]||{};return AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.leads||0),0);});
  const oppsMonth  = MONTHS_SHORT.map((_,i)=>{const md=data[`m${i}`]||{};return AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.opps||0),0);});

  mkC('rep-spend-chart','bar',{labels:MONTHS_SHORT,datasets:[{label:'Spend £',data:spendByMonth,backgroundColor:MONTHS_SHORT.map((_,i)=>i===ACTIVE_MONTH?'rgba(29,158,117,.8)':'rgba(29,158,117,.2)'),borderColor:MONTHS_SHORT.map((_,i)=>i===ACTIVE_MONTH?'#1D9E75':'rgba(29,158,117,.4)'),borderWidth:1.5,borderRadius:4}]},{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10},callback:v=>fmtGBP(v)},grid:{color:GC},beginAtZero:true}}});

  mkC('rep-leads-chart','bar',{labels:MONTHS_SHORT,datasets:[
    {label:'Leads',data:leadsMonth,backgroundColor:MONTHS_SHORT.map((_,i)=>i===ACTIVE_MONTH?'rgba(37,99,235,.8)':'rgba(37,99,235,.2)'),borderRadius:4,stack:'a'},
    {label:'Opps',data:oppsMonth,backgroundColor:MONTHS_SHORT.map((_,i)=>i===ACTIVE_MONTH?'rgba(124,58,237,.8)':'rgba(124,58,237,.2)'),borderRadius:4,stack:'b'},
  ]},{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},beginAtZero:true}},plugins:{legend:{display:true,position:'bottom',labels:{font:{size:10},boxWidth:10,padding:8}}}});
}

async function renderRepSessions(){
  const srcEl = document.getElementById('rep-sessions-src');
  if(!srcEl) return;
  if(!TOKEN){srcEl.innerHTML='<div class="notice" style="padding:10px"><strong>GA4 not connected</strong></div>';return;}
  srcEl.innerHTML='<div class="ld"><div class="sp2"></div>Loading GA4…</div>';
  try{
    // Get sessions for selected month
    const year = 2026;
    const monthStart = new Date(year, ACTIVE_MONTH, 1);
    const monthEnd = new Date(year, ACTIVE_MONTH+1, 0);
    const sd = fD(monthStart); const ed = fD(monthEnd);
    const data = await gF(`https://analyticsdata.googleapis.com/v1beta/${CFG.ga4}:runReport`,{
      dateRanges:[{startDate:sd,endDate:ed}],
      dimensions:[{name:'sessionDefaultChannelGroup'}],
      metrics:[{name:'sessions'},{name:'totalUsers'},{name:'screenPageViews'}],
      limit:10,orderBys:[{metric:{metricName:'sessions'},desc:true}]
    });
    const rows = data.rows||[];
    const total = rows.reduce((a,r)=>a+parseInt(r.metricValues[0].value),0);
    const totalPV = rows.reduce((a,r)=>a+parseInt(r.metricValues[2].value),0);
    const totalUsers = rows.reduce((a,r)=>a+parseInt(r.metricValues[1].value),0);

    // Update session chart
    mkC('rep-sessions-chart','bar',{labels:rows.map(r=>r.dimensionValues[0].value),datasets:[{label:'Sessions',data:rows.map(r=>parseInt(r.metricValues[0].value)),backgroundColor:COLORS.map(c=>c+'33'),borderColor:COLORS,borderWidth:1.5,borderRadius:4}]},{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},beginAtZero:true}}});

    srcEl.innerHTML=`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
      <div class="sb2"><div class="sv">${total.toLocaleString()}</div><div class="slb">Sessions</div></div>
      <div class="sb2"><div class="sv">${totalUsers.toLocaleString()}</div><div class="slb">Users</div></div>
      <div class="sb2"><div class="sv">${totalPV.toLocaleString()}</div><div class="slb">Pageviews</div></div>
    </div>
    <table class="dt"><thead><tr><th>Source</th><th>Sessions</th><th>%</th></tr></thead><tbody>${
      rows.map(r=>{const s=parseInt(r.metricValues[0].value);const pct=total>0?((s/total)*100).toFixed(0):0;return`<tr><td><span class="tm">${r.dimensionValues[0].value}</span><div class="mb"><div class="mf" style="width:${pct}%;background:#1D9E75"></div></div></td><td>${s.toLocaleString()}</td><td>${pct}%</td></tr>`;}).join('')
    }</tbody></table>`;

    // Also update email chart if Instantly connected
    renderRepEmail();
  }catch(e){srcEl.innerHTML=`<div class="notice" style="padding:10px"><strong>GA4 error</strong>${e.message}</div>`;}
}

async function renderRepEmail(){
  const emailEl = document.getElementById('rep-email-chart');
  if(!emailEl||!CFG.instantly) return;
  try{
    const hdrs2={'Authorization':'Bearer '+CFG.instantly,'Content-Type':'application/json'};
    let r2;
    try{ r2=await fetch('https://api.instantly.ai/api/v2/campaigns?limit=50',{headers:hdrs2}); }catch(e){ r2=null; }
    if(!r2||!r2.ok){ try{ r2=await fetch(`https://corsproxy.io/?${encodeURIComponent('https://api.instantly.ai/api/v2/campaigns?limit=50')}`,{headers:hdrs2}); }catch(e){ r2=null; } }
    if(!r2||!r2.ok) return;
    const d2=await r2.json();
    const camps=Array.isArray(d2)?d2:(d2.items||d2.campaigns||d2.data||[]);
    const sent=camps.reduce((a,c)=>a+(c.campaign_stats?.emails_sent_count||0),0);
    const opens=camps.reduce((a,c)=>a+(c.campaign_stats?.unique_opens_count||0),0);
    const replies=camps.reduce((a,c)=>a+(c.campaign_stats?.reply_count||0),0);
    const clicks=camps.reduce((a,c)=>a+(c.campaign_stats?.link_clicks_count||0),0);
    mkC('rep-email-chart','bar',{
      labels:['Sent','Opens','Clicks','Replies'],
      datasets:[{data:[sent,opens,clicks,replies],backgroundColor:['rgba(124,58,237,.15)','rgba(124,58,237,.3)','rgba(124,58,237,.5)','rgba(124,58,237,.8)'],borderColor:'#7C3AED',borderWidth:1.5,borderRadius:4}]
    },{scales:{x:{ticks:{color:TC,font:{size:10}},grid:{color:GC}},y:{ticks:{color:TC,font:{size:10}},grid:{color:GC},beginAtZero:true}}});
  }catch(e){}
}

function renderYearTable(){
  const data = getReportData();
  const budget = JSON.parse(localStorage.getItem(BK)||'{}');
  const headEl = document.getElementById('rep-year-head');
  const bodyEl = document.getElementById('rep-year-body');
  if(!headEl||!bodyEl) return;

  headEl.innerHTML=`<tr>
    <th style="min-width:140px">Metric</th>
    ${MONTHS_SHORT.map((m,i)=>`<th style="${i===ACTIVE_MONTH?'background:var(--gp);color:var(--green)':''}">${m}</th>`).join('')}
    <th>Total / Avg</th>
  </tr>`;

  const rows2 = [
    {label:'💰 Total spend (£)', vals: MONTHS_SHORT.map((_,i)=>{
      const mk=`m${i}`;const md=data[mk]||{};
      const manual=AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.spend||0),0);
      const bdg=['paid_media','li_ads','design','email','events','tools','other'].reduce((a,ch)=>a+parseFloat(budget[`${ch}_${i}`]||0),0);
      return manual>0?manual:bdg;
    }), fmt:v=>v>0?fmtGBP(v):'—', sum:true},
    {label:'👥 Leads', vals:MONTHS_SHORT.map((_,i)=>{const md=data[`m${i}`]||{};return AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.leads||0),0);}), fmt:v=>v>0?v:'—', sum:true},
    {label:'🎯 Opportunities', vals:MONTHS_SHORT.map((_,i)=>{const md=data[`m${i}`]||{};return AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.opps||0),0);}), fmt:v=>v>0?v:'—', sum:true},
    {label:'💷 Cost per lead', vals:MONTHS_SHORT.map((_,i)=>{
      const md=data[`m${i}`]||{};
      const spend=AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.spend||0),0);
      const leads=AREAS.slice(0,4).reduce((a,_,j)=>a+(md[`area_${j}`]?.leads||0),0);
      return leads>0?Math.round(spend/leads):0;
    }), fmt:v=>v>0?fmtGBP(v):'—', avg:true},
    {label:'📝 Form conversions', vals:MONTHS_SHORT.map((_,i)=>data[`m${i}`]?.conversions||0), fmt:v=>v>0?v:'—', sum:true},
    {label:'🌐 Service page hits', vals:MONTHS_SHORT.map((_,i)=>data[`m${i}`]?.svc_hits||0), fmt:v=>v>0?v:'—', sum:true},
  ];

  bodyEl.innerHTML = rows2.map(row=>{
    const total = row.sum ? row.vals.reduce((a,b)=>a+b,0) : row.avg ? (row.vals.filter(v=>v>0).reduce((a,b)=>a+b,0)/(row.vals.filter(v=>v>0).length||1)) : 0;
    return `<tr>
      <td><span class="tm">${row.label}</span></td>
      ${row.vals.map((v,i)=>`<td style="text-align:right;${i===ACTIVE_MONTH?'background:var(--gp);font-weight:500;color:var(--green)':''}">${row.fmt(v)}</td>`).join('')}
      <td style="text-align:right;font-weight:500;color:var(--tx)">${row.fmt(total)}</td>
    </tr>`;
  }).join('');
}


