import { createClient } from '@supabase/supabase-js';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

function hasValidSupabaseEnv(candidateUrl: string, candidateKey: string): boolean {
  if (!candidateUrl || !candidateKey) return false;
  const lowerUrl = candidateUrl.toLowerCase();
  const lowerKey = candidateKey.toLowerCase();
  if (
    lowerUrl.includes('your-project-ref') ||
    lowerUrl.includes('placeholder') ||
    lowerUrl.includes('example.com') ||
    lowerKey.includes('your-anon-key') ||
    lowerKey.includes('placeholder') ||
    lowerKey === 'supabase-not-configured'
  ) {
    return false;
  }
  return lowerUrl.startsWith('https://') || lowerUrl.startsWith('http://');
}

/** False when the .env values are missing or placeholders: the storefront then runs on built-in demo data. */
export const isSupabaseConfigured = hasValidSupabaseEnv(rawUrl, rawAnonKey);
const url = isSupabaseConfigured ? rawUrl : '';
const anonKey = isSupabaseConfigured ? rawAnonKey : '';

if (!isSupabaseConfigured && typeof console !== 'undefined') {
  console.info(
    '[supabase] Running on built-in UAE demo catalog & seeded order state (connect VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY for live cloud persistence).'
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
