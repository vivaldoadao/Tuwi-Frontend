import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Use service role key to bypass RLS for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus } = await request.json()

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { success: false, error: 'orderId e newStatus são obrigatórios' },
        { status: 400 }
      )
    }

    console.log('🔄 Admin: Updating order status:', { orderId, newStatus })

    // First, get the current order to log the state
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('id, status, customer_email, updated_at')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('❌ Admin: Error fetching current order:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar pedido: ${fetchError.message}`,
        details: fetchError
      })
    }

    console.log('✅ Admin: Current order state:', currentOrder)

    // Update the order using service role (bypasses RLS)
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    const { data: updateResult, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()

    if (updateError) {
      console.error('❌ Admin: Error updating order:', updateError)
      return NextResponse.json({
        success: false,
        error: `Erro ao atualizar pedido: ${updateError.message}`,
        details: updateError
      })
    }

    console.log('✅ Admin: Order updated successfully:', updateResult)

    // Verify the update
    const { data: verifiedOrder, error: verifyError } = await supabaseAdmin
      .from('orders')
      .select('id, status, customer_email, updated_at')
      .eq('id', orderId)
      .single()

    if (verifyError) {
      console.error('❌ Admin: Error verifying update:', verifyError)
    } else {
      console.log('✅ Admin: Verified order state:', verifiedOrder)
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully with admin privileges',
      previousStatus: currentOrder.status,
      newStatus: verifiedOrder?.status || newStatus,
      statusChanged: currentOrder.status !== (verifiedOrder?.status || newStatus),
      updateResult,
      verifiedOrder
    })

  } catch (error) {
    console.error('❌ Admin: Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    )
  }
}