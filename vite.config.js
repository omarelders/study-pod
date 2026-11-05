import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const resolvedUrl =
    env.VITE_SUPABASE_URL ||
    env.NEXT_PUBLIC_SUPABASE_URL ||
    env.SUPABASE_URL ||
    '';
  const resolvedAnonKey =
    env.VITE_SUPABASE_ANON_KEY ||
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    env.SUPABASE_ANON_KEY ||
    env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    env.SUPABASE_PUBLISHABLE_KEY ||
    '';

  return {
    plugins: [react(), tailwindcss()],
    define: {
      __STUDYPOD_SUPABASE_URL__: JSON.stringify(resolvedUrl),
      __STUDYPOD_SUPABASE_ANON_KEY__: JSON.stringify(resolvedAnonKey),
    },
    server: {
      port: 5173,
      proxy: {
        '/api': 'http://127.0.0.1:3001',
      },
    },
  };
});
