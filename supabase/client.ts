
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from './credentials.ts';

// A verificação garante que a aplicação falhe de forma clara se as credenciais
// não forem fornecidas no arquivo credentials.ts.
// FIX: Removed the comparison to a placeholder string, which caused a TS error since the URL is already configured.
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

let supabase: any; // Use 'any' to avoid initialization error

if (isSupabaseConfigured) {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  console.warn("Supabase credentials are not configured in supabase/credentials.ts. The app will not function correctly.");
}

export { supabase, isSupabaseConfigured };