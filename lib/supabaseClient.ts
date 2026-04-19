import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file."
  );
}

/**
 * Supabase client for browser/client-side operations
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client
 * For server-side operations, use the service role key (if needed)
 */
export function createServerClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    // Fallback to anon key if service role key is not available
    return createClient(supabaseUrl!, supabaseAnonKey!);
  }

  return createClient(supabaseUrl!, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
}

/**
 * Type for the Users table
 */
export interface UserRecord {
  id: string;
  user_token: string;
  created_at: string;
  last_visit_date: string | null;
}

/**
 * Type for the API Calls table
 */
export interface ApiCallRecord {
  id: string;
  user_token: string;
  timestamp: string;
  status: "success" | "error";
  retry_count: number;
  model_used: string;
}

/**
 * Type for the Visit Logs table
 */
export interface VisitLogRecord {
  id: string;
  user_token: string;
  visit_date: string;
  count: number;
}

/**
 * Type for User Settings table
 */
export interface UserSettings {
  id: string;
  user_token: string;
  custom_api_key: string | null;
  custom_model: string | null;
  custom_system_prompt: string | null;
  preferred_platforms: string[]; // JSON array of platforms
  updated_at: string;
}
