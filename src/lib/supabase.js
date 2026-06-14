import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.localStorage, // OAuth 리다이렉트(PKCE) 오류 방지를 위해 localStorage 사용 필수
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
