import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL?.trim();
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

export const isSupabaseConfigured = !!(url && key);
let client: SupabaseClient | null = null;

/** A autenticação é real mesmo quando os demais serviços usam dados demo. */
export function getSupabase() {
  if (!url || !key) return null;
  client ??= createClient(url, key, {
    auth: {
      storage: AsyncStorage,
      storageKey: '@flamengo/supabase-auth',
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      lock: processLock,
    },
  });
  return client;
}

export function requireSupabase() {
  const supabase = getSupabase();
  if (!supabase) throw new Error('SUPABASE_NOT_CONFIGURED');
  return supabase;
}
