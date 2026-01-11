-- Delete the 5 invalid theme entries identified by the user
-- These themes have broken URLs causing 400 errors

DELETE FROM themes 
WHERE id IN (
  '1ce26ff4-fc58-4c9d-af01-96f51af66425',
  '5390f82b-cad2-44c6-a654-739cb82774e4',
  '67c74c21-c5f8-4e3b-a96b-bc7d106a4925',
  '32092ba8-ea6c-408b-8de2-56ff9ce18c5f',
  '16a7e9c6-11d6-4bef-9393-d5b2b5636567'
);

-- Verify deletion
SELECT COUNT(*) as deleted_count FROM themes WHERE id IN (
  '1ce26ff4-fc58-4c9d-af01-96f51af66425',
  '5390f82b-cad2-44c6-a654-739cb82774e4',
  '67c74c21-c5f8-4e3b-a96b-bc7d106a4925',
  '32092ba8-ea6c-408b-8de2-56ff9ce18c5f',
  '16a7e9c6-11d6-4bef-9393-d5b2b5636567'
);
-- Should return 0 after deletion

-- Check remaining wallpaper themes
SELECT id, name, category, wallpaper_url 
FROM themes 
WHERE type = 'wallpaper'
ORDER BY name;
