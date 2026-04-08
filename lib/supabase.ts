import { createClient } from '@supabase/supabase-js'

// ✅ Client PUBLIC — utilisé uniquement dans les composants React côté client
// ⚠️ Ne jamais faire de requêtes sensibles avec ce client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)