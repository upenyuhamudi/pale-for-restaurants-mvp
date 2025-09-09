-- Create diverse pairing suggestions for meals and drinks using actual menu items
-- This script ensures each meal and drink has unique, varied pairings

-- First, let's create a temporary function to help with random selection
CREATE OR REPLACE FUNCTION array_shuffle(arr anyarray) 
RETURNS anyarray AS $$
BEGIN
    RETURN (
        SELECT array_agg(elem ORDER BY random())
        FROM unnest(arr) AS elem
    );
END;
$$ LANGUAGE plpgsql;

-- Update meal pairings with diverse drink suggestions
-- Each meal gets 2-3 different drinks as pairings
WITH meal_drink_pairings AS (
    SELECT 
        m.id as meal_id,
        m.name as meal_name,
        m.dietary_category,
        -- Get diverse drink suggestions based on meal type
        CASE 
            -- For meat dishes, suggest wines and cocktails
            WHEN m.dietary_category IN ('mains', 'grills') THEN 
                (SELECT array_agg(d.id ORDER BY random()) 
                 FROM drinks d 
                 WHERE d.restaurant_id = m.restaurant_id 
                 AND (d.name ILIKE '%wine%' OR d.name ILIKE '%cocktail%' OR d.name ILIKE '%whiskey%' OR d.name ILIKE '%gin%')
                 LIMIT 2)
            -- For appetizers, suggest lighter drinks
            WHEN m.dietary_category IN ('starters', 'appetizers') THEN 
                (SELECT array_agg(d.id ORDER BY random()) 
                 FROM drinks d 
                 WHERE d.restaurant_id = m.restaurant_id 
                 AND (d.name ILIKE '%beer%' OR d.name ILIKE '%cocktail%' OR d.name ILIKE '%wine%' OR d.name ILIKE '%gin%')
                 LIMIT 2)
            -- For desserts, suggest sweet drinks
            WHEN m.dietary_category IN ('desserts', 'sweets') THEN 
                (SELECT array_agg(d.id ORDER BY random()) 
                 FROM drinks d 
                 WHERE d.restaurant_id = m.restaurant_id 
                 AND (d.name ILIKE '%wine%' OR d.name ILIKE '%cocktail%' OR d.name ILIKE '%liqueur%' OR d.name ILIKE '%port%')
                 LIMIT 2)
            -- Default: mix of popular drinks
            ELSE 
                (SELECT array_agg(d.id ORDER BY random()) 
                 FROM drinks d 
                 WHERE d.restaurant_id = m.restaurant_id 
                 AND d.pricing IS NOT NULL
                 LIMIT 2)
        END as suggested_drinks
    FROM meals m
    WHERE m.restaurant_id = 'rest_mote'
    AND m.availability_status != 'unavailable'
),
-- Add some randomization to ensure variety
randomized_meal_pairings AS (
    SELECT 
        meal_id,
        meal_name,
        -- If no specific matches, get random drinks
        COALESCE(
            suggested_drinks,
            (SELECT array_agg(d.id ORDER BY random()) 
             FROM drinks d 
             WHERE d.restaurant_id = 'rest_mote' 
             AND d.pricing IS NOT NULL 
             LIMIT 2)
        ) as drink_pairings
    FROM meal_drink_pairings
)
UPDATE meals 
SET pairings_drinks = rmp.drink_pairings
FROM randomized_meal_pairings rmp
WHERE meals.id = rmp.meal_id;

