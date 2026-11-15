import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** False when the .env values are missing: the storefront then runs on built-in demo data. */
export const isSupabaseConfigured = Boolean(url && anonKey);

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  console.warn(
    '[supabase] VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY are not set. ' +
      'Copy .env.example to .env and fill them in. Running on local demo data.'
  );
}

// The anon key is designed to be public: Row Level Security protects the data.
export const supabase = createClient(
  url || 'http://localhost:54321',
  anonKey || 'supabase-not-configured',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true, // completes the Google OAuth redirect
    },
  }
);
