/* ═══════════════════════════════════════════════
   GUIDE — Página de inicio y mapa del dashboard
   ═══════════════════════════════════════════════ */

function renderGuidePage() {
  var el = document.getElementById('guide-main');
  if (!el) return;

  try {
    var cfg = (typeof CFG !== 'undefined') ? CFG : {};
    var hasToken = !!(typeof TOKEN !== 'undefined' && TOKEN);
    var conn = {
      ga4:  !!(cfg.clientId && cfg.ga4 && hasToken),
      gsc:  !!(cfg.gsc && hasToken),
      ads:  !!(cfg.ads && hasToken),
      li:   !!(cfg.liId || cfg.liToken),
      crm:  !!(cfg.monday || cfg.hubspot),
      mail: !!(cfg.instantly),
    };
    var connCount = Object.values(conn).filter(Boolean).length;

    function dot(ok) {
      return '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:' + (ok?'var(--green)':'#DC2626') + ';flex-shrink:0"></span>';
    }

    function srcCard(icon, name, desc, ok, nav, pending) {
      var click = (nav && !pending) ? ' onclick="showP(\''+nav+'\',null)" onmouseover="this.style.background=\'var(--sf2)\'" onmouseout="this.style.background=\'var(--sf)\'" style="cursor:pointer"' : ' style="cursor:default"';
      var opacity = pending ? 'opacity:.5;' : '';
      var dotHtml = pending ? '<span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:var(--ht)"></span>' : dot(ok);
      var badge = pending ? ' <span style="font-size:9px;padding:1px 5px;border-radius:6px;background:var(--ap);color:var(--amber)">Pronto</span>' : '';
      return '<div'+click+' style="'+opacity+'padding:10px 12px;border-radius:var(--r);border:.5px solid var(--bd);background:var(--sf);display:flex;align-items:flex-start;gap:8px">'+
        '<span style="font-size:15px;flex-shrink:0">'+icon+'</span>'+
        '<div style="flex:1;min-width:0">'+
          '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">'+dotHtml+'<span style="font-size:11px;font-weight:500;color:var(--tx)">'+name+'</span>'+badge+'</div>'+
          '<div style="font-size:10px;color:var(--ht);line-height:1.3">'+desc+'</div>'+
        '</div></div>';
    }

    function modCard(icon, name, desc, color, nav, pending) {
      var click = (nav && !pending) ? ' onclick="showP(\''+nav+'\',null)" onmouseover="this.style.background=\'var(--sf2)\'" onmouseout="this.style.background=\'var(--sf)\'"' : '';
      var opacity = pending ? 'opacity:.55;' : '';
      var badge = pending ? ' <span style="font-size:9px;padding:1px 6px;border-radius:8px;background:var(--ap);color:var(--amber);font-weight:500">Próximamente</span>' : '';
      var arrow = (nav && !pending) ? '<div style="font-size:10px;color:'+color+';margin-top:5px;font-weight:500">Abrir →</div>' : '';
      var cursor = (nav && !pending) ? 'cursor:pointer;' : 'cursor:default;';
      return '<div'+click+' style="'+opacity+cursor+'padding:12px 14px;border-radius:var(--rl);border:.5px solid var(--bd);border-left:3px solid '+color+';background:var(--sf);transition:background .15s">'+
        '<div style="display:flex;align-items:flex-start;gap:8px">'+
          '<span style="font-size:16px;flex-shrink:0">'+icon+'</span>'+
          '<div style="flex:1;min-width:0">'+
            '<div style="font-size:12px;font-weight:500;color:var(--tx);margin-bottom:3px">'+name+badge+'</div>'+
            '<div style="font-size:11px;color:var(--mt);line-height:1.5">'+desc+'</div>'+
            arrow+
          '</div>'+
        '</div></div>';
    }

    function sectionLabel(text) {
      return '<div style="font-size:10px;font-weight:600;color:var(--ht);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">'+text+'</div>';
    }

    function grid(minW, content) {
      return '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax('+minW+'px,1fr));gap:8px;margin-bottom:8px">'+content+'</div>';
    }

    function flowSep(text) {
      return '<div style="display:flex;align-items:center;gap:8px;margin:10px 0;color:var(--ht);font-size:11px">'+
        '<div style="flex:1;height:.5px;background:var(--bd)"></div><span>'+text+'</span><div style="flex:1;height:.5px;background:var(--bd)"></div></div>';
    }

    // Status bar
    var sLabels = {ga4:'GA4',gsc:'GSC',ads:'Ads',li:'LinkedIn',crm:'CRM',mail:'Mailing'};
    var sDots = Object.keys(conn).map(function(k){
      return '<div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--mt)">'+
        '<span style="width:7px;height:7px;border-radius:50%;display:inline-block;background:'+(conn[k]?'var(--green)':'#DC2626')+'"></span>'+sLabels[k]+'</div>';
    }).join('');

    var statusBar =
      '<div style="background:var(--sf);border:1px solid var(--bd);border-radius:var(--rl);padding:14px 18px;margin-bottom:16px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px">'+
        '<div><div style="font-size:13px;font-weight:500;color:var(--tx)">Estado del sistema</div>'+
        '<div style="font-size:11px;color:var(--mt);margin-top:2px">'+connCount+' de 6 fuentes conectadas</div></div>'+
        '<div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">'+sDots+
        '<button onclick="showP(\'settings\',null)" style="padding:4px 12px;border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;cursor:pointer;background:var(--sf2);color:var(--mt);font-family:\'DM Sans\',sans-serif">Configurar →</button></div></div>';

    var layer1 = sectionLabel('Capa 1 — Fuentes de datos') +
      grid(150,
        srcCard('📊','Google Analytics','Sesiones, usuarios, conversiones',conn.ga4,'ga4',false)+
        srcCard('🔍','Search Console','Keywords, posiciones orgánicas',conn.gsc,'gsc',false)+
        srcCard('📢','Google Ads','Campañas de pago, CTR, CPC',conn.ads,'ads',false)+
        srcCard('💼','LinkedIn','Followers, engagement, posts',conn.li,'li',false)+
        srcCard('🏢','CRM / HubSpot','Pipeline, deals, oportunidades',conn.crm,'mon',false)+
        srcCard('📧','Mailing masivo','Campañas email, opens, replies',conn.mail,'inst',false)
      )+
      grid(150,
        srcCard('📸','Instagram','Posts, stories, reach',false,null,true)+
        srcCard('🎬','YouTube','Vídeos, retención, subs',false,null,true)+
        srcCard('🎵','TikTok','Vídeos, FYP, engagement',false,null,true)
      );

    var layer2 = sectionLabel('Capa 2 — Análisis por canal') +
      grid(220,
        modCard('📈','Google Analytics','Tráfico, usuarios, embudo de conversión y top páginas con comparativas vs período anterior','#1D9E75','ga4',false)+
        modCard('🔎','Search Console','Keywords orgánicas, impresiones, CTR y posición. Detecta oportunidades en posición 5-15','#2563EB','gsc',false)+
        modCard('📢','Google Ads','Rendimiento de campañas, grupos de anuncios y palabras clave. ROI y recomendaciones IA','#DC2626','ads',false)+
        modCard('💼','LinkedIn','Crecimiento de seguidores, engagement por post y análisis de competidores en tiempo real','#0891B2','li',false)+
        modCard('🎯','Pipeline','Visualización del pipeline por stage. Valor total, forecast y desglose por fuente de origen','#7C3AED','opps',false)+
        modCard('💰','Budget & Costs','Presupuesto mensual vs actuals. Sube tu Excel y el dashboard categoriza los gastos automáticamente','#D97706','budget',false)
      );

    var layer3 = sectionLabel('Capa 3 — Inteligencia IA') +
      grid(220,
        modCard('🧠','Keyword Intelligence','Gap analysis de keywords. Detecta términos con alta demanda donde no apareces aún','#7C3AED','kwi',false)+
        modCard('🔬','SEO Intelligence','Auditor de páginas, chat SEO con web search, competitor spy y checklist SEO completo','#2563EB','seo',false)+
        modCard('📅','Monthly Report','Resumen ejecutivo mensual con todos los KPIs consolidados — listo para compartir','#0891B2','report',false)
      );

    var layer4 = sectionLabel('Capa 4 — Contenido e IA generativa') +
      grid(220,
        modCard('🔬','Content Audit','Escanea blog + LinkedIn + GSC + GA4 → clasifica temas → detecta gaps con alta demanda sin cubrir','#BE185D','audit',false)+
        modCard('✍️','Content Studio','5 agentes especializados (Instagram, LinkedIn, Newsletter, YouTube, Ads) con identidad de marca configurable','#1D9E75','content',false)+
        modCard('🤖','AI Insights','Analiza tus métricas reales cada semana y genera recomendaciones automáticas sobre qué hacer','#7C3AED',null,true)+
        modCard('📅','Calendario Editorial','Planifica publicaciones basado en los gaps del Audit. Crea tareas en CRM automáticamente','#D97706',null,true)+
        modCard('🎨','Visual Studio','Genera briefs de contenido visual: carruseles Instagram, infografías LinkedIn, thumbnails YouTube','#DC2626',null,true)+
        modCard('📡','Campaign Analyzer','Lee Google Ads + Mailing masivo y recomienda qué pausar, escalar o probar esta semana','#0891B2',null,true)
      );

    var footer = '<div style="background:var(--sf2);border-radius:var(--r);padding:12px 16px;margin-top:4px;font-size:11px;color:var(--mt);line-height:1.6">'+
      '<strong style="color:var(--tx)">Módulos "Próximamente"</strong> están en el roadmap activo y se añadirán progresivamente. Haz clic en cualquier módulo activo para navegar directamente a él.</div>';

    el.innerHTML = statusBar + layer1 +
      flowSep('los datos de las fuentes alimentan los módulos de análisis') + layer2 +
      flowSep('el análisis alimenta la inteligencia IA') + layer3 +
      flowSep('todo converge en los módulos de contenido') + layer4 + footer;

  } catch(e) {
    console.error('renderGuidePage error:', e);
    var el2 = document.getElementById('guide-main');
    if (el2) el2.innerHTML = '<div style="padding:20px;color:#DC2626;font-size:12px">Error: ' + e.message + '</div>';
  }
}
