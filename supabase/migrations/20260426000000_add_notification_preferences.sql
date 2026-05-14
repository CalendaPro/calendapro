-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration #38 - Ajouter colonne notification_preferences à profiles
-- ═══════════════════════════════════════════════════════════════════════════════

-- Ajouter la colonne si elle n'existe pas
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "email": true,
  "sms": true,
  "push": true
}'::jsonb;

-- Commentaire explicatif
COMMENT ON COLUMN public.profiles.notification_preferences IS 
'Préférences de notification: { email: boolean, sms: boolean, push: boolean }';

-- Index GIN pour rechercher efficacement dans le JSON
CREATE INDEX IF NOT EXISTS idx_profiles_notification_prefs 
ON public.profiles USING GIN (notification_preferences);

-- Fonction helper pour vérifier si un utilisateur accepte les notifications
CREATE OR REPLACE FUNCTION public.user_accepts_notification_type(
  user_id TEXT,
  notif_type TEXT
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  prefs JSONB;
BEGIN
  SELECT notification_preferences INTO prefs
  FROM public.profiles
  WHERE id = user_id;
  
  -- Si pas de préférences, accepter par défaut
  IF prefs IS NULL THEN
    RETURN true;
  END IF;
  
  -- Vérifier le type spécifique
  RETURN COALESCE((prefs->>notif_type)::boolean, true);
END;
$$;
