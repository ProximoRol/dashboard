/* ═══════════════════════════════════════════════
   CURRENCY — Detección y formato de moneda
   Autodetecta por navigator.language.
   Se puede sobreescribir en Settings → Preferencias.
   Guardado en CFG.currency (localStorage vía core.js).

   Uso:
     fmtCurrency(1234.5)        → "£1,235" / "$1.235" / "CLP 1.235.000"
     getUserCurrency()          → { symbol, code, locale, name }
   ═══════════════════════════════════════════════ */

// ── Mapa de monedas soportadas ──────────────────
const CURRENCY_MAP = {
  'GBP': { symbol: '£',    code: 'GBP', locale: 'en-GB', name: 'Libra esterlina (£)' },
  'EUR': { symbol: '€',    code: 'EUR', locale: 'es-ES', name: 'Euro (€)' },
  'USD': { symbol: '$',    code: 'USD', locale: 'en-US', name: 'Dólar USD ($)' },
  'MXN': { symbol: '$',    code: 'MXN', locale: 'es-MX', name: 'Peso mexicano (MXN)' },
  'ARS': { symbol: '$',    code: 'ARS', locale: 'es-AR', name: 'Peso argentino (ARS)' },
  'COP': { symbol: '$',    code: 'COP', locale: 'es-CO', name: 'Peso colombiano (COP)' },
  'CLP': { symbol: '$',    code: 'CLP', locale: 'es-CL', name: 'Peso chileno (CLP)' },
  'PEN': { symbol: 'S/.',  code: 'PEN', locale: 'es-PE', name: 'Sol peruano (PEN)' },
};

// ── Mapa idioma/región → moneda ─────────────────
const LOCALE_TO_CURRENCY = {
  'en-GB': 'GBP',
  'en-UK': 'GBP',
  'es-ES': 'EUR',
  'ca-ES': 'EUR',   // Catalán (España)
  'eu-ES': 'EUR',   // Euskera (España)
  'gl-ES': 'EUR',   // Gallego (España)
  'es-MX': 'MXN',
  'es-AR': 'ARS',
  'es-CO': 'COP',
  'es-CL': 'CLP',
  'es-PE': 'PEN',
  'es-UY': 'USD',   // Uruguay dolarizado en la práctica
  'es-VE': 'USD',   // Venezuela dolarizada en la práctica
  'es-EC': 'USD',   // Ecuador usa USD
  'es-PA': 'USD',   // Panamá usa USD
};

// ── Detectar moneda por browser locale ──────────
function _detectCurrencyFromLocale() {
  const langs = navigator.languages || [navigator.language || 'en-GB'];

  for (const lang of langs) {
    // Coincidencia exacta (es-CL, en-GB…)
    if (LOCALE_TO_CURRENCY[lang]) return LOCALE_TO_CURRENCY[lang];
    // Coincidencia por prefijo de región (es-419 → es → EUR por defecto español)
    const base = lang.split('-')[0];
    if (base === 'es') return 'EUR'; // fallback español → EUR
    if (base === 'en') return 'GBP'; // fallback inglés → GBP
  }

  return 'GBP'; // default
}

// ── API pública ─────────────────────────────────

/**
 * Devuelve el objeto de moneda activo.
 * Orden de prioridad: CFG.currency (guardado) → autodetección.
 */
function getUserCurrency() {
  const saved = (typeof CFG !== 'undefined' && CFG.currency) ? CFG.currency : null;
  return CURRENCY_MAP[saved] || CURRENCY_MAP[_detectCurrencyFromLocale()] || CURRENCY_MAP['GBP'];
}

/**
 * Formatea un número según la moneda del usuario.
 * Ejemplos:
 *   fmtCurrency(1234.5)   → "£1,235" (GBP)
 *   fmtCurrency(1234.5)   → "€1.235" (EUR)
 *   fmtCurrency(150000)   → "CLP 150.000" (CLP, sin decimales)
 *
 * @param {number} amount
 * @param {boolean} [forceDecimals=false] — fuerza 2 decimales aunque no sean necesarios
 */
function fmtCurrency(amount, forceDecimals = false) {
  if (amount === null || amount === undefined || isNaN(amount)) return '—';

  const cur = getUserCurrency();

  // Monedas de alto valor (sin decimales útiles)
  const noDecimals = ['CLP', 'ARS', 'COP'].includes(cur.code);
  const decimals = forceDecimals ? 2 : noDecimals ? 0 : 2;

  try {
    const formatted = new Intl.NumberFormat(cur.locale, {
      style:                 'currency',
      currency:              cur.code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);

    return formatted;
  } catch (_) {
    // Fallback manual si Intl falla
    return cur.symbol + amount.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

/**
 * Devuelve solo el símbolo o código corto para usar en labels.
 * Ejemplos: "£", "€", "CLP"
 */
function getCurrencySymbol() {
  const cur = getUserCurrency();
  // Para monedas donde el símbolo es $ ambiguo, usar código
  if (['MXN','ARS','COP','CLP'].includes(cur.code)) return cur.code;
  return cur.symbol;
}

/**
 * Devuelve todas las monedas disponibles para el selector de Settings.
 */
function getCurrencyOptions() {
  return Object.values(CURRENCY_MAP);
}
