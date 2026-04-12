/* ═══════════════════════════════════════════════
   STORAGE — Capa de abstracción localStorage → Supabase
   Fase 6: Migración de datos de usuario

   Uso:
     await DB.get('budget', 'config')          → valor o null
     await DB.set('budget', 'config', value)   → true/false
     await DB.remove('budget', 'config')       → true/false

   Estrategia:
     - Lee Supabase primero
     - Fallback a localStorage si no hay datos en Supabase
     - Al primer load con datos locales → migra automáticamente a Supabase
     - Admin usa localStorage directamente (sin token de usuario cliente)
   ═══════════════════════════════════════════════ */

const DB = (() => {

  // ── Mapeo localStorage legacy → Supabase ─────────────────
  // Si existe la key legacy en localStorage, se migra automáticamente
  const LEGACY_MAP = {
    'budget:config':       'pr_budget_v2',
    'budget:actuals':      'eco_actual_v2',
    'budget:libre':        'eco_libre_v1',
    'pnl:data':            'pr_pnl_v1',
    'library:items':       'pr_content_library_v1',
    'library:snapshot':    'pr_site_snapshot_v1',
    'experiments:data':    'pr_experiments_v1',
    'experiments:digest':  'pr_memory_digest_v1',
    'memory:profile':      'pr_copilot_memory_v2',
    'review:data':         'pr_reviews_v1',
    'copilot:buffer':      'pr_session_buffer_v1',
  };

  // ── Cache en memoria para evitar llamadas repetidas ───────
  const _cache = {};
  const CACHE_TTL = 60 * 1000; // 1 minuto

  function _cacheKey(module, key) { return `${module}:${key}`; }

  function _cacheGet(module, key) {
    const k = _cacheKey(module, key);
    const entry = _cache[k];
    if (!entry) return undefined;
    if (Date.now() - entry.ts > CACHE_TTL) { delete _cache[k]; return undefined; }
    return entry.value;
  }

  function _cacheSet(module, key, value) {
    _cache[_cacheKey(module, key)] = { value, ts: Date.now() };
  }

  function _cacheDel(module, key) {
    delete _cache[_cacheKey(module, key)];
  }

  // ── ¿Está disponible la API? ─────────────────────────────
  function _canUseApi() {
    return typeof apiFetch === 'function' && window.__SUPABASE_JWT__;
  }

  // ── Migrar datos legacy de localStorage → Supabase ───────
  async function _migrateLegacy(module, key) {
    const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
    if (!legacyKey) return null;

    const raw = localStorage.getItem(legacyKey);
    if (!raw) return null;

    try {
      const value = JSON.parse(raw);
      // Subir a Supabase
      await apiFetch('/api/user-data', {
        method: 'POST',
        body: { action: 'set', module, key, value }
      });
      // Borrar localStorage legacy
      localStorage.removeItem(legacyKey);
      console.log(`[storage] Migrado ${legacyKey} → Supabase (${module}:${key})`);
      return value;
    } catch (e) {
      console.warn(`[storage] Error migrando ${legacyKey}:`, e);
      // Si falla la migración, devolver el valor local sin borrar
      try { return JSON.parse(raw); } catch (_) { return null; }
    }
  }

  return {

    // ── GET ────────────────────────────────────────────────
    async get(module, key, fallback = null) {
      // 1. Cache en memoria
      const cached = _cacheGet(module, key);
      if (cached !== undefined) return cached;

      // 2. Sin API (admin sin cliente, o no logado) → localStorage legacy
      if (!_canUseApi()) {
        const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
        if (legacyKey) {
          try { return JSON.parse(localStorage.getItem(legacyKey) || 'null') ?? fallback; }
          catch (_) { return fallback; }
        }
        return fallback;
      }

      try {
        // 3. Intentar Supabase
        const data = await apiFetch(`/api/user-data?module=${module}&key=${key}`);

        if (data?.value !== undefined && data.value !== null) {
          _cacheSet(module, key, data.value);
          return data.value;
        }

        // 4. No hay datos en Supabase → intentar migrar desde localStorage
        const migrated = await _migrateLegacy(module, key);
        if (migrated !== null) {
          _cacheSet(module, key, migrated);
          return migrated;
        }

        return fallback;
      } catch (e) {
        console.warn(`[storage] GET ${module}:${key} error:`, e);
        // Fallback a localStorage legacy en caso de error de red
        const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
        if (legacyKey) {
          try { return JSON.parse(localStorage.getItem(legacyKey) || 'null') ?? fallback; }
          catch (_) {}
        }
        return fallback;
      }
    },

    // ── SET ────────────────────────────────────────────────
    async set(module, key, value) {
      // Actualizar cache inmediatamente (optimistic)
      _cacheSet(module, key, value);

      if (!_canUseApi()) {
        // Sin API → guardar en localStorage legacy como fallback
        const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
        if (legacyKey) {
          try { localStorage.setItem(legacyKey, JSON.stringify(value)); return true; }
          catch (_) { return false; }
        }
        return false;
      }

      try {
        await apiFetch('/api/user-data', {
          method: 'POST',
          body: { action: 'set', module, key, value }
        });
        return true;
      } catch (e) {
        console.warn(`[storage] SET ${module}:${key} error:`, e);
        // Fallback a localStorage en caso de error
        const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
        if (legacyKey) {
          try { localStorage.setItem(legacyKey, JSON.stringify(value)); }
          catch (_) {}
        }
        return false;
      }
    },

    // ── REMOVE ────────────────────────────────────────────
    async remove(module, key) {
      _cacheDel(module, key);

      if (!_canUseApi()) {
        const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
        if (legacyKey) localStorage.removeItem(legacyKey);
        return true;
      }

      try {
        await apiFetch('/api/user-data', {
          method: 'POST',
          body: { action: 'delete', module, key }
        });
        // Limpiar también localStorage legacy por si acaso
        const legacyKey = LEGACY_MAP[_cacheKey(module, key)];
        if (legacyKey) localStorage.removeItem(legacyKey);
        return true;
      } catch (e) {
        console.warn(`[storage] REMOVE ${module}:${key} error:`, e);
        return false;
      }
    },

    // ── INVALIDATE CACHE ──────────────────────────────────
    invalidate(module, key) {
      if (key) _cacheDel(module, key);
      else {
        // Invalidar todo el módulo
        Object.keys(_cache).forEach(k => {
          if (k.startsWith(module + ':')) delete _cache[k];
        });
      }
    }
  };
})();
