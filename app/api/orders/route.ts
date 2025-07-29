import { NextResponse } from 'next/server'
import { withAuth, type AuthenticatedRequest } from '@/lib/api-auth'
import { getUserOrders, createOrder, type CreateOrderRequest } from '@/lib/orders'
import { createOrderSchema, validateData } from '@/lib/server-validations'

// GET /api/orders - Get user orders (authenticated)
export const GET = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = searchParams.get('limit')

    const orders = await getUserOrders(request.user.id)
    
    let filteredOrders = orders

    if (status) {
      filteredOrders = orders.filter(order => order.status === status)
    }

    if (limit) {
      filteredOrders = filteredOrders.slice(0, parseInt(limit))
    }

    return NextResponse.json({ orders: filteredOrders })
  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar pedidos' },
      { status: 500 }
    )
  }
})

// POST /api/orders - Create new order (authenticated)
export const POST = withAuth(async (request: AuthenticatedRequest) => {
  try {
    const body = await request.json()
    
    // Validate request data
    const validation = validateData(createOrderSchema, body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Add user ID to the order
    const orderRequest = {
      ...validation.data,
      userId: request.user.id,
      userEmail: request.user.email
    }

    const result = await createOrder(orderRequest)

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        orderId: result.orderId,
        message: 'Pedido criado com sucesso' 
      })
    } else {
      return NextResponse.json(
        { error: result.error || 'Erro ao criar pedido' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
})