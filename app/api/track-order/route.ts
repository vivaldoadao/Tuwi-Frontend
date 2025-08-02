import { NextRequest, NextResponse } from 'next/server'
import { getPublicOrderTracking } from '@/lib/data-supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, customerEmail } = await request.json()

    // Validate input
    if (!orderNumber || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'Número do pedido e email são obrigatórios' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(customerEmail)) {
      return NextResponse.json(
        { success: false, error: 'Email inválido' },
        { status: 400 }
      )
    }

    // Clean order number (remove # if present)
    const cleanOrderNumber = orderNumber.replace('#', '').trim().toUpperCase()

    // Validate order number format (8 alphanumeric characters)
    if (!/^[A-Z0-9]{8}$/.test(cleanOrderNumber)) {
      return NextResponse.json(
        { success: false, error: 'Formato do número do pedido inválido. Use 8 caracteres (ex: 6F0EBBD4)' },
        { status: 400 }
      )
    }

    // Get order tracking
    const result = await getPublicOrderTracking(cleanOrderNumber, customerEmail.trim().toLowerCase())
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in track-order API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}