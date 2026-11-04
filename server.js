import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import {
  createDefaultState,
  createBlankOnboardingState,
} from './src/data/studyData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_DB_PATH = path.join(__dirname, 'studypod.db');
const DIST_DIR = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function sendJson(res, status, data) {
  res.writeHead(status, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(data));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw.trim()) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function randomPodCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

export function createAppServer(dbPath = DEFAULT_DB_PATH) {
  const db = new DatabaseSync(dbPath);
  db.exec(`
    CREATE TABLE IF NOT EXISTS pods (
      code TEXT PRIMARY KEY,
      state_json TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  const selectStmt = db.prepare('SELECT state_json FROM pods WHERE code = ?');
  const upsertStmt = db.prepare(`
    INSERT INTO pods (code, state_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(code) DO UPDATE SET
      state_json = excluded.state_json,
      updated_at = excluded.updated_at
  `);

  // Seed default pod ZAU8PP if it doesn't exist yet
  if (!selectStmt.get('ZAU8PP')) {
    const seed = createDefaultState();
    seed.podCode = 'ZAU8PP';
    upsertStmt.run('ZAU8PP', JSON.stringify(seed), Date.now());
  }

  const sseClients = new Map(); // code -> Set<ServerResponse>

  function getOrCreatePod(code) {
    const row = selectStmt.get(code);
    if (row) {
      return JSON.parse(row.state_json);
    }
    const fresh = createDefaultState();
    fresh.podCode = code;
    upsertStmt.run(code, JSON.stringify(fresh), Date.now());
    return fresh;
  }

  function savePod(code, state) {
    const normalized = { ...state, podCode: code };
    upsertStmt.run(code, JSON.stringify(normalized), Date.now());
    return normalized;
  }

  function broadcast(code, payload) {
    const clients = sseClients.get(code);
    if (!clients || clients.size === 0) return;
    const message = `data: ${JSON.stringify(payload)}\n\n`;
    for (const client of clients) {
      try {
        client.write(message);
      } catch {
        clients.delete(client);
      }
    }
  }

  const server = http.createServer(async (req, res) => {
    if (req.method === 'OPTIONS') {
      res.writeHead(204, CORS_HEADERS);
      res.end();
      return;
    }

    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    try {
      if (pathname === '/api/health' && req.method === 'GET') {
        sendJson(res, 200, { ok: true });
        return;
      }

      if (pathname === '/api/pods/create' && req.method === 'POST') {
        const body = await readJsonBody(req);
        let code = randomPodCode();
        while (selectStmt.get(code)) {
          code = randomPodCode();
        }
        const incoming = body?.state && typeof body.state === 'object'
          ? body.state
          : body && typeof body === 'object' && Object.keys(body).length > 0 && !('mode' in body)
            ? body
            : null;
        const base = body?.mode === 'blank' ? createBlankOnboardingState() : createDefaultState();
        const state = savePod(code, incoming ? { ...base, ...incoming } : base);
        sendJson(res, 200, { code, state });
        return;
      }

      const podMatch = pathname.match(/^\/api\/pods\/([A-Za-z0-9_-]+)(?:\/(sync|reset|events))?$/);
      if (podMatch) {
        const code = podMatch[1].toUpperCase();
        const action = podMatch[2];

        if (!action && req.method === 'GET') {
          const state = getOrCreatePod(code);
          sendJson(res, 200, { code, state });
          return;
        }

        if (action === 'sync' && req.method === 'POST') {
          const body = await readJsonBody(req);
          const current = getOrCreatePod(code);
          const incoming = body?.state && typeof body.state === 'object' ? body.state : body;
          const state = savePod(code, { ...current, ...incoming });
          broadcast(code, { type: 'sync', code, state });
          sendJson(res, 200, { ok: true, code, state });
          return;
        }

        if (action === 'reset' && req.method === 'POST') {
          const body = await readJsonBody(req);
          const base = body?.mode === 'blank' ? createBlankOnboardingState() : createDefaultState();
          const state = savePod(code, base);
          broadcast(code, { type: 'sync', code, state });
          sendJson(res, 200, { ok: true, code, state });
          return;
        }

        if (action === 'events' && req.method === 'GET') {
          res.writeHead(200, {
            ...CORS_HEADERS,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });
          const state = getOrCreatePod(code);
          res.write(`data: ${JSON.stringify({ type: 'sync', code, state })}\n\n`);

          if (!sseClients.has(code)) {
            sseClients.set(code, new Set());
          }
          const clients = sseClients.get(code);
          clients.add(res);

          req.on('close', () => {
            clients.delete(res);
          });
          return;
        }
      }

      // Serve static files from dist if available
      if (!pathname.startsWith('/api') && fs.existsSync( path.join(DIST_DIR, 'index.html') )) {
        const safeRel = path.normalize(pathname).replace(/^(\.\.(\/|\\|$))+/, '');
        let filePath = path.join(DIST_DIR, safeRel === '/' || safeRel === '\\' ? 'index.html' : safeRel);
        if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
          filePath = path.join(DIST_DIR, 'index.html');
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          ...CORS_HEADERS,
          'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
        });
        fs.createReadStream(filePath).pipe(res);
        return;
      }

      sendJson(res, 404, { error: 'Not found' });
    } catch (err) {
      sendJson(res, 400, { error: err.message || 'Bad request' });
    }
  });

  server.on('close', () => {
    for (const clients of sseClients.values()) {
      for (const client of clients) {
        try {
          client.end();
        } catch {
          // ignore
        }
      }
      clients.clear();
    }
    try {
      db.close();
    } catch {
      // ignore
    }
  });

  return server;
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const port = Number(process.env.PORT) || 3001;
  const server = createAppServer();
  server.listen(port, () => {
    console.log(`StudyPod API server listening on http://localhost:${port}`);
  });
}
