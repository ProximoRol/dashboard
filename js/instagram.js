/* ═══════════════════════════════════════════════
   INSTAGRAM / FACEBOOK — Métricas de cuenta
   Depends on: core.js
   ═══════════════════════════════════════════════ */

/* ── META API HELPER ── */
async function metaFetch(endpoint) {
  if (!CFG.metaToken) throw new Error('Meta token no configurado');
  const url = `https://graph.facebook.com/v25.0/${endpoint}&access_token=${CFG.metaToken}`;
  const resp = await fetch(url);
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data;
}

/* ── LOAD INSTAGRAM ── */
async function loadInstagram() {
  setNB('ig', '...');
  const igId = CFG.metaIgId;
  const pageId = CFG.metaPageId;

  if (!CFG.metaToken || !igId) {
    setNB('ig', 'off');
    nc('Instagram / Facebook', 'ig-main');
    return;
  }

  const el = document.getElementById('ig-main');
  if (!el) return;
  el.innerHTML = `<div class="ld"><div class="sp2"></div>Cargando datos de Instagram…</div>`;

  try {
    // ── 1. PERFIL ──
    const profile = await metaFetch(`${igId}?fields=name,username,followers_count,follows_count,media_count,profile_picture_url,biography,website`);

    // ── 2. INSIGHTS (últimos 30 días) ──
    let insights = { reach: 0, impressions: 0, profile_views: 0, website_clicks: 0 };
    try {
      const since = Math.floor((Date.now() - 30 * 86400000) / 1000);
      const until = Math.floor(Date.now() / 1000);
      const ins = await metaFetch(`${igId}/insights?metric=reach,impressions,profile_views,website_clicks&period=day&since=${since}&until=${until}`);
      (ins.data || []).forEach(m => {
        const total = (m.values || []).reduce((a, v) => a + (v.value || 0), 0);
        insights[m.name] = total;
      });
    } catch (e) { console.warn('Insights parciales:', e.message); }

    // ── 3. POSTS RECIENTES ──
    let posts = [];
    try {
      const media = await metaFetch(`${igId}/media?fields=id,caption,media_type,thumbnail_url,media_url,timestamp,like_count,comments_count,permalink&limit=12`);
      posts = media.data || [];
    } catch (e) { console.warn('Posts:', e.message); }

    // ── 4. PAGE INSIGHTS (Facebook) ──
    let pageFans = 0, pageReach = 0, pageEngagement = 0;
    if (pageId && CFG.metaToken) {
      try {
        const pgIns = await metaFetch(`${pageId}/insights?metric=page_fans,page_impressions,page_engaged_users&period=month&limit=3`);
        (pgIns.data || []).forEach(m => {
          const last = m.values?.[m.values.length - 1]?.value || 0;
          if (m.name === 'page_fans') pageFans = last;
          if (m.name === 'page_impressions') pageReach = last;
          if (m.name === 'page_engaged_users') pageEngagement = last;
        });
      } catch (e) { console.warn('Facebook page insights:', e.message); }
    }

    // ── RENDER ──
    const engRate = profile.followers_count > 0
      ? ((posts.slice(0, 10).reduce((a, p) => a + (p.like_count || 0) + (p.comments_count || 0), 0) / 10) / profile.followers_count * 100).toFixed(2)
      : '—';

    el.innerHTML = `
      <!-- KPIs Instagram -->
      <div class="kr" style="margin-bottom:16px">
        ${kpi('📸', 'Seguidores IG', fmtK(profile.followers_count), '', 'var(--purple)')}
        ${kpi('👁', 'Alcance 30d', fmtK(insights.reach), '', 'var(--blue)')}
        ${kpi('🔁', 'Impresiones 30d', fmtK(insights.impressions), '', 'var(--green)')}
        ${kpi('💬', 'Engagement rate', engRate !== '—' ? engRate + '%' : '—', '', 'var(--amber)')}
        ${kpi('👤', 'Visitas al perfil', fmtK(insights.profile_views), '', 'var(--purple)')}
        ${kpi('🔗', 'Clicks web', fmtK(insights.website_clicks), '', 'var(--blue)')}
      </div>

      <!-- Facebook KPIs -->
      ${pageId ? `
      <div class="cd" style="margin-bottom:16px">
        <div class="ch"><span class="ct">Facebook — Página "Próximo Rol"</span><span class="bg bg-b">30d</span></div>
        <div class="kr" style="margin-top:10px">
          ${kpi('👍', 'Fans totales', fmtK(pageFans), '', 'var(--blue)')}
          ${kpi('📢', 'Alcance mensual', fmtK(pageReach), '', 'var(--green)')}
          ${kpi('⚡', 'Usuarios activos', fmtK(pageEngagement), '', 'var(--amber)')}
        </div>
      </div>` : ''}

      <!-- Posts recientes -->
      <div class="cd">
        <div class="ch"><span class="ct">Posts recientes</span><span class="bg bg-p">Últimos 12</span></div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;margin-top:12px">
          ${posts.map(p => igPostCard(p)).join('')}
        </div>
        ${posts.length === 0 ? '<p style="color:var(--ht);font-size:13px;text-align:center;padding:2rem">No se encontraron posts recientes</p>' : ''}
      </div>
    `;

    setNB('ig', 'live');

  } catch (e) {
    setNB('ig', 'err');
    el.innerHTML = `<div class="notice" style="background:var(--rp);border-color:#FECACA;color:#991B1B">
      <strong>Error al cargar Instagram:</strong> ${e.message}
      <br><small>Verifica que el token y el Instagram Account ID sean correctos en Settings.</small>
      <button class="cbtn" onclick="showP('settings',null)">Abrir Settings →</button>
    </div>`;
  }
}

