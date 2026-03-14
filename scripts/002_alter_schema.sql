-- Add missing columns and fix schema
ALTER TABLE links ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE links ADD COLUMN IF NOT EXISTS favicon_url TEXT;

-- Update existing favicon column if needed
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'links' AND column_name = 'favicon') THEN
    UPDATE links SET favicon_url = favicon WHERE favicon_url IS NULL AND favicon IS NOT NULL;
    ALTER TABLE links DROP COLUMN IF EXISTS favicon;
  END IF;
END $$;

-- Make domain nullable since we'll extract it from URL
ALTER TABLE links ALTER COLUMN domain DROP NOT NULL;

-- Add color column to tags
ALTER TABLE tags ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#10b981';
