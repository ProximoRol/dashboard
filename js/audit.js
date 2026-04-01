/* ═══════════════════════════════════════════════
   CONTENT AUDIT — Blog · LinkedIn · GSC · GA4
   Depends on: core.js (CFG, antFetch, gscQ, ga4R, TOKEN)
   ═══════════════════════════════════════════════ */

let CA_DAYS = 30;
let CA_DATA = null;

/* ── Entry point ── */
function renderAuditPage() {
  setNB('audit', 'live');
  const out = document.getElementById('audit-main');
  if (out) out.innerHTML = `<div class="ld"><div class="sp2"></div>Listo para escanear — elige el rango y pulsa el botón.</div>`;
}

function caSetRange(days, el) {
  CA_DAYS = days;
  document.querySelectorAll('.ca-range-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
}

/* ── Main scan ── */
async function caRunScan() {
  const btn = document.getElementById('ca-scan-btn');
  const out = document.getElementById('audit-main');
  if (!CFG.ak) { alert('Configura tu Anthropic API Key en ⚙️ Settings primero.'); return; }

  btn.disabled = true;
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation:spin .8s linear infinite"><path d="M21 12a9 9 0 11-6-8.5"/></svg> Escaneando…`;

  out.innerHTML = `
    <div style="display:flex;flex-direction:column;gap:10px;padding:20px 0">
      <div class="ld"><div class="sp2"></div><span id="ca-status">Leyendo blog de Próximo Rol…</span></div>
    </div>`;

  const setStatus = t => { const el = document.getElementById('ca-status'); if (el) el.textContent = t; };

  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - CA_DAYS);
    const sd = startDate.toISOString().split('T')[0];
    const ed = endDate.toISOString().split('T')[0];

    // ── 1. Blog scan via Claude web search ──
    setStatus('Leyendo blog de Próximo Rol…');
    const blogData = await caScanBlog(sd, ed);

    // ── 2. LinkedIn posts ──
    setStatus('Leyendo posts de LinkedIn…');
    const liData = await caGetLinkedInPosts();

    // ── 3. Search Console top queries ──
    setStatus('Leyendo Search Console…');
    const gscData = await caGetGSCData(sd, ed);

    // ── 4. GA4 top pages ──
    setStatus('Leyendo GA4…');
    const ga4Data = await caGetGA4Pages(sd, ed);

    // ── 5. Classify + analyse with Claude ──
    setStatus('Analizando y clasificando contenido con IA…');
    const analysis = await caAnalyse(blogData, liData, gscData, ga4Data);

    CA_DATA = { blogData, liData, gscData, ga4Data, analysis, days: CA_DAYS };
    caRender(CA_DATA);

  } catch (e) {
    out.innerHTML = `<div style="padding:14px;background:var(--rp);border-radius:var(--r);font-size:12px;color:#991B1B">⚠ Error: ${e.message}</div>`;
  }

  btn.disabled = false;
  btn.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg> Escanear contenido`;
}

/* ── Data fetchers ── */
async function caScanBlog(sd, ed) {
  const blogUrl = CFG.gsc || 'https://www.proximorol.com';
  const domain = blogUrl.replace(/\/$/, '');

  const data = await antFetch({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1200,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: `You are a content analyst. Search for blog posts and articles from the given website published in the given date range. Return ONLY valid JSON, no markdown.`,
    messages: [{
      role: 'user',
      content: `Search for all blog posts and articles published on ${domain} between ${sd} and ${ed}.

