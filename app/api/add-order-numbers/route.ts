import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to run migrations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    console.log('🔧 Adding order_number field to orders table...')

    // Step 1: Add the order_number column if it doesn't exist
    console.log('📝 Step 1: Adding order_number column...')
    const { error: addColumnError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(12);'
    })

    if (addColumnError) {
      console.error('❌ Error adding column:', addColumnError)
    } else {
      console.log('✅ Order_number column added successfully')
    }

    // Step 2: Create the function to generate order numbers
    console.log('📝 Step 2: Creating order number generation function...')
    const generateFunctionSQL = `
      CREATE OR REPLACE FUNCTION generate_order_number()
      RETURNS VARCHAR(12) AS $$
      DECLARE
          new_number VARCHAR(12);
          counter INTEGER := 0;
      BEGIN
          LOOP
              -- Generate 8-character code based on timestamp and random
              new_number := UPPER(
                  SUBSTR(
                      MD5(
                          EXTRACT(EPOCH FROM NOW())::TEXT || 
                          RANDOM()::TEXT || 
                          counter::TEXT
                      ),
                      1, 8
                  )
              );
              
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
    `

    const { error: functionError } = await supabaseAdmin.rpc('exec_sql', {
      sql: generateFunctionSQL
    })

    if (functionError) {
      console.error('❌ Error creating function:', functionError)
    } else {
      console.log('✅ Order number generation function created')
    }

    // Step 3: Generate order numbers for existing orders
    console.log('📝 Step 3: Generating order numbers for existing orders...')
    
    // First, get all orders without order numbers
    const { data: ordersWithoutNumbers, error: selectError } = await supabaseAdmin
      .from('orders')
      .select('id')
      .is('order_number', null)

    if (selectError) {
      console.error('❌ Error selecting orders:', selectError)
      return NextResponse.json({
        success: false,
        error: selectError.message
      })
    }

    console.log(`📊 Found ${ordersWithoutNumbers?.length || 0} orders without order numbers`)

    // Generate numbers for each order
    let updatedCount = 0
    if (ordersWithoutNumbers && ordersWithoutNumbers.length > 0) {
      for (const order of ordersWithoutNumbers) {
        // Generate a simple 8-character order number
        const orderNumber = Math.random().toString(36).substr(2, 8).toUpperCase()
        
        const { error: updateError } = await supabaseAdmin
          .from('orders')
          .update({ order_number: orderNumber })
          .eq('id', order.id)

        if (!updateError) {
          updatedCount++
          console.log(`✅ Updated order ${order.id} with number ${orderNumber}`)
        } else {
          console.error(`❌ Error updating order ${order.id}:`, updateError)
        }
      }
    }

    // Step 4: Create index
    console.log('📝 Step 4: Creating index...')
    const { error: indexError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);'
    })

    if (indexError) {
      console.error('❌ Error creating index:', indexError)
    } else {
      console.log('✅ Index created successfully')
    }

    // Step 5: Add unique constraint
    console.log('📝 Step 5: Adding unique constraint...')
    const { error: constraintError } = await supabaseAdmin.rpc('exec_sql', {
      sql: 'ALTER TABLE orders ADD CONSTRAINT IF NOT EXISTS orders_order_number_unique UNIQUE (order_number);'
    })

    if (constraintError) {
      console.error('❌ Error adding constraint:', constraintError)
    } else {
      console.log('✅ Unique constraint added successfully')
    }

    console.log('🎉 Order number migration completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Order numbers added successfully',
      details: {
        ordersUpdated: updatedCount,
        totalOrders: ordersWithoutNumbers?.length || 0
      }
    })

  } catch (error) {
    console.error('❌ Unexpected error in add-order-numbers migration:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro inesperado durante a migração'
    }, { status: 500 })
  }
}