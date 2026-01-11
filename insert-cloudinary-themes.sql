-- SQL script to insert themes with Cloudinary image URLs
-- Replace the placeholder URLs with your actual Cloudinary image URLs

-- First, verify the themes table structure
-- SELECT * FROM themes LIMIT 1;

-- Insert wallpaper themes with Cloudinary URLs
-- IMPORTANT: Replace 'YOUR_CLOUDINARY_URL_HERE' with your actual Cloudinary image URLs

INSERT INTO themes (name, category, type, wallpaper_url, primary_color, secondary_color, accent_color) VALUES
-- Nature themes
('Aurora Waves', 'nature', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#22d3ee', '#34d399', '#0b1120'),
('Ocean Breeze', 'nature', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#06b6d4', '#0ea5e9', '#0c4a6e'),
('Mountain Peak', 'nature', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#64748b', '#475569', '#1e293b'),
('Forest Path', 'nature', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#22c55e', '#16a34a', '#14532d'),
('Desert Dusk', 'nature', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#f59e0b', '#f97316', '#1f2937'),

-- Space themes
('Nebula Night', 'space', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#a855f7', '#6366f1', '#0f172a'),

-- Minimal themes
('Midnight Minimal', 'minimal', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#f3f4f6', '#94a3b8', '#0f172a'),

-- Urban themes
('City Lights', 'urban', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#f59e0b', '#eab308', '#78350f'),

-- Gradient themes
('Purple Dream', 'gradient', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#a855f7', '#ec4899', '#7c3aed'),

-- Abstract themes
('Abstract Flow', 'abstract', 'wallpaper', 'YOUR_CLOUDINARY_URL_HERE', '#f43f5e', '#fb923c', '#be123c')

ON CONFLICT (id) DO NOTHING;

-- Verify the inserted themes
SELECT id, name, category, wallpaper_url FROM themes WHERE type = 'wallpaper' ORDER BY category, name;

-- INSTRUCTIONS:
-- 1. Upload your images to Cloudinary
-- 2. Get the public URLs for each image (should look like: https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/v1234567890/your-image.jpg)
-- 3. Replace each 'YOUR_CLOUDINARY_URL_HERE' with the actual Cloudinary URL
-- 4. Run this script in your Supabase SQL Editor
-- 5. Refresh your app to see the new themes

-- Example Cloudinary URL format:
-- https://res.cloudinary.com/demo/image/upload/v1234567890/sample.jpg
-- https://res.cloudinary.com/YOUR_CLOUD_NAME/image/upload/w_1200,h_800,c_fill/your-image-name.jpg
