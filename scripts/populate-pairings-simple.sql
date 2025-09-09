-- Simple script to populate pairings arrays with existing menu items
-- This will add some basic pairings to test the functionality

-- Update meals to have drink pairings (using existing drink IDs from the same restaurant)
UPDATE meals 
SET pairings_drinks = ARRAY[
  (SELECT id FROM drinks WHERE restaurant_id = meals.restaurant_id AND availability_status = 'available' LIMIT 1 OFFSET 0),
  (SELECT id FROM drinks WHERE restaurant_id = meals.restaurant_id AND availability_status = 'available' LIMIT 1 OFFSET 1)
]
WHERE restaurant_id = 'rest_mote' 
AND dietary_category NOT IN ('sides', 'extras', 'desserts')
AND pairings_drinks IS NULL;

-- Update drinks to have meal pairings (using existing meal IDs from the same restaurant)
UPDATE drinks 
SET pairings_meals = ARRAY[
  (SELECT id FROM meals WHERE restaurant_id = drinks.restaurant_id AND availability_status = 'available' AND dietary_category NOT IN ('sides', 'extras', 'desserts') LIMIT 1 OFFSET 0),
  (SELECT id FROM meals WHERE restaurant_id = drinks.restaurant_id AND availability_status = 'available' AND dietary_category NOT IN ('sides', 'extras', 'desserts') LIMIT 1 OFFSET 1)
]
WHERE restaurant_id = 'rest_mote' 
AND pairings_meals IS NULL;

-- Verify the updates
SELECT name, pairings_drinks FROM meals WHERE restaurant_id = 'rest_mote' AND pairings_drinks IS NOT NULL LIMIT 5;
SELECT name, pairings_meals FROM drinks WHERE restaurant_id = 'rest_mote' AND pairings_meals IS NOT NULL LIMIT 5;
