-- Add bill_requested and waiter_called columns to orders table if they don't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS bill_requested BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS waiter_called BOOLEAN DEFAULT FALSE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_bill_requested ON orders(bill_requested) WHERE bill_requested = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_waiter_called ON orders(waiter_called) WHERE waiter_called = TRUE;
CREATE INDEX IF NOT EXISTS idx_orders_table_closed ON orders(table_closed) WHERE table_closed = TRUE;
