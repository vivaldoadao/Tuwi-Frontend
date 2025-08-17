-- Remove location field from braiders table
-- This script safely removes the location column after data migration

BEGIN;

-- Check if all data has been migrated
DO $$
BEGIN
    -- Verify that all braiders with location data now have district populated
    IF EXISTS (
        SELECT 1 FROM braiders 
        WHERE location IS NOT NULL 
        AND district IS NULL
    ) THEN
        RAISE EXCEPTION 'Migration incomplete: some braiders still have location without district';
    END IF;
    
    RAISE NOTICE 'Migration verification passed: all location data migrated to structured fields';
END $$;

-- Remove the location column
ALTER TABLE braiders DROP COLUMN IF EXISTS location;

-- Update RLS policies if needed (location field should not be referenced)
-- Note: No policy changes needed as location wasn't used in RLS

COMMIT;

-- Success message
SELECT 'Location field removed successfully from braiders table' AS result;