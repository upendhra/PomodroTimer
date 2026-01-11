-- SQL script to identify and optionally remove themes with invalid URLs

-- 1. First, let's see what themes exist with problematic URLs
SELECT id, name, category, wallpaper_url 
FROM themes 
WHERE type = 'wallpaper' 
  AND (
    wallpaper_url LIKE '%/Assets/%' 
    OR wallpaper_url LIKE '%workers.dev%'
    OR wallpaper_url IS NULL
  );

-- 2. Option A: Delete themes with invalid Supabase Assets URLs
-- Uncomment to execute:
-- DELETE FROM themes 
-- WHERE type = 'wallpaper' 
--   AND wallpaper_url LIKE '%/Assets/%';

-- 3. Option B: Delete themes with Cloudflare Worker URLs (CORS issues)
-- Uncomment to execute:
-- DELETE FROM themes 
-- WHERE type = 'wallpaper' 
--   AND wallpaper_url LIKE '%workers.dev%';

-- 4. Option C: Delete ALL invalid wallpaper themes and keep only Unsplash URLs
-- Uncomment to execute:
-- DELETE FROM themes 
-- WHERE type = 'wallpaper' 
--   AND wallpaper_url NOT LIKE '%unsplash.com%';

-- 5. After cleanup, verify remaining themes
-- SELECT id, name, category, wallpaper_url 
-- FROM themes 
-- WHERE type = 'wallpaper';
