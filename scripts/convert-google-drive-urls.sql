-- Convert Google Drive sharing links to direct viewable URLs
-- This script finds Google Drive links and converts them to the proper format

-- First, let's see what Google Drive URLs we have
SELECT 'meals' as table_name, id, name, image_url 
FROM meals 
WHERE image_url LIKE '%drive.google.com%'
UNION ALL
SELECT 'drinks' as table_name, id, name, image_url 
FROM drinks 
WHERE image_url LIKE '%drive.google.com%'
UNION ALL
SELECT 'restaurants' as table_name, id, name, logo_url as image_url
FROM restaurants 
WHERE logo_url LIKE '%drive.google.com%'
UNION ALL
SELECT 'restaurants_header' as table_name, id, name, header_image as image_url
FROM restaurants 
WHERE header_image LIKE '%drive.google.com%';

-- Convert Google Drive sharing links to direct viewable URLs for meals
UPDATE meals 
SET image_url = CASE 
    -- Convert /file/d/FILE_ID/view format
    WHEN image_url ~ 'drive\.google\.com/file/d/([^/]+)' THEN 
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(image_url, 'drive\.google\.com/file/d/([^/]+)'))[1]
    -- Convert open?id=FILE_ID format  
    WHEN image_url ~ 'drive\.google\.com/open\?id=([^&]+)' THEN
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(image_url, 'drive\.google\.com/open\?id=([^&]+)'))[1]
    -- Keep existing URL if already in correct format
    ELSE image_url
END
WHERE image_url LIKE '%drive.google.com%' 
AND image_url NOT LIKE '%uc?export=view%';

-- Convert Google Drive sharing links to direct viewable URLs for drinks
UPDATE drinks 
SET image_url = CASE 
    -- Convert /file/d/FILE_ID/view format
    WHEN image_url ~ 'drive\.google\.com/file/d/([^/]+)' THEN 
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(image_url, 'drive\.google\.com/file/d/([^/]+)'))[1]
    -- Convert open?id=FILE_ID format  
    WHEN image_url ~ 'drive\.google\.com/open\?id=([^&]+)' THEN
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(image_url, 'drive\.google\.com/open\?id=([^&]+)'))[1]
    -- Keep existing URL if already in correct format
    ELSE image_url
END
WHERE image_url LIKE '%drive.google.com%' 
AND image_url NOT LIKE '%uc?export=view%';

-- Convert Google Drive sharing links for restaurant logos
UPDATE restaurants 
SET logo_url = CASE 
    -- Convert /file/d/FILE_ID/view format
    WHEN logo_url ~ 'drive\.google\.com/file/d/([^/]+)' THEN 
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(logo_url, 'drive\.google\.com/file/d/([^/]+)'))[1]
    -- Convert open?id=FILE_ID format  
    WHEN logo_url ~ 'drive\.google\.com/open\?id=([^&]+)' THEN
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(logo_url, 'drive\.google\.com/open\?id=([^&]+)'))[1]
    -- Keep existing URL if already in correct format
    ELSE logo_url
END
WHERE logo_url LIKE '%drive.google.com%' 
AND logo_url NOT LIKE '%uc?export=view%';

-- Convert Google Drive sharing links for restaurant header images
UPDATE restaurants 
SET header_image = CASE 
    -- Convert /file/d/FILE_ID/view format
    WHEN header_image ~ 'drive\.google\.com/file/d/([^/]+)' THEN 
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(header_image, 'drive\.google\.com/file/d/([^/]+)'))[1]
    -- Convert open?id=FILE_ID format  
    WHEN header_image ~ 'drive\.google\.com/open\?id=([^&]+)' THEN
        'https://drive.google.com/uc?export=view&id=' || 
        (regexp_match(header_image, 'drive\.google\.com/open\?id=([^&]+)'))[1]
    -- Keep existing URL if already in correct format
    ELSE header_image
END
WHERE header_image LIKE '%drive.google.com%' 
AND header_image NOT LIKE '%uc?export=view%';

-- Show the results after conversion
SELECT 'Updated meals' as table_name, COUNT(*) as count
FROM meals 
WHERE image_url LIKE '%uc?export=view%'
UNION ALL
SELECT 'Updated drinks' as table_name, COUNT(*) as count
FROM drinks 
WHERE image_url LIKE '%uc?export=view%'
UNION ALL
SELECT 'Updated restaurant logos' as table_name, COUNT(*) as count
FROM restaurants 
WHERE logo_url LIKE '%uc?export=view%'
UNION ALL
SELECT 'Updated restaurant headers' as table_name, COUNT(*) as count
FROM restaurants 
WHERE header_image LIKE '%uc?export=view%';
