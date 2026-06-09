import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isDemoMode = !url || !key;

export const supabase = (isDemoMode
  ? null
  : createClient(url!, key!, { auth: { persistSession: false } })
) as ReturnType<typeof createClient>;
