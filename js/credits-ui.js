/* ═══════════════════════════════════════════════
   TOKENS UI — Badge + modal de recarga
   Fase 5: Billing por tokens
   £5 = 1,000 tokens | no caducan
   Depends on: core.js (apiFetch)
   ═══════════════════════════════════════════════ */

// ── URL del Payment Link de Stripe ──────────────────────────
// IMPORTANTE: Sustituir con tu Payment Link real
// Stripe → Products → "Pulso Tokens" → precio "Customer chooses" → Payment Link
const TOKENS_STRIPE_URL = 'https://buy.stripe.com/TU_PAYMENT_LINK';  // ← reemplazar

// ── Estado ───────────────────────────────────────────────────
let TK = {
  tokens:     null,   // null = no cargado
  lastLoaded: null
};

// ── Inicializar — llamar después del login del cliente ───────
async function tokensInit() {
  if (window.__USER_ROLE__ === 'admin') return;
  await tokensLoad();
  tokensRenderBadge();
  // Actualizar cada 5 minutos
  setInterval(async () => {
    await tokensLoad();
    tokensRenderBadge();
  }, 5 * 60 * 1000);
}

async function tokensLoad() {
  try {
    const data = await apiFetch('/api/user-usage');
    TK.tokens    = data.tokens || 0;
    TK.purchases = data.purchases || [];
    TK.lastLoaded = Date.now();
  } catch (e) {
    console.error('[tokens] Error:', e);
  }
}

// ── Badge en el topbar ───────────────────────────────────────
function tokensRenderBadge() {
  if (window.__USER_ROLE__ === 'admin') return;

  let badge = document.getElementById('tokens-badge');
  if (!badge) {
    const tpr = document.querySelector('.tpr');
    if (!tpr) return;
    badge = document.createElement('div');
    badge.id = 'tokens-badge';
    badge.onclick = () => tokensShowModal();
    badge.style.cssText = [
      'display:flex', 'align-items:center', 'gap:5px',
      'padding:5px 10px', 'border-radius:20px',
      'cursor:pointer', 'font-size:12px', 'font-weight:500',
      'font-family:"DM Sans",sans-serif', 'transition:all .15s',
      'user-select:none', 'margin-right:8px'
    ].join(';');
    tpr.insertBefore(badge, tpr.firstChild);
  }

  if (TK.tokens === null) {
    badge.innerHTML = '⟳ Tokens';
    badge.style.cssText += ';background:var(--bg);color:var(--mt);border:1px solid var(--bd2)';
    return;
  }

  if (TK.tokens <= 0) {
    badge.innerHTML = '⚠️ Sin tokens';
    badge.style.background = '#FEF2F2';
    badge.style.color      = '#DC2626';
    badge.style.border     = '1px solid #FECACA';
    setTimeout(() => tokensShowModal(true), 600);
  } else if (TK.tokens < 100) {
    badge.innerHTML = `🔴 ${TK.tokens.toLocaleString()} tokens`;
    badge.style.background = '#FEF2F2';
    badge.style.color      = '#DC2626';
    badge.style.border     = '1px solid #FECACA';
  } else if (TK.tokens < 300) {
    badge.innerHTML = `🟡 ${TK.tokens.toLocaleString()} tokens`;
    badge.style.background = '#FFFBEB';
    badge.style.color      = '#D97706';
    badge.style.border     = '1px solid #FDE68A';
  } else {
    badge.innerHTML = `✦ ${TK.tokens.toLocaleString()} tokens`;
    badge.style.background = 'var(--bg)';
    badge.style.color      = 'var(--mt)';
    badge.style.border     = '1px solid var(--bd2)';
  }
}

// ── Descuento de tokens en el frontend (optimista) ───────────
// Se llama desde los módulos después de una llamada exitosa
function tokensDeduct(amount) {
  if (TK.tokens !== null) {
    TK.tokens = Math.max(0, TK.tokens - amount);
    tokensRenderBadge();
  }
}

