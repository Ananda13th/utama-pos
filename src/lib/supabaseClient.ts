import { createClient } from '@supabase/supabase-js';

// Inisialisasi Supabase client (satu instance untuk seluruh aplikasi)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Environment variable Supabase belum diset. Salin .env.example menjadi .env dan isi kredensialnya.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
