import { NextRequest, NextResponse } from 'next/server'
import { updateOrderStatusAdmin } from '@/lib/data-supabase-admin'
import type { OrderStatus } from '@/lib/data-supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId, status, paymentIntentId } = await request.json()

    // Validate input
    if (!orderId || !status) {
      return NextResponse.json(
        { success: false, error: 'orderId e status são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate status
    const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Status inválido' },
        { status: 400 }
      )
    }

    // Update order status using admin privileges
    const result = await updateOrderStatusAdmin(orderId, status, paymentIntentId)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order status updated successfully'
    })

  } catch (error) {
    console.error('Error in update-order-status API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}