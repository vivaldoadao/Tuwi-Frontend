-- Add order_number field to orders table
-- This creates user-friendly order numbers like #6F0EBBD4

-- Add the order_number column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(12) UNIQUE;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Function to generate a unique order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(12) AS $$
DECLARE
    new_number VARCHAR(12);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- Generate 8-character alphanumeric code (uppercase)
        new_number := UPPER(
            SUBSTR(
                encode(
                    decode(
                        LPAD(TO_HEX((EXTRACT(EPOCH FROM NOW())::INTEGER + counter) % 4294967296), 8, '0') ||
                        LPAD(TO_HEX((RANDOM() * 65535)::INTEGER), 4, '0'),
                        'hex'
                    ), 
                    'base64'
                ), 
                1, 8
            )
        );
        
        -- Ensure it's exactly 8 characters and alphanumeric
        new_number := REGEXP_REPLACE(new_number, '[^A-Z0-9]', '', 'g');
        IF LENGTH(new_number) < 8 THEN
            new_number := RPAD(new_number, 8, '0');
        END IF;
        new_number := SUBSTR(new_number, 1, 8);
        
        -- Check if this number already exists
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = new_number) THEN
            RETURN new_number;
        END IF;
        
        counter := counter + 1;
        -- Prevent infinite loop
        IF counter > 1000 THEN
            RAISE EXCEPTION 'Unable to generate unique order number after 1000 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing orders with order numbers
UPDATE orders 
SET order_number = generate_order_number()
WHERE order_number IS NULL;

-- Make order_number NOT NULL after populating existing records
ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL;

-- Create trigger to auto-generate order_number for new orders
CREATE OR REPLACE FUNCTION trigger_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS orders_generate_number_trigger ON orders;
CREATE TRIGGER orders_generate_number_trigger
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generate_order_number();

-- Comments for documentation
COMMENT ON COLUMN orders.order_number IS 'User-friendly order number (8 chars, e.g., 6F0EBBD4)';
COMMENT ON FUNCTION generate_order_number() IS 'Generates unique 8-character alphanumeric order numbers';
COMMENT ON FUNCTION trigger_generate_order_number() IS 'Auto-generates order_number for new orders';