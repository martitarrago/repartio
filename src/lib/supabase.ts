import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Cliente público — usado en el frontend para Realtime y Storage uploads
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente con service role — solo para uso en server-side (API routes)
// Nunca exponer SUPABASE_SERVICE_ROLE_KEY al cliente
export function createServiceClient() {
  return createClient(
    supabaseUrl,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