-- Update drink pairings with diverse meal suggestions
-- Each drink gets 2-3 different meals as pairings
WITH drink_meal_pairings AS (
    SELECT 
        d.id as drink_id,
        d.name as drink_name,
        -- Get diverse meal suggestions based on drink type
        CASE 
            -- For wines, suggest main courses
            WHEN d.name ILIKE '%wine%' THEN 
                (SELECT array_agg(m.id ORDER BY random()) 
                 FROM meals m 
                 WHERE m.restaurant_id = d.restaurant_id 
                 AND m.dietary_category IN ('mains', 'grills', 'steaks')
                 LIMIT 3)
            -- For beers, suggest casual foods
            WHEN d.name ILIKE '%beer%' OR d.name ILIKE '%lager%' THEN 
                (SELECT array_agg(m.id ORDER BY random()) 
                 FROM meals m 
                 WHERE m.restaurant_id = d.restaurant_id 
                 AND m.dietary_category IN ('starters', 'mains', 'burgers', 'pizza')
                 LIMIT 3)
            -- For cocktails, suggest appetizers and mains
            WHEN d.name ILIKE '%cocktail%' OR d.name ILIKE '%gin%' OR d.name ILIKE '%vodka%' THEN 
                (SELECT array_agg(m.id ORDER BY random()) 
                 FROM meals m 
                 WHERE m.restaurant_id = d.restaurant_id 
                 AND m.dietary_category IN ('starters', 'mains', 'appetizers')
                 LIMIT 3)
            -- For spirits, suggest hearty meals
            WHEN d.name ILIKE '%whiskey%' OR d.name ILIKE '%rum%' OR d.name ILIKE '%brandy%' THEN 
                (SELECT array_agg(m.id ORDER BY random()) 
                 FROM meals m 
                 WHERE m.restaurant_id = d.restaurant_id 
                 AND m.dietary_category IN ('mains', 'grills', 'steaks')
                 LIMIT 3)
            -- For non-alcoholic, suggest lighter meals
            WHEN d.name ILIKE '%juice%' OR d.name ILIKE '%water%' OR d.name ILIKE '%soda%' THEN 
                (SELECT array_agg(m.id ORDER BY random()) 
                 FROM meals m 
                 WHERE m.restaurant_id = d.restaurant_id 
                 AND m.dietary_category IN ('starters', 'salads', 'light')
                 LIMIT 2)
            -- Default: mix of popular meals
            ELSE 
                (SELECT array_agg(m.id ORDER BY random()) 
                 FROM meals m 
                 WHERE m.restaurant_id = d.restaurant_id 
                 AND m.availability_status != 'unavailable'
                 LIMIT 3)
        END as suggested_meals
    FROM drinks d
    WHERE d.restaurant_id = 'rest_mote'
    AND d.availability_status != 'unavailable'
),
-- Add randomization to ensure variety
randomized_drink_pairings AS (
    SELECT 
        drink_id,
        drink_name,
        -- If no specific matches, get random meals
        COALESCE(
            suggested_meals,
            (SELECT array_agg(m.id ORDER BY random()) 
             FROM meals m 
             WHERE m.restaurant_id = 'rest_mote' 
             AND m.availability_status != 'unavailable' 
             LIMIT 3)
        ) as meal_pairings
    FROM drink_meal_pairings
)
UPDATE drinks 
SET pairings_meals = rdp.meal_pairings
FROM randomized_drink_pairings rdp
WHERE drinks.id = rdp.drink_id;

-- Clean up temporary function
DROP FUNCTION IF EXISTS array_shuffle(anyarray);

-- Verify the updates
SELECT 
    'Meals Updated' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN pairings_drinks IS NOT NULL AND array_length(pairings_drinks, 1) > 0 THEN 1 END) as with_pairings
FROM meals 
WHERE restaurant_id = 'rest_mote'

UNION ALL

SELECT 
    'Drinks Updated' as type,
    COUNT(*) as count,
    COUNT(CASE WHEN pairings_meals IS NOT NULL AND array_length(pairings_meals, 1) > 0 THEN 1 END) as with_pairings
FROM drinks 
WHERE restaurant_id = 'rest_mote';

-- Show sample pairings to verify diversity
SELECT 
    'Sample Meal Pairings' as info,
    m.name as meal_name,
    array_to_string(
        (SELECT array_agg(d.name) 
         FROM drinks d 
         WHERE d.id = ANY(m.pairings_drinks)), 
        ', '
    ) as paired_drinks
FROM meals m 
WHERE m.restaurant_id = 'rest_mote' 
AND m.pairings_drinks IS NOT NULL
LIMIT 5;
