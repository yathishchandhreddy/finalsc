import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key, {
        auth: {
          persistSession: false
        }
      });
    } catch (err) {
      console.warn('Failed to initialize Supabase client:', err);
      return null;
    }
  }

  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return !!(process.env.SUPABASE_URL && (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY));
}

export async function checkSupabaseConnection(): Promise<{ connected: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      connected: false,
      message: 'Supabase credentials not configured in environment variables.'
    };
  }

  try {
    const { error } = await client.from('vsb_documents').select('count', { count: 'exact', head: true });
    if (error && error.code !== 'PGRST116' && !error.message.includes('relation') && !error.message.includes('does not exist')) {
      return { connected: false, message: error.message };
    }
    return { connected: true, message: 'Connected to Supabase successfully' };
  } catch (err: any) {
    return { connected: false, message: err?.message || 'Error connecting to Supabase' };
  }
}
