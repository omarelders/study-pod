/**
 * Zero-dependency Supabase PostgREST + Local /api Fallback Sync Client
 */
const SUPABASE_URL = (
  (typeof __STUDYPOD_SUPABASE_URL__ !== 'undefined' && __STUDYPOD_SUPABASE_URL__) ||
  import.meta.env?.VITE_SUPABASE_URL ||
  ''
).replace(/\/+$/, '');

const SUPABASE_ANON_KEY =
  (typeof __STUDYPOD_SUPABASE_ANON_KEY__ !== 'undefined' &&
    __STUDYPOD_SUPABASE_ANON_KEY__) ||
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  '';

export const HAS_DIRECT_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function syncPodStateToCloud(code, state) {
  if (!code) return;
  const cleanCode = String(code).trim().toUpperCase();

  if (HAS_DIRECT_SUPABASE) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/pods`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          code: cleanCode,
          state_json: { ...state, podCode: cleanCode },
          updated_at: Date.now(),
        }),
      });
      if (res.ok) return;
    } catch {}
  }

  try {
    await fetch(`/api/pods/${encodeURIComponent(cleanCode)}/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ state }),
    });
  } catch {}
}

export async function fetchPodStateFromCloud(code) {
  if (!code) return null;
  const cleanCode = String(code).trim().toUpperCase();

  if (HAS_DIRECT_SUPABASE) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pods?code=eq.${encodeURIComponent(cleanCode)}&select=state_json`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (res.ok) {
        const rows = await res.json();
        if (Array.isArray(rows) && rows[0]?.state_json) {
          return rows[0].state_json;
        }
      }
    } catch {}
  }

  try {
    const res = await fetch(`/api/pods/${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      const data = await res.json();
      if (data?.state) return data.state;
    }
  } catch {}

  return null;
}

export async function checkBackendHealth(currentCode = 'ZAU8PP', currentState = null) {
  if (HAS_DIRECT_SUPABASE) {
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/pods?select=code&limit=1`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (res.ok) {
        if (currentState) {
          await syncPodStateToCloud(currentCode, currentState);
        }
        return {
          ok: true,
          backend: 'supabase',
          tableReady: true,
          message: 'Supabase Cloud connected & public.pods verified',
        };
      }
    } catch {}
  }

  try {
    const res = await fetch('/api/health');
    if (res.ok) {
      const data = await res.json();
      if (currentState && data?.tableReady) {
        await syncPodStateToCloud(currentCode, currentState);
      }
      return {
        ok: Boolean(data?.ok),
        backend: data?.backend || 'api',
        tableReady: Boolean(data?.tableReady ?? true),
        message:
          data?.message ||
          (data?.backend === 'supabase'
            ? 'Supabase Cloud connected via Vercel /api'
            : 'Connected to API backend'),
      };
    }
  } catch {}

  return {
    ok: false,
    backend: 'local-storage',
    tableReady: false,
    message: 'Offline / Browser LocalStorage mode',
  };
}
