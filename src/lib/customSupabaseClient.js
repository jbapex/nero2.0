import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? 'https://ujfhwjwfpbmhkmkdrbaq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVqZmh3andmcGJtaGtta2RyYmFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODkxMDMsImV4cCI6MjA2OTU2NTEwM30.sGySIGLJ-LjXxG8XBbOmet3xB1N9BJIRrQzTRT8qL9U';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);