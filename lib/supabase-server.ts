import { createClient } from '@supabase/supabase-js'

// ✅ Client SERVEUR — utilisé uniquement dans les API routes et Server Actions
// 🔒 La service_role key bypasse le RLS — elle a accès à TOUT
// ⛔ Ne jamais importer ce fichier dans un composant React côté client
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      '❌ Variables Supabase manquantes. Vérifie NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY dans .env.local'
    )
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      // Désactive la persistance de session côté serveur — inutile et risqué
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}