Return ONLY this JSON structure (no markdown, no preamble):
{
  "posts": [
    {
      "title": "...",
      "url": "...",
      "date": "YYYY-MM-DD or approximate",
      "summary": "1-2 sentence summary",
      "topics": ["topic1", "topic2"]
    }
  ],
  "total_found": 0
}`
    }]
  });

  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : { posts: [], total_found: 0 };
  } catch (e) {
    return { posts: [], total_found: 0 };
  }
}

async function caGetLinkedInPosts() {
  // Try manual data first, then API
  const manual = liGetManualData ? liGetManualData() : {};
  const posts = [];

  if (manual && manual.posts && manual.posts.length > 0) {
    return { posts: manual.posts.slice(0, 20), source: 'manual' };
  }

  // If LinkedIn API connected, try to get posts
  if (CFG.liToken && CFG.liOrg) {
    try {
      const org = CFG.liOrg || '';
      const headers = { 'Authorization': 'Bearer ' + CFG.liToken, 'LinkedIn-Version': '202401' };
      const url = `https://api.linkedin.com/v2/shares?q=owners&owners=${encodeURIComponent(org)}&count=20&sharesPerOwner=20`;
      const resp = await fetch(url, { headers });
      if (resp.ok) {
        const d = await resp.json();
        const items = (d.elements || []).map(e => ({
          text: e.text?.text || '',
          date: e.created?.time ? new Date(e.created.time).toISOString().split('T')[0] : '',
          likes: e.socialDetail?.totalSocialActivityCounts?.numLikes || 0,
          comments: e.socialDetail?.totalSocialActivityCounts?.numComments || 0
        }));
        return { posts: items, source: 'api' };
      }
    } catch (e) {}
  }

  return { posts: [], source: 'none' };
}

async function caGetGSCData(sd, ed) {
  if (!CFG.gsc || !TOKEN) return { queries: [], pages: [] };
  try {
    const [queries, pages] = await Promise.all([
      gscQ({ startDate: sd, endDate: ed, dimensions: ['query'], rowLimit: 20, orderBys: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }] }),
      gscQ({ startDate: sd, endDate: ed, dimensions: ['page'], rowLimit: 15, orderBys: [{ fieldName: 'clicks', sortOrder: 'DESCENDING' }] })
    ]);
    return {
      queries: (queries.rows || []).map(r => ({ query: r.keys[0], clicks: r.clicks, impressions: r.impressions, position: r.position })),
      pages: (pages.rows || []).map(r => ({ page: r.keys[0].replace(CFG.gsc.replace(/\/$/, ''), ''), clicks: r.clicks }))
    };
  } catch (e) {
    return { queries: [], pages: [] };
  }
}

async function caGetGA4Pages(sd, ed) {
  if (!TOKEN) return { pages: [] };
  try {
    const data = await gF(`https://analyticsdata.googleapis.com/v1beta/${CFG.ga4}:runReport`, {
      dateRanges: [{ startDate: sd, endDate: ed }],
      dimensions: [{ name: 'pagePath' }, { name: 'pageTitle' }],
      metrics: [{ name: 'sessions' }, { name: 'averageSessionDuration' }, { name: 'bounceRate' }],
      limit: 20,
      orderBys: [{ metric: { metricName: 'sessions' }, desc: true }]
    });
    return {
      pages: (data.rows || []).map(r => ({
        path: r.dimensionValues[0].value,
        title: r.dimensionValues[1].value,
        sessions: parseInt(r.metricValues[0].value),
        avgDuration: parseFloat(r.metricValues[1].value),
        bounceRate: parseFloat(r.metricValues[2].value)
      }))
    };
  } catch (e) {
    return { pages: [] };
  }
}

