-- Updated SQL script to use correct category IDs and dietary categories
-- First, let's see what categories actually exist in the database
-- Update pairings to show different drinks and meals per restaurant

-- Update pairings_drinks for meals to suggest cocktails and wines
UPDATE meals 
SET pairings_drinks = ARRAY(
  SELECT DISTINCT d.id 
  FROM drinks d 
  WHERE d.restaurant_id = meals.restaurant_id 
    AND d.category_id IN (
      SELECT c.id FROM categories c 
      WHERE c.restaurant_id = meals.restaurant_id 
      AND (LOWER(c.name) LIKE '%cocktail%' OR LOWER(c.name) LIKE '%wine%' OR LOWER(c.name) LIKE '%spirit%')
    )
    AND d.availability_status = 'available'
  ORDER BY RANDOM() 
  LIMIT 2
)
WHERE meals.availability_status = 'available';

-- Update pairings_meals for drinks to suggest main dishes (excluding sides, extras, desserts)
UPDATE drinks 
SET pairings_meals = ARRAY(
  SELECT DISTINCT m.id 
  FROM meals m 
  WHERE m.restaurant_id = drinks.restaurant_id 
    AND m.dietary_category NOT IN ('Side', 'Extra', 'Dessert', 'Sides', 'Extras', 'Desserts')
    AND m.availability_status = 'available'
  ORDER BY RANDOM() 
  LIMIT 2
)
WHERE drinks.availability_status = 'available';

-- Add fallback pairings for items without any pairings
UPDATE meals 
SET pairings_drinks = ARRAY(
  SELECT DISTINCT d.id 
  FROM drinks d 
  WHERE d.restaurant_id = meals.restaurant_id 
    AND d.availability_status = 'available'
  ORDER BY RANDOM() 
  LIMIT 2
)
WHERE (pairings_drinks IS NULL OR array_length(pairings_drinks, 1) = 0)
  AND meals.availability_status = 'available';

UPDATE drinks 
SET pairings_meals = ARRAY(
  SELECT DISTINCT m.id 
  FROM meals m 
  WHERE m.restaurant_id = drinks.restaurant_id 
    AND m.availability_status = 'available'
  ORDER BY RANDOM() 
  LIMIT 2
)
WHERE (pairings_meals IS NULL OR array_length(pairings_meals, 1) = 0)
  AND drinks.availability_status = 'available';
