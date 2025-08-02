-- Orders RLS Policies
-- This file creates proper Row Level Security policies for the orders table

-- Enable RLS on orders table if not already enabled
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
DROP POLICY IF EXISTS "Admins can update orders" ON orders;
DROP POLICY IF EXISTS "System can insert orders" ON orders;

-- Policy 1: Customers can view their own orders
CREATE POLICY "Customers can view own orders" ON orders
  FOR SELECT USING (
    customer_email = auth.jwt() ->> 'email'
  );

-- Policy 2: Admins can view all orders
CREATE POLICY "Admins can view all orders" ON orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy 3: Admins can update orders (THIS IS THE MISSING POLICY!)
CREATE POLICY "Admins can update orders" ON orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Policy 4: System can insert orders (for checkout process)
CREATE POLICY "System can insert orders" ON orders
  FOR INSERT WITH CHECK (true);

-- Policy 5: Admins can insert orders (for manual order creation)
CREATE POLICY "Admins can insert orders" ON orders
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON POLICY "Customers can view own orders" ON orders IS 'Allows customers to view only their own orders using their email';
COMMENT ON POLICY "Admins can view all orders" ON orders IS 'Allows admin users to view all orders in the system';
COMMENT ON POLICY "Admins can update orders" ON orders IS 'Allows admin users to update order status and other fields';
COMMENT ON POLICY "System can insert orders" ON orders IS 'Allows the system to create new orders during checkout';
COMMENT ON POLICY "Admins can insert orders" ON orders IS 'Allows admin users to manually create orders';

-- Verify policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'orders';