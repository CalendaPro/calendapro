-- Migration: RPC get_pro_photos pour fixer le N+1 sur les photos de profil
-- Date: 2026-04-25

create or replace function get_pro_photos(pro_id uuid)
returns table (
  url text,
  path text
)
language plpgsql
security definer
as $$
declare
  bucket_name text := 'pro-photos';
  prefix text;
begin
  prefix := pro_id::text || '/';
  
  -- Retourne les URLs publiques pour les photos du pro
  -- Note: Les URLs signées nécessitent une logique côté client/Edge Function
  -- Cette RPC retourne les chemins; le client peut générer les URLs signées
  return query
  select 
    storage.filename(name) as path,
    storage.filename(name) as url_placeholder
  from storage.objects
  where bucket_id = bucket_name
    and name like prefix || '%';
end;
$$;

-- Alternative: Version qui retourne les chemins complets pour traitement côté serveur
create or replace function get_pro_photo_paths(pro_id uuid)
returns table (
  name text,
  full_path text
)
language sql
security definer
as $$
  select 
    name,
    name as full_path
  from storage.objects
  where bucket_id = 'pro-photos'
    and name like pro_id::text || '/%';
$$;

-- Grant access to authenticated and anon users (public profiles)
grant execute on function get_pro_photos(uuid) to authenticated;
grant execute on function get_pro_photos(uuid) to anon;
grant execute on function get_pro_photo_paths(uuid) to authenticated;
grant execute on function get_pro_photo_paths(uuid) to anon;
