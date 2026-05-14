-- Migration: Atomic Wallet Balance Function (Fix #9)
-- Date: 2026-04-25
-- Purpose: Enable atomic balance calculation with row-level locking

-- Fonction pour récupérer le solde de manière atomique avec row-level locking
CREATE OR REPLACE FUNCTION get_wallet_balance_atomic(p_user_id UUID)
RETURNS TABLE(balance NUMERIC, currency TEXT, updated_at TIMESTAMPTZ) AS $$
DECLARE
    v_balance NUMERIC;
    v_currency TEXT;
    v_updated_at TIMESTAMPTZ;
BEGIN
    -- Utiliser SELECT FOR UPDATE pour verrouiller la ligne pendant la lecture
    -- Cela garantit que personne ne peut modifier le solde pendant le calcul
    SELECT w.balance, w.currency, w.updated_at
    INTO v_balance, v_currency, v_updated_at
    FROM wallets w
    WHERE w.user_id = p_user_id
    FOR UPDATE NOWAIT; -- Échoue immédiatement si verrou déjà pris

    -- Si pas de wallet trouvé, retourner des valeurs par défaut
    IF NOT FOUND THEN
        v_balance := 0;
        v_currency := 'EUR';
        v_updated_at := NOW();
    END IF;

    RETURN QUERY SELECT v_balance, v_currency, v_updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_wallet_balance_atomic(UUID) IS 
'Retourne le solde du wallet avec row-level locking (FOR UPDATE NOWAIT).
Garantit la cohérence en cas de transactions concurrentes.';

GRANT EXECUTE ON FUNCTION get_wallet_balance_atomic(UUID) TO authenticated, service_role;

-- Fonction pour créditer/débiter le wallet de manière atomique
CREATE OR REPLACE FUNCTION update_wallet_balance_atomic(
    p_user_id UUID,
    p_amount NUMERIC,  -- Positif pour crédit, négatif pour débit
    p_description TEXT DEFAULT NULL,
    p_booking_id UUID DEFAULT NULL
)
RETURNS TABLE(new_balance NUMERIC, success BOOLEAN, error TEXT) AS $$
DECLARE
    v_current_balance NUMERIC;
    v_new_balance NUMERIC;
    v_currency TEXT;
    v_wallet_id UUID;
BEGIN
    -- Verrouiller le wallet et récupérer le solde actuel
    SELECT w.id, w.balance, w.currency
    INTO v_wallet_id, v_current_balance, v_currency
    FROM wallets w
    WHERE w.user_id = p_user_id
    FOR UPDATE;

    -- Si pas de wallet, en créer un
    IF NOT FOUND THEN
        INSERT INTO wallets (user_id, balance, currency)
        VALUES (p_user_id, 0, 'EUR')
        RETURNING id, balance, currency 
        INTO v_wallet_id, v_current_balance, v_currency;
    END IF;

    -- Calculer le nouveau solde
    v_new_balance := v_current_balance + p_amount;

    -- Vérifier que le solde ne devient pas négatif
    IF v_new_balance < 0 THEN
        RETURN QUERY SELECT v_current_balance, FALSE, 'Solde insuffisant'::TEXT;
        RETURN;
    END IF;

    -- Mettre à jour le wallet
    UPDATE wallets
    SET balance = v_new_balance,
        updated_at = NOW()
    WHERE id = v_wallet_id;

    -- Créer la transaction
    INSERT INTO wallet_transactions (
        user_id,
        wallet_id,
        amount,
        type,
        status,
        description,
        booking_id
    ) VALUES (
        p_user_id,
        v_wallet_id,
        ABS(p_amount),
        CASE WHEN p_amount > 0 THEN 'credit' ELSE 'debit' END,
        'completed',
        p_description,
        p_booking_id
    );

    RETURN QUERY SELECT v_new_balance, TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_wallet_balance_atomic(UUID, NUMERIC, TEXT, UUID) IS 
'Crédite ou débite le wallet de manière atomique avec row-level locking.
Garantit la cohérence du solde et empêche les balances négatives.
Retourne (new_balance, success, error).';

GRANT EXECUTE ON FUNCTION update_wallet_balance_atomic(UUID, NUMERIC, TEXT, UUID) TO authenticated, service_role;
