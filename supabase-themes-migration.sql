-- Migration script to update existing themes table with new columns
-- Current schema has: id, name, preview_image_url, wallpaper_url, is_default, created_at

-- Add missing columns if they don't exist
ALTER TABLE themes ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS primary_color TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS secondary_color TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS accent_color TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS background_color TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS text_color TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS persona TEXT;
ALTER TABLE themes ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Drop existing constraints if they exist (to avoid conflicts)
DO $$ 
BEGIN
    ALTER TABLE themes DROP CONSTRAINT IF EXISTS themes_category_check;
    ALTER TABLE themes DROP CONSTRAINT IF EXISTS themes_type_check;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Add constraints
ALTER TABLE themes ADD CONSTRAINT themes_category_check 
  CHECK (category IN ('nature', 'abstract', 'minimal', 'urban', 'space', 'gradient'));

ALTER TABLE themes ADD CONSTRAINT themes_type_check 
  CHECK (type IN ('wallpaper', 'color_scheme'));

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_themes_category ON themes (category);
CREATE INDEX IF NOT EXISTS idx_themes_type ON themes (type);
CREATE INDEX IF NOT EXISTS idx_themes_persona ON themes (persona);

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read themes" ON themes;
DROP POLICY IF EXISTS "Authenticated users can insert themes" ON themes;

-- Recreate policies
CREATE POLICY "Anyone can read themes" ON themes
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert themes" ON themes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Clear existing data (optional - remove this line if you want to keep existing themes)
-- DELETE FROM themes;

-- Insert sample wallpaper themes
INSERT INTO themes (name, category, type, wallpaper_url, primary_color, secondary_color, accent_color) VALUES
('Nebula Night', 'space', 'wallpaper', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80', '#a855f7', '#6366f1', '#0f172a'),
('Aurora Waves', 'nature', 'wallpaper', 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80', '#22d3ee', '#34d399', '#0b1120'),
('Desert Dusk', 'nature', 'wallpaper', 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80', '#f59e0b', '#f97316', '#1f2937'),
('Midnight Minimal', 'minimal', 'wallpaper', 'https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1200&q=80', '#f3f4f6', '#94a3b8', '#0f172a'),
('Ocean Breeze', 'nature', 'wallpaper', 'https://images.unsplash.com/photo-1505142468610-359e7d316be0?auto=format&fit=crop&w=1200&q=80', '#06b6d4', '#0ea5e9', '#0c4a6e'),
('Mountain Peak', 'nature', 'wallpaper', 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1200&q=80', '#64748b', '#475569', '#1e293b'),
('City Lights', 'urban', 'wallpaper', 'https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1200&q=80', '#f59e0b', '#eab308', '#78350f'),
('Purple Dream', 'gradient', 'wallpaper', 'https://images.unsplash.com/photo-1557672172-298e090bd0f1?auto=format&fit=crop&w=1200&q=80', '#a855f7', '#ec4899', '#7c3aed'),
('Forest Path', 'nature', 'wallpaper', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80', '#22c55e', '#16a34a', '#14532d'),
('Abstract Flow', 'abstract', 'wallpaper', 'https://images.unsplash.com/photo-1557672199-6ba6f7f6f1c6?auto=format&fit=crop&w=1200&q=80', '#f43f5e', '#fb923c', '#be123c')
ON CONFLICT (id) DO NOTHING;

-- Insert sample color scheme themes
INSERT INTO themes (name, category, type, background_color, text_color, primary_color, secondary_color, accent_color) VALUES
('Light Mode', 'minimal', 'color_scheme', '#ffffff', '#1f2937', '#3b82f6', '#6366f1', '#8b5cf6'),
('Dark Mode', 'minimal', 'color_scheme', '#0f172a', '#f1f5f9', '#3b82f6', '#6366f1', '#8b5cf6'),
('Warm Sunset', 'gradient', 'color_scheme', '#fef3c7', '#78350f', '#f59e0b', '#f97316', '#ea580c'),
('Cool Ocean', 'gradient', 'color_scheme', '#ecfeff', '#164e63', '#06b6d4', '#0ea5e9', '#0284c7')
ON CONFLICT (id) DO NOTHING;