// ── Modal de recarga ─────────────────────────────────────────
function tokensShowModal(forceOpen = false) {
  let modal = document.getElementById('tokens-modal');

  if (modal && !forceOpen) {
    modal.style.display = modal.style.display === 'none' ? 'flex' : 'none';
    return;
  }

  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'tokens-modal';
    modal.style.cssText = [
      'position:fixed', 'top:0', 'left:0', 'width:100%', 'height:100%',
      'background:rgba(0,0,0,.6)', 'z-index:999999',
      'display:flex', 'align-items:center', 'justify-content:center',
      'padding:16px', 'box-sizing:border-box'
    ].join(';');
    modal.onclick = (e) => { if (e.target === modal) modal.style.display = 'none'; };
    document.body.appendChild(modal);
  }

  modal.style.display = 'flex';
  modal.innerHTML = `
    <div style="background:var(--sf);border-radius:14px;padding:28px;width:100%;max-width:400px;box-shadow:0 24px 64px rgba(0,0,0,.35);box-sizing:border-box">

      <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:17px;font-weight:600;color:var(--tx)">Recargar tokens</div>
        <button onclick="document.getElementById('tokens-modal').style.display='none'"
          style="background:none;border:none;cursor:pointer;color:var(--mt);font-size:20px;line-height:1;padding:0">✕</button>
      </div>

      <div style="font-size:13px;color:var(--mt);margin-bottom:20px">
        ${TK.tokens <= 0
          ? '⚠️ Te quedaste sin tokens. Recarga para seguir usando los módulos de IA.'
          : `Saldo actual: <strong style="color:var(--tx)">${(TK.tokens||0).toLocaleString()} tokens</strong>`
        }
      </div>

      <!-- Calculadora -->
      <div style="background:var(--bg);border:1px solid var(--bd2);border-radius:10px;padding:16px;margin-bottom:16px">
        <div style="font-size:12px;font-weight:600;color:var(--tx);margin-bottom:10px">¿Cuánto quieres recargar?</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-size:18px;font-weight:600;color:var(--tx)">£</span>
          <input id="tokens-amount-input" type="number" min="5" step="5" value="10"
            oninput="tokensUpdateCalc()"
            style="width:80px;padding:8px;border:1px solid var(--bd2);border-radius:var(--r);font-size:16px;font-weight:600;font-family:'DM Sans',sans-serif;background:var(--sf);color:var(--tx);text-align:center"/>
          <span style="font-size:13px;color:var(--mt)">GBP</span>
        </div>
        <div id="tokens-calc-result" style="font-size:13px;color:var(--green);font-weight:500">
          = 2,000 tokens
        </div>
        <div style="font-size:11px;color:var(--mt);margin-top:4px">£5 = 1,000 tokens · Los tokens no caducan</div>
      </div>

      <!-- Sugerencias rápidas -->
      <div style="display:flex;gap:6px;margin-bottom:16px">
        ${[5,10,25,50].map(v => `
          <button onclick="tokensSetAmount(${v})"
            style="flex:1;padding:6px 4px;background:var(--bg);border:1px solid var(--bd2);border-radius:var(--r);font-size:11px;font-weight:500;cursor:pointer;font-family:'DM Sans',sans-serif;color:var(--tx)">
            £${v}
          </button>`).join('')}
      </div>

      <!-- Botón de pago -->
      <button onclick="tokensOpenStripe()"
        style="width:100%;padding:12px;background:var(--green);color:#fff;border:none;border-radius:var(--r);font-size:14px;font-weight:600;cursor:pointer;font-family:'DM Sans',sans-serif;margin-bottom:10px">
        Pagar con Stripe →
      </button>

      <!-- Info -->
      <div style="font-size:11px;color:var(--mt);text-align:center;line-height:1.6">
        💳 Pago seguro · Sin suscripción · Tokens añadidos en ~1 min
      </div>

      <!-- Historial -->
      ${(TK.purchases||[]).length > 0 ? `
        <button onclick="tokensShowHistory()"
          style="margin-top:10px;background:none;border:none;color:var(--green);font-size:12px;cursor:pointer;font-family:'DM Sans',sans-serif;padding:0;display:block">
          Ver historial de recargas →
        </button>` : ''}
    </div>
  `;

  // Inicializar calculadora
  tokensUpdateCalc();
}

function tokensUpdateCalc() {
  const input  = document.getElementById('tokens-amount-input');
  const result = document.getElementById('tokens-calc-result');
  if (!input || !result) return;
  const gbp    = parseFloat(input.value) || 0;
  const tokens = Math.floor((gbp / 5) * 1000);
  result.textContent = `= ${tokens.toLocaleString()} tokens`;
  result.style.color = gbp >= 5 ? 'var(--green)' : '#EF4444';
}

