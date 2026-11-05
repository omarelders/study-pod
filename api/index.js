import {
  createDefaultState,
  createRealInitialState,
  createBlankOnboardingState,
} from '../src/data/studyData.js';

const SUPABASE_URL = (
  process.env.SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ''
).replace(/\/+$/, '');

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  '';

const HAS_SUPABASE = Boolean(SUPABASE_URL && SUPABASE_KEY);

// ponytail: in-memory fallback when Vercel env vars aren't wired yet; upgrade path is setting SUPABASE_URL + SUPABASE_ANON_KEY
const memPods =
  globalThis.__STUDYPOD_MEM_PODS__ ||
  (globalThis.__STUDYPOD_MEM_PODS__ = new Map([
    ['ZAU8PP', { ...createDefaultState(), podCode: 'ZAU8PP' }],
  ]));

function randomPodCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

async function supabaseGetPod(code) {
  if (!HAS_SUPABASE) {
    return memPods.get(code) || null;
  }
  const url = `${SUPABASE_URL}/rest/v1/pods?code=eq.${encodeURIComponent(code)}&select=state_json`;
  const res = await fetch(url, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) return memPods.get(code) || null;
  const rows = await res.json();
  if (Array.isArray(rows) && rows[0]?.state_json) {
    return rows[0].state_json;
  }
  return null;
}

async function supabaseSavePod(code, state) {
  const normalized = { ...state, podCode: code };
  memPods.set(code, normalized);

  if (HAS_SUPABASE) {
    await fetch(`${SUPABASE_URL}/rest/v1/pods`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=minimal',
      },
      body: JSON.stringify({
        code,
        state_json: normalized,
        updated_at: Date.now(),
      }),
    }).catch(() => {});
  }
  return normalized;
}

async function getOrCreatePod(code) {
  const existing = await supabaseGetPod(code);
  if (existing) return existing;
  const fresh = createRealInitialState(code);
  await supabaseSavePod(code, fresh);
  return fresh;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }

  const url = new URL(
    req.url || '/',
    `https://${req.headers.host || 'localhost'}`
  );
  const pathname = url.pathname;

  try {
    if (pathname === '/api/health' && req.method === 'GET') {
      if (!HAS_SUPABASE) {
        res.status(200).json({
          ok: true,
          backend: 'vercel-memory-fallback',
          tableReady: false,
          message:
            'Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Settings -> Environment Variables and Redeploy.',
        });
        return;
      }

      try {
        const probe = await fetch(
          `${SUPABASE_URL}/rest/v1/pods?select=code&limit=1`,
          {
            headers: {
              apikey: SUPABASE_KEY,
              Authorization: `Bearer ${SUPABASE_KEY}`,
            },
          }
        );
        res.status(200).json({
          ok: true,
          backend: 'supabase',
          tableReady: probe.ok,
          status: probe.status,
          message: probe.ok
            ? 'Connected to Supabase (public.pods table verified)'
            : 'Supabase URL/Key found, but public.pods table was not accessible (check SQL schema & RLS)',
        });
      } catch (e) {
        res.status(200).json({
          ok: true,
          backend: 'supabase',
          tableReady: false,
          message: e.message || 'Failed to reach Supabase',
        });
      }
      return;
    }

    if (pathname === '/api/pods/create' && req.method === 'POST') {
      const body = req.body || {};
      const code = randomPodCode();
      const incoming =
        body?.state && typeof body.state === 'object' ? body.state : null;
      const base =
        body?.mode === 'blank'
          ? createBlankOnboardingState()
          : createDefaultState();
      const state = await supabaseSavePod(
        code,
        incoming ? { ...base, ...incoming } : base
      );
      res.status(200).json({ code, state });
      return;
    }

    const podMatch = pathname.match(
      /^\/api\/pods\/([A-Za-z0-9_-]+)(?:\/(sync|reset|events))?$/
    );
    if (podMatch) {
      const code = podMatch[1].toUpperCase();
      const action = podMatch[2];

      if (!action && req.method === 'GET') {
        const state = await getOrCreatePod(code);
        res.status(200).json({ code, state });
        return;
      }

      if (action === 'sync' && req.method === 'POST') {
        const body = req.body || {};
        const current = await getOrCreatePod(code);
        const incoming =
          body?.state && typeof body.state === 'object' ? body.state : body;
        const state = await supabaseSavePod(code, { ...current, ...incoming });
        res.status(200).json({ ok: true, code, state });
        return;
      }

      if (action === 'reset' && req.method === 'POST') {
        const body = req.body || {};
        const base =
          body?.mode === 'blank'
            ? createBlankOnboardingState()
            : createDefaultState();
        const state = await supabaseSavePod(code, base);
        res.status(200).json({ ok: true, code, state });
        return;
      }

      if (action === 'events' && req.method === 'GET') {
        const state = await getOrCreatePod(code);
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        });
        res.write(`data: ${JSON.stringify({ type: 'sync', code, state })}\n\n`);
        res.end();
        return;
      }
    }

    res.status(404).json({ error: 'Not found' });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Bad request' });
  }
}
