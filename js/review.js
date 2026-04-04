/* ═══════════════════════════════════════════════════════════════
   REVIEW ENGINE — Motor de revisión periódica
   Diseñado para aprender sin gastar a diario.
   Weekly (Sonnet): ~$0.05/semana
   Monthly (Opus):  ~$0.15/mes
   Total: ~$0.35/mes vs $4.02/mes del sistema automático
   ═══════════════════════════════════════════════════════════════ */

const RV_KEY = 'pr_reviews_v1';

/* ══════════════════════════════════════════
   PERSISTENCIA
══════════════════════════════════════════ */

function rvLoad() {
  try { return JSON.parse(localStorage.getItem(RV_KEY) || 'null') || rvDefault(); }
  catch (_) { return rvDefault(); }
}
function rvSave(d) { try { localStorage.setItem(RV_KEY, JSON.stringify(d)); } catch (_) {} }
function rvDefault() {
  return {
    lastWeeklyReview  : null,  /* ISO date */
    lastMonthlyReview : null,
    weeklyReviews     : [],    /* últimas 12 */
    monthlyReviews    : [],    /* últimos 6 */
  };
}

/* ══════════════════════════════════════════
   WEEKLY REVIEW — Sonnet
   Qué hace:
   1. Lee sesiones acumuladas desde la última revisión
   2. Lee métricas actuales del dashboard (DOM)
   3. Compara con objetivos de memoria
   4. Genera 3 prioridades + actualiza memoria
   Coste: ~$0.05 por ejecución
══════════════════════════════════════════ */

