import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Evita quebrar o build; apenas alerta em tempo de execução.
  console.warn('VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não configurados.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

