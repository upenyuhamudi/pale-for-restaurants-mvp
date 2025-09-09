-- Update Google Drive URLs to use thumbnail format for better compatibility
-- This script converts existing Google Drive URLs to the thumbnail format

-- Update meals table
UPDATE meals 
SET image_url = CASE 
  WHEN image_url ~ 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(image_url, 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  WHEN image_url ~ '[?&]id=([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(image_url, '[?&]id=([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  ELSE image_url 
END
WHERE image_url IS NOT NULL 
  AND (image_url LIKE '%drive.google.com%' OR image_url LIKE '%docs.google.com%');

-- Update drinks table
UPDATE drinks 
SET image_url = CASE 
  WHEN image_url ~ 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(image_url, 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  WHEN image_url ~ '[?&]id=([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(image_url, '[?&]id=([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  ELSE image_url 
END
WHERE image_url IS NOT NULL 
  AND (image_url LIKE '%drive.google.com%' OR image_url LIKE '%docs.google.com%');

-- Update restaurants table
UPDATE restaurants 
SET logo_url = CASE 
  WHEN logo_url ~ 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(logo_url, 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  WHEN logo_url ~ '[?&]id=([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(logo_url, '[?&]id=([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  ELSE logo_url 
END,
header_image = CASE 
  WHEN header_image ~ 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(header_image, 'drive\.google\.com/file/d/([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  WHEN header_image ~ '[?&]id=([a-zA-Z0-9_-]+)' THEN 
    'https://drive.google.com/thumbnail?id=' || 
    (regexp_match(header_image, '[?&]id=([a-zA-Z0-9_-]+)'))[1] || 
    '&sz=w400-h400'
  ELSE header_image 
END
WHERE (logo_url IS NOT NULL AND (logo_url LIKE '%drive.google.com%' OR logo_url LIKE '%docs.google.com%'))
   OR (header_image IS NOT NULL AND (header_image LIKE '%drive.google.com%' OR header_image LIKE '%docs.google.com%'));