async function rvRunWeekly() {
  if (!CFG.ak) { alert('Añade tu Anthropic API key en Settings para usar las revisiones.'); return; }

  const btn = document.getElementById('rv-weekly-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Analizando semana…'; }

  const rv    = rvLoad();
  const mem   = typeof memLoad === 'function' ? memLoad() : {};
  const buf   = JSON.parse(localStorage.getItem('pr_session_buffer_v1') || '[]');

  /* ── Recoger métricas del dashboard ── */
  const metrics = rvCollectMetrics();

  /* ── Construir el contexto de revisión ── */
  const sinceDate = rv.lastWeeklyReview
    ? new Date(rv.lastWeeklyReview).toLocaleDateString('es-ES')
    : 'el inicio';

  const sessionSummary = buf.length > 0
    ? `CONVERSACIONES DESDE ${sinceDate.toUpperCase()}:\n` +
      buf.slice(-15).map((b, i) => `[${i+1}] Usuario: ${b.user}\nAsistente: ${b.asst}`).join('\n\n')
    : 'Sin conversaciones registradas esta semana.';

  const memProfile = mem.businessProfile || {};
  const pendingRecs = (mem.recommendations?.pending || []).slice(0, 5).map(r => r.text).join(' | ');
  const failedRecs  = (mem.recommendations?.failed  || []).slice(0, 3).map(r => r.text).join(' | ');

  const prompt = `Eres el estratega de marketing de Próximo Rol (coaching de entrevistas, España/LATAM). Haz la revisión semanal.

PERFIL DEL NEGOCIO:
- Objetivo: ${memProfile.monthlyClientGoal || 'no definido'} clientes/mes a €${memProfile.avgTicket || 97}/ticket
- MRR actual: ${memProfile.currentMRR ? '€' + memProfile.currentMRR : 'no registrado'}
- Cuello de botella conocido: ${memProfile.mainBottleneck || 'no identificado'}

MÉTRICAS DASHBOARD (período activo: ${metrics.periodo}):
${Object.entries(metrics).filter(([k]) => k !== 'periodo').map(([k,v]) => `- ${k}: ${v}`).join('\n')}

RECOMENDACIONES PENDIENTES: ${pendingRecs || 'ninguna registrada'}
INTENTOS FALLIDOS (no repetir): ${failedRecs || 'ninguno'}

${sessionSummary}

GENERA la revisión semanal con esta estructura EXACTA:

## Estado de la semana
[1-2 frases directas sobre cómo fue la semana en términos de progreso real]

## Los 3 aprendizajes clave
[3 insights concretos extraídos de las conversaciones y métricas — cada uno en 1 frase]

## 3 prioridades para la próxima semana
[3 acciones ordenadas por impacto. Para cada una: qué hacer, por qué importa ahora, cómo medir si funcionó]

## Ajuste de calibración
[1 frase sobre qué debemos cambiar en nuestra estrategia basado en lo que observaste]

Sé directo. Sin introducciones. En español.`;

  const resultEl = document.getElementById('rv-weekly-result');
  try {
    const data = await antFetch({
      model     : 'claude-sonnet-4-20250514',
      max_tokens: 700,
      messages  : [{ role: 'user', content: prompt }],
    });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();

    /* ── Guardar revisión ── */
    const review = { date: new Date().toISOString(), summary: text, metrics };
    rv.weeklyReviews.unshift(review);
    rv.weeklyReviews = rv.weeklyReviews.slice(0, 12);
    rv.lastWeeklyReview = review.date;
    rvSave(rv);

    /* ── Limpiar session buffer tras revisar ── */
    localStorage.removeItem('pr_session_buffer_v1');
    if (typeof cpUpdateSaveBtn === 'function') cpUpdateSaveBtn();

    /* ── Extraer insights a la memoria ── */
    if (typeof memAutoExtract === 'function') {
      await memAutoExtract(
        'REVISIÓN SEMANAL — contexto completo del negocio',
        text
      );
    }

    /* ── Renderizar resultado ── */
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">📅</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--tx)">Revisión semanal — ${new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</div>
            <div style="font-size:11px;color:var(--ht)">Basada en ${buf.length} conversaciones · memoria actualizada</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--tx);line-height:1.75;white-space:pre-wrap">${rvMd(text)}</div>
        <div style="margin-top:12px;display:flex;gap:8px">
          <button onclick="rvExportWeekly()" style="padding:5px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">Exportar texto</button>
          <button onclick="showP('pnl',null)" style="padding:5px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">Ver P&L →</button>
        </div>`;
    }
  } catch (err) {
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `<div style="color:var(--red);font-size:12px">Error: ${err.message}</div>`;
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📅 Weekly Review'; }
    rvRenderHistory();
  }
}

/* ══════════════════════════════════════════
   MONTHLY REVIEW — Opus
   Más profundo: P&L, estrategia, recalibración
   Coste: ~$0.15 por ejecución
══════════════════════════════════════════ */

async function rvRunMonthly() {
  if (!CFG.ak) return;

  const btn = document.getElementById('rv-monthly-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⟳ Análisis profundo…'; }

  const rv      = rvLoad();
  const mem     = typeof memLoad === 'function' ? memLoad() : {};
  const metrics = rvCollectMetrics();
  const pnlCtx  = window._PNL_CONTEXT || null;

  const lastWeeklies = rv.weeklyReviews.slice(0, 4).map(r =>
    `[${new Date(r.date).toLocaleDateString('es-ES')}]\n${r.summary?.slice(0, 400)}`
  ).join('\n\n---\n\n');

  const memProfile = mem.businessProfile || {};

  const prompt = `Eres el CMO y estratega senior de Próximo Rol (coaching de entrevistas profesionales, España/LATAM). 

Haz la revisión mensual estratégica profunda.

PERFIL Y OBJETIVOS:
- Target: ${memProfile.monthlyClientGoal || '?'} clientes/mes · Ticket medio: €${memProfile.avgTicket || 97}
- MRR actual: ${memProfile.currentMRR ? '€' + memProfile.currentMRR : 'no definido'}
- Cuello de botella: ${memProfile.mainBottleneck || 'no identificado'}
- Reto principal: ${memProfile.mainChallenge || 'tráfico branded'}

MÉTRICAS ACTUALES: ${JSON.stringify(metrics)}

${pnlCtx ? `P&L DEL MES:
- Revenue: £${Math.round(pnlCtx.mc?.gross_revenue || 0).toLocaleString()}
- EBITDA: £${Math.round(pnlCtx.mc?.ebitda || 0).toLocaleString()}
- CAC: ${pnlCtx.mc?.cac ? '£' + pnlCtx.mc.cac : 'N/A'}
- LTV/CAC: ${pnlCtx.mc?.ltv_cac_ratio || 'N/A'}` : ''}

RESUMEN DE LAS 4 SEMANAS:
${lastWeeklies || 'Sin revisiones semanales registradas este mes.'}

RECOMENDACIONES QUE NO FUNCIONARON (no repetir): ${(mem.recommendations?.failed || []).map(r => r.text).slice(0,3).join(' | ') || 'ninguna'}

Genera la revisión mensual estratégica:

## Diagnóstico del mes
[Estado real del negocio: qué funcionó, qué no, por qué]

## Análisis de unit economics
[CAC, LTV, margen — ¿estamos en el camino correcto? ¿qué ajustar?]

## El cuello de botella real este mes
[Una sola cosa que más limita el crecimiento. Ser específico y directo.]

## Estrategia ajustada para el próximo mes
[3 iniciativas priorizadas con estimación de impacto en revenue]

## Qué dejar de hacer
[1-2 cosas que están consumiendo recursos sin retorno]

## OKR sugerido para el próximo mes
[Objetivo + 2-3 resultados clave medibles]

En español. Sin introducciones. Máximo 500 palabras.`;

  const resultEl = document.getElementById('rv-monthly-result');
  try {
    const data = await antFetch({
      model     : 'claude-opus-4-5',
      max_tokens: 1000,
      messages  : [{ role: 'user', content: prompt }],
    });
    const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();

    const review = { date: new Date().toISOString(), summary: text };
    rv.monthlyReviews.unshift(review);
    rv.monthlyReviews = rv.monthlyReviews.slice(0, 6);
    rv.lastMonthlyReview = review.date;
    rvSave(rv);

    if (typeof memAutoExtract === 'function') {
      await memAutoExtract('REVISIÓN MENSUAL ESTRATÉGICA', text.slice(0, 800));
    }

    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
          <span style="font-size:18px">📊</span>
          <div>
            <div style="font-size:13px;font-weight:600;color:var(--tx)">Revisión mensual — ${new Date().toLocaleDateString('es-ES', { month:'long', year:'numeric' })}</div>
            <div style="font-size:11px;color:var(--ht)">Análisis Opus · basado en ${rv.weeklyReviews.filter(r => {
              const d = new Date(r.date); const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length} revisiones semanales</div>
          </div>
        </div>
        <div style="font-size:13px;color:var(--tx);line-height:1.75">${rvMd(text)}</div>
        <div style="margin-top:12px">
          <button onclick="rvExportMonthly()" style="padding:5px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:inherit">Exportar PDF</button>
        </div>`;
    }
  } catch (err) {
    if (resultEl) {
      resultEl.style.display = 'block';
      resultEl.innerHTML = `<div style="color:var(--red);font-size:12px">Error: ${err.message}</div>`;
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '📊 Monthly Strategy (Opus)'; }
    rvRenderHistory();
  }
}

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */

