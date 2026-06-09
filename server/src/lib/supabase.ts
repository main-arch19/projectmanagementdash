import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isDemoMode = !url || !key;

export const supabase = createClient(
  url ?? 'https://placeholder.supabase.co',
  key ?? 'placeholder-key',
  { auth: { persistSession: false } }
);
