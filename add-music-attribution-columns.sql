-- Add attribution columns to music table
ALTER TABLE music
ADD COLUMN IF NOT EXISTS author TEXT,
ADD COLUMN IF NOT EXISTS source TEXT;

-- Add comment for documentation
COMMENT ON COLUMN music.author IS 'Artist/contributor name for attribution';
COMMENT ON COLUMN music.source IS 'Source platform (e.g., Pixabay) for attribution';