/* ── HELPERS ── */
function igPostCard(p) {
  const date = new Date(p.timestamp).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  const img = p.thumbnail_url || p.media_url || '';
  const caption = (p.caption || '').slice(0, 80) + ((p.caption || '').length > 80 ? '…' : '');
  const typeEmoji = p.media_type === 'VIDEO' ? '🎬' : p.media_type === 'CAROUSEL_ALBUM' ? '🖼' : '📸';
  return `
    <a href="${p.permalink}" target="_blank" style="text-decoration:none;display:block;border:1px solid var(--bd);border-radius:var(--r);overflow:hidden;transition:box-shadow .15s;background:var(--sf)" onmouseover="this.style.boxShadow='0 4px 16px rgba(0,0,0,.12)'" onmouseout="this.style.boxShadow='none'">
      ${img ? `<div style="aspect-ratio:1;background:var(--sf2);overflow:hidden"><img src="${img}" style="width:100%;height:100%;object-fit:cover" loading="lazy" onerror="this.parentElement.innerHTML='<div style=\\'height:100%;display:flex;align-items:center;justify-content:center;font-size:28px\\'>${typeEmoji}</div>'"/></div>` : `<div style="aspect-ratio:1;background:var(--sf2);display:flex;align-items:center;justify-content:center;font-size:32px">${typeEmoji}</div>`}
      <div style="padding:8px 10px">
        <div style="font-size:10px;color:var(--ht);margin-bottom:4px">${typeEmoji} ${date}</div>
        <div style="font-size:11px;color:var(--tx);line-height:1.4;margin-bottom:6px">${caption || '(sin caption)'}</div>
        <div style="display:flex;gap:10px;font-size:11px;color:var(--mt)">
          <span>❤️ ${fmtK(p.like_count || 0)}</span>
          <span>💬 ${fmtK(p.comments_count || 0)}</span>
        </div>
      </div>
    </a>`;
}

function kpi(icon, label, value, delta, color) {
  return `<div class="kc" style="border-left:3px solid ${color}">
    <div style="font-size:18px;margin-bottom:4px">${icon}</div>
    <div class="kv">${value}</div>
    <div class="kl">${label}</div>
    ${delta ? `<div style="font-size:11px;color:${color};font-weight:500;margin-top:2px">${delta}</div>` : ''}
  </div>`;
}

function fmtK(n) {
  if (!n && n !== 0) return '—';
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toLocaleString();
}
