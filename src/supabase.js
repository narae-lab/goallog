import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://clokopqfsjlcxchlruvq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_xfmRiqEE28TIlBXefAGipA_Kiwk2fS7';

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
