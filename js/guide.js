/* ═══════════════════════════════════════════════
   GUIDE — Página de inicio y mapa del dashboard
   ═══════════════════════════════════════════════ */

function renderGuidePage() {
  const el = document.getElementById('guide-main');
  if (!el) return;

  // Connection status
  const conn = {
    ga4:  !!(CFG.clientId && CFG.ga4 && window.TOKEN),
    gsc:  !!(CFG.gsc && window.TOKEN),
    ads:  !!(CFG.ads && window.TOKEN),
    li:   !!(CFG.liId || CFG.liToken),
    crm:  !!(CFG.monday || CFG.hubspot),
    mail: !!(CFG.instantly),
  };

  const dot = (ok, pending) => {
    if (pending) return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ht);flex-shrink:0;margin-top:5px"></span>`;
    return `<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:${ok?'var(--green)':'var(--red)'};flex-shrink:0;margin-top:5px"></span>`;
  };

  const modules = {
    // ── DATA SOURCES ──
    sources: [
      { id:'ga4',  icon:'📊', name:'Google Analytics', desc:'Sesiones, usuarios, conversiones', conn: conn.ga4,  nav:'ga4'  },
      { id:'gsc',  icon:'🔍', name:'Search Console',   desc:'Keywords, posiciones orgánicas',  conn: conn.gsc,  nav:'gsc'  },
      { id:'ads',  icon:'📢', name:'Google Ads',        desc:'Campañas de pago, CTR, CPC',      conn: conn.ads,  nav:'ads'  },
      { id:'li',   icon:'💼', name:'LinkedIn',          desc:'Followers, engagement, posts',    conn: conn.li,   nav:'li'   },
      { id:'crm',  icon:'🏢', name:'CRM / HubSpot',    desc:'Pipeline, deals, oportunidades',  conn: conn.crm,  nav:'mon'  },
      { id:'mail', icon:'📧', name:'Mailing masivo',    desc:'Campañas email, opens, replies',  conn: conn.mail, nav:'inst' },
    ],
    // ── SOCIAL (pending) ──
    social_pending: [
      { id:'ig',  icon:'📸', name:'Instagram',  desc:'Posts, stories, reach', pending:true },
      { id:'yt',  icon:'🎬', name:'YouTube',    desc:'Vídeos, retención, subs', pending:true },
      { id:'tt',  icon:'🎵', name:'TikTok',     desc:'Vídeos, FYP, engagement', pending:true },
    ],
    // ── ANALYTICS ──
    analytics: [
      { id:'ga4p',  icon:'📈', name:'Google Analytics', desc:'Tráfico, usuarios, embudo de conversión y top páginas con comparativas vs período anterior',      nav:'ga4',  color:'#1D9E75' },
      { id:'gscp',  icon:'🔎', name:'Search Console',   desc:'Keywords orgánicas, impresiones, CTR y posición. Detecta oportunidades de mejora de posición',    nav:'gsc',  color:'#2563EB' },
      { id:'adsp',  icon:'📢', name:'Google Ads',        desc:'Rendimiento de campañas, grupos de anuncios y palabras clave. ROI y recomendaciones IA',          nav:'ads',  color:'#DC2626' },
      { id:'lip',   icon:'💼', name:'LinkedIn',          desc:'Crecimiento de seguidores, engagement por post y análisis de competidores en tiempo real',         nav:'li',   color:'#0891B2' },
      { id:'oppsp', icon:'🎯', name:'Pipeline',          desc:'Visualización del pipeline de ventas por stage. Valor total, forecast y desglose por fuente',      nav:'opps', color:'#7C3AED' },
      { id:'budp',  icon:'💰', name:'Budget & Costs',    desc:'Presupuesto mensual vs actuals. Sube tu Excel de gastos y el dashboard los categoriza automáticamente', nav:'budget', color:'#D97706' },
    ],
    // ── INTELLIGENCE ──
    intelligence: [
      { id:'kwi',  icon:'🧠', name:'Keyword Intelligence', desc:'Gap analysis de keywords. Detecta términos con alta demanda donde no apareces', nav:'kwi', color:'#7C3AED' },
      { id:'seo',  icon:'🔬', name:'SEO Intelligence',     desc:'Auditor de páginas, chat SEO con web search, competitor spy y checklist SEO',   nav:'seo', color:'#2563EB' },
      { id:'rep',  icon:'📅', name:'Monthly Report',       desc:'Resumen ejecutivo mensual con todos los KPIs consolidados en una vista',         nav:'report', color:'#0891B2' },
    ],
    // ── CONTENT ──
    content: [
      { id:'audit',   icon:'🔬', name:'Content Audit',       desc:'Escanea blog + LinkedIn + GSC + GA4 → clasifica temas → detecta gaps con alta demanda sin cubrir. Exporta a .txt y .json', nav:'audit',   color:'#BE185D' },
      { id:'studio',  icon:'✍️', name:'Content Studio',      desc:'5 agentes: Instagram, LinkedIn, Newsletter, YouTube, Ads. Identidad de marca configurable con arquetipos. Guarda y exporta', nav:'content', color:'#1D9E75' },
      { id:'ai',      icon:'🤖', name:'AI Insights',          desc:'Analiza tus métricas reales de GA4 + LinkedIn + GSC y genera recomendaciones semanales automáticas sobre qué hacer',         pending:true,  color:'#7C3AED' },
      { id:'cal',     icon:'📅', name:'Calendario Editorial', desc:'Planifica qué publicar, cuándo y en qué plataforma. Basado en los gaps del Audit. Crea tareas en CRM automáticamente',      pending:true,  color:'#D97706' },
      { id:'visual',  icon:'🎨', name:'Visual Studio',        desc:'Genera briefs de contenido visual: carruseles para Instagram, infografías para LinkedIn, thumbnails para YouTube',            pending:true,  color:'#DC2626' },
      { id:'camp',    icon:'📡', name:'Campaign Analyzer',    desc:'Lee Google Ads + Mailing masivo y genera recomendaciones: qué pausar, qué escalar, qué probar esta semana',                  pending:true,  color:'#0891B2' },
    ],
  };

  const modCard = (m) => {
    const isPending = m.pending;
    const borderColor = m.color || 'var(--bd2)';
    const clickable = !isPending && m.nav;
    return `<div onclick="${clickable ? `showP('${m.nav}',null)` : ''}"
      style="padding:12px 14px;border-radius:var(--rl);border:.5px solid ${borderColor}33;background:var(--sf);
             cursor:${clickable ? 'pointer' : 'default'};transition:all .15s;opacity:${isPending ? '.55' : '1'};
             border-left:3px solid ${borderColor};"
      ${clickable ? `onmouseover="this.style.background='var(--sf2)'" onmouseout="this.style.background='var(--sf)'"` : ''}>
      <div style="display:flex;align-items:flex-start;gap:8px">
        <span style="font-size:16px;flex-shrink:0">${m.icon}</span>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
            <span style="font-size:12px;font-weight:500;color:var(--tx)">${m.name}</span>
            ${isPending ? `<span style="font-size:9px;padding:1px 6px;border-radius:8px;background:var(--ap);color:var(--amber);font-weight:500">Próximamente</span>` : ''}
          </div>
          <div style="font-size:11px;color:var(--mt);line-height:1.5">${m.desc}</div>
          ${clickable ? `<div style="font-size:10px;color:${borderColor};margin-top:5px;font-weight:500">Abrir →</div>` : ''}
        </div>
      </div>
    </div>`;
  };

  const srcCard = (s) => {
    const isPending = s.pending;
    return `<div onclick="${s.nav && !isPending ? `showP('${s.nav}',null)` : ''}"
      style="padding:10px 12px;border-radius:var(--r);border:.5px solid var(--bd);background:var(--sf);
             cursor:${s.nav && !isPending ? 'pointer' : 'default'};transition:all .15s;opacity:${isPending?'.5':'1'};
             display:flex;align-items:flex-start;gap:8px"
      ${s.nav && !isPending ? `onmouseover="this.style.background='var(--sf2)'" onmouseout="this.style.background='var(--sf)'"` : ''}>
      <span style="font-size:15px;flex-shrink:0">${s.icon}</span>
      <div style="flex:1;min-width:0">
        <div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">
          ${!isPending ? dot(s.conn) : dot(false, true)}
          <span style="font-size:11px;font-weight:500;color:var(--tx)">${s.name}</span>
          ${isPending ? `<span style="font-size:9px;padding:1px 5px;border-radius:6px;background:var(--ap);color:var(--amber)">Pronto</span>` : ''}
        </div>
        <div style="font-size:10px;color:var(--ht);line-height:1.3">${s.desc}</div>
      </div>
    </div>`;
  };

  const connectedCount = Object.values(conn).filter(Boolean).length;
  const totalSources = Object.keys(conn).length;

  el.innerHTML = `
    <!-- Status bar -->
    <div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">
      <div>
        <div style="font-size:13px;font-weight:500;color:var(--tx)">Estado del sistema</div>
        <div style="font-size:11px;color:var(--mt);margin-top:2px">${connectedCount} de ${totalSources} fuentes conectadas</div>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${Object.entries(conn).map(([k,v])=>{
          const labels={ga4:'GA4',gsc:'GSC',ads:'Ads',li:'LinkedIn',crm:'CRM',mail:'Mailing'};
          return `<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--mt)">
            <span style="width:7px;height:7px;border-radius:50%;background:${v?'var(--green)':'var(--red)'};display:inline-block"></span>
            ${labels[k]}
          </div>`;
        }).join('')}
        <button onclick="showP('settings',null)" style="padding:4px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:'DM Sans',sans-serif">
          Configurar →
        </button>
      </div>
    </div>

    <!-- Layer 1: Data Sources -->
    <div style="margin-bottom:6px">
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Capa 1 — Fuentes de datos
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:8px;margin-bottom:8px">
        ${modules.sources.map(srcCard).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        ${modules.social_pending.map(srcCard).join('')}
      </div>
    </div>

    <!-- Flow arrow -->
    <div style="display:flex;align-items:center;gap:8px;margin:10px 0;color:var(--ht);font-size:11px">
      <div style="flex:1;height:.5px;background:var(--bd)"></div>
      <span>los datos de las fuentes alimentan los módulos</span>
      <div style="flex:1;height:.5px;background:var(--bd)"></div>
    </div>

    <!-- Layer 2: Analytics -->
    <div style="margin-bottom:6px">
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Capa 2 — Análisis por canal
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">
        ${modules.analytics.map(modCard).join('')}
      </div>
    </div>

    <!-- Flow arrow -->
    <div style="display:flex;align-items:center;gap:8px;margin:10px 0;color:var(--ht);font-size:11px">
      <div style="flex:1;height:.5px;background:var(--bd)"></div>
      <span>el análisis alimenta la inteligencia IA</span>
      <div style="flex:1;height:.5px;background:var(--bd)"></div>
    </div>

    <!-- Layer 3: Intelligence -->
    <div style="margin-bottom:6px">
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Capa 3 — Inteligencia IA
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">
        ${modules.intelligence.map(modCard).join('')}
      </div>
    </div>

    <!-- Flow arrow -->
    <div style="display:flex;align-items:center;gap:8px;margin:10px 0;color:var(--ht);font-size:11px">
      <div style="flex:1;height:.5px;background:var(--bd)"></div>
      <span>todo converge en los módulos de contenido</span>
      <div style="flex:1;height:.5px;background:var(--bd)"></div>
    </div>

    <!-- Layer 4: Content -->
    <div style="margin-bottom:6px">
      <div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">
        Capa 4 — Contenido e IA generativa
      </div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px">
        ${modules.content.map(modCard).join('')}
      </div>
    </div>

    <!-- Footer note -->
    <div style="background:var(--sf2);border-radius:var(--r);padding:12px 16px;margin-top:12px;font-size:11px;color:var(--mt);line-height:1.6">
      <strong style="color:var(--tx)">Módulos marcados como "Próximamente"</strong> están en el roadmap y se añadirán progresivamente. Los módulos activos tienen acceso completo a datos en tiempo real a través de sus APIs correspondientes.
    </div>`;
}
