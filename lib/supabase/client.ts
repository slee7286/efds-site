"use client";

import { createBrowserClient } from "@supabase/ssr";
import { config } from "@/lib/config";

export function createBrowserSupabaseClient() {
  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
}