/* ── AI Analysis ── */
async function caAnalyse(blogData, liData, gscData, ga4Data) {
  const blogPosts = (blogData.posts || []).map(p => `- "${p.title}" (${p.date}) — Temas: ${(p.topics || []).join(', ')}`).join('\n') || 'No se encontraron posts de blog.';
  const liPosts = (liData.posts || []).slice(0, 15).map(p => `- "${(p.text || p.title || '').slice(0, 100)}"`).join('\n') || 'No hay datos de LinkedIn.';
  const gscQueries = (gscData.queries || []).slice(0, 15).map(q => `- "${q.query}" (${q.clicks} clicks, pos. ${q.position ? q.position.toFixed(1) : '?'})`).join('\n') || 'No hay datos de Search Console.';
  const ga4Pages = (ga4Data.pages || []).slice(0, 10).map(p => `- ${p.path} — ${p.sessions} sesiones, ${Math.round(p.avgDuration)}s promedio`).join('\n') || 'No hay datos de GA4.';

  const prompt = `Eres un estratega de contenido especializado en marketing digital para Próximo Rol, un servicio de coaching de entrevistas para profesionales en España, UK y LATAM.

Analiza los siguientes datos de contenido de los últimos ${CA_DAYS} días:

BLOG POSTS PUBLICADOS:
${blogPosts}

POSTS DE LINKEDIN:
${liPosts}

TOP KEYWORDS EN SEARCH CONSOLE:
${gscQueries}

PÁGINAS MÁS VISITADAS EN GA4:
${ga4Pages}

Genera un análisis completo en JSON con este formato exacto (sin markdown):
{
  "summary": {
    "total_pieces": 0,
    "blog_count": 0,
    "linkedin_count": 0,
    "top_topic": "...",
    "top_topic_count": 0,
    "coverage_score": "X de Y temas cubiertos"
  },
  "topics": [
    {"name": "...", "count": 0, "channels": ["blog", "linkedin"], "performance": "high|medium|low"}
  ],
  "gaps": [
    {"topic": "...", "reason": "...", "priority": "high|medium|low", "opportunity": "..."}
  ],
  "top_performing": [
    {"title": "...", "channel": "blog|linkedin|gsc", "metric": "...", "value": "..."}
  ],
  "insight": "Párrafo de 2-3 frases con la síntesis más importante y la recomendación principal para los próximos 30 días.",
  "next_content": [
    {"title": "...", "format": "blog|linkedin|ambos", "rationale": "..."}
  ]
}`;

  const data = await antFetch({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{ role: 'user', content: prompt }]
  });

  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  try {
    const clean = text.replace(/```json|```/g, '').trim();
    const match = clean.match(/\{[\s\S]*\}/);
    return match ? JSON.parse(match[0]) : caFallbackAnalysis();
  } catch (e) {
    return caFallbackAnalysis();
  }
}

function caFallbackAnalysis() {
  return {
    summary: { total_pieces: 0, blog_count: 0, linkedin_count: 0, top_topic: '—', top_topic_count: 0, coverage_score: '— de — temas' },
    topics: [],
    gaps: [],
    top_performing: [],
    insight: 'No se pudo completar el análisis. Verifica que GA4, Search Console y tu API Key de Anthropic estén configurados.',
    next_content: []
  };
}