function tokensSetAmount(gbp) {
  const input = document.getElementById('tokens-amount-input');
  if (input) { input.value = gbp; tokensUpdateCalc(); }
}

function tokensOpenStripe() {
  const input = document.getElementById('tokens-amount-input');
  const gbp   = parseFloat(input?.value) || 10;

  if (gbp < 5) { alert('El mínimo es £5'); return; }

  if (TOKENS_STRIPE_URL.includes('TU_PAYMENT_LINK')) {
    alert('⚠️ Payment Link de Stripe no configurado aún.\nConfigura TOKENS_STRIPE_URL en credits-ui.js');
    return;
  }

  // Abrir Stripe con importe pre-rellenado si el link lo soporta
  window.open(TOKENS_STRIPE_URL, '_blank');

  // Polling: verificar si llegaron tokens nuevos
  const prevTokens = TK.tokens || 0;
  let checks = 0;
  const interval = setInterval(async () => {
    await tokensLoad();
    tokensRenderBadge();
    checks++;
    if ((TK.tokens || 0) > prevTokens || checks > 18) {
      clearInterval(interval);
      if ((TK.tokens || 0) > prevTokens) {
        tokensShowToast(`✅ ${((TK.tokens||0) - prevTokens).toLocaleString()} tokens añadidos`);
        document.getElementById('tokens-modal').style.display = 'none';
      }
    }
  }, 10000);

  tokensShowToast('Abriendo Stripe… los tokens se añaden automáticamente');
}

async function tokensShowHistory() {
  const modal = document.getElementById('tokens-modal');
  if (!modal) return;

  const rows = (TK.purchases || []).map(p => `
    <tr style="border-bottom:1px solid var(--bd2)">
      <td style="padding:8px 6px;color:var(--mt);font-size:11px">${new Date(p.created_at).toLocaleDateString('es-ES')}</td>
      <td style="padding:8px 6px;color:var(--tx);font-size:12px">${p.pack_name}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--tx);font-size:12px">${p.amount_gbp > 0 ? `£${p.amount_gbp}` : '—'}</td>
      <td style="padding:8px 6px;text-align:right;color:var(--green);font-weight:600;font-size:12px">+${(p.tokens_added||0).toLocaleString()}</td>
    </tr>`).join('');

  modal.querySelector('div').innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
      <div style="font-size:16px;font-weight:600;color:var(--tx)">Historial de recargas</div>
      <button onclick="tokensShowModal(true)" style="background:none;border:none;cursor:pointer;color:var(--green);font-size:12px;font-family:'DM Sans',sans-serif">← Volver</button>
    </div>
    <table style="width:100%;border-collapse:collapse">
      <thead>
        <tr style="border-bottom:2px solid var(--bd2)">
          <th style="text-align:left;padding:6px;font-size:11px;color:var(--mt);font-weight:500">Fecha</th>
          <th style="text-align:left;padding:6px;font-size:11px;color:var(--mt);font-weight:500">Recarga</th>
          <th style="text-align:right;padding:6px;font-size:11px;color:var(--mt);font-weight:500">£ GBP</th>
          <th style="text-align:right;padding:6px;font-size:11px;color:var(--mt);font-weight:500">Tokens</th>
        </tr>
      </thead>
      <tbody>${rows || '<tr><td colspan="4" style="text-align:center;padding:20px;color:var(--mt)">Sin recargas aún</td></tr>'}</tbody>
    </table>
  `;
}

// ── Toast ────────────────────────────────────────────────────
function tokensShowToast(msg) {
  let toast = document.getElementById('tokens-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'tokens-toast';
    toast.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:#1F2937;color:#fff;padding:10px 20px;border-radius:8px;font-size:13px;font-family:"DM Sans",sans-serif;z-index:99999;opacity:0;transition:opacity .2s;white-space:nowrap;pointer-events:none';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  setTimeout(() => { toast.style.opacity = '0'; }, 3000);
}

// ── Handler global de error 402 ──────────────────────────────
// Intercepta respuestas de tokens insuficientes de cualquier módulo
// Llamar desde los módulos cuando apiFetch devuelve HTTP 402:
//   .catch(e => { if (!tokensHandleError(e)) throw e; });
function tokensHandleError(err) {
  if (err.message && (err.message.includes('402') || err.message.includes('Tokens insuficientes'))) {
    tokensShowModal(true);
    return true;
  }
  return false;
}
