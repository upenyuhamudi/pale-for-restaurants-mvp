-- Update pairings to show different drinks and meals per restaurant
-- This script will diversify the pairings_drinks and pairings_meals arrays

-- First, let's update pairings_drinks for meals to have more variety
UPDATE meals 
SET pairings_drinks = CASE 
  WHEN restaurant_id = 'rest_mote' THEN 
    CASE 
      WHEN dietary_category = 'Main' THEN ARRAY['drink_stella_artois', 'drink_windhoek_draught']
      WHEN dietary_category = 'Starter' THEN ARRAY['drink_apple_juice', 'drink_cranberry_juice']
      WHEN dietary_category = 'Dessert' THEN ARRAY['drink_ice_tropez', 'drink_brutal_fruit']
      ELSE ARRAY['drink_castle_lite', 'drink_heineken']
    END
  WHEN restaurant_id = 'rest_gemelli' THEN 
    CASE 
      WHEN dietary_category = 'Main' THEN ARRAY['drink_corona_extra', 'drink_stella_artois']
      WHEN dietary_category = 'Starter' THEN ARRAY['drink_orange_juice', 'drink_pineapple_juice']
      WHEN dietary_category = 'Dessert' THEN ARRAY['drink_hunters_gold', 'drink_savanna_dry']
      ELSE ARRAY['drink_redbull', 'drink_appletizer']
    END
  ELSE pairings_drinks -- Keep existing for other restaurants
END
WHERE pairings_drinks IS NOT NULL;

-- Update pairings_meals for drinks to suggest different meals
UPDATE drinks 
SET pairings_meals = CASE 
  WHEN restaurant_id = 'rest_mote' THEN 
    CASE 
      WHEN category = 'Beer' THEN ARRAY['meal_beef_ribs', 'meal_chicken_wings']
      WHEN category = 'Wine' THEN ARRAY['meal_salmon', 'meal_lamb_chops']
      WHEN category = 'Cocktail' THEN ARRAY['meal_prawns', 'meal_calamari']
      WHEN category = 'Soft Drink' THEN ARRAY['meal_burger', 'meal_pizza']
      ELSE ARRAY['meal_steak', 'meal_pasta']
    END
  WHEN restaurant_id = 'rest_gemelli' THEN 
    CASE 
      WHEN category = 'Beer' THEN ARRAY['meal_pizza_margherita', 'meal_spaghetti_bolognese']
      WHEN category = 'Wine' THEN ARRAY['meal_risotto', 'meal_osso_buco']
      WHEN category = 'Cocktail' THEN ARRAY['meal_antipasti', 'meal_bruschetta']
      WHEN category = 'Soft Drink' THEN ARRAY['meal_carbonara', 'meal_lasagna']
      ELSE ARRAY['meal_gnocchi', 'meal_tiramisu']
    END
  ELSE pairings_meals -- Keep existing for other restaurants
END
WHERE pairings_meals IS NOT NULL;

-- Add some random variety to ensure different pairings across restaurants
UPDATE meals 
SET pairings_drinks = ARRAY(
  SELECT DISTINCT drink_id 
  FROM drinks 
  WHERE restaurant_id = meals.restaurant_id 
    AND category IN ('Beer', 'Wine', 'Cocktail')
  ORDER BY RANDOM() 
  LIMIT 2
)
WHERE pairings_drinks IS NULL OR array_length(pairings_drinks, 1) = 0;

UPDATE drinks 
SET pairings_meals = ARRAY(
  SELECT DISTINCT meal_id 
  FROM meals 
  WHERE restaurant_id = drinks.restaurant_id 
    AND dietary_category NOT IN ('Side', 'Extra', 'Dessert')
  ORDER BY RANDOM() 
  LIMIT 2
)
WHERE pairings_meals IS NULL OR array_length(pairings_meals, 1) = 0;
