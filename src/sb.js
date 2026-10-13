/* One shared Supabase client for the public site, user dashboard and admin portal. */
import { createClient } from "@supabase/supabase-js";
let client = null;
export const hasSupabase = () => !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
export function sb() {
  if (!client && hasSupabase()) client = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);
  return client;
}
// Demo preview only: forget the client so a new persona gets a fresh session.
export function resetSb() { client = null; }
