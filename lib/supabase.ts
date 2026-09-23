import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'EXPO_PUBLIC_SUPABASE_URL と EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY を設定してください',
  );
}

// Expo Web is server-rendered during startup. AsyncStorage's web adapter
// accesses window, so storage must be a no-op until the browser is available.
const isWebServer = Platform.OS === 'web' && typeof window === 'undefined';
const authStorage = {
  getItem: (key: string) => (isWebServer ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    isWebServer ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) => (isWebServer ? Promise.resolve() : AsyncStorage.removeItem(key)),
};

/** 開発環境のSupabaseクライアント。service_roleキーはクライアントに置かない。 */
export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
