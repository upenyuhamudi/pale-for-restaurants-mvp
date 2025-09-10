-- Add service_time column to orders table to store the time taken to serve an order
ALTER TABLE orders ADD COLUMN IF NOT EXISTS service_time_minutes integer;

-- Add comment to explain the column
COMMENT ON COLUMN orders.service_time_minutes IS 'Time taken to serve the order in minutes, calculated when order status changes to completed';
