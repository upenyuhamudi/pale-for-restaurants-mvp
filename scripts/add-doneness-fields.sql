-- Add doneness configuration fields to meals table
ALTER TABLE meals 
ADD COLUMN IF NOT EXISTS requires_doneness boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS doneness_options jsonb DEFAULT '[]'::jsonb;

-- Update existing meals to have default doneness options for steaks and burgers
UPDATE meals 
SET requires_doneness = true,
    doneness_options = '["Rare", "Medium Rare", "Medium", "Medium Well", "Well Done"]'::jsonb
WHERE LOWER(name) LIKE '%steak%' 
   OR LOWER(name) LIKE '%burger%' 
   OR LOWER(description) LIKE '%steak%' 
   OR LOWER(description) LIKE '%burger%';
