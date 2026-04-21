-- Migration d'urgence : ajout des colonnes de paiement manquantes
-- Ces colonnes sont essentielles pour le fonctionnement du paiement Stripe

-- Vérifier et ajouter chaque colonne si manquante
DO $$
BEGIN
    -- online_payment_enabled
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'online_payment_enabled') THEN
        ALTER TABLE public.profiles ADD COLUMN online_payment_enabled boolean NOT NULL DEFAULT false;
        RAISE NOTICE 'Ajout de la colonne online_payment_enabled';
    END IF;

    -- deposit_required
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deposit_required') THEN
        ALTER TABLE public.profiles ADD COLUMN deposit_required boolean NOT NULL DEFAULT false;
        RAISE NOTICE 'Ajout de la colonne deposit_required';
    END IF;

    -- deposit_type
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deposit_type') THEN
        ALTER TABLE public.profiles ADD COLUMN deposit_type text NOT NULL DEFAULT 'percent';
        -- Ajouter la contrainte CHECK si possible (peut échouer si données existantes)
        BEGIN
            ALTER TABLE public.profiles ADD CONSTRAINT deposit_type_check 
                CHECK (deposit_type IN ('percent', 'fixed'));
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Contrainte CHECK non ajoutée (peut-être des données existantes)';
        END;
        RAISE NOTICE 'Ajout de la colonne deposit_type';
    END IF;

    -- deposit_value
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'deposit_value') THEN
        ALTER TABLE public.profiles ADD COLUMN deposit_value numeric NOT NULL DEFAULT 25;
        RAISE NOTICE 'Ajout de la colonne deposit_value';
    END IF;

    -- allow_full_online_payment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'allow_full_online_payment') THEN
        ALTER TABLE public.profiles ADD COLUMN allow_full_online_payment boolean NOT NULL DEFAULT false;
        RAISE NOTICE 'Ajout de la colonne allow_full_online_payment';
    END IF;
END $$;

-- Commentaires pour documentation
COMMENT ON COLUMN public.profiles.online_payment_enabled IS 
    'Active le paiement en ligne via Stripe (false = réservation sans paiement)';
COMMENT ON COLUMN public.profiles.deposit_required IS 
    'Exige un acompte en ligne obligatoire (uniquement si online_payment_enabled = true)';
COMMENT ON COLUMN public.profiles.deposit_type IS 
    'Type d''acompte : percent (pourcentage) ou fixed (montant fixe en euros)';
COMMENT ON COLUMN public.profiles.deposit_value IS 
    'Valeur de l''acompte : pourcentage (1-100) ou montant fixe selon deposit_type';
COMMENT ON COLUMN public.profiles.allow_full_online_payment IS 
    'Autorise le paiement intégral en ligne en plus de l''acompte';
