# StudyPod — iOS 26 Liquid Glass Study Accountability App

2-person study accountability & Pomodoro pod tracker inspired by iOS 26 Liquid Glass.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fomarelders%2Fstudy-pod&env=VITE_SUPABASE_URL,VITE_SUPABASE_ANON_KEY&envDescription=Optional%20Supabase%20URL%20and%20Anon%20Key%20for%20cross-device%20cloud%20sync)

## Backend Architecture (3-Tier Automatic Sync)

1. **Local SQLite + SSE Backend (`server.js`)**
   - Built on Node.js 24 native `node:sqlite` (`studypod.db`) + real-time Server-Sent Events (`/api/pods/:code/events`).
   - Run locally with:
     ```bash
     npm install
     npm run build
     npm start
     ```
2. **Vercel Serverless API (`api/index.js` + `vercel.json`)**
   - Automatically handles `/api/health`, `/api/pods/create`, `/api/pods/:code`, and `/api/pods/:code/sync` on Vercel.
3. **Supabase Free Cloud Database (`supabase/schema.sql` + `src/data/supabaseSync.js`)**
   - Zero-dependency PostgREST sync for persistent multi-device Pod pairing (`ZAU8PP`).
   - To enable Supabase persistence:
     1. Create a free project at [supabase.com](https://supabase.com) and run [`supabase/schema.sql`](./supabase/schema.sql) in the **SQL Editor**.
     2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in your Vercel Project **Settings → Environment Variables**.
