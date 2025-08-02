import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { orderId, newStatus } = await request.json()

    if (!orderId || !newStatus) {
      return NextResponse.json(
        { success: false, error: 'orderId e newStatus são obrigatórios' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    console.log('🔍 Debug: Attempting to update order', orderId, 'to status', newStatus)

    // First, check if the order exists and what the current status is
    const { data: currentOrder, error: fetchError } = await supabase
      .from('orders')
      .select('id, status, customer_email, updated_at')
      .eq('id', orderId)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching current order:', fetchError)
      return NextResponse.json({
        success: false,
        error: `Erro ao buscar pedido: ${fetchError.message}`,
        details: fetchError
      })
    }

    console.log('✅ Current order state:', currentOrder)

    // Now try to update the order
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    const { data: updateResult, error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()

    if (updateError) {
      console.error('❌ Error updating order:', updateError)
      return NextResponse.json({
        success: false,
        error: `Erro ao atualizar pedido: ${updateError.message}`,
        details: updateError,
        currentOrder
      })
    }

    console.log('✅ Order updated successfully:', updateResult)

    // Verify the update by fetching again
    const { data: verifiedOrder, error: verifyError } = await supabase
      .from('orders')
      .select('id, status, customer_email, updated_at')
      .eq('id', orderId)
      .single()

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError)
      return NextResponse.json({
        success: false,
        error: `Erro ao verificar atualização: ${verifyError.message}`,
        updateResult,
        details: verifyError
      })
    }

    console.log('✅ Verified order state:', verifiedOrder)

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      currentOrder,
      updateResult,
      verifiedOrder,
      statusChanged: currentOrder.status !== verifiedOrder.status
    })

  } catch (error) {
    console.error('❌ Unexpected error in debug-order-update:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor', details: String(error) },
      { status: 500 }
    )
  }
}