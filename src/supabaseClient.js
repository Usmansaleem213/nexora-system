import { createClient } from '@supabase/supabase-js';

// Apne Supabase dashboard se URL aur Anon Key yahan dalein
const supabaseUrl = 'https://muhlvzuahtksscgbgylq.supabase.co';
const supabaseAnonKey = 'sb_publishable_G9QB_h4PIDe12mcyrLtEyw_Xhjucu_3';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);