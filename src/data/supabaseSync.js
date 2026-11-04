/**
 * Zero-dependency Supabase PostgREST + Local /api Fallback Sync Client
 */
const SUPABASE_URL = (import.meta.env?.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_ANON_KEY = import.meta.env?.VITE_SUPABASE_ANON_KEY || '';

export const HAS_DIRECT_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export async function syncPodStateToCloud(code, state) {
  if (!code) return;
  const cleanCode = String(code).trim().toUpperCase();

  if (HAS_DIRECT_SUPABASE) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/pods`, {
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
      return;
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
