-- Migration: Advisory Lock Functions for Distributed Cron Locking
-- Date: 2026-04-25
-- Purpose: Enable distributed locking using PostgreSQL advisory locks

-- Function to try acquiring an advisory lock (non-blocking)
CREATE OR REPLACE FUNCTION try_advisory_lock(lock_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN pg_try_advisory_lock(lock_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release an advisory lock
CREATE OR REPLACE FUNCTION advisory_unlock(lock_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN pg_advisory_unlock(lock_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to release all advisory locks for current session (cleanup)
CREATE OR REPLACE FUNCTION advisory_unlock_all()
RETURNS VOID AS $$
BEGIN
    PERFORM pg_advisory_unlock_all();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on functions
COMMENT ON FUNCTION try_advisory_lock(BIGINT) IS 'Tente d''acquérir un verrou advisory PostgreSQL. Retourne true si acquis, false si déjà pris.';
COMMENT ON FUNCTION advisory_unlock(BIGINT) IS 'Libère un verrou advisory PostgreSQL précédemment acquis.';
COMMENT ON FUNCTION advisory_unlock_all() IS 'Libère tous les verrous advisory de la session courante.';

-- Grant execute to authenticated and service_role
GRANT EXECUTE ON FUNCTION try_advisory_lock(BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION advisory_unlock(BIGINT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION advisory_unlock_all() TO authenticated, service_role;
