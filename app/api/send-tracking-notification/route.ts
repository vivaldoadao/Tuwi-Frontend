import { NextRequest, NextResponse } from 'next/server'
import { sendTrackingNotification } from '@/lib/tracking-notifications'
import type { TrackingEventType } from '@/lib/data-supabase'

export async function POST(request: NextRequest) {
  try {
    const { orderId, eventType } = await request.json()

    // Validate input
    if (!orderId || !eventType) {
      return NextResponse.json(
        { success: false, error: 'orderId e eventType são obrigatórios' },
        { status: 400 }
      )
    }

    // Send tracking notification
    const result = await sendTrackingNotification(orderId as string, eventType as TrackingEventType)

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in send-tracking-notification API:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}