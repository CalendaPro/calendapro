-- Add description column to services table
ALTER TABLE services ADD COLUMN IF NOT EXISTS description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN services.description IS 'Optional description of the service';
