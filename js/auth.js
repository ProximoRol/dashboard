/* ═══════════════════════════════════════════════
   AUTH — Supabase Auth
   Reemplaza el password gate con login real.
   ═══════════════════════════════════════════════ */

const SUPABASE_URL      = 'https://zsidhtxkrsrkujxdbvle.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpzaWRodHhrcnNya3VqeGRidmxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NTE5ODIsImV4cCI6MjA5MDEyNzk4Mn0.ujPMrbtgpXxZPJ_aQv7SVDOXbihrCPpagZerJ9QpAdE';

// ── Inicializar cliente Supabase ─────────────────
const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// JWT en memoria — nunca en localStorage
window.__SUPABASE_JWT__ = null;
window.__SUPABASE_USER__ = null;

// ── INIT AUTH ────────────────────────────────────
// Se llama al cargar la página.
// Si ya hay sesión activa → saltar login directo al onboarding.
async function authInit() {
  // Mostrar pantalla de login mientras verificamos
  showScreen('login');

  const { data: { session } } = await _supabase.auth.getSession();

  if (session) {
    // Sesión activa — restaurar JWT y continuar
    window.__SUPABASE_JWT__  = session.access_token;
    window.__SUPABASE_USER__ = session.user;
    await afterLogin();
  } else {
    // Sin sesión — mostrar login
    showScreen('login');
  }

  // Escuchar cambios de sesión (refresh token automático)
  _supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session) {
      window.__SUPABASE_JWT__  = session.access_token;
      window.__SUPABASE_USER__ = session.user;
    }
    if (event === 'SIGNED_OUT') {
      window.__SUPABASE_JWT__  = null;
      window.__SUPABASE_USER__ = null;
      showScreen('login');
    }
    if (event === 'TOKEN_REFRESHED' && session) {
      window.__SUPABASE_JWT__ = session.access_token;
    }
  });
}

// ── LOGIN ────────────────────────────────────────
async function authLogin() {
  const email    = document.getElementById('auth-email').value.trim();
  const password = document.getElementById('auth-password').value;
  const errEl    = document.getElementById('auth-err');
  const btnEl    = document.getElementById('auth-btn');

  errEl.textContent = '';

  if (!email || !password) {
    errEl.textContent = 'Introduce tu email y contraseña.';
    return;
  }

  // Loading state
  btnEl.disabled    = true;
  btnEl.textContent = 'Entrando...';

  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });

  if (error) {
    btnEl.disabled    = false;
    btnEl.textContent = 'Entrar →';

    const msgs = {
      'Invalid login credentials': 'Email o contraseña incorrectos.',
      'Email not confirmed':       'Confirma tu email antes de entrar.',
      'Too many requests':         'Demasiados intentos. Espera unos minutos.'
    };
    errEl.textContent = msgs[error.message] || 'Error: ' + error.message;
    return;
  }

  window.__SUPABASE_JWT__  = data.session.access_token;
  window.__SUPABASE_USER__ = data.user;

  await afterLogin();
}

// ── LOGOUT ───────────────────────────────────────
async function authLogout() {
  await _supabase.auth.signOut();
  window.__SUPABASE_JWT__  = null;
  window.__SUPABASE_USER__ = null;
  // Limpiar estado del dashboard
  TOKEN = null;
  showScreen('login');
}

// ── DESPUÉS DEL LOGIN ────────────────────────────
// Carga los módulos del usuario y arranca el dashboard.
async function afterLogin() {
  try {
    // 1. Cargar módulos habilitados desde el backend
    const res = await fetch('https://pulso-api-seven.vercel.app/api/user-modules', {
      headers: { 'Authorization': 'Bearer ' + window.__SUPABASE_JWT__ }
    });

    if (!res.ok) throw new Error('No se pudieron cargar los módulos');

    const { modules, role, plan, company } = await res.json();

    // Guardar en global para uso en core.js
    window.__USER_MODULES__ = modules;
    window.__USER_ROLE__    = role;
    window.__USER_PLAN__    = plan;

    // 2. Actualizar nombre en sidebar si hay datos del usuario
    const email = window.__SUPABASE_USER__?.email || '';
    const name  = email.split('@')[0];
    const nameEl = document.getElementById('sb-nm');
    const avEl   = document.getElementById('sb-av');
    if (nameEl) nameEl.textContent = name;
    if (avEl)   avEl.textContent   = name.charAt(0).toUpperCase();

    // 3. Decidir qué pantalla mostrar
    // — Admin: va al onboarding (necesita Google OAuth para GA4/GSC)
    // — Cliente: va directo al app (no tiene Google OAuth configurado)
    if (role === 'admin') {
      showScreen('onboarding');
    } else {
      // Cliente — entrar directo al dashboard sin Google OAuth
      buildSidebar(modules, role);
      showScreen('app');
      buildSettings(); // Necesario para que Settings no aparezca en blanco
      if (typeof tokensInit === 'function') tokensInit(); // Cargar badge de tokens
      // Mostrar la Guía como página de entrada
      setTimeout(() => {
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('.ni').forEach(n => n.classList.remove('active'));
        const guidePage = document.getElementById('page-guide');
        if (guidePage) guidePage.classList.add('active');
        const guideNav = document.querySelector('.ni[onclick*="\'guide\'"]');
        if (guideNav) guideNav.classList.add('active');
        const topT = document.getElementById('top-t');
        if (topT) topT.textContent = 'Guía del dashboard';
        if (typeof renderGuidePage === 'function') renderGuidePage();
      }, 300);
    }

  } catch (err) {
    console.error('[auth] afterLogin error:', err);
    const errEl = document.getElementById('auth-err');
    if (errEl) errEl.textContent = 'Error al cargar tu cuenta. Inténtalo de nuevo.';
    showScreen('login');
  }
}

// ── SHOW SCREEN ──────────────────────────────────
// Controla qué pantalla se muestra.
function showScreen(screen) {
  const loginEl  = document.getElementById('login-gate');
  const obEl     = document.getElementById('ob');
  const appEl    = document.getElementById('app');

  if (loginEl) loginEl.style.display = screen === 'login'      ? 'flex'  : 'none';
  if (obEl)    obEl.style.display    = screen === 'onboarding' ? 'flex'  : 'none';
  if (appEl)   appEl.style.display   = screen === 'app'        ? 'block' : 'none';

  // Focus en el campo email al mostrar login
  if (screen === 'login') {
    setTimeout(() => document.getElementById('auth-email')?.focus(), 100);
  }
}

// ── ENTER en campo password ──────────────────────
function authKeydown(e) {
  if (e.key === 'Enter') authLogin();
}