function rvCollectMetrics() {
  const m = { periodo: typeof sD === 'function' ? `${sD()} → ${eD()}` : 'N/A' };

  const readKPIs = id => {
    const el = document.getElementById(id);
    if (!el) return {};
    const out = {};
    el.querySelectorAll('.kpi').forEach(k => {
      const lbl = k.querySelector('.kl')?.textContent?.trim();
      const val = k.querySelector('.kv')?.textContent?.trim();
      if (lbl && val && !val.includes('—')) out[lbl] = val;
    });
    return out;
  };

  const ga4 = readKPIs('ga4-kpis');
  if (Object.keys(ga4).length) m.ga4 = ga4;

  const li = readKPIs('li-kpis');
  if (Object.keys(li).length) m.linkedin = li;

  if (typeof _OPP_DATA !== 'undefined' && _OPP_DATA.length) {
    m.pipeline = { total: _OPP_DATA.length };
  }

  if (window._INST_AGG?.sent > 0) {
    m.email = {
      enviados: window._INST_AGG.sent,
      apertura: ((window._INST_AGG.opens / window._INST_AGG.sent) * 100).toFixed(1) + '%',
    };
  }

  return m;
}

function rvMd(text) {
  return text
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/^## (.+)$/gm, '<div style="font-size:13px;font-weight:600;color:var(--tx);margin:12px 0 5px">$1</div>')
    .replace(/^### (.+)$/gm, '<div style="font-size:12px;font-weight:600;margin:8px 0 4px">$1</div>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^[-•] (.+)$/gm, '<div style="display:flex;gap:6px;margin:2px 0"><span style="color:var(--green);flex-shrink:0">•</span><span>$1</span></div>')
    .replace(/\n/g, '<br>');
}

function rvRenderHistory() {
  const el = document.getElementById('rv-history');
  if (!el) return;
  const rv = rvLoad();
  const all = [
    ...rv.weeklyReviews.map(r => ({ ...r, type:'weekly' })),
    ...rv.monthlyReviews.map(r => ({ ...r, type:'monthly' })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 8);

  if (all.length === 0) {
    el.innerHTML = '<div style="font-size:12px;color:var(--ht);padding:8px 0">Sin revisiones todavía. La primera revisión semanal establecerá la línea base.</div>';
    return;
  }

  el.innerHTML = all.map(r => `
    <div style="display:flex;gap:8px;padding:8px 0;border-bottom:1px solid var(--bd);align-items:flex-start;cursor:pointer" onclick="rvShowReview('${r.date}','${r.type}')">
      <span style="font-size:13px;flex-shrink:0">${r.type === 'monthly' ? '📊' : '📅'}</span>
      <div style="flex:1;min-width:0">
        <div style="font-size:12px;font-weight:500;color:var(--tx)">${r.type === 'monthly' ? 'Revisión mensual' : 'Revisión semanal'}</div>
        <div style="font-size:11px;color:var(--ht)">${new Date(r.date).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</div>
      </div>
      <span style="font-size:10px;color:var(--ht);flex-shrink:0">Ver →</span>
    </div>`).join('');
}

function rvShowReview(date, type) {
  const rv = rvLoad();
  const list = type === 'monthly' ? rv.monthlyReviews : rv.weeklyReviews;
  const review = list.find(r => r.date === date);
  if (!review) return;
  const resultEl = document.getElementById(`rv-${type}-result`);
  if (!resultEl) return;
  resultEl.style.display = 'block';
  resultEl.innerHTML = `
    <div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:10px">
      ${type === 'monthly' ? '📊' : '📅'} ${new Date(date).toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
    </div>
    <div style="font-size:13px;color:var(--tx);line-height:1.75">${rvMd(review.summary || '')}</div>`;
  resultEl.scrollIntoView({ behavior: 'smooth' });
}

function rvExportWeekly() {
  const rv = rvLoad();
  const r = rv.weeklyReviews[0];
  if (!r) return;
  const blob = new Blob([`REVISIÓN SEMANAL — ${new Date(r.date).toLocaleDateString('es-ES')}\n\n${r.summary}`], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `revision-semanal-${r.date.slice(0,10)}.txt`;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}

function rvExportMonthly() {
  rvExportWeekly(); /* Simple text export — PDF requires more setup */
}

/* ══════════════════════════════════════════
   INIT — Inyecta la página en el dashboard
══════════════════════════════════════════ */

(function rvInit() {
  function injectReviewPage() {
    /* 1. Nav item en sección Planning */
    const nav = document.querySelector('.sb-nav');
    if (nav) {
      const planningItems = Array.from(nav.querySelectorAll('.ni'))
        .find(el => el.textContent.includes('P&L') || el.textContent.includes('Budget'));
      if (planningItems) {
        const rvNav = document.createElement('div');
        rvNav.className = 'ni';
        rvNav.setAttribute('onclick', "showP('review', this)");
        rvNav.innerHTML = `<div class="nico">📅</div>Revisión periódica<span class="nb" style="background:#F5F3FF;color:#7C3AED">Weekly</span>`;
        planningItems.insertAdjacentElement('afterend', rvNav);
      }
    }

    /* 2. Página */
    const main = document.querySelector('.main');
    if (!main) return;

    const page = document.createElement('div');
    page.className = 'page';
    page.id = 'page-review';
    page.innerHTML = `
      <div class="sh">
        <span class="sl">Revisión periódica</span>
        <div class="sln"></div>
      </div>

      <!-- Cost transparency banner -->
      <div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:12px 16px;margin-bottom:14px;display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap">
        <div style="flex:1;min-width:200px">
          <div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:3px">Coste por llamada</div>
          <div style="font-size:11px;color:var(--mt)">Weekly Review (Sonnet): ~$0.05 · Monthly Strategy (Opus): ~$0.15 · Total típico: ~$0.35/mes</div>
        </div>
        <div style="font-size:11px;color:var(--ht);max-width:260px">Nada corre automáticamente — tú decides cuándo revisar.</div>
      </div>

      <!-- Action buttons -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
        <div class="cd">
          <div class="ch">
            <span class="ct">Weekly Review</span>
            <span class="bg" style="background:var(--gp);color:var(--green)">Sonnet · ~$0.05</span>
          </div>
          <div style="font-size:12px;color:var(--mt);margin-bottom:12px;line-height:1.6">Analiza las conversaciones de la semana, las métricas del dashboard y te da 3 prioridades concretas. Recomendado: cada viernes.</div>
          <button id="rv-weekly-btn" onclick="rvRunWeekly()" class="btn-s" style="width:100%">📅 Weekly Review</button>
          <div id="rv-weekly-result" style="display:none;margin-top:14px;padding:14px;background:var(--sf2);border-radius:var(--r);font-size:13px;line-height:1.7"></div>
        </div>
        <div class="cd">
          <div class="ch">
            <span class="ct">Monthly Strategy</span>
            <span class="bg" style="background:var(--pp);color:var(--purple)">Opus · ~$0.15</span>
          </div>
          <div style="font-size:12px;color:var(--mt);margin-bottom:12px;line-height:1.6">Revisión profunda con P&L, ajuste de estrategia, OKRs del próximo mes. Usa Opus para mayor profundidad analítica. Recomendado: último día del mes.</div>
          <button id="rv-monthly-btn" onclick="rvRunMonthly()" class="btn-s" style="width:100%;background:var(--purple)">📊 Monthly Strategy (Opus)</button>
          <div id="rv-monthly-result" style="display:none;margin-top:14px;padding:14px;background:var(--sf2);border-radius:var(--r);font-size:13px;line-height:1.7"></div>
        </div>
      </div>

      <!-- History -->
      <div class="cd">
        <div class="ch"><span class="ct">Historial de revisiones</span></div>
        <div id="rv-history" style="padding:4px 0"></div>
      </div>`;

    const lastPage = main.querySelector('.page:last-of-type');
    if (lastPage) lastPage.insertAdjacentElement('afterend', page);
    else main.appendChild(page);

    if (typeof TITLES !== 'undefined') TITLES['review'] = 'Revisión periódica';

    const origShowP = window.showP;
    window.showP = function(id, el) {
      origShowP.apply(this, arguments);
      if (id === 'review') {
        requestAnimationFrame(() => requestAnimationFrame(() => rvRenderHistory()));
      }
    };
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectReviewPage);
  } else {
    setTimeout(injectReviewPage, 300);
  }
})();