/* ── Render ── */
function caRender(d) {
  const { analysis: a, days } = d;
  const s = a.summary || {};
  const topics = a.topics || [];
  const gaps = a.gaps || [];
  const top = a.top_performing || [];
  const next = a.next_content || [];
  const maxTopicCount = Math.max(...topics.map(t => t.count), 1);

  const priorityColor = { high: { bg: 'var(--rp)', text: 'var(--red)', label: 'Alta prioridad' }, medium: { bg: 'var(--ap)', text: 'var(--amber)', label: 'Media prioridad' }, low: { bg: 'var(--gp)', text: 'var(--green)', label: 'Baja prioridad' } };
  const perfColor = { high: 'var(--green)', medium: 'var(--amber)', low: 'var(--ht)' };
  const channelIcon = { blog: '📝', linkedin: '💼', gsc: '🔍', ga4: '📈', ambos: '🔄' };

  document.getElementById('audit-main').innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">
      ${[
        { val: s.total_pieces || 0, lbl: 'Piezas totales', sub: `Últimos ${days}d` },
        { val: topics.length, lbl: 'Temas cubiertos', sub: s.coverage_score || '' },
        { val: gaps.length, lbl: 'Gaps detectados', sub: 'Con demanda orgánica' },
        { val: s.top_topic || '—', lbl: 'Tema principal', sub: s.top_topic_count ? `${s.top_topic_count} piezas` : '' }
      ].map(k => `<div class="kpi"><div class="kv" style="font-size:20px">${k.val}</div><div class="kl">${k.lbl}</div><div class="ks">${k.sub}</div></div>`).join('')}
    </div>

    <div class="g2" style="margin-bottom:12px">
      <div class="cd">
        <div class="ch"><span class="ct">Temas publicados</span><span class="bg bg-g">Blog + LinkedIn</span></div>
        ${topics.length === 0 ? '<div class="notice"><strong>Sin datos</strong>No se encontraron temas clasificados.</div>' :
          topics.map(t => {
            const pct = Math.round((t.count / maxTopicCount) * 100);
            const channels = (t.channels || []).map(c => `<span style="font-size:10px;padding:1px 6px;border-radius:10px;background:var(--sf2);color:var(--mt)">${c}</span>`).join(' ');
            return `<div style="margin-bottom:10px">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                <span style="font-size:12px;font-weight:500;color:var(--tx)">${t.name}</span>
                <div style="display:flex;align-items:center;gap:6px">${channels}<span style="font-size:11px;color:var(--mt)">${t.count}</span></div>
              </div>
              <div style="height:5px;background:var(--sf2);border-radius:3px">
                <div style="height:5px;border-radius:3px;background:${perfColor[t.performance] || 'var(--green)'};width:${pct}%"></div>
              </div>
            </div>`;
          }).join('')
        }
      </div>

      <div class="cd">
        <div class="ch"><span class="ct">Mejor rendimiento</span><span class="bg bg-b">Por canal</span></div>
        ${top.length === 0 ? '<div class="notice"><strong>Sin datos</strong>Conecta GA4 y Search Console.</div>' :
          top.map(t => `
            <div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid var(--bd)">
              <div style="font-size:16px;flex-shrink:0;margin-top:1px">${channelIcon[t.channel] || '📄'}</div>
              <div style="flex:1;min-width:0">
                <div style="font-size:12px;font-weight:500;color:var(--tx);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${t.title}</div>
                <div style="font-size:11px;color:var(--mt);margin-top:2px">${t.metric}: <strong>${t.value}</strong></div>
              </div>
            </div>`).join('')
        }
      </div>
    </div>

    <div class="cd" style="margin-bottom:12px">
      <div class="ch"><span class="ct">Gaps detectados</span><span class="bg" style="background:var(--pp);color:var(--purple)">IA · Alta oportunidad</span></div>
      ${gaps.length === 0 ? '<div class="notice"><strong>Sin gaps detectados</strong>¡Excelente cobertura de temas!</div>' :
        gaps.map(g => {
          const p = priorityColor[g.priority] || priorityColor.medium;
          return `<div style="display:flex;gap:12px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--bd)">
            <div style="width:8px;height:8px;border-radius:50%;background:${p.text};flex-shrink:0;margin-top:4px"></div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap">
                <span style="font-size:12px;font-weight:500;color:var(--tx)">${g.topic}</span>
                <span style="font-size:10px;padding:2px 8px;border-radius:10px;background:${p.bg};color:${p.text};white-space:nowrap">${p.label}</span>
              </div>
              <div style="font-size:11px;color:var(--mt);margin-top:3px;line-height:1.5">${g.reason}</div>
              ${g.opportunity ? `<div style="font-size:11px;color:var(--teal);margin-top:2px">→ ${g.opportunity}</div>` : ''}
            </div>
          </div>`;
        }).join('')
      }
    </div>

    ${next.length > 0 ? `
    <div class="cd" style="margin-bottom:12px">
      <div class="ch"><span class="ct">Contenido recomendado — próximo mes</span><span class="bg bg-p">IA</span></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">
        ${next.map((n, i) => `
          <div style="background:var(--sf2);border-radius:var(--r);padding:12px">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
              <span style="font-size:11px;font-weight:600;color:var(--ht)">#${i + 1}</span>
              <span style="font-size:10px;padding:2px 7px;border-radius:10px;background:var(--sf);border:1px solid var(--bd)">${channelIcon[n.format] || '📄'} ${n.format}</span>
            </div>
            <div style="font-size:12px;font-weight:500;color:var(--tx);margin-bottom:4px">${n.title}</div>
            <div style="font-size:11px;color:var(--mt);line-height:1.5">${n.rationale}</div>
          </div>`).join('')}
      </div>
    </div>` : ''}

    <div style="background:var(--pp);border-radius:var(--rl);padding:16px">
      <div style="font-size:11px;font-weight:600;color:var(--purple);text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px">Síntesis IA</div>
      <div style="font-size:13px;color:#26215C;line-height:1.7">${a.insight || '—'}</div>
    </div>`;
}
