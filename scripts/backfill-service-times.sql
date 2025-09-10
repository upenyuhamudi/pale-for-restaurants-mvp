-- Backfill service times for all existing completed orders
-- This calculates the service time for orders that were completed before the service_time_minutes column was added

UPDATE orders 
SET service_time_minutes = EXTRACT(EPOCH FROM (updated_at - created_at)) / 60
WHERE status = 'completed' 
  AND service_time_minutes IS NULL
  AND updated_at IS NOT NULL 
  AND created_at IS NOT NULL;

-- Optional: View the results to verify the calculation
-- SELECT 
--   id,
--   diner_name,
--   table_number,
--   created_at,
--   updated_at,
--   service_time_minutes,
--   ROUND(EXTRACT(EPOCH FROM (updated_at - created_at)) / 60, 2) as calculated_minutes
-- FROM orders 
-- WHERE status = 'completed' 
-- ORDER BY created_at DESC;
