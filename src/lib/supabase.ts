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

export const isSupabaseConfigured = hasValidSupabaseEnv(rawUrl, rawAnonKey);
const url = isSupabaseConfigured ? rawUrl : '';
const anonKey = isSupabaseConfigured ? rawAnonKey : '';

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
