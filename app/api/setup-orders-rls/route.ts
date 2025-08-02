import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to create RLS policies
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Setting up RLS policies for orders table...')

    // SQL to set up RLS policies
    const setupRLSSQL = `
      -- Enable RLS on orders table if not already enabled
      ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

      -- Drop existing policies if they exist (to avoid conflicts)
      DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
      DROP POLICY IF EXISTS "Admins can view all orders" ON orders;
      DROP POLICY IF EXISTS "Admins can update orders" ON orders;
      DROP POLICY IF EXISTS "System can insert orders" ON orders;
      DROP POLICY IF EXISTS "Admins can insert orders" ON orders;

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
    `

    // Since we can't execute raw SQL directly, we'll simulate the policy creation
    // by creating a comprehensive solution directly in the code
    
    console.log('⚠️  Note: Direct SQL execution not available. Using alternative approach...')
    
    // The real solution is to apply the SQL manually in Supabase dashboard
    // But we can still provide guidance and attempt some basic operations
    
    const guidance = {
      message: 'RLS policies need to be created manually in Supabase',
      sqlToExecute: setupRLSSQL,
      steps: [
        '1. Go to Supabase Dashboard -> SQL Editor',
        '2. Execute the provided SQL',
        '3. The main missing policy is: "Admins can update orders"',
        '4. This policy allows admin users to update order status'
      ]
    }

    console.log('📋 RLS setup guidance provided')

    return NextResponse.json({
      success: true,
      message: 'RLS setup guidance provided - manual execution required',
      guidance,
      sqlToExecute: setupRLSSQL,
      instructions: 'Execute the provided SQL in Supabase Dashboard -> SQL Editor to fix the RLS policies'
    })

  } catch (error) {
    console.error('❌ Unexpected error setting up RLS:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    )
  }
}