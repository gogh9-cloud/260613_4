import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: window.sessionStorage, // 창을 닫으면 세션이 삭제되도록 설정
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
