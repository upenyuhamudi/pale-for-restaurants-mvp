-- Add table_closed column to orders table
ALTER TABLE orders 
ADD COLUMN table_closed BOOLEAN DEFAULT FALSE;

-- Add index for better query performance when filtering by closed tables
CREATE INDEX IF NOT EXISTS idx_orders_table_closed ON orders(table_closed);

-- Add composite index for restaurant and table filtering
CREATE INDEX IF NOT EXISTS idx_orders_restaurant_table_closed ON orders(restaurant_id, table_number, table_closed);

-- Update any existing completed orders to be considered closed if needed
-- (Optional: uncomment if you want to mark completed orders as closed)
-- UPDATE orders SET table_closed = TRUE WHERE status = 'completed';